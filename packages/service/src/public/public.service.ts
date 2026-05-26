import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createLogger } from "@flowform/logger";
import type {
  FormSettings,
  FormTheme,
  FormFont,
  FormContent,
  AnswerEntry,
  Question,
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
} from "./public.schema";

const log = createLogger("public-service");

const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

// Bot detection: time per question thresholds
const MIN_MS_PER_QUESTION = 800;
const MAX_MS_PER_QUESTION = 60_000;

// Answer Validation

function buildAnswerSchema(q: Question): z.ZodTypeAny {
  switch (q.type) {
    case "short_text":
    case "long_text": {
      let s = z.string().min(1);
      if (q.config?.maxLength) s = s.max(q.config.maxLength);
      return s;
    }

    case "email":
      return z.email();

    case "number": {
      let s = z.coerce.number();
      if (q.config?.min !== undefined) s = s.min(q.config.min);
      if (q.config?.max !== undefined) s = s.max(q.config.max);
      return s;
    }

    case "radio":
    case "select": {
      const validIds = new Set(q.options?.map((o) => o.id) ?? []);
      return z.string().refine((v) => validIds.has(v));
    }

    case "checkbox": {
      const validIds = new Set(q.options?.map((o) => o.id) ?? []);
      return z
        .array(z.string().min(1))
        .min(1)
        .refine((arr) => arr.every((v) => validIds.has(v)));
    }

    case "rating": {
      const scale = q.config?.scale ?? 5;
      return z.number().int().min(1).max(scale);
    }

    case "date":
      return z.string().refine((v) => !isNaN(Date.parse(v)));

    case "phone":
      return z.string().refine((v) => /^\+[1-9]\d{0,2}-\d{6,14}$/.test(v.trim()));

    case "url":
      return z.url();

    case "yes_no":
      return z.boolean();

    default:
      return z.unknown();
  }
}

function validateAnswers(
  answers: AnswerEntry[],
  content: FormContent,
): "ok" | "validation_failed" {
  const questionMap = new Map<string, Question>();
  for (const page of content.pages) {
    for (const q of page.questions) {
      questionMap.set(q.id, q);
    }
  }

  for (const answer of answers) {
    const q = questionMap.get(answer.questionId);
    if (!q) return "validation_failed";
    if (answer.type !== q.type) return "validation_failed";
  }

  const answeredMap = new Map(answers.map((a) => [a.questionId, a.value]));

  for (const [qId, q] of questionMap) {
    const val = answeredMap.get(qId) ?? null;
    const isEmpty =
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "") ||
      (Array.isArray(val) && val.length === 0);

    if (q.required && isEmpty) return "validation_failed";
    if (isEmpty) continue;

    if (!buildAnswerSchema(q).safeParse(val).success) return "validation_failed";
  }

  return "ok";
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

    // LAYER 6: Answer validation against published snapshot
    const validationResult = validateAnswers(
      input.answers as AnswerEntry[],
      content,
    );
    if (validationResult !== "ok") {
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: "validation_failed",
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
}
