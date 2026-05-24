import { roleEnum, workspaceInviteStatusEnum } from "./models/workspace.model";
import { formStatusEnum } from "./models/form.model";
import type { FormSettings, FormFont, FormTheme, QuestionType as QuestionTypeValue } from "./models/form.model";
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

export const BorderRadius = {
  SHARP: "sharp",
  ROUNDED: "rounded",
  PILL: "pill",
} as const satisfies Record<string, FormTheme["borderRadius"]>;
export type BorderRadius = (typeof BorderRadius)[keyof typeof BorderRadius];

export const QuestionType = {
  SHORT_TEXT: "short_text",
  LONG_TEXT: "long_text",
  EMAIL: "email",
  NUMBER: "number",
  SELECT: "select",
  RADIO: "radio",
  CHECKBOX: "checkbox",
  RATING: "rating",
  DATE: "date",
  PHONE: "phone",
  URL: "url",
  YES_NO: "yes_no",
} as const satisfies Record<string, QuestionTypeValue>;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const FormAccessType = {
  PUBLIC: "public",
  UNLISTED: "unlisted",
  PASSWORD_PROTECTED: "password_protected",
} as const satisfies Record<string, FormSettings["accessType"]>;
export type FormAccessType = (typeof FormAccessType)[keyof typeof FormAccessType];

export const ProgressBarStyle = {
  BAR: "bar",
  STEPS: "steps",
  PERCENTAGE: "percentage",
} as const satisfies Record<string, Extract<FormSettings["progressBar"], { enabled: true }>["style"]>;
export type ProgressBarStyle = (typeof ProgressBarStyle)[keyof typeof ProgressBarStyle];

export const FormLayout = {
  VERTICAL: "vertical",
  CONVERSATIONAL: "conversational",
} as const satisfies Record<string, FormSettings["formLayout"]>;
export type FormLayout = (typeof FormLayout)[keyof typeof FormLayout];

export const FontSize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const satisfies Record<string, FormFont["fontSize"]>;
export type FontSize = (typeof FontSize)[keyof typeof FontSize];

export const LetterSpacing = {
  TIGHT: "tight",
  NORMAL: "normal",
  WIDE: "wide",
} as const satisfies Record<string, FormFont["letterSpacing"]>;
export type LetterSpacing = (typeof LetterSpacing)[keyof typeof LetterSpacing];

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
