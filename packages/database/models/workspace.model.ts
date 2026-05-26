import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import { user } from "./auth.model";

export const roleEnum = pgEnum("role", ["VIEWER", "EDITOR", "ADMIN", "OWNER"]);
export const workspaceInviteStatusEnum = pgEnum("workspace_invite_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
]);

export const workspace = pgTable("workspace", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => `ws_${nanoid(10)}`),
  title: text("title").notNull(),
  logo: text("logo").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  isPrivate: boolean("is_private").notNull().default(true),
  isPersonal: boolean("is_personal").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `wm_${nanoid(10)}`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id),
    role: roleEnum("role").notNull().default("VIEWER"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("workspace_member_user_workspace_idx").on(
      t.userId,
      t.workspaceId,
    ),
  ],
);

export const workspaceInvite = pgTable(
  "workspace_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `wi_${nanoid(10)}`),
    email: text("email").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id),
    role: roleEnum("role").notNull().default("VIEWER"),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    status: workspaceInviteStatusEnum("status").notNull().default("PENDING"),
    invitedBy: text("invited_by").references(() => user.id),
    acceptedAt: timestamp("accepted_at"),
    resendCount: integer("resend_count").notNull().default(0),
    lastSentAt: timestamp("last_sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("workspace_invite_token_idx").on(t.tokenHash),
    uniqueIndex("workspace_invite_email_workspace_idx").on(
      t.email,
      t.workspaceId,
    ),
  ],
);

export type WorkspaceRecord = typeof workspace.$inferSelect;
export type WorkspaceMemberRecord = typeof workspaceMember.$inferSelect;
export type WorkspaceInviteRecord = typeof workspaceInvite.$inferSelect;

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, { fields: [workspace.ownerId], references: [user.id] }),
  members: many(workspaceMember),
  invites: many(workspaceInvite),
}));

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
  }),
);

export const workspaceInviteRelations = relations(
  workspaceInvite,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceInvite.workspaceId],
      references: [workspace.id],
    }),
    invitedByUser: one(user, {
      fields: [workspaceInvite.invitedBy],
      references: [user.id],
    }),
  }),
);
