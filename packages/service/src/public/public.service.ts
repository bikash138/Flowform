import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { validateAnswers } from "@flowform/form-core";
import type {
  FormSettings,
  FormTheme,
  FormFont,
  FormContent,
  AnswerEntry,
} from "@flowform/database/models";
import { BillingService } from "../billing/billing.service";
import { PublicFormRepository } from "./public.repo";
import { verifyAccessCode } from "../form/access-code.util";
import { detectDevice, isValidTimezone, lookupGeo } from "./geo";
import {
  checkRateLimit,
  isDedupCacheHit,
  setDedupCache,
  getCachedSnapshot,
  setCachedSnapshot,
  getCachedSubmissionCount,
  setCachedSubmissionCount,
} from "./redis-cache";
import type {
  GetPublicFormInput,
  PublicFormOutput,
  PublicFormSettings,
  TrackViewInput,
  TrackViewOutput,
  StartSessionInput,
  StartSessionOutput,
  SubmitResponseInput,
  SubmitResponseOutput,
  PreviewFormInput,
  PreviewFormOutput,
  PreviewFormSettings,
  ListPublicFormsInput,
  ListPublicFormsOutput,
} from "./public.schema";

const log = createLogger("public-service");

const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

// Bot detection: time per question thresholds
const MIN_MS_PER_QUESTION = 800;
const MAX_MS_PER_QUESTION = 60_000;

// Answer validation now lives in @flowform/form-core, so the server and the
// renderer run the SAME code. The old implementation here flattened every page
// and required every `required` question — which made any form using HIDE or
// JUMP impossible to submit, because it demanded answers to questions the
// respondent was never shown.

/**
 * Carries per-question errors out to the client so the form can highlight the
 * offending field instead of showing an opaque "validation failed" toast.
 * Surfaced as `error.data.fieldErrors` by the tRPC errorFormatter.
 */
export class ValidationError extends Error {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super("validation_failed");
    this.name = "ValidationError";
  }
}

export class PublicFormService {
  private readonly repo = new PublicFormRepository();
  private readonly billingService = new BillingService();

  // Shared guard funtions
  private async findFormOrThrow(formId: string) {
    const doc = await this.repo.findPublishedForm(formId);
    if (!doc)
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    return doc;
  }

