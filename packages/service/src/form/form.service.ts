import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { genQuestionId, genPageId } from "@flowform/utils";
import {
  FormStatus,
  FormAccessType,
  ProgressBarStyle,
} from "@flowform/database/constants";
import type {
  FormRecord,
  FormContent,
  FormTheme,
  FormFont,
  FormSettings,
  StartPage,
  EndPage,
} from "@flowform/database/models";
import { CacheService } from "@flowform/redis";
import { BillingService } from "../billing/billing.service";
import { AnalyticsRepository } from "../analytics/analytics.repo";
import type { WorkspacePlanOutput } from "../billing/billing.schema";
import { CacheKeys } from "../cache";
import { FormRepository } from "./form.repo";
import { hashAccessCode } from "./access-code.util";
import {
  DEFAULT_THEME,
  DEFAULT_FONT,
  FREE_THEMES,
  getFreeThemeById,
} from "./themes/free-themes";
import {
  getProMaxThemeById,
  getAllProMaxThemeIds,
} from "./themes/pro-max-themes";
import {
  getProThemeById,
  getAllProThemeIds,
  PLAN_RANK,
  type ThemeTier,
} from "./themes/pro-themes";
import type {
  CreateFormInput,
  SyncFormInput,
  PatchPublishInput,
  SetAccessCodeInput,
  CheckSlugInput,
  UpdateSettingsInput,
  UpdateSettingsOutput,
  UpdateSlugInput,
  UpdateSlugOutput,
  UpdateThemeInput,
  UpdateThemeOutput,
  UpdateFontInput,
  UpdateFontOutput,
  ArchiveFormInput,
  UnarchiveFormInput,
  DuplicateFormInput,
  FormSummary,
  FormDetail,
  ThemeRecord,
} from "./form.schema";

const log = createLogger("form-service");

const DEFAULT_SETTINGS: Omit<
  FormSettings,
  "responseLimit" | "formLayout" | "closeAtDays"
> = {
  accessType: FormAccessType.PUBLIC,
  collectEmail: false,
  progressBar: { enabled: true, style: ProgressBarStyle.STEPS },
  languages: ["en"],
  defaultLanguage: "en",
  navbar: { showBranding: false },
  redirectOnComplete: null,
  removeWatermark: false,
};

const SLUG_CHECK_LIMIT = 15;

export class FormService {
  private readonly repo = new FormRepository();
  private readonly billingService = new BillingService();
  private readonly analyticsRepo = new AnalyticsRepository();
  private readonly cache = new CacheService();

