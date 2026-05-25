import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { Role } from "@flowform/database/constants";
import { CacheService } from "@flowform/redis";
import { BillingService } from "../../billing/billing.service";
import { CacheKeys, TTL } from "../../cache";
import { WorkspaceMemberRepository } from "./workspace-member.repo";
import type {
  UpdateMemberRoleInput,
  MemberActionInput,
  MemberSummary,
} from "./workspace-member.schema";

const log = createLogger("workspace-member-service");

export default class WorkspaceMemberService {
  private readonly repo = new WorkspaceMemberRepository();
  private readonly billingService = new BillingService();
  private readonly cache = new CacheService();

  //This service is getting used in the middleware everytime
  async getMembership(
    workspaceId: string,
    userId: string,
  ): Promise<{ role: string } | null> {
    const key = CacheKeys.membership.role(workspaceId, userId);
    const cached = await this.cache.get<{ role: string }>(key);
    if (cached !== null) return cached;

    const member = await this.repo.findMembership(workspaceId, userId);
    if (!member) return null;

    const result = { role: member.role as string };
    await this.cache.set(key, result, TTL.MEMBERSHIP);
    return result;
  }

  async listMembers(workspaceId: string): Promise<MemberSummary[]> {
    const rows = await this.repo.findMembersWithUserDetails(workspaceId);

    return rows.map(({ member, user }) => ({
      userId: member.userId,
      role: member.role as MemberSummary["role"],
      joinedAt: member.createdAt?.toISOString() ?? null,
      user: user
        ? {
            name: (user.name as string) ?? null,
            email: (user.email as string) ?? null,
            image: (user.image as string) ?? null,
          }
        : null,
    }));
  }

  async updateMemberRole(
    workspaceId: string,
    input: UpdateMemberRoleInput,
    userId: string,
  ): Promise<void> {
    const { targetUserId, role } = input;

    if (targetUserId === userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot change your own role.",
      });
    }

    const target = await this.repo.findMembership(workspaceId, targetUserId);
    if (!target) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This user is not a member of the workspace.",
      });
    }
    if (target.role === Role.OWNER) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot change the owner's role.",
      });
    }

    if (target.role === role) return;

    const updated = await this.repo.updateRole(workspaceId, targetUserId, role);
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
    }

    await this.cache.del(CacheKeys.membership.role(workspaceId, targetUserId));
    log.info({ workspaceId, targetUserId, role }, "Member role updated");
  }

  async removeMember(
    workspaceId: string,
    input: MemberActionInput,
    userId: string,
  ): Promise<void> {
    const { targetUserId } = input;

    if (targetUserId === userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Use the leave workspace action to remove yourself.",
      });
    }

    const target = await this.repo.findMembership(workspaceId, targetUserId);
    if (!target) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This user is not a member of the workspace.",
      });
    }
    if (target.role === Role.OWNER) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot remove the workspace owner.",
      });
    }

    await this.repo.remove(workspaceId, targetUserId);
    await Promise.all([
      this.billingService.decrementTeamMemberCount(workspaceId),
      this.cache.del(CacheKeys.membership.role(workspaceId, targetUserId)),
    ]);

    // Auto-set private if workspace is now down to 1 member (just the owner)
    const remaining = await this.repo.countMembers(workspaceId);
    if (remaining <= 1) {
      await this.repo.setPrivate(workspaceId, true);
    }

    log.info({ workspaceId, targetUserId }, "Member removed");
  }

  async leaveMember(
    workspaceId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === Role.OWNER) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Owners cannot leave. Delete the workspace or transfer ownership first.",
      });
    }

    const removed = await this.repo.remove(workspaceId, userId);
    //IMP check when the ADMIN kicked the memebr out and the mmber is trying to leave the workapce
    if (!removed) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You are not a member of this workspace.",
      });
    }

    await Promise.all([
      this.billingService.decrementTeamMemberCount(workspaceId),
      this.cache.del(CacheKeys.membership.role(workspaceId, userId)),
    ]);

    const remaining = await this.repo.countMembers(workspaceId);
    if (remaining <= 1) {
      await this.repo.setPrivate(workspaceId, true);
    }

    log.info({ workspaceId, userId }, "User left workspace");
  }
}
