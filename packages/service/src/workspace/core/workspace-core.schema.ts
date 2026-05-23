import { z } from "zod";
import { Role } from "@flowform/database/constants";

//Inputs
export const CreateWorkspaceInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  logo: z.url().nullable().optional(),
  isPublic: z.boolean().default(false),
});

export const UpdateWorkspaceInputSchema = z.object({
  title: z.string().min(1).max(25),
  logo: z.url().optional(),
});

export const WorkspaceIdParamSchema = z.object({
  workspaceId: z.string().min(1),
});

//Outputs
export const WorkspaceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  logo: z.string(),
  ownerId: z.string(),
  isPrivate: z.boolean(),
  isPersonal: z.boolean(),
  myRole: z.enum(Role),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInputSchema>;
export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;