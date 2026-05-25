import { z } from "zod";
import { router } from "../../trpc";
import {
  workspaceProcedure,
  permissionProcedure,
} from "../../middlewares/workspace.middleware";
import { workspaceMemberService } from "../../services";
import {
  MemberSummarySchema,
  UpdateMemberRoleInputSchema,
  MemberActionInputSchema,
} from "@flowform/services";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Workspace Members"];
const getPath = generatePath("/workspaces");

export const workspaceMembersRouter = router({
  getWorkspaceMembers: workspaceProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/:workspaceId/members"),
        tags: TAGS,
      },
    })
    .output(z.array(MemberSummarySchema))
    .query(({ ctx }) => workspaceMemberService.listMembers(ctx.workspaceId)),

  updateMemberRole: permissionProcedure("member:update-role")
    .meta({
      openapi: {
        method: "PUT",
        path: getPath("/:workspaceId/members/:targetUserId"),
        tags: TAGS,
      },
    })
    .input(UpdateMemberRoleInputSchema)
    .output(z.void())
    .mutation(({ input, ctx }) =>
      workspaceMemberService.updateMemberRole(ctx.workspaceId, input, ctx.userId),
    ),

  removeWorkspaceMember: permissionProcedure("member:remove")
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/:workspaceId/members/:targetUserId"),
        tags: TAGS,
      },
    })
    .input(MemberActionInputSchema)
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      await workspaceMemberService.removeMember(ctx.workspaceId, input, ctx.userId);
      return { success: true as const };
    }),

  leaveWorkspace: workspaceProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/:workspaceId/members/me"),
        tags: TAGS,
      },
    })
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      await workspaceMemberService.leaveMember(ctx.workspaceId, ctx.userId, ctx.role);
      return { success: true as const };
    }),
});
