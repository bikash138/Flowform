import { eq, and } from "drizzle-orm";
import { getDb } from "@flowform/database/connection";
import type { Tx } from "@flowform/database/connection";
import { Role } from "@flowform/database/constants";
import { workspace, workspaceMember } from "@flowform/database/models";
import type { WorkspaceRecord } from "@flowform/database/models";

export type CreateWorkspaceRecordInput = {
  ownerId: string;
  title: string;
  logo: string;
  isPersonal: boolean;
  isPrivate: boolean;
};

export type WorkspaceUpdateInput = {
  title?: string;
  logo?: string;
};

export class WorkspaceCoreRepository {
  private get db() {
    return getDb();
  }

  async createWithOwner(
    input: CreateWorkspaceRecordInput,
    onCreated: (workspaceId: string, tx: Tx) => Promise<void>,
  ): Promise<WorkspaceRecord> {
    return this.db.transaction(async (tx) => {
      const [ws] = await tx
        .insert(workspace)
        .values({
          title: input.title,
          logo: input.logo,
          ownerId: input.ownerId,
          isPersonal: input.isPersonal,
          isPrivate: input.isPrivate,
        })
        .returning();

      await tx.insert(workspaceMember).values({
        userId: input.ownerId,
        workspaceId: ws!.id,
        role: Role.OWNER,
      });

      await onCreated(ws!.id, tx);

      return ws!;
    });
  }

  async findById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const [ws] = await this.db
      .select()
      .from(workspace)
      .where(and(eq(workspace.id, workspaceId), eq(workspace.isDeleted, false)))
      .limit(1);
    return ws ?? null;
  }

  async findPopulatedMemberships(userId: string) {
    return this.db
      .select()
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
      .where(eq(workspaceMember.userId, userId));
  }

  async updateById(
    workspaceId: string,
    update: WorkspaceUpdateInput,
  ): Promise<WorkspaceRecord | null> {
    const [updated] = await this.db
      .update(workspace)
      .set(update)
      .where(and(eq(workspace.id, workspaceId), eq(workspace.isDeleted, false)))
      .returning();
    return updated ?? null;
  }

  async deleteById(workspaceId: string): Promise<boolean> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(workspace)
        .set({ isDeleted: true })
        .where(eq(workspace.id, workspaceId));

      await tx
        .delete(workspaceMember)
        .where(eq(workspaceMember.workspaceId, workspaceId));
    });
    return true;
  }
}
