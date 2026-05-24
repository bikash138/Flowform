import { z } from "zod";
import { router } from "../../trpc";
import { protectedProcedure } from "../../middlewares/auth.middleware";
import {
  workspaceProcedure,
  permissionProcedure,
} from "../../middlewares/workspace.middleware";
import { workspaceCoreService } from "../../services";
import {
  CreateWorkspaceInputSchema,
  UpdateWorkspaceInputSchema,
  WorkspaceSummarySchema,
} from "@flowform/services";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Workspaces"];
const getPath = generatePath("/workspaces");

export const workspaceCoreRouter = router({
  createWorkspace: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(CreateWorkspaceInputSchema)
    .output(WorkspaceSummarySchema)
    .mutation(({ input, ctx }) =>
      workspaceCoreService.createWorkspace(input, ctx.userId),
    ),

  getUserWorkspaces: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(z.undefined())
    .output(z.array(WorkspaceSummarySchema))
    .query(({ ctx }) => workspaceCoreService.listWorksapceMemebers(ctx.userId)),

  getWorkspaceById: workspaceProcedure
    .meta({
      openapi: { method: "GET", path: getPath("/:workspaceId"), tags: TAGS },
    })
    .input(z.object({}))
    .output(WorkspaceSummarySchema)
    .query(({ ctx }) =>
      workspaceCoreService.getWorksapaceById(ctx.workspaceId, ctx.role),
    ),

  updateWorkspace: permissionProcedure("workspace:update")
    .meta({
      openapi: { method: "PUT", path: getPath("/:workspaceId"), tags: TAGS },
    })
    .input(UpdateWorkspaceInputSchema)
    .output(WorkspaceSummarySchema)
    .mutation(({ input, ctx }) =>
      workspaceCoreService.updateWorksapce(ctx.workspaceId, input, ctx.role),
    ),

  deleteWorkspace: permissionProcedure("workspace:delete")
    .meta({
      openapi: { method: "DELETE", path: getPath("/:workspaceId"), tags: TAGS },
    })
    .input(z.object({}))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      await workspaceCoreService.deleteWorkpace(ctx.workspaceId);
      return { success: true as const };
    }),
});
