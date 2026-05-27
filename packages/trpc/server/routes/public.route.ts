import { router, publicProcedure } from "../trpc";
import { publicFormService } from "../services";
import {
  GetPublicFormInputSchema,
  PublicFormOutputSchema,
  TrackViewInputSchema,
  TrackViewOutputSchema,
  StartSessionInputSchema,
  StartSessionOutputSchema,
  SubmitResponseInputSchema,
  SubmitResponseOutputSchema,
  PreviewFormInputSchema,
  PreviewFormOutputSchema,
  ListPublicFormsInputSchema,
  ListPublicFormsOutputSchema,
} from "@flowform/services/public";
import { generatePath } from "../utils/path-generator";

const TAGS = ["Public"];
const getPath = generatePath("/public/forms");

export const publicRouter = router({
  getPublicForm: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:idOrSlug"), tags: TAGS } })
    .input(GetPublicFormInputSchema)
    .output(PublicFormOutputSchema)
    .query(({ input, ctx }) =>
      publicFormService.getPublicForm(input, ctx.anonId),
    ),

  trackView: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/:formId/view"), tags: TAGS } })
    .input(TrackViewInputSchema)
    .output(TrackViewOutputSchema)
    .mutation(({ input, ctx }) =>
      publicFormService.trackView(input, ctx.anonId, ctx.ip),
    ),

  startSession: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/:formId/start"), tags: TAGS } })
    .input(StartSessionInputSchema)
    .output(StartSessionOutputSchema)
    .mutation(({ input, ctx }) =>
      publicFormService.startSession(input, ctx.anonId, ctx.ip, ctx.userAgent),
    ),

  submitResponse: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/:formId/responses"), tags: TAGS } })
    .input(SubmitResponseInputSchema)
    .output(SubmitResponseOutputSchema)
    .mutation(({ input, ctx }) =>
      publicFormService.submitResponse(input, ctx.anonId, ctx.ip),
    ),

  previewForm: publicProcedure
    .input(PreviewFormInputSchema)
    .output(PreviewFormOutputSchema)
    .query(({ input }) => publicFormService.previewPublicForm(input)),

  // Explore page — publicly lists forms with accessType="public"
  listForms: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(ListPublicFormsInputSchema)
    .output(ListPublicFormsOutputSchema)
    .query(({ input }) => publicFormService.listPublicForms(input)),
});
