import { sql } from "drizzle-orm";
import { getDb } from "../connection";
import { plan } from "../models/billing.model";
import type { PlanFeatures } from "../models/billing.model";
import { createLogger } from "@flowform/logger";

const log = createLogger("seed:plans");

const FREE_FEATURES: PlanFeatures = {
  monthlyResponseLimit: 100,
  formLimit: 3,
  teamMemberLimit: 3,
  multiLanguage: false,
  customCloseDate: false,
  customBranding: false,
  customSlug: false,
  redirectOnComplete: false,
  advancedAnalytics: false,
  removeWatermark: false,
  confirmationEmail: false,
};

const PRO_FEATURES: PlanFeatures = {
  monthlyResponseLimit: 2000,
  formLimit: 20,
  teamMemberLimit: 10,
  multiLanguage: true,
  customCloseDate: true,
  customBranding: true,
  customSlug: true,
  redirectOnComplete: false,
  advancedAnalytics: true,
  removeWatermark: false,
  confirmationEmail: false,
};

const PRO_MAX_FEATURES: PlanFeatures = {
  monthlyResponseLimit: 10000,
  formLimit: 50,
  teamMemberLimit: 30,
  multiLanguage: true,
  customCloseDate: true,
  customBranding: true,
  customSlug: true,
  redirectOnComplete: true,
  advancedAnalytics: true,
  removeWatermark: true,
  confirmationEmail: true,
};

export async function seedPlans() {
  const db = getDb();

  await db
    .insert(plan)
    .values([
      {
        id: "FREE",
        name: "Free",
        description: "Get started with the basics.",
        monthlyPriceCents: 0,
        features: FREE_FEATURES,
      },
      {
        id: "PRO",
        name: "Pro",
        description: "For growing teams and serious form builders.",
        monthlyPriceCents: 1000,
        features: PRO_FEATURES,
      },
      {
        id: "PRO_MAX",
        name: "Pro Max",
        description: "Unlimited everything for power users.",
        monthlyPriceCents: 2500,
        features: PRO_MAX_FEATURES,
      },
    ])
    .onConflictDoUpdate({
      target: plan.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        monthlyPriceCents: sql`excluded.monthly_price_cents`,
        features: sql`excluded.features`,
        updatedAt: new Date(),
      },
    });

  log.info("Plans upserted successfully");
}
