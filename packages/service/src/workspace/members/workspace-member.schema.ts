import z from "zod";
import { WorkspaceRoleSchema } from "../../rbac";
import { Role } from "@flowform/database";

//Inputs
export const UpdateMemberRoleInputSchema = z.object({
  targetUserId: z.string(),
  role: z.enum([Role.ADMIN, Role.EDITOR, Role.VIEWER]),
});

export const MemberActionInputSchema = z.object({
  targetUserId: z.string(),
});

//Outputs
export const MemberSummarySchema = z.object({
  userId: z.string(),
  role: WorkspaceRoleSchema,
  joinedAt: z.iso.datetime().nullable(),
  user: z
    .object({
      name: z.string().nullable(),
      email: z.string().nullable(),
      image: z.string().nullable(),
    })
    .nullable(),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleInputSchema>;
export type MemberActionInput = z.infer<typeof MemberActionInputSchema>;
export type MemberSummary = z.infer<typeof MemberSummarySchema>;
