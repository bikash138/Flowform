import { TRPCError } from "@trpc/server";

import type { AnswerEntry, FormContent } from "@flowform/database/models";
import { createLogger } from "@flowform/logger";
import { CacheService } from "@flowform/redis";

import { CacheKeys } from "@/cache/keys";
import { TTL } from "@/cache/ttl";

import { AnalyticsRepository } from "./analytics.repo";
import type {
  ExportResponsesInput,
  ExportResponsesOutput,
  GetFormSummaryInput,
  GetFormSummaryOutput,
  GetGeoStatsInput,
  GetGeoStatsOutput,
  GetQuestionStatsInput,
  GetQuestionStatsOutput,
  GetTopCitiesInput,
  GetTopCitiesOutput,
  ListResponsesInput,
  ListResponsesOutput,
  QuestionStat,
  ResponseColumn,
  ResponseRow,
} from "./analytics.schema";

const log = createLogger("analytics-service");

const CHARTABLE_TYPES = new Set(["radio", "checkbox", "select", "rating"]);

export class AnalyticsService {
  private readonly repo = new AnalyticsRepository();
  private readonly cache = new CacheService();

  private guardOwnership(owned: boolean) {
    if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }

  async getFormSummary(
    input: GetFormSummaryInput,
    workspaceId: string,
  ): Promise<GetFormSummaryOutput> {
    const [owned, row] = await Promise.all([
      this.repo.isFormOwnedByWorkspace(input.formId, workspaceId),
      this.repo.getAnalyticsSummary(input.formId),
    ]);
    this.guardOwnership(owned);

    const views = row?.views ?? 0;
    const starts = row?.starts ?? 0;
    const submissions = row?.submissions ?? 0;
    const completionRate = views > 0 ? Math.round((submissions / views) * 100 * 10) / 10 : 0;

    return {
      views,
      starts,
      submissions,
      completionRate,
      avgTimeMs: row?.avgTimeMs ?? null,
    };
  }

  async getGeoStats(
    input: GetGeoStatsInput,
    workspaceId: string,
  ): Promise<GetGeoStatsOutput> {
    const [owned, row] = await Promise.all([
      this.repo.isFormOwnedByWorkspace(input.formId, workspaceId),
      this.repo.getAnalyticsSummary(input.formId),
    ]);
    this.guardOwnership(owned);

    return {
      continents: (row?.continents as Record<string, number>) ?? {},
      countries: (row?.countries as Record<string, number>) ?? {},
    };
  }

  async getTopCities(
    input: GetTopCitiesInput,
    workspaceId: string,
  ): Promise<GetTopCitiesOutput> {
    const [owned, cities] = await Promise.all([
      this.repo.isFormOwnedByWorkspace(input.formId, workspaceId),
      this.repo.getTopCitiesByContinent(input.formId, input.continent, input.limit),
    ]);
    this.guardOwnership(owned);

    return { continent: input.continent, cities };
  }

