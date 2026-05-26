import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { workspace } from "./workspace.model";

export type PlanFeatures = {
  //Numeric quotas
  monthlyResponseLimit: number; // workspace-wide cap per calendar month
  formLimit: number; // max forms per workspace
  teamMemberLimit: number; // max workspace members

  //PRO
  multiLanguage: boolean; // set form language (non-English)
  customCloseDate: boolean; // edit closeAt — FREE gets auto 10-day close
  customBranding: boolean; // edit navbar logo + brand name
  customSlug: boolean; // vanity URL slugs for forms
  redirectOnComplete: boolean; // redirect button on end page
  advancedAnalytics: boolean; // question-level stats, drop-off, device breakdown

  //PRO_MAX
  removeWatermark: boolean; // hide "Powered by Flowform" footer
  confirmationEmail: boolean; // send branded confirmation email to respondent
};

export const planIdEnum = pgEnum("plan_id", ["FREE", "PRO", "PRO_MAX"]);

export const workspacePlanStatusEnum = pgEnum("workspace_plan_status", [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
  "PAUSED",
]);

// Catalog of available plans
export const plan = pgTable("plan", {
  id: planIdEnum("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull().default(0),
  features: jsonb("features").notNull().$type<PlanFeatures>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One row per workspace with their repective plans
export const workspacePlan = pgTable(
  "workspace_plan",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `wpl_${nanoid(10)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .unique()
      .references(() => workspace.id),
    planId: planIdEnum("plan_id").notNull().default("FREE"),
    status: workspacePlanStatusEnum("status").notNull().default("ACTIVE"),
    polarCustomerId: text("polar_customer_id"),
    polarSubscriptionId: text("polar_subscription_id"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    formCount: integer("form_count").notNull().default(0),
    teamMemberCount: integer("team_member_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("workspace_plan_plan_idx").on(t.planId),
    index("workspace_plan_status_idx").on(t.status),
    check("workspace_plan_form_count_non_negative", sql`${t.formCount} >= 0`),
    check(
      "workspace_plan_team_member_count_non_negative",
      sql`${t.teamMemberCount} >= 0`,
    ),
  ],
);

//Workspace Usage
export const workspaceUsage = pgTable(
  "workspace_usage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `wus_${nanoid(10)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id),
    yearMonth: text("year_month").notNull(),
    responseCount: integer("response_count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("workspace_usage_workspace_month_idx").on(
      t.workspaceId,
      t.yearMonth,
    ),
  ],
);

//Record Types
export type PlanRecord = typeof plan.$inferSelect;
export type WorkspacePlanRecord = typeof workspacePlan.$inferSelect;
export type WorkspaceUsageRecord = typeof workspaceUsage.$inferSelect;

//Relations
export const planRelations = relations(plan, ({ many }) => ({
  workspacePlans: many(workspacePlan),
}));

export const workspacePlanRelations = relations(workspacePlan, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspacePlan.workspaceId],
    references: [workspace.id],
  }),
  plan: one(plan, {
    fields: [workspacePlan.planId],
    references: [plan.id],
  }),
}));

export const workspaceUsageRelations = relations(workspaceUsage, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceUsage.workspaceId],
    references: [workspace.id],
  }),
}));
