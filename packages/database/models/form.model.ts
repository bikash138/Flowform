import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { uuidv7 } from "uuidv7";
import { user } from "./auth.model";
import { workspace } from "./workspace.model";

export const formStatusEnum = pgEnum("form_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "rating"
  | "date"
  | "phone"
  | "url"
  | "yes_no";

export type QuestionOption = {
  id: string;
  label: string;
  order: number;
};

export type QuestionConfig = {
  maxLength?: number;
  min?: number;
  max?: number;
  scale?: number;
  includeTime?: boolean;
};

export type Question = {
  id: string;
  order: number;
  type: QuestionType;
  label: string;
  placeholder?: string | null;
  required: boolean;
  options?: QuestionOption[];
  config?: QuestionConfig;
};

export type PageLayout = "vertical" | "conversational";

export type FormPage = {
  id: string;
  order: number;
  title?: string | null;
  questions: Question[];
  layout?: PageLayout;
  coverImage?: string | null;
  imagePosition?: "left" | "right";
};

export type StartPage = {
  heading: string;
  description?: string | null;
  buttonLabel: string;
};

export type EndPageAnimation = "confetti" | "fireworks" | "balloons" | "none";

export type EndPage = {
  heading: string;
  message?: string | null;
  animation: EndPageAnimation;
};

export type LogicCondition =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than";

export type LogicAction = "SHOW" | "HIDE" | "REQUIRE" | "JUMP";

export type LogicRule = {
  id: string;
  triggerId: string;
  condition: LogicCondition;
  value: unknown;
  action: LogicAction;
  targetId: string;
};

export type FormContent = {
  startPage: StartPage;
  pages: FormPage[];
  endPage: EndPage;
  logic: LogicRule[];
};

export type FormFont = {
  fontFamily: string;
  fontSize: "sm" | "md" | "lg";
  letterSpacing: "tight" | "normal" | "wide";
};

export type FormTheme = {
  primaryColor: string;
  backgroundColor: string;      // form card background
  pageBackgroundColor?: string; // outer page background (behind the card)
  accentColor: string;

  // Text / labels
  labelColor?: string;
  placeholderColor?: string;

  // Input fields (text, email, number, select, date, textarea)
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;

  // Choice fields (radio, checkbox)
  choiceColor?: string;          // unselected option bg
  choiceSelectedColor?: string;  // selected option bg

  // Rating
  starColor?: string;

  // Border radius
  borderRadius: "sharp" | "rounded" | "pill";  // card / global
  buttonRadius?: "sharp" | "rounded" | "pill"; // Next / Submit / Start buttons
  inputRadius?: "sharp" | "rounded" | "pill";  // input / select / textarea

  backgroundImage?: string | null;
};

export type FormSettings = {
  //FREE
  accessType: "public" | "unlisted" | "password_protected";
  collectEmail: boolean;
  progressBar:
    | { enabled: false }
    | { enabled: true; style: "bar" | "steps" | "percentage" };
  formLayout: "vertical" | "conversational";

  //PRO
  closeAtDays: number;            // days after publish before form closes, FREE locked to 10
  languages: string[];            // enabled languages, e.g. ["en", "fr", "es"] — PRO and above can add more
  defaultLanguage: string;        // language the form renders in by default, FREE locked to "en"
  responseLimit: number;          // per-form response cap, FREE locked to plan's monthlyResponseLimit
  navbar:
    | { showBranding: false }
    | { showBranding: true; logoUrl: string; brandName: string };

  //PRO
  redirectOnComplete?: {
    url: string;
    label: string;
  } | null;

  //PRO_MAX
  removeWatermark: boolean;       // hide "Powered by Flowform" footer
  confirmationEmail?: {
    templateId: 1 | 2 | 3 | 4 | 5 | 6;
    subject: string;
    brandName: string;
    brandColor: string;
    brandLogo?: string | null;
    brandLink?: string | null;
    personalizedMessage: string;
  };
};

export type AnswerEntry = {
  questionId: string;
  type: QuestionType;
  value: string | number | string[] | boolean | null;
};

export const form = pgTable(
  "form",
  {
    id: text("id").primaryKey().$defaultFn(() => `frm_${nanoid(10)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").unique(),
    status: formStatusEnum("status").notNull().default("DRAFT"),
    hasDraft: boolean("has_draft").notNull().default(false),
    editVersion: integer("edit_version").notNull().default(1),
    publishVersion: integer("publish_version").notNull().default(0),
    draftContent: jsonb("draft_content").$type<FormContent>(),
    theme: jsonb("theme").notNull().$type<FormTheme>(),
    font: jsonb("font").notNull().$type<FormFont>(),
    settings: jsonb("settings").notNull().$type<FormSettings>(),
    accessCode: text("access_code"),
    closeAt: timestamp("close_at"),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("form_workspace_idx").on(t.workspaceId),
    index("form_user_idx").on(t.userId),
    index("form_status_idx").on(t.status),
    check(
      "access_code_required_when_password_protected",
      sql`(${t.settings}->>'accessType') != 'password_protected' OR ${t.accessCode} IS NOT NULL`,
    ),
  ],
);

export const formPublishSnapshot = pgTable(
  "form_publish_snapshot",
  {
    id: text("id").primaryKey().$defaultFn(() => `snp_${nanoid(10)}`),
    formId: text("form_id")
      .notNull()
      .references(() => form.id),
    publishVersion: integer("publish_version").notNull(),
    content: jsonb("content").notNull().$type<FormContent>(),
    theme: jsonb("theme").notNull().$type<FormTheme>(),
    font: jsonb("font").notNull().$type<FormFont>(),
    settings: jsonb("settings").notNull().$type<FormSettings>(),
    publishedAt: timestamp("published_at").notNull(),
  },
  (t) => [
    uniqueIndex("snapshot_form_version_idx").on(t.formId, t.publishVersion),
  ],
);

export const formResponse = pgTable(
  "form_response",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    formId: text("form_id")
      .notNull()
      .references(() => form.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id),
    formVersion: integer("form_version").notNull(),
    respondentEmail: text("respondent_email"),
    answers: jsonb("answers").notNull().$type<AnswerEntry[]>(),
    fingerprint: text("fingerprint"),
    device: text("device"),
    country: text("country"),
    continent: text("continent"),
    city: text("city"),
    timezone: text("timezone"),
    startedAt: timestamp("started_at"),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("response_form_idx").on(t.formId),
    index("response_workspace_idx").on(t.workspaceId),
    index("response_submitted_at_idx").on(t.submittedAt),
    index("response_fingerprint_idx").on(t.formId, t.fingerprint),
    index("response_geo_idx").on(t.formId, t.continent, t.city),
    index("response_email_idx").on(t.respondentEmail),
  ],
);

export const formAnalyticsSummary = pgTable("form_analytics_summary", {
  id: text("id").primaryKey().$defaultFn(() => `fas_${nanoid(10)}`),
  formId: text("form_id")
    .notNull()
    .unique()
    .references(() => form.id),
  views: integer("views").notNull().default(0),
  starts: integer("starts").notNull().default(0),
  submissions: integer("submissions").notNull().default(0),
  avgTimeMs: integer("avg_time_ms"),
  devices: jsonb("devices")
    .notNull()
    .$type<{ desktop: number; mobile: number; tablet: number }>()
    .default({ desktop: 0, mobile: 0, tablet: 0 }),
  countries: jsonb("countries")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  continents: jsonb("continents")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FormRecord = typeof form.$inferSelect;
export type FormPublishSnapshotRecord = typeof formPublishSnapshot.$inferSelect;
export type FormResponseRecord = typeof formResponse.$inferSelect;
export type FormAnalyticsSummaryRecord =
  typeof formAnalyticsSummary.$inferSelect;

export const formRelations = relations(form, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [form.workspaceId],
    references: [workspace.id],
  }),
  owner: one(user, {
    fields: [form.userId],
    references: [user.id],
  }),
  snapshots: many(formPublishSnapshot),
  responses: many(formResponse),
  analytics: one(formAnalyticsSummary, {
    fields: [form.id],
    references: [formAnalyticsSummary.formId],
  }),
}));

export const formPublishSnapshotRelations = relations(
  formPublishSnapshot,
  ({ one }) => ({
    form: one(form, {
      fields: [formPublishSnapshot.formId],
      references: [form.id],
    }),
  }),
);

export const formResponseRelations = relations(formResponse, ({ one }) => ({
  form: one(form, {
    fields: [formResponse.formId],
    references: [form.id],
  }),
  workspace: one(workspace, {
    fields: [formResponse.workspaceId],
    references: [workspace.id],
  }),
}));
