import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  hasFeatureAccess,
  type PlanFeatureKey,
  type WorkspacePlanOutput,
} from "@flowform/services/billing";
import {
  hasPermission,
  type Permission,
  type WorkspaceRole,
} from "@flowform/services/rbac";

import { billingService, workspaceMemberService } from "../services";
import { protectedProcedure } from "./auth.middleware";

export const workspaceProcedure = protectedProcedure
  .input(z.object({ workspaceId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const [member, workspacePlan] = await Promise.all([
      workspaceMemberService.getMembership(input.workspaceId, ctx.userId),
      billingService.getWorkspacePlan(input.workspaceId),
    ]);

    if (!member) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this workspace.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        role: member.role as WorkspaceRole,
        workspaceId: input.workspaceId,
        workspacePlan,
      },
    });
  });

export function permissionProcedure(permission: Permission) {
  return workspaceProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to perform this action.",
      });
    }
    return next({ ctx });
  });
}

export function featureProcedure(feature: PlanFeatureKey) {
  return workspaceProcedure.use(({ ctx, next }) => {
    if (!hasFeatureAccess(ctx.workspacePlan as WorkspacePlanOutput, feature)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature is not available on your current plan.`,
      });
    }
    return next({ ctx });
  });
}