  private toSummary(doc: FormRecord, responseCount = 0): FormSummary {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? null,
      slug: doc.slug ?? null,
      status: doc.status,
      hasDraft: doc.hasDraft,
      publishVersion: doc.publishVersion,
      closeAt: doc.closeAt?.toISOString() ?? null,
      settings: {
        accessType: (doc.settings as FormSettings).accessType,
      },
      responseCount,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toDetail(doc: FormRecord): FormDetail {
    return {
      ...this.toSummary(doc),
      draftContent: doc.draftContent ?? null,
      editVersion: doc.editVersion,
      theme: doc.theme as FormTheme,
      font: doc.font as FormFont,
      settings: doc.settings as FormSettings,
    };
  }

  private async requireForm(
    formId: string,
    workspaceId: string,
  ): Promise<FormRecord> {
    const doc = await this.repo.findActiveByIdAndWorkspace(formId, workspaceId);
    if (!doc) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Form not found in this workspace.",
      });
    }
    return doc;
  }

  //==== FORM CRUD ====

  async createForm(
    input: CreateFormInput,
    workspaceId: string,
    userId: string,
    plan: WorkspacePlanOutput,
  ): Promise<FormDetail> {
    const title = input.title.trim() || "Untitled form";

    const defaultStartPage: StartPage = {
      heading: `Welcome to ${title}`,
      description:
        "This form takes only a few minutes to complete. Your responses are appreciated.",
      buttonLabel: "Start",
    };

    const defaultEndPage: EndPage = {
      heading: "Thank you!",
      message:
        "Your response has been submitted. We appreciate you taking the time to fill this out.",
      animation: "confetti",
    };

    const defaultContent: FormContent = {
      startPage: defaultStartPage,
      pages: [],
      endPage: defaultEndPage,
      logic: [],
    };

    await this.billingService.checkFormLimit(workspaceId);

    log.info({ workspaceId, userId }, "Creating form");

    const doc = await this.repo.create(
      {
        userId,
        workspaceId,
        title,
        description: input.description ?? null,
        draftContent: defaultContent,
        theme: DEFAULT_THEME,
        font: DEFAULT_FONT,
        settings: {
          ...DEFAULT_SETTINGS,
          formLayout: input.formLayout,
          responseLimit: plan.features.monthlyResponseLimit,
          closeAtDays: plan.features.customCloseDate ? 30 : 10,
        },
      },
      (tx) => this.billingService.incrementFormCount(workspaceId, tx),
    );

    return this.toDetail(doc);
  }

  async listForms(
    workspaceId: string,
    status?: FormStatus,
  ): Promise<FormSummary[]> {
    const docs = await this.repo.listActiveByWorkspace(workspaceId, status);
    const counts = await this.analyticsRepo.countAllResponsesForForms(
      docs.map((d) => d.id),
    );
    return docs.map((d) => this.toSummary(d, counts.get(d.id) ?? 0));
  }

  async getFormById(formId: string, workspaceId: string): Promise<FormDetail> {
    const doc = await this.requireForm(formId, workspaceId);
    return this.toDetail(doc);
  }

  async deleteForm(formId: string, workspaceId: string): Promise<void> {
    const deleted = await this.repo.softDelete(formId, workspaceId, (tx) =>
      this.billingService.decrementFormCount(workspaceId, tx),
    );
    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }
    log.info({ formId }, "Form soft-deleted");
  }

  async archiveForm(
    input: ArchiveFormInput,
    workspaceId: string,
  ): Promise<FormDetail> {
    const updated = await this.repo.updateByIdAndWorkspace(
      input.formId,
      workspaceId,
      {
        status: "ARCHIVED",
      },
    );
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }
    log.info({ formId: input.formId }, "Form archived");
    return this.toDetail(updated);
  }

  async unarchiveForm(
    input: UnarchiveFormInput,
    workspaceId: string,
  ): Promise<FormDetail> {
    const updated = await this.repo.updateByIdAndWorkspace(
      input.formId,
      workspaceId,
      {
        status: "DRAFT",
      },
    );
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }
    log.info({ formId: input.formId }, "Form unarchived");
    return this.toDetail(updated);
  }

  async duplicateForm(
    input: DuplicateFormInput,
    workspaceId: string,
    userId: string,
    plan: WorkspacePlanOutput,
  ): Promise<FormDetail> {
    const original = await this.requireForm(input.formId, workspaceId);

    let rawContent: FormContent;
    if (original.draftContent) {
      rawContent = original.draftContent as FormContent;
    } else {
      const snapshot = await this.repo.findLatestSnapshot(original.id);
      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No publishable content found for this form.",
        });
      }
      rawContent = snapshot.content;
    }

    const idMap = new Map<string, string>();
    const pages = rawContent.pages.map((page) => {
      const newPageId = genPageId();
      idMap.set(page.id, newPageId);
      const questions = page.questions.map((q) => {
        const newQId = genQuestionId(q.type);
        idMap.set(q.id, newQId);
        return {
          ...q,
          id: newQId,
          options: q.options?.map((opt) => ({ ...opt })),
        };
      });
      return { ...page, id: newPageId, questions };
    });
    const logic = rawContent.logic.map((rule) => ({
      ...rule,
      triggerId: idMap.get(rule.triggerId) ?? rule.triggerId,
      targetId: idMap.get(rule.targetId) ?? rule.targetId,
    }));
    const clonedContent: FormContent = { ...rawContent, pages, logic };

    await this.billingService.checkFormLimit(workspaceId);

    const doc = await this.repo.create(
      {
        userId,
        workspaceId,
        title: `${original.title} Copy`,
        description: original.description ?? null,
        draftContent: clonedContent,
        theme: original.theme as FormTheme,
        font: original.font as FormFont,
        settings: {
          ...(original.settings as FormSettings),
          responseLimit: plan.features.monthlyResponseLimit,
          closeAtDays: plan.features.customCloseDate ? 30 : 10,
        },
      },
      (tx) => this.billingService.incrementFormCount(workspaceId, tx),
    );

    log.info(
      { originalFormId: input.formId, newFormId: doc.id },
      "Form duplicated",
    );
    return this.toDetail(doc);
  }

  async syncFormContent(
    input: SyncFormInput,
    workspaceId: string,
  ): Promise<FormDetail> {
    const current = await this.requireForm(input.formId, workspaceId);

    if (input.editVersion < current.editVersion) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Form was modified by someone else. Please resync.",
      });
    }

    const updated = await this.repo.updateByVersionAndWorkspace(
      input.formId,
      workspaceId,
      input.editVersion,
      {
        draftContent: input.draftContent as FormContent,
        hasDraft: true,
        editVersion: input.editVersion + 1,
      },
    );

    if (!updated) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Form was modified by someone else. Please resync.",
      });
    }

    log.info(
      { formId: input.formId, editVersion: updated.editVersion },
      "Form synced",
    );
    return this.toDetail(updated);
  }

  //==== THEMES =====

  listThemes(): ThemeRecord[] {
    return [
      ...FREE_THEMES,
      ...getAllProThemeIds().map((id) => getProThemeById(id)!),
      ...getAllProMaxThemeIds().map((id) => getProMaxThemeById(id)!),
    ];
  }

  async updateFormTheme(
    input: UpdateThemeInput,
    workspaceId: string,
    planId: string,
  ): Promise<UpdateThemeOutput> {
    await this.requireForm(input.formId, workspaceId);

    const freeTheme = getFreeThemeById(input.themeId);
    if (freeTheme) {
      await this.repo.updateByIdAndWorkspace(input.formId, workspaceId, { theme: freeTheme.theme });
      log.info({ formId: input.formId, themeId: input.themeId }, "Theme updated");
      return { theme: freeTheme.theme };
    }

    const proTheme = getProThemeById(input.themeId);
    const proMaxTheme = proTheme ? undefined : getProMaxThemeById(input.themeId);
    const paidTheme = proTheme ?? proMaxTheme;

    if (paidTheme) {
      const tier: ThemeTier = planId in PLAN_RANK ? (planId as ThemeTier) : "FREE";
      if (PLAN_RANK[tier] < PLAN_RANK[paidTheme.tier]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This theme requires the ${paidTheme.tier} plan or higher.`,
        });
      }
      await this.repo.updateByIdAndWorkspace(input.formId, workspaceId, { theme: paidTheme.theme });
      log.info({ formId: input.formId, themeId: input.themeId, tier: paidTheme.tier }, "Theme applied");
      return { theme: paidTheme.theme };
    }

    throw new TRPCError({ code: "NOT_FOUND", message: "Theme not found." });
  }

  async updateFormFont(
    input: UpdateFontInput,
    workspaceId: string,
  ): Promise<UpdateFontOutput> {
    await this.requireForm(input.formId, workspaceId);
    await this.repo.updateByIdAndWorkspace(input.formId, workspaceId, { font: input.font as FormFont });
    log.info({ formId: input.formId, font: input.font }, "Font updated");
    return { font: input.font };
  }

  //==== FORM SETTINGS ====

  async setFormAccessCode(
    input: SetAccessCodeInput,
    workspaceId: string,
  ): Promise<void> {
    const accessCode = input.accessCode
      ? await hashAccessCode(input.accessCode)
      : null;
    const updated = await this.repo.updateByIdAndWorkspace(
      input.formId,
      workspaceId,
      { accessCode },
    );
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }
    log.info({ formId: input.formId }, "Access code updated");
  }

  async checkFormSlugAvailability(
    input: CheckSlugInput,
    workspaceId: string,
  ): Promise<{ available: boolean }> {
    const { retryAfter } = await this.cache.rateLimit(
      CacheKeys.rateLimit.slugCheck(workspaceId),
      SLUG_CHECK_LIMIT,
      60 * 60,
    );
    if (retryAfter > 0) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many slug checks. Try again in ${retryAfter}s.`,
      });
    }

    const available = await this.repo.isSlugAvailable(
      input.slug,
      input.excludeFormId,
    );
    return { available };
  }

  async updateFormSettings(
    input: UpdateSettingsInput,
    workspaceId: string,
    plan: WorkspacePlanOutput,
  ): Promise<UpdateSettingsOutput> {
    const current = await this.requireForm(input.formId, workspaceId);
    const currentSettings = current.settings as FormSettings;
    const incoming = input.settings;
    const filtered: Partial<FormSettings> = {};

    // FREE — always allowed
    if (incoming.accessType !== undefined)
      filtered.accessType = incoming.accessType;
    if (incoming.collectEmail !== undefined)
      filtered.collectEmail = incoming.collectEmail;
    if (incoming.progressBar !== undefined)
      filtered.progressBar = incoming.progressBar;

    // responseLimit: capped at remaining quota for this month, not the monthly ceiling
    if (incoming.responseLimit !== undefined) {
      const quota = await this.billingService.getRemainingQuota(workspaceId);
      filtered.responseLimit = Math.min(
        incoming.responseLimit,
        quota.remaining,
      );
    }

    // closeAtDays: locked once the form has been published
    if (incoming.closeAtDays !== undefined && current.publishVersion === 0) {
      filtered.closeAtDays = plan.features.customCloseDate
        ? incoming.closeAtDays
        : 10;
    }
    if (plan.features.multiLanguage) {
      if (incoming.languages !== undefined)
        filtered.languages = incoming.languages;
      if (incoming.defaultLanguage !== undefined)
        filtered.defaultLanguage = incoming.defaultLanguage;
    }
    if (plan.features.customBranding && incoming.navbar !== undefined) {
      filtered.navbar = incoming.navbar;
    }
    if (
      plan.features.redirectOnComplete &&
      incoming.redirectOnComplete !== undefined
    ) {
      filtered.redirectOnComplete = incoming.redirectOnComplete;
    }

    // PRO_MAX
    if (
      plan.features.removeWatermark &&
      incoming.removeWatermark !== undefined
    ) {
      filtered.removeWatermark = incoming.removeWatermark;
    }
    if (
      plan.features.confirmationEmail &&
      incoming.confirmationEmail !== undefined
    ) {
      filtered.confirmationEmail = incoming.confirmationEmail;
    }

    if (Object.keys(filtered).length === 0) {
      return { settings: currentSettings };
    }

    const mergedSettings: FormSettings = { ...currentSettings, ...filtered };

    await this.repo.updateByIdAndWorkspace(input.formId, workspaceId, { settings: mergedSettings });

    log.info({ formId: input.formId }, "Form settings updated");
    return { settings: mergedSettings };
  }

  async updateFormSlug(
    input: UpdateSlugInput,
    workspaceId: string,
    plan: WorkspacePlanOutput,
  ): Promise<UpdateSlugOutput> {
    if (!plan.features.customSlug) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Custom slugs require the PRO plan or higher.",
      });
    }

    await this.requireForm(input.formId, workspaceId);

    if (input.slug !== null) {
      const available = await this.repo.isSlugAvailable(
        input.slug,
        input.formId,
      );
      if (!available) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slug is already taken.",
        });
      }
    }

    const updated = await this.repo.updateByIdAndWorkspace(
      input.formId,
      workspaceId,
      {
        slug: input.slug,
      },
    );
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }

    log.info({ formId: input.formId, slug: input.slug }, "Form slug updated");
    return { slug: input.slug };
  }

  //==== OTHER HANDLERS ====

  async getResponseCount(
    formId: string,
    workspaceId: string,
  ): Promise<{ total: number }> {
    await this.requireForm(formId, workspaceId);
    const total = await this.analyticsRepo.countAllResponsesForForm(formId);
    return { total };
  }

  async publishForm(formId: string, workspaceId: string): Promise<FormDetail> {
    const doc = await this.requireForm(formId, workspaceId);

    if (doc.status === "ARCHIVED") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Archived forms cannot be published. Unarchive the form first.",
      });
    }

    if (!doc.draftContent) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Form has no content to publish.",
      });
    }

    const nextPublishVersion = doc.publishVersion + 1;

    const updateData: {
      publishVersion: number;
      hasDraft: boolean;
      status: "PUBLISHED";
      closeAt?: Date;
    } = {
      publishVersion: nextPublishVersion,
      hasDraft: false,
      status: "PUBLISHED",
    };

    if (doc.publishVersion === 0) {
      const settings = doc.settings as FormSettings;
      const closeAtDays = settings.closeAtDays ?? 10;
      updateData.closeAt = new Date(
        Date.now() + closeAtDays * 24 * 60 * 60 * 1000,
      );
    }

    const updated = await this.repo.publish(
      formId,
      workspaceId,
      {
        formId: doc.id,
        publishVersion: nextPublishVersion,
        content: doc.draftContent as FormContent,
        theme: doc.theme as FormTheme,
        font: doc.font as FormFont,
        settings: doc.settings as FormSettings,
      },
      updateData,
    );

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }

    if (doc.publishVersion > 0) {
      await this.cache.del(CacheKeys.public.snapshot(formId, doc.publishVersion));
    }

    log.info(
      {
        formId,
        publishVersion: nextPublishVersion,
        closeAt: updateData.closeAt,
      },
      "Form published",
    );
    return this.toDetail(updated);
  }

  async patchPublish(
    input: PatchPublishInput,
    workspaceId: string,
  ): Promise<FormDetail> {
    const doc = await this.requireForm(input.formId, workspaceId);

    if (doc.publishVersion === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Form has not been published yet. Use publish instead.",
      });
    }

    if (input.editVersion < doc.editVersion) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Form was modified by someone else. Please resync.",
      });
    }

    const updated = await this.repo.patchPublish(
      input.formId,
      workspaceId,
      input.editVersion,
      input.draftContent as FormContent,
    );

    if (!updated) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Form was modified by someone else. Please resync.",
      });
    }

    await this.cache.del(CacheKeys.public.snapshot(input.formId, doc.publishVersion));

    log.info(
      { formId: input.formId, publishVersion: doc.publishVersion },
      "Form patch published",
    );
    return this.toDetail(updated);
  }
}
