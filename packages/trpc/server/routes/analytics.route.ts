import { router } from "../trpc";
import { featureProcedure } from "../middlewares/workspace.middleware";
import { analyticsService } from "../services";
import {
  GetFormSummaryInputSchema,
  GetFormSummaryOutputSchema,
  GetQuestionStatsInputSchema,
  GetQuestionStatsOutputSchema,
  ListResponsesInputSchema,
  ListResponsesOutputSchema,
  ExportResponsesInputSchema,
  ExportResponsesOutputSchema,
  GetGeoStatsInputSchema,
  GetGeoStatsOutputSchema,
  GetTopCitiesInputSchema,
  GetTopCitiesOutputSchema,
} from "@flowform/services/analytics";
import { generatePath } from "../utils/path-generator";

const TAGS = ["Analytics"];
const getPath = generatePath("/workspaces/:workspaceId/analytics");

export const analyticsRouter = router({
  getFormSummary: featureProcedure("advancedAnalytics")
    .meta({
      openapi: { method: "GET", path: getPath("/forms/:formId/summary"), tags: TAGS },
    })
    .input(GetFormSummaryInputSchema)
    .output(GetFormSummaryOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.getFormSummary(input, ctx.workspaceId),
    ),

  getQuestionStats: featureProcedure("advancedAnalytics")
    .meta({
      openapi: { method: "GET", path: getPath("/forms/:formId/questions"), tags: TAGS },
    })
    .input(GetQuestionStatsInputSchema)
    .output(GetQuestionStatsOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.getQuestionStats(input, ctx.workspaceId),
    ),

  listResponses: featureProcedure("advancedAnalytics")
    .meta({
      openapi: { method: "GET", path: getPath("/forms/:formId/responses"), tags: TAGS },
    })
    .input(ListResponsesInputSchema)
    .output(ListResponsesOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.listResponses(input, ctx.workspaceId),
    ),

  exportResponses: featureProcedure("advancedAnalytics")
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/forms/:formId/responses/export"),
        tags: TAGS,
      },
    })
    .input(ExportResponsesInputSchema)
    .output(ExportResponsesOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.exportResponses(input, ctx.workspaceId),
    ),

  getGeoStats: featureProcedure("advancedAnalytics")
    .meta({
      openapi: { method: "GET", path: getPath("/forms/:formId/geo"), tags: TAGS },
    })
    .input(GetGeoStatsInputSchema)
    .output(GetGeoStatsOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.getGeoStats(input, ctx.workspaceId),
    ),

  getTopCities: featureProcedure("advancedAnalytics")
    .meta({
      openapi: { method: "GET", path: getPath("/forms/:formId/geo/cities"), tags: TAGS },
    })
    .input(GetTopCitiesInputSchema)
    .output(GetTopCitiesOutputSchema)
    .query(({ input, ctx }) =>
      analyticsService.getTopCities(input, ctx.workspaceId),
    ),
});
