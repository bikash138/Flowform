CREATE TYPE "public"."plan_id" AS ENUM('FREE', 'PRO', 'PRO_MAX');--> statement-breakpoint
CREATE TYPE "public"."workspace_plan_status" AS ENUM('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'PAUSED');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('VIEWER', 'EDITOR', 'ADMIN', 'OWNER');--> statement-breakpoint
CREATE TYPE "public"."workspace_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"personal_workspace_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" "plan_id" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"monthly_price_cents" integer DEFAULT 0 NOT NULL,
	"features" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"plan_id" "plan_id" DEFAULT 'FREE' NOT NULL,
	"status" "workspace_plan_status" DEFAULT 'ACTIVE' NOT NULL,
	"polar_customer_id" text,
	"polar_subscription_id" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"form_count" integer DEFAULT 0 NOT NULL,
	"team_member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_plan_workspace_id_unique" UNIQUE("workspace_id"),
	CONSTRAINT "workspace_plan_form_count_non_negative" CHECK ("workspace_plan"."form_count" >= 0),
	CONSTRAINT "workspace_plan_team_member_count_non_negative" CHECK ("workspace_plan"."team_member_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workspace_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"year_month" text NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text,
	"status" "form_status" DEFAULT 'DRAFT' NOT NULL,
	"has_draft" boolean DEFAULT false NOT NULL,
	"edit_version" integer DEFAULT 1 NOT NULL,
	"publish_version" integer DEFAULT 0 NOT NULL,
	"draft_content" jsonb,
	"theme" jsonb NOT NULL,
	"font" jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"access_code" text,
	"close_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_slug_unique" UNIQUE("slug"),
	CONSTRAINT "access_code_required_when_password_protected" CHECK (("form"."settings"->>'accessType') != 'password_protected' OR "form"."access_code" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "form_analytics_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"starts" integer DEFAULT 0 NOT NULL,
	"submissions" integer DEFAULT 0 NOT NULL,
	"avg_time_ms" integer,
	"devices" jsonb DEFAULT '{"desktop":0,"mobile":0,"tablet":0}'::jsonb NOT NULL,
	"countries" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"continents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_analytics_summary_form_id_unique" UNIQUE("form_id")
);
--> statement-breakpoint
CREATE TABLE "form_publish_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"publish_version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"theme" jsonb NOT NULL,
	"font" jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"published_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_response" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"form_version" integer NOT NULL,
	"respondent_email" text,
	"answers" jsonb NOT NULL,
	"fingerprint" text,
	"device" text,
	"country" text,
	"continent" text,
	"city" text,
	"timezone" text,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"logo" text NOT NULL,
	"owner_id" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"is_personal" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" "role" DEFAULT 'VIEWER' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "workspace_invite_status" DEFAULT 'PENDING' NOT NULL,
	"invited_by" text,
	"accepted_at" timestamp,
	"resend_count" integer DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" "role" DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_plan" ADD CONSTRAINT "workspace_plan_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_usage" ADD CONSTRAINT "workspace_usage_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_analytics_summary" ADD CONSTRAINT "form_analytics_summary_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_publish_snapshot" ADD CONSTRAINT "form_publish_snapshot_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_plan_plan_idx" ON "workspace_plan" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "workspace_plan_status_idx" ON "workspace_plan" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_usage_workspace_month_idx" ON "workspace_usage" USING btree ("workspace_id","year_month");--> statement-breakpoint
CREATE INDEX "form_workspace_idx" ON "form" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "form_user_idx" ON "form" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_status_idx" ON "form" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshot_form_version_idx" ON "form_publish_snapshot" USING btree ("form_id","publish_version");--> statement-breakpoint
CREATE INDEX "response_form_idx" ON "form_response" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "response_workspace_idx" ON "form_response" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "response_submitted_at_idx" ON "form_response" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "response_fingerprint_idx" ON "form_response" USING btree ("form_id","fingerprint");--> statement-breakpoint
CREATE INDEX "response_geo_idx" ON "form_response" USING btree ("form_id","continent","city");--> statement-breakpoint
CREATE INDEX "response_email_idx" ON "form_response" USING btree ("respondent_email");--> statement-breakpoint
CREATE INDEX "workspace_invite_token_idx" ON "workspace_invite" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invite_email_workspace_idx" ON "workspace_invite" USING btree ("email","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_user_workspace_idx" ON "workspace_member" USING btree ("user_id","workspace_id");