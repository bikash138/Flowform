import { z } from "zod";
import { roleEnum } from "@flowform/database/models";

export const WORKSPACE_ROLES = roleEnum.enumValues;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export const WorkspaceRoleSchema = z.enum(WORKSPACE_ROLES);

export const PERMISSIONS = [
  "form:view",
  "form:create",
  "form:edit",
  "form:delete",
  "form:publish",
  "member:view",
  "member:invite",
  "member:remove",
  "member:update-role",
  "workspace:update",
  "workspace:delete",
  "billing:purchase",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  VIEWER: ["form:view", "member:view"],
  EDITOR: ["form:view", "form:create", "form:edit", "member:view"],
  ADMIN: [
    "form:view",
    "form:create",
    "form:edit",
    "form:delete",
    "form:publish",
    "member:view",
    "member:invite",
    "member:remove",
    "member:update-role",
  ],
  OWNER: [
    "form:view",
    "form:create",
    "form:edit",
    "form:delete",
    "form:publish",
    "member:view",
    "member:invite",
    "member:remove",
    "member:update-role",
    "workspace:update",
    "workspace:delete",
    "billing:purchase",
  ],
};

export function hasPermission(
  role: WorkspaceRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}