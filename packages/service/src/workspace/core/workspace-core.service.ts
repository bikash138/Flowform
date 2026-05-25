import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { Role } from "@flowform/database/constants";
import type { WorkspaceRecord } from "@flowform/database/models";
import { CacheService } from "@flowform/redis";
import { WorkspaceCoreRepository } from "./workspace-core.repo";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceSummary,
} from "./workspace-core.schema";
import { BillingService } from "../../billing";
import { CacheKeys } from "../../cache";

const log = createLogger("workspace-core-service");

export default class WorkspaceCoreService {
  private readonly repo = new WorkspaceCoreRepository();
  private readonly billingService = new BillingService();
  private readonly cache = new CacheService();

  private toSummary(doc: WorkspaceRecord, myRole: Role): WorkspaceSummary {
    return {
      id: doc.id,
      title: doc.title,
      logo: doc.logo,
      ownerId: doc.ownerId,
      isPrivate: doc.isPrivate,
      isPersonal: doc.isPersonal,
      myRole: myRole as WorkspaceSummary["myRole"],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async createPersonalWorkspace(
    userId: string,
    ownerName: string,
  ): Promise<WorkspaceSummary> {
    const title = `${ownerName.split(" ")[0] || "My"}'s Workspace`;

    log.info({ userId, title }, "Creating personal workspace");

    const ws = await this.repo.createWithOwner(
      {
        ownerId: userId,
        title,
        logo: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(title)}`,
        isPersonal: true,
        isPrivate: true,
      },
      (wsId, tx) => this.billingService.initializeFreePlan(wsId, tx),
    );

    return this.toSummary(ws, Role.OWNER);
  }

  async createWorkspace(
    input: CreateWorkspaceInput,
    userId: string,
  ): Promise<WorkspaceSummary> {
    const title = input.title.trim() || "My Workspace";

    log.info({ userId, title }, "Creating workspace");

    const ws = await this.repo.createWithOwner(
      {
        ownerId: userId,
        title,
        logo:
          input.logo ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(title)}`,
        isPersonal: false,
        isPrivate: !input.isPublic,
      },
      (wsId, tx) => this.billingService.initializeFreePlan(wsId, tx),
    );

    return this.toSummary(ws, Role.OWNER);
  }

  async listWorksapceMemebers(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.repo.findPopulatedMemberships(userId);

    return memberships
      .filter((m) => m.workspace && !m.workspace.isDeleted)
      .map((m) => this.toSummary(m.workspace, m.workspace_member.role as Role));
  }

  async getWorksapaceById(workspaceId: string, myRole: Role): Promise<WorkspaceSummary> {
    const ws = await this.repo.findById(workspaceId);
    if (!ws) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found.",
      });
    }
    return this.toSummary(ws, myRole);
  }

  async updateWorksapce(
    workspaceId: string,
    input: UpdateWorkspaceInput,
    myRole: Role,
  ): Promise<WorkspaceSummary> {
    const updated = await this.repo.updateById(workspaceId, {
      title: input.title.trim(),
      logo: input.logo,
    });
    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found.",
      });
    }

    return this.toSummary(updated, myRole);
  }

  async deleteWorkpace(workspaceId: string): Promise<void> {
    const ws = await this.repo.findById(workspaceId);
    if (!ws) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found.",
      });
    }
    if (ws.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot delete your personal workspace.",
      });
    }

    log.info({ workspaceId }, "Deleting workspace");
    await this.repo.deleteById(workspaceId);
    await this.cache.del(CacheKeys.billing.workspacePlan(workspaceId));
  }
}
