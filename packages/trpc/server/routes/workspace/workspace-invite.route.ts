import { z } from "zod";
import { router } from "../../trpc";
import { protectedProcedure } from "../../middlewares/auth.middleware";
import { permissionProcedure } from "../../middlewares/workspace.middleware";
import { workspaceInviteService } from "../../services";
import {
  InviteSummarySchema,
  SendInviteInputSchema,
  AcceptInviteInputSchema,
  ValidateTokenInputSchema,
  InvitePreviewSchema,
} from "@flowform/services";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Workspace Invites"];
const getPath = generatePath("/workspaces");

export const workspaceInvitesRouter = router({
  sendInvite: permissionProcedure("member:invite")
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/:workspaceId/invites"),
        tags: TAGS,
      },
    })
    .input(SendInviteInputSchema)
    .output(z.object({ inviteLink: z.url() }))
    .mutation(({ input, ctx }) =>
      workspaceInviteService.sendInvite(ctx.workspaceId, input, ctx.userId),
    ),

  getWorkspaceInvites: permissionProcedure("member:view")
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/:workspaceId/invites"),
        tags: TAGS,
      },
    })
    .output(z.array(InviteSummarySchema))
    .query(({ ctx }) => workspaceInviteService.listInvites(ctx.workspaceId)),

  revokeInvite: permissionProcedure("member:invite")
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/:workspaceId/invites/:inviteId"),
        tags: TAGS,
      },
    })
    .input(z.object({ inviteId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      await workspaceInviteService.revokeInvite(input.inviteId, ctx.workspaceId);
      return { success: true as const };
    }),

  acceptInvite: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/invites/accept", tags: TAGS } })
    .input(AcceptInviteInputSchema)
    .output(z.object({ workspaceId: z.string() }))
    .mutation(({ input, ctx }) =>
      workspaceInviteService.acceptInvite(input.token, ctx.userId),
    ),

  resendInvite: permissionProcedure("member:invite")
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/:workspaceId/invites/:inviteId/resend"),
        tags: TAGS,
      },
    })
    .input(z.object({ inviteId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      await workspaceInviteService.resendInvite(
        input.inviteId,
        ctx.workspaceId,
        ctx.userId,
      );
      return { success: true as const };
    }),

  validateInviteToken: protectedProcedure
    .meta({
      openapi: { method: "GET", path: "/invites/validate", tags: TAGS },
    })
    .input(ValidateTokenInputSchema)
    .output(InvitePreviewSchema)
    .query(({ input }) => workspaceInviteService.validateInviteToken(input.token)),
});