  private guardFormOpen(
    doc: Awaited<ReturnType<PublicFormRepository["findPublishedForm"]>> &
      object,
    settings: FormSettings,
  ) {
    if (doc.closeAt && new Date(doc.closeAt) < new Date()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This form is no longer accepting responses.",
      });
    }
  }

  private async getSnapshotCached(formId: string, publishVersion: number) {
    const cached = await getCachedSnapshot<object>(formId, publishVersion);
    if (cached) return cached;

    const snapshot = await this.repo.getSnapshot(formId, publishVersion);
    if (snapshot) await setCachedSnapshot(formId, publishVersion, snapshot);
    return snapshot;
  }

  private async getSubmissionCountCached(formId: string): Promise<number> {
    const cached = await getCachedSubmissionCount(formId);
    if (cached !== null) return cached;
    const count = await this.repo.getSubmissionCountFromSummary(formId);
    await setCachedSubmissionCount(formId, count);
    return count;
  }

  // PREVIEW: Get draft form data without any tracking or analytics
  async previewPublicForm(input: PreviewFormInput): Promise<PreviewFormOutput> {
    const doc = await this.repo.findFormForPreview(input.formId);
    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }

    const settings = doc.settings as FormSettings;
    const previewSettings: PreviewFormSettings = {
      accessType: settings.accessType,
      collectEmail: settings.collectEmail,
      formLayout: settings.formLayout,
      navbar: settings.navbar,
      progressBar: settings.progressBar,
      languages: settings.languages ?? [settings.defaultLanguage ?? "en"],
      defaultLanguage: settings.defaultLanguage,
      removeWatermark: settings.removeWatermark,
      redirectOnComplete: settings.redirectOnComplete ?? null,
    };

    return {
      id: doc.id,
      title: doc.title,
      content: (doc.draftContent ?? null) as unknown,
      theme: doc.theme as FormTheme,
      font: doc.font as FormFont,
      settings: previewSettings,
    };
  }

  // STEP 1: Get Public Form
  async getPublicForm(
    input: GetPublicFormInput,
    anonId: string,
  ): Promise<PublicFormOutput> {
    const doc = await this.repo.findPublishedForm(input.idOrSlug);
    if (!doc)
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });

    const settings = doc.settings as FormSettings;

    if (settings.accessType === "password_protected") {
      if (!input.accessCode) {
        return {
          id: doc.id,
          title: doc.title,
          publishVersion: doc.publishVersion,
          closed: false,
          requiresCode: true,
          alreadySubmitted: false,
          content: null,
          theme: null,
          font: null,
          settings: null,
        };
      }
      const codeValid = await verifyAccessCode(
        input.accessCode,
        doc.accessCode!,
      );
      if (!codeValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Incorrect access code.",
        });
      }
    }

    // Watermark check
    const watermarkCheck = settings.removeWatermark
      ? this.billingService
          .getWorkspacePlan(doc.workspaceId)
          .then(
            (plan) =>
              ACTIVE_STATUSES.has(plan.status) && plan.features.removeWatermark,
          )
      : Promise.resolve(false);

    const [removeWatermark, submissionCount] = await Promise.all([
      watermarkCheck,
      this.getSubmissionCountCached(doc.id),
    ]);

    const publicSettings: PublicFormSettings = {
      collectEmail: settings.collectEmail,
      formLayout: settings.formLayout,
      navbar: settings.navbar,
      progressBar: settings.progressBar,
      defaultLanguage: settings.defaultLanguage,
      removeWatermark,
      redirectOnComplete: settings.redirectOnComplete ?? null,
    };

    const meta = {
      id: doc.id,
      title: doc.title,
      publishVersion: doc.publishVersion,
      content: null,
      theme: null,
      font: null,
      settings: publicSettings,
    } as const;

    if (doc.closeAt && new Date(doc.closeAt) < new Date()) {
      return {
        ...meta,
        closed: true,
        requiresCode: false,
        alreadySubmitted: false,
      };
    }

    if (submissionCount >= settings.responseLimit) {
      return {
        ...meta,
        closed: true,
        requiresCode: false,
        alreadySubmitted: false,
      };
    }

    const [alreadySubmitted, snapshot] = await Promise.all([
      isDedupCacheHit(doc.id, anonId).then((hit) =>
        hit ? true : this.repo.hasSubmittedResponse(doc.id, anonId),
      ),
      this.getSnapshotCached(doc.id, doc.publishVersion),
    ]);

    if (alreadySubmitted) {
      return {
        ...meta,
        closed: false,
        requiresCode: false,
        alreadySubmitted: true,
      };
    }

    if (!snapshot) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Published snapshot not found.",
      });
    }

    const snap = snapshot as {
      content: unknown;
      theme: FormTheme;
      font: FormFont;
    };

    log.info({ formId: doc.id }, "Public form served");

    return {
      id: doc.id,
      title: doc.title,
      publishVersion: doc.publishVersion,
      closed: false,
      requiresCode: false,
      alreadySubmitted: false,
      content: snap.content,
      theme: snap.theme,
      font: snap.font,
      settings: publicSettings,
    };
  }

  //STEP 2: Track View
  async trackView(
    input: TrackViewInput,
    anonId: string,
    ip: string,
  ): Promise<TrackViewOutput> {
    const allowed = await checkRateLimit("view", ip, input.formId);
    if (!allowed) return { counted: false };

    // Already submitted -> don't count as a new view
    const cacheHit = await isDedupCacheHit(input.formId, anonId);
    if (cacheHit) return { counted: false };

    const dbHit = await this.repo.hasSubmittedResponse(input.formId, anonId);
    if (dbHit) {
      await setDedupCache(input.formId, anonId);
      return { counted: false };
    }

    await this.repo.incrementViews(input.formId);

    log.info({ formId: input.formId }, "View counted");
    return { counted: true };
  }

  //STEP 3: Start Session
  async startSession(
    input: StartSessionInput,
    anonId: string,
    ip: string,
    userAgent: string,
  ): Promise<StartSessionOutput> {
    const allowed = await checkRateLimit("start", ip, input.formId);
    if (!allowed)
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please slow down.",
      });

    const doc = await this.findFormOrThrow(input.formId);

    const timezone =
      input.timezone && isValidTimezone(input.timezone) ? input.timezone : null;

    const device = detectDevice(userAgent);

    const [session] = await Promise.all([
      this.repo.createSession({
        formId: doc.id,
        workspaceId: doc.workspaceId,
        formVersion: input.publishVersion,
        fingerprint: anonId,
        timezone,
        device,
      }),
      this.repo.incrementStarts(doc.id),
    ]);

    lookupGeo(ip)
      .then((geo) => {
        if (geo) return this.repo.updateGeo(session.id, geo);
      })
      .catch((err) =>
        log.warn({ err, responseId: session.id }, "Async geo update failed"),
      );

    log.info({ formId: doc.id, responseId: session.id }, "Session started");
    return { responseId: session.id };
  }

  //STEP 4: Submit Response
  async submitResponse(
    input: SubmitResponseInput,
    anonId: string,
    ip: string,
  ): Promise<SubmitResponseOutput> {
    // LAYER 1: Rate limit
    const allowed = await checkRateLimit("submit", ip, input.formId);
    if (!allowed)
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please slow down.",
      });

    // LAYER 2: Honeypot — silent discard, return fake success
    if (input._hp) {
      log.warn({ formId: input.formId }, "Honeypot triggered");
      return { success: true, redirectUrl: null };
    }

    // LAYERS 3–5: Parallel prefetch — session, form, snapshot, submission count
    const [session, doc, snapshot, submissionCount] = await Promise.all([
      this.repo.findSessionById(input.responseId),
      this.repo.findPublishedForm(input.formId),
      this.getSnapshotCached(input.formId, input.publishVersion),
      this.getSubmissionCountCached(input.formId),
    ]);

    // LAYER 3: Validate session
    if (!session || session.formId !== input.formId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid session." });
    }
    if (session.submittedAt !== null) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This session has already been submitted.",
      });
    }

    // LAYER 4: Form guards
    if (!doc)
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    const settings = doc.settings as FormSettings;
    this.guardFormOpen(doc, settings);
    if (submissionCount >= settings.responseLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This form is no longer accepting responses.",
      });
    }

    // LAYER 5: Bot time check
    if (!snapshot) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Form version mismatch. Please reload.",
      });
    }
    const startedAt = session.startedAt ?? new Date();
    const timeTakenMs = Date.now() - startedAt.getTime();

    const content = (snapshot as { content: FormContent }).content;
    const questionCount = content.pages.reduce(
      (acc, p) => acc + p.questions.length,
      0,
    );
    const minTime = questionCount * MIN_MS_PER_QUESTION;
    const maxTime = questionCount * MAX_MS_PER_QUESTION;

    if (questionCount > 0 && timeTakenMs < minTime) {
      log.warn(
        {
          formId: input.formId,
          responseId: input.responseId,
          timeTakenMs,
          minTime,
        },
        "Bot time check failed",
      );
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Submission rejected.",
      });
    }

    const clampedTimeMs = Math.min(timeTakenMs, maxTime);

    // LAYER 6: Answer validation against the published snapshot.
    //
    // form-core replays the respondent's journey from their own answers, so it
    // knows which questions they were actually asked. It then:
    //   - requires only the questions on THEIR path (a skipped branch is fine)
    //   - rejects answers to questions they could never have reached (bot stuffing)
    //   - returns errors keyed by questionId, so the UI can point at the field
    const validation = validateAnswers(content, input.answers as AnswerEntry[]);
    if (!validation.ok) {
      log.warn(
        { formId: input.formId, responseId: input.responseId, errors: validation.errors },
        "Answer validation failed",
      );
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: "validation_failed",
        cause: new ValidationError(validation.errors),
      });
    }

    // LAYER 7: Email dedup (if collectEmail)
    if (settings.collectEmail && !input.respondentEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "validation_failed",
      });
    }

    // LAYER 8: Atomic update (natural mutex — WHERE submittedAt IS NULL)
    const finalized = await this.repo.finalizeResponse({
      responseId: input.responseId,
      answers: input.answers as AnswerEntry[],
      respondentEmail: input.respondentEmail ?? null,
    });

    if (!finalized) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This session has already been submitted.",
      });
    }

    // LAYER 9: Analytics update + post-submit actions
    const device = (session.device ?? "desktop") as
      | "desktop"
      | "mobile"
      | "tablet";

    await Promise.all([
      this.repo.incrementSubmission({
        formId: doc.id,
        clampedTimeMs,
        device,
        country: finalized.country,
        continent: finalized.continent,
      }),
      this.billingService.incrementUsage(doc.workspaceId),
    ]);

    await setDedupCache(doc.id, anonId);

    log.info(
      {
        formId: doc.id,
        responseId: input.responseId,
        timeTakenMs: clampedTimeMs,
      },
      "Response submitted",
    );

    const redirectUrl = settings.redirectOnComplete?.url ?? null;
    return { success: true, redirectUrl };
  }

  // Explore — list published public forms
  // Maps repo rows to the safe ExploreFormCard shape.
  async listPublicForms(input: ListPublicFormsInput): Promise<ListPublicFormsOutput> {
    const { rows, total } = await this.repo.listPublicForms({
      limit: input.limit,
      offset: input.offset,
      search: input.search,
    });

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      description: row.description ?? null,
      primaryColor: row.primaryColor ?? "#6366f1",
      formLayout: (row.formLayout ?? "vertical") as "vertical" | "conversational",
      collectEmail: row.collectEmail ?? false,
      questionCount: row.questionCount ?? 0,
      views: row.views ?? 0,
      submissions: row.submissions ?? 0,
      avgTimeMs: row.avgTimeMs ?? null,
      // Serialise Date → ISO string (tRPC JSON transport)
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    }));

    return {
      items,
      total,
      hasMore: input.offset + items.length < total,
    };
  }
}
