import { eq, and, count } from "drizzle-orm";
import {
  workspace,
  workspaceMember,
  user,
  type WorkspaceMemberRecord,
} from "@flowform/database/models";
import { getDb } from "@flowform/database/connection";
import { Role } from "@flowform/database/constants";

export class WorkspaceMemberRepository {
  private get db() {
    return getDb();
  }

  async findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberRecord | null> {
    const [member] = await this.db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, userId),
        ),
      )
      .limit(1);
    return member ?? null;
  }

  // user table is not managed by this service — it belongs to better-auth
  async findMembersWithUserDetails(workspaceId: string) {
    const rows = await this.db
      .select()
      .from(workspaceMember)
      .leftJoin(user, eq(workspaceMember.userId, user.id))
      .where(eq(workspaceMember.workspaceId, workspaceId));

    return rows.map(({ workspace_member: member, user: u }) => ({
      member,
      user: u,
    }));
  }

  async updateRole(
    workspaceId: string,
    targetUserId: string,
    role: Role,
  ): Promise<WorkspaceMemberRecord | null> {
    const [updated] = await this.db
      .update(workspaceMember)
      .set({ role })
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, targetUserId),
        ),
      )
      .returning();
    return updated ?? null;
  }

  async remove(workspaceId: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, userId),
        ),
      )
      .returning();
    return deleted.length > 0;
  }

  async countMembers(workspaceId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(workspaceMember)
      .where(eq(workspaceMember.workspaceId, workspaceId));
    return result?.count ?? 0;
  }

  async setPrivate(workspaceId: string, isPrivate: boolean): Promise<void> {
    await this.db
      .update(workspace)
      .set({ isPrivate })
      .where(eq(workspace.id, workspaceId));
  }
}
