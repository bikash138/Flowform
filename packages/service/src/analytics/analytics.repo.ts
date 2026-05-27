import { eq, and, isNotNull, count, inArray, sql, desc } from "drizzle-orm";
import {
  form,
  formPublishSnapshot,
  formResponse,
  formAnalyticsSummary,
  type FormPublishSnapshotRecord,
  type FormResponseRecord,
} from "@flowform/database/models";
import { getDb } from "@flowform/database/connection";

export class AnalyticsRepository {
  private get db() {
    return getDb();
  }

  async isFormOwnedByWorkspace(
    formId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: form.id })
      .from(form)
      .where(
        and(
          eq(form.id, formId),
          eq(form.workspaceId, workspaceId),
          eq(form.isDeleted, false),
        ),
      )
      .limit(1);

    return !!row;
  }

  async getSnapshot(
    formId: string,
    publishVersion: number,
  ): Promise<FormPublishSnapshotRecord | null> {
    const [snapshot] = await this.db
      .select()
      .from(formPublishSnapshot)
      .where(
        and(
          eq(formPublishSnapshot.formId, formId),
          eq(formPublishSnapshot.publishVersion, publishVersion),
        ),
      )
      .limit(1);

    return snapshot ?? null;
  }

  async countSubmittedResponses(
    formId: string,
    publishVersion: number,
  ): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          eq(formResponse.formVersion, publishVersion),
          isNotNull(formResponse.submittedAt),
        ),
      );

    return row?.total ?? 0;
  }

  async listSubmittedResponses(
    formId: string,
    publishVersion: number,
    offset: number,
    limit: number,
  ): Promise<Pick<FormResponseRecord, "id" | "submittedAt" | "respondentEmail" | "answers">[]> {
    return this.db
      .select({
        id: formResponse.id,
        submittedAt: formResponse.submittedAt,
        respondentEmail: formResponse.respondentEmail,
        answers: formResponse.answers,
      })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          eq(formResponse.formVersion, publishVersion),
          isNotNull(formResponse.submittedAt),
        ),
      )
      .orderBy(sql`${formResponse.submittedAt} DESC`)
      .offset(offset)
      .limit(limit);
  }

  async countAllResponsesForForm(formId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          isNotNull(formResponse.submittedAt),
        ),
      );
    return row?.total ?? 0;
  }

  /** Batch: returns a map of formId → total submitted responses. */
  async countAllResponsesForForms(
    formIds: string[],
  ): Promise<Map<string, number>> {
    if (formIds.length === 0) return new Map();
    const rows = await this.db
      .select({ formId: formResponse.formId, total: count() })
      .from(formResponse)
      .where(
        and(
          inArray(formResponse.formId, formIds),
          isNotNull(formResponse.submittedAt),
        ),
      )
      .groupBy(formResponse.formId);
    return new Map(rows.map((r) => [r.formId, r.total]));
  }

  async getAllSubmittedResponses(
    formId: string,
    publishVersion: number,
  ): Promise<Pick<FormResponseRecord, "id" | "submittedAt" | "respondentEmail" | "answers">[]> {
    return this.db
      .select({
        id: formResponse.id,
        submittedAt: formResponse.submittedAt,
        respondentEmail: formResponse.respondentEmail,
        answers: formResponse.answers,
      })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          eq(formResponse.formVersion, publishVersion),
          isNotNull(formResponse.submittedAt),
        ),
      )
      .orderBy(sql`${formResponse.submittedAt} DESC`);
  }

  // ─── Analytics Summary ──────────────────────────────────────────────────────

  async getAnalyticsSummary(formId: string) {
    const [row] = await this.db
      .select()
      .from(formAnalyticsSummary)
      .where(eq(formAnalyticsSummary.formId, formId))
      .limit(1);
    return row ?? null;
  }

  /**
   * Live geo aggregation directly from formResponse rows.
   * Used instead of formAnalyticsSummary.continents/countries because the
   * summary may miss geo data when the geo lookup resolves after submission.
   */
  async getGeoBreakdown(formId: string): Promise<{
    continents: Record<string, number>;
    countries: Record<string, number>;
  }> {
    const [continentRows, countryRows] = await Promise.all([
      this.db
        .select({ continent: formResponse.continent, total: count() })
        .from(formResponse)
        .where(
          and(
            eq(formResponse.formId, formId),
            isNotNull(formResponse.submittedAt),
            isNotNull(formResponse.continent),
          ),
        )
        .groupBy(formResponse.continent),
      this.db
        .select({ country: formResponse.country, total: count() })
        .from(formResponse)
        .where(
          and(
            eq(formResponse.formId, formId),
            isNotNull(formResponse.submittedAt),
            isNotNull(formResponse.country),
          ),
        )
        .groupBy(formResponse.country),
    ]);

    const continents: Record<string, number> = {};
    for (const r of continentRows) {
      if (r.continent) continents[r.continent] = r.total;
    }
    const countries: Record<string, number> = {};
    for (const r of countryRows) {
      if (r.country) countries[r.country] = r.total;
    }

    return { continents, countries };
  }

  async aggregateQuestionStats(
    formId: string,
    publishVersion: number,
  ): Promise<{ questionId: string; valueKey: string; count: number }[]> {
    const result = await this.db.execute(sql`
      WITH answer_rows AS (
        SELECT
          elem->>'questionId' AS question_id,
          elem->>'type'       AS type,
          elem->'value'       AS value
        FROM ${formResponse},
          jsonb_array_elements(${formResponse.answers}) AS elem
        WHERE ${formResponse.formId}      = ${formId}
          AND ${formResponse.formVersion} = ${publishVersion}
          AND ${formResponse.submittedAt} IS NOT NULL
          AND elem->>'type' IN ('radio', 'select', 'checkbox', 'rating', 'yes_no')
      ),
      unnested AS (
        SELECT
          question_id,
          CASE
            WHEN jsonb_typeof(value) = 'array' THEN arr_elem #>> '{}'
            ELSE value #>> '{}'
          END AS value_key
        FROM answer_rows
        CROSS JOIN LATERAL (
          SELECT jsonb_array_elements(value) AS arr_elem
          WHERE  jsonb_typeof(value) = 'array'
          UNION ALL
          SELECT value AS arr_elem
          WHERE  jsonb_typeof(value) <> 'array'
        ) sub
      )
      SELECT question_id AS "questionId", value_key AS "valueKey", COUNT(*)::int AS count
      FROM   unnested
      GROUP  BY question_id, value_key
    `);

    return result.rows as { questionId: string; valueKey: string; count: number }[];
  }

  // ─── Geo Drill-Down ─────────────────────────────────────────────────────────

  async getTopCitiesByContinent(
    formId: string,
    continent: string,
    limit: number,
  ): Promise<{ city: string; count: number }[]> {
    return this.db
      .select({
        city: formResponse.city,
        count: count(),
      })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          eq(formResponse.continent, continent),
          isNotNull(formResponse.submittedAt),
          isNotNull(formResponse.city),
        ),
      )
      .groupBy(formResponse.city)
      .orderBy(desc(count()))
      .limit(limit) as Promise<{ city: string; count: number }[]>;
  }
}