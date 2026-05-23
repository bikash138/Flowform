import { PlanFeatures } from "@flowform/database/models";
import type { WorkspacePlanOutput } from "./billing.schema";

export const PLAN_FEATURES_LIST = [
  "multiLanguage",
  "customCloseDate",
  "customBranding",
  "customSlug",
  "redirectOnComplete",
  "advancedAnalytics",
  "removeWatermark",
  "confirmationEmail",
] as const satisfies (keyof PlanFeatures)[];

export type PlanFeatureKey = (typeof PLAN_FEATURES_LIST)[number];

const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export function hasFeatureAccess(
  plan: WorkspacePlanOutput,
  feature: PlanFeatureKey,
): boolean {
  if (!ACTIVE_STATUSES.has(plan.status)) return false;
  return Boolean(plan.features[feature]);
}
