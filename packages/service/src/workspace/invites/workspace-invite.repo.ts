import { eq, and, inArray } from "drizzle-orm";
import {
  workspace,
  workspaceMember,
  workspaceInvite,
  user,
  type WorkspaceInviteRecord,
  type WorkspaceMemberRecord,
  type WorkspaceRecord,
} from "@flowform/database/models";
import { WorkspaceInviteStatus } from "@flowform/database/constants";
import { getDb } from "@flowform/database/connection";
import type { Tx } from "@flowform/database/connection";

export class WorkspaceInviteRepository {
  private get db() {
    return getDb();
  }

  async findExistingPendingInvite(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInviteRecord | null> {
    const [invite] = await this.db
      .select()
      .from(workspaceInvite)
      .where(
        and(
          eq(workspaceInvite.workspaceId, workspaceId),
          eq(workspaceInvite.email, email),
          inArray(workspaceInvite.status, [
            WorkspaceInviteStatus.PENDING,
            WorkspaceInviteStatus.EXPIRED,
          ]),
        ),
      )
      .limit(1);
    return invite ?? null;
  }

  async findById(
    inviteId: string,
    workspaceId: string,
  ): Promise<WorkspaceInviteRecord | null> {
    const [invite] = await this.db
      .select()
      .from(workspaceInvite)
      .where(
        and(
          eq(workspaceInvite.id, inviteId),
          eq(workspaceInvite.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return invite ?? null;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<(WorkspaceInviteRecord & { inviterName: string | null }) | null> {
    const [row] = await this.db
      .select()
      .from(workspaceInvite)
      .leftJoin(user, eq(workspaceInvite.invitedBy, user.id))
      .where(eq(workspaceInvite.tokenHash, tokenHash))
      .limit(1);

    if (!row) return null;

    return {
      ...row.workspace_invite,
      inviterName: row.user?.name ?? null,
    };
  }

  async listPending(workspaceId: string): Promise<WorkspaceInviteRecord[]> {
    return this.db
      .select()
      .from(workspaceInvite)
      .where(
        and(
          eq(workspaceInvite.workspaceId, workspaceId),
          inArray(workspaceInvite.status, [
            WorkspaceInviteStatus.PENDING,
            WorkspaceInviteStatus.EXPIRED,
          ]),
        ),
      );
  }

  async create(data: {
    email: string;
    workspaceId: string;
    role: string;
    tokenHash: string;
    expiresAt: Date;
    invitedBy: string;
  }): Promise<WorkspaceInviteRecord> {
    const [invite] = await this.db
      .insert(workspaceInvite)
      .values({
        ...data,
        role: data.role as WorkspaceInviteRecord["role"],
        status: WorkspaceInviteStatus.PENDING,
      })
      .returning();
    return invite!;
  }

  async update(
    inviteId: string,
    workspaceId: string,
    data: Partial<{
      tokenHash: string;
      expiresAt: Date;
      status: string;
      resendCount: number;
      lastSentAt: Date;
    }>,
  ): Promise<WorkspaceInviteRecord | null> {
    const [updated] = await this.db
      .update(workspaceInvite)
      .set({
        ...data,
        status: data.status as WorkspaceInviteRecord["status"] | undefined,
      })
      .where(
        and(
          eq(workspaceInvite.id, inviteId),
          eq(workspaceInvite.workspaceId, workspaceId),
        ),
      )
      .returning();
    return updated ?? null;
  }

  async delete(inviteId: string, workspaceId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(workspaceInvite)
      .where(
        and(
          eq(workspaceInvite.id, inviteId),
          eq(workspaceInvite.workspaceId, workspaceId),
        ),
      )
      .returning();
    return deleted.length > 0;
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

  async findUserByEmail(email: string): Promise<{ id: string } | null> {
    const [found] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return found ?? null;
  }

  async findUserById(
    id: string,
  ): Promise<{ email: string; name: string } | null> {
    const [found] = await this.db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!found) return null;
    return { email: found.email, name: found.name ?? "" };
  }

  async findWorkspace(workspaceId: string): Promise<WorkspaceRecord | null> {
    const [ws] = await this.db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);
    return ws ?? null;
  }

  async acceptTransaction(
    inviteId: string,
    workspaceId: string,
    userId: string,
    role: string,
    onAccepted: (tx: Tx) => Promise<void>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(workspaceInvite)
        .set({ status: WorkspaceInviteStatus.ACCEPTED })
        .where(eq(workspaceInvite.id, inviteId));

      await tx
        .insert(workspaceMember)
        .values({
          workspaceId,
          userId,
          role: role as WorkspaceMemberRecord["role"],
        })
        .onConflictDoNothing();

      await tx
        .update(workspace)
        .set({ isPrivate: false })
        .where(eq(workspace.id, workspaceId));

      await onAccepted(tx);
    });
  }
}
