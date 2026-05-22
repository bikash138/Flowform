import { roleEnum, workspaceInviteStatusEnum } from "./models/workspace.model";
import { formStatusEnum } from "./models/form.model";
import { planIdEnum, workspacePlanStatusEnum } from "./models/billing.model";

export const Role = {
  VIEWER: "VIEWER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
} as const satisfies Record<string, (typeof roleEnum.enumValues)[number]>;
export type Role = (typeof Role)[keyof typeof Role];

export const WORKSPACE_INVITE_ROLES = [
  Role.ADMIN,
  Role.EDITOR,
  Role.VIEWER,
] as const;
export type WorkspaceInviteRole = (typeof WORKSPACE_INVITE_ROLES)[number];

export const WorkspaceInviteStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
} as const satisfies Record<
  string,
  (typeof workspaceInviteStatusEnum.enumValues)[number]
>;
export type WorkspaceInviteStatus =
  (typeof WorkspaceInviteStatus)[keyof typeof WorkspaceInviteStatus];

export const FormStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const satisfies Record<string, (typeof formStatusEnum.enumValues)[number]>;
export type FormStatus = (typeof FormStatus)[keyof typeof FormStatus];

export const PlanId = {
  FREE: "FREE",
  PRO: "PRO",
  PRO_MAX: "PRO_MAX",
} as const satisfies Record<string, (typeof planIdEnum.enumValues)[number]>;
export type PlanId = (typeof PlanId)[keyof typeof PlanId];

export const WorkspacePlanStatus = {
  ACTIVE: "ACTIVE",
  TRIALING: "TRIALING",
  PAST_DUE: "PAST_DUE",
  CANCELLED: "CANCELLED",
  PAUSED: "PAUSED",
} as const satisfies Record<
  string,
  (typeof workspacePlanStatusEnum.enumValues)[number]
>;
export type WorkspacePlanStatus =
  (typeof WorkspacePlanStatus)[keyof typeof WorkspacePlanStatus];
