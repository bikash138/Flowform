import { z } from "zod";
import { PlanId, WorkspacePlanStatus } from "@flowform/database/constants";

//Input Schemas

export const ActivatePlanInputSchema = z.object({
  workspaceId: z.string().min(1),
  planId: z.enum(PlanId),
});

export const GetRemainingQuotaInputSchema = z.object({
  workspaceId: z.string().min(1),
});

//Output Schemas

export const PlanFeaturesSchema = z.object({
  monthlyResponseLimit: z.number(),
  formLimit: z.number(),
  teamMemberLimit: z.number(),
  multiLanguage: z.boolean(),
  customCloseDate: z.boolean(),
  customBranding: z.boolean(),
  customSlug: z.boolean(),
  redirectOnComplete: z.boolean(),
  advancedAnalytics: z.boolean(),
  removeWatermark: z.boolean(),
  confirmationEmail: z.boolean(),
});

export const WorkspacePlanOutputSchema = z.object({
  planId: z.enum(PlanId),
  planName: z.string(),
  status: z.enum(WorkspacePlanStatus),
  features: PlanFeaturesSchema,
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  formCount: z.number(),
  teamMemberCount: z.number(),
});

export const RemainingQuotaOutputSchema = z.object({
  monthlyLimit: z.number(),
  usedThisMonth: z.number(),
  remaining: z.number(),
  yearMonth: z.string(),
});

export const FormUsageOutputSchema = z.object({
  used: z.number(),
  limit: z.number().nullable(),
});

export type ActivatePlanInput = z.infer<typeof ActivatePlanInputSchema>;
export type GetRemainingQuotaInput = z.infer<typeof GetRemainingQuotaInputSchema>;
export type WorkspacePlanOutput = z.infer<typeof WorkspacePlanOutputSchema>;
export type RemainingQuotaOutput = z.infer<typeof RemainingQuotaOutputSchema>;
export type FormUsageOutput = z.infer<typeof FormUsageOutputSchema>;
