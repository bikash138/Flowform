import { z } from "zod";
import {
  WORKSPACE_INVITE_ROLES,
  WorkspaceInviteStatus,
} from "@flowform/database/constants";

// Inputs
export const SendInviteInputSchema = z.object({
  email: z.email(),
  role: z.enum(WORKSPACE_INVITE_ROLES),
});

export const RevokeInviteInputSchema = z.object({
  inviteId: z.string(),
});

export const ResendInviteInputSchema = z.object({
  inviteId: z.string(),
});

export const ValidateTokenInputSchema = z.object({
  token: z.string().min(1),
});

export const AcceptInviteInputSchema = z.object({
  token: z.string().min(1),
});

// Outputs

export const InviteSummarySchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(WORKSPACE_INVITE_ROLES),
  status: z.enum(WorkspaceInviteStatus),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const InvitePreviewSchema = z.object({
  email: z.email(),
  role: z.enum(WORKSPACE_INVITE_ROLES),
  workspaceName: z.string(),
  workspaceLogo: z.string().nullable(),
  inviterName: z.string(),
});

//Types
export type SendInviteInput = z.infer<typeof SendInviteInputSchema>;
export type RevokeInviteInput = z.infer<typeof RevokeInviteInputSchema>;
export type ResendInviteInput = z.infer<typeof ResendInviteInputSchema>;
export type InviteSummary = z.infer<typeof InviteSummarySchema>;
export type InvitePreview = z.infer<typeof InvitePreviewSchema>;
