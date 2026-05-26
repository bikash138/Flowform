import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { workspaceProcedure, permissionProcedure } from "../middlewares/workspace.middleware";
import { billingService, workspaceCoreService } from "../services";
import {
  ActivatePlanInputSchema,
  WorkspacePlanOutputSchema,
  RemainingQuotaOutputSchema,
  FormUsageOutputSchema,
  PlanCatalogOutputSchema,
} from "@flowform/services/billing";
import { generatePath } from "../utils/path-generator";

const TAGS = ["Billing"];
const getPath = generatePath("/workspaces/:workspaceId/billing");

export const billingRouter = router({
  getPlans: publicProcedure
    .meta({ openapi: { method: "GET", path: "/billing/plans", tags: TAGS } })
    .input(z.object({}))
    .output(PlanCatalogOutputSchema)
    .query(() => billingService.getPlans()),

  getWorkspacePlan: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/plan"), tags: TAGS } })
    .output(WorkspacePlanOutputSchema)
    .query(({ ctx }) => billingService.getWorkspacePlan(ctx.workspaceId)),

  getRemainingQuota: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/quota"), tags: TAGS } })
    .output(RemainingQuotaOutputSchema)
    .query(({ ctx }) => billingService.getRemainingQuota(ctx.workspaceId)),

  getFormUsage: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/form-usage"), tags: TAGS } })
    .output(FormUsageOutputSchema)
    .query(({ ctx }) => billingService.getFormUsage(ctx.workspaceId)),

  getMemberUsage: workspaceProcedure
    .meta({ openapi: { method: "GET", path: getPath("/member-usage"), tags: TAGS } })
    .output(FormUsageOutputSchema)
    .query(({ ctx }) => billingService.getMemberUsage(ctx.workspaceId)),

  activatePlan: permissionProcedure("billing:purchase")
    .meta({ openapi: { method: "POST", path: getPath("/activate"), tags: TAGS } })
    .input(ActivatePlanInputSchema.omit({ workspaceId: true }))
    .output(WorkspacePlanOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const workspace = await workspaceCoreService.getWorksapaceById(ctx.workspaceId, ctx.role);
      if (workspace.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plans cannot be purchased for a personal workspace.",
        });
      }
      return billingService.activatePlan({ workspaceId: ctx.workspaceId, planId: input.planId });
    }),
});