  async getQuestionStats(
    input: GetQuestionStatsInput,
    workspaceId: string,
  ): Promise<GetQuestionStatsOutput> {
    // Ownership checked before cache — non-owners must not get cached data
    const owned = await this.repo.isFormOwnedByWorkspace(input.formId, workspaceId);
    this.guardOwnership(owned);

    const cacheKey = CacheKeys.analytics.questionStats(input.formId, input.publishVersion);
    const cached = await this.cache.get<GetQuestionStatsOutput>(cacheKey);
    if (cached) return cached;

    const [snapshot, statsRows, totalResponses] = await Promise.all([
      this.repo.getSnapshot(input.formId, input.publishVersion),
      this.repo.aggregateQuestionStats(input.formId, input.publishVersion),
      this.repo.countSubmittedResponses(input.formId, input.publishVersion),
    ]);

    if (!snapshot) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No snapshot found for this form version.",
      });
    }

    const content = snapshot.content as FormContent;

    // Index aggregated rows by questionId → valueKey → count
    const statsByQuestion = new Map<string, Map<string, number>>();
    for (const row of statsRows) {
      if (!statsByQuestion.has(row.questionId)) {
        statsByQuestion.set(row.questionId, new Map());
      }
      statsByQuestion.get(row.questionId)!.set(row.valueKey, row.count);
    }

    const chartableQuestions = content.pages
      .flatMap((p) => p.questions)
      .filter((q) => CHARTABLE_TYPES.has(q.type));

    const questions: QuestionStat[] = chartableQuestions.map((question) => {
      const counts = statsByQuestion.get(question.id) ?? new Map<string, number>();

      if (question.type === "radio" || question.type === "checkbox" || question.type === "select") {
        const options = (question.options ?? []).map((option) => {
          const count = counts.get(option.id) ?? 0;
          return {
            label: option.label,
            count,
            percentage: totalResponses > 0
              ? Math.round((count / totalResponses) * 100 * 10) / 10
              : 0,
          };
        });

        return {
          questionId: question.id,
          label: question.label,
          type: question.type as "radio" | "checkbox" | "select",
          stats: { options },
        };
      }

      // rating
      const scale = question.config?.scale ?? 5;
      let ratingSum = 0;
      let ratingCount = 0;

      const distribution = Array.from({ length: scale }, (_, i) => {
        const value = i + 1;
        const count = counts.get(String(value)) ?? 0;
        ratingSum += value * count;
        ratingCount += count;
        return { value, count };
      });

      const avgScore = ratingCount > 0
        ? Math.round((ratingSum / ratingCount) * 100) / 100
        : 0;

      return {
        questionId: question.id,
        label: question.label,
        type: "rating" as const,
        stats: { distribution, avgScore },
      };
    });

    const result: GetQuestionStatsOutput = {
      publishVersion: input.publishVersion,
      totalResponses,
      questions,
    };

    await this.cache.set(cacheKey, result, TTL.QUESTION_STATS);

    log.info(
      { formId: input.formId, publishVersion: input.publishVersion },
      "Question stats computed",
    );

    return result;
  }

  async listResponses(
    input: ListResponsesInput,
    workspaceId: string,
  ): Promise<ListResponsesOutput> {
    const offset = (input.page - 1) * input.pageSize;

    const [owned, snapshot, total, rawRows] = await Promise.all([
      this.repo.isFormOwnedByWorkspace(input.formId, workspaceId),
      this.repo.getSnapshot(input.formId, input.publishVersion),
      this.repo.countSubmittedResponses(input.formId, input.publishVersion),
      this.repo.listSubmittedResponses(input.formId, input.publishVersion, offset, input.pageSize),
    ]);
    this.guardOwnership(owned);

    if (!snapshot) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No snapshot found for this form version.",
      });
    }

    const content = snapshot.content as FormContent;
    const columns: ResponseColumn[] = content.pages
      .flatMap((p) => p.questions)
      .map((q) => ({ questionId: q.id, label: q.label, type: q.type }));

    const rows: ResponseRow[] = rawRows.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt!,
      respondentEmail: r.respondentEmail ?? null,
      answers: r.answers as AnswerEntry[],
    }));

    log.info(
      { formId: input.formId, publishVersion: input.publishVersion, page: input.page },
      "Responses listed",
    );

    return {
      publishVersion: input.publishVersion,
      total,
      page: input.page,
      pageSize: input.pageSize,
      columns,
      rows,
    };
  }

  async exportResponses(
    input: ExportResponsesInput,
    workspaceId: string,
  ): Promise<ExportResponsesOutput> {
    const [owned, snapshot, rawRows] = await Promise.all([
      this.repo.isFormOwnedByWorkspace(input.formId, workspaceId),
      this.repo.getSnapshot(input.formId, input.publishVersion),
      this.repo.getAllSubmittedResponses(input.formId, input.publishVersion),
    ]);
    this.guardOwnership(owned);

    if (!snapshot) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No snapshot found for this form version.",
      });
    }

    const content = snapshot.content as FormContent;
    const columns: ResponseColumn[] = content.pages
      .flatMap((p) => p.questions)
      .map((q) => ({ questionId: q.id, label: q.label, type: q.type }));

    const rows: ResponseRow[] = rawRows.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt!,
      respondentEmail: r.respondentEmail ?? null,
      answers: r.answers as AnswerEntry[],
    }));

    log.info(
      { formId: input.formId, publishVersion: input.publishVersion, count: rows.length },
      "Responses exported",
    );

    return {
      publishVersion: input.publishVersion,
      columns,
      rows,
    };
  }
}