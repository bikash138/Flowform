import { z } from "zod";
import { router } from "../trpc";
import { workspaceProcedure } from "../middlewares/workspace.middleware";
import { formService } from "../services";
import {
  CreateFormInputSchema,
  ListFormsInputSchema,
  SyncFormInputSchema,
  PublishFormInputSchema,
  PatchPublishInputSchema,
  ArchiveFormInputSchema,
  DeleteFormInputSchema,
  DuplicateFormInputSchema,
  SetAccessCodeInputSchema,
  CheckSlugInputSchema,
  UpdateSettingsInputSchema,
  UpdateSettingsOutputSchema,
  UpdateThemeInputSchema,
  UpdateThemeOutputSchema,
  UpdateFontInputSchema,
  UpdateFontOutputSchema,
  UpdateSlugInputSchema,
  UpdateSlugOutputSchema,
  GetFormResponseCountInputSchema,
  GetFormResponseCountOutputSchema,
  ListThemesOutputSchema,
  FormSummarySchema,
  FormDetailSchema,
} from "@flowform/services/form";
import { generatePath } from "../utils/path-generator";

const TAGS = ["Forms"];
const getPath = generatePath("/workspaces/:workspaceId/forms");

export const formRouter = router({
  createForm: workspaceProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(CreateFormInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) =>
      formService.createForm(input, ctx.workspaceId, ctx.userId, ctx.workspacePlan),
    ),

  listForms: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(ListFormsInputSchema)
    .output(z.array(FormSummarySchema))
    .query(({ input, ctx }) => formService.listForms(ctx.workspaceId, input.status)),

  getFormById: workspaceProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/:formId"), tags: TAGS },
    })
    .input(z.object({ formId: z.uuid() }))
    .output(FormDetailSchema)
    .query(({ input, ctx }) => formService.getFormById(input.formId, ctx.workspaceId)),

  deleteForm: workspaceProcedure
    .meta({
      openapi: { method: "DELETE", path: getPath("/:formId"), tags: TAGS },
    })
    .input(DeleteFormInputSchema)
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      await formService.deleteForm(input.formId, ctx.workspaceId);
      return { success: true as const };
    }),

  syncContent: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/sync"), tags: TAGS },
    })
    .input(SyncFormInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) => formService.syncFormContent(input, ctx.workspaceId)),

  publishForm: workspaceProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/:formId/publish"), tags: TAGS },
    })
    .input(PublishFormInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) => formService.publishForm(input.formId, ctx.workspaceId)),

  patchPublish: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/publish"), tags: TAGS },
    })
    .input(PatchPublishInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) => formService.patchPublish(input, ctx.workspaceId)),

  archiveForm: workspaceProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/:formId/archive"), tags: TAGS },
    })
    .input(ArchiveFormInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) => formService.archiveForm(input, ctx.workspaceId)),

  duplicateForm: workspaceProcedure
    .meta({
      openapi: { method: "POST", path: getPath("/:formId/duplicate"), tags: TAGS },
    })
    .input(DuplicateFormInputSchema)
    .output(FormDetailSchema)
    .mutation(({ input, ctx }) =>
      formService.duplicateForm(input, ctx.workspaceId, ctx.userId, ctx.workspacePlan),
    ),

  updateSettings: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/settings"), tags: TAGS },
    })
    .input(UpdateSettingsInputSchema)
    .output(UpdateSettingsOutputSchema)
    .mutation(({ input, ctx }) =>
      formService.updateFormSettings(input, ctx.workspaceId, ctx.workspacePlan),
    ),

  updateTheme: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/theme"), tags: TAGS },
    })
    .input(UpdateThemeInputSchema)
    .output(UpdateThemeOutputSchema)
    .mutation(({ input, ctx }) =>
      formService.updateFormTheme(input, ctx.workspaceId, ctx.workspacePlan.planId),
    ),

  updateFont: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/font"), tags: TAGS },
    })
    .input(UpdateFontInputSchema)
    .output(UpdateFontOutputSchema)
    .mutation(({ input, ctx }) =>
      formService.updateFormFont(input, ctx.workspaceId),
    ),

  setAccessCode: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/access-code"), tags: TAGS },
    })
    .input(SetAccessCodeInputSchema)
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      await formService.setFormAccessCode(input, ctx.workspaceId);
      return { success: true as const };
    }),

  updateSlug: workspaceProcedure
    .meta({
      openapi: { method: "PATCH", path: getPath("/:formId/slug"), tags: TAGS },
    })
    .input(UpdateSlugInputSchema)
    .output(UpdateSlugOutputSchema)
    .mutation(({ input, ctx }) =>
      formService.updateFormSlug(input, ctx.workspaceId, ctx.workspacePlan),
    ),

  checkSlugAvailable: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/check-slug"), tags: TAGS } })
    .input(CheckSlugInputSchema)
    .output(z.object({ available: z.boolean() }))
    .query(({ input, ctx }) => formService.checkFormSlugAvailiblity(input, ctx.workspaceId)),

  listThemes: workspaceProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/themes"), tags: TAGS },
    })
    .input(z.object({}))
    .output(ListThemesOutputSchema)
    .query(() => formService.listThemes()),

  getResponseCount: workspaceProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/:formId/response-count"), tags: TAGS },
    })
    .input(GetFormResponseCountInputSchema)
    .output(GetFormResponseCountOutputSchema)
    .query(({ input, ctx }) =>
      formService.getResponseCount(input.formId, ctx.workspaceId),
    ),
});
