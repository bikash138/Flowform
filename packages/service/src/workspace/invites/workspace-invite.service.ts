import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { env } from "@flowform/env";
import { CacheService } from "@flowform/redis";
import { WorkspaceInviteStatus } from "@flowform/database/constants";
import { CacheKeys } from "@/cache";
import { BillingService } from "@/billing/billing.service";
import { EmailService } from "@/email/email.service";
import { WorkspaceInviteRepository } from "./workspace-invite.repo";
import type {
  SendInviteInput,
  InviteSummary,
  InvitePreview,
} from "./workspace-invite.schema";

const log = createLogger("workspace-invite-service");
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESEND_INVITE_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_RESENDS = 3;

//20 new invites can only sent in 1hr 
const INVITE_SEND_LIMIT = 20;
const INVITE_SEND_WINDOW_SECONDS = 60 * 60;

export default class WorkspaceInviteService {
  private readonly repo = new WorkspaceInviteRepository();
  private readonly billingService = new BillingService();
  private readonly cache = new CacheService();

  private generateToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    return { token, tokenHash };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async sendInvite(
    workspaceId: string,
    input: SendInviteInput,
    userId: string,
  ): Promise<{ inviteLink: string }> {
    const { email, role } = input;

    const { retryAfter } = await this.cache.rateLimit(
      CacheKeys.rateLimit.inviteSend(workspaceId),
      INVITE_SEND_LIMIT,
      INVITE_SEND_WINDOW_SECONDS,
    );
    if (retryAfter > 0) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Invite limit reached. Try again in ${retryAfter}s.`,
      });
    }

    const [workspace, existingUser, existingInvite, planData, inviter] =
      await Promise.all([
        this.repo.findWorkspace(workspaceId),
        this.repo.findUserByEmail(email),
        this.repo.findExistingPendingInvite(workspaceId, email),
        this.billingService.getWorkspacePlan(workspaceId),
        this.repo.findUserById(userId),
      ]);

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found.",
      });
    }

    if (workspace.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot invite members to a personal workspace.",
      });
    }

    if (existingUser) {
      if (existingUser.id === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot invite yourself.",
        });
      }
      const membership = await this.repo.findMembership(workspaceId, existingUser.id);
      if (membership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the workspace.",
        });
      }
    }

    if (planData.teamMemberCount >= planData.features.teamMemberLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your ${planData.planName} plan allows up to ${planData.features.teamMemberLimit} team members. Upgrade to add more.`,
      });
    }

    if (existingInvite) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An invitation for this email already exists. Resend it from the pending list.",
      });
    }

    const { token, tokenHash } = this.generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await this.repo.create({
      email,
      workspaceId,
      role,
      tokenHash,
      expiresAt,
      invitedBy: userId,
    });

    await EmailService.sendWorkspaceInvite({
      toEmail: email,
      workspaceName: workspace?.title ?? "A workspace",
      inviterName: (inviter?.name as string) ?? "A team member",
      rawToken: token,
    });

    const frontendUrl = env.http.frontendUrl || "http://localhost:3000";
    const inviteLink = `${frontendUrl}/invite/${token}`;

    log.info({ workspaceId, email, role }, "Invite link generated");

    return { inviteLink };
  }

  async listInvites(workspaceId: string): Promise<InviteSummary[]> {
    const invites = await this.repo.listPending(workspaceId);

    return invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role as InviteSummary["role"],
      status: inv.status as InviteSummary["status"],
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  async revokeInvite(inviteId: string, workspaceId: string): Promise<void> {
    const deleted = await this.repo.delete(inviteId, workspaceId);
    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invite not found or already processed.",
      });
    }
    log.info({ inviteId, workspaceId }, "Invite revoked");
  }

  async resendInvite(
    inviteId: string,
    workspaceId: string,
    callerId: string,
  ): Promise<void> {
    const invite = await this.repo.findById(inviteId, workspaceId);
    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation not found.",
      });
    }
    if (invite.status === WorkspaceInviteStatus.ACCEPTED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User has already joined.",
      });
    }

    const isExpired =
      invite.status === WorkspaceInviteStatus.EXPIRED ||
      new Date() > invite.expiresAt;
    if (isExpired) {
      await this.repo.delete(inviteId, workspaceId);
      await this.sendInvite(
        invite.workspaceId,
        {
          email: invite.email,
          role: invite.role as SendInviteInput["role"],
        },
        callerId,
      );
      return;
    }

    //Only 3 resends are allowed
    if ((invite.resendCount ?? 0) >= MAX_RESENDS) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Maximum resend limit reached. Revoke and send a new invite.",
      });
    }

    // Rate limit — 60s cooldown per invite
    if (invite.lastSentAt) {
      const elapsed = Date.now() - new Date(invite.lastSentAt).getTime();
      if (elapsed < RESEND_INVITE_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_INVITE_COOLDOWN_MS - elapsed) / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${wait}s before resending.`,
        });
      }
    }

    const { token, tokenHash } = this.generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const [workspace, inviter] = await Promise.all([
      this.repo.findWorkspace(workspaceId),
      this.repo.findUserById(callerId),
    ]);

    await EmailService.sendWorkspaceInvite({
      toEmail: invite.email,
      rawToken: token,
      workspaceName: workspace?.title ?? "A workspace",
      inviterName: (inviter?.name as string) ?? "A team member",
    });

    await this.repo.update(inviteId, workspaceId, {
      tokenHash,
      expiresAt,
      lastSentAt: new Date(),
      resendCount: (invite.resendCount ?? 0) + 1,
      status: "PENDING",
    });

    log.info({ inviteId, workspaceId }, "Invite resent");
  }

  async validateInviteToken(token: string): Promise<InvitePreview> {
    const tokenHash = this.hashToken(token);
    const invite = await this.repo.findByTokenHash(tokenHash);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid invite link.",
      });
    }
    if (invite.status !== WorkspaceInviteStatus.PENDING) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `This invite has already been ${invite.status}.`,
      });
    }
    if (new Date() > invite.expiresAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite has expired.",
      });
    }

    const workspace = await this.repo.findWorkspace(invite.workspaceId);
    if (!workspace || workspace.isDeleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "This workspace no longer exists.",
      });
    }

    return {
      email: invite.email,
      role: invite.role as InvitePreview["role"],
      workspaceName: workspace.title,
      workspaceLogo: workspace.logo ?? null,
      inviterName: invite.inviterName ?? "A team member",
    };
  }

  async acceptInvite(
    token: string,
    userId: string,
  ): Promise<{ workspaceId: string }> {
    const tokenHash = this.hashToken(token);
    const invite = await this.repo.findByTokenHash(tokenHash);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid invite link.",
      });
    }
    if (invite.status !== WorkspaceInviteStatus.PENDING) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `This invite has already been ${invite.status}.`,
      });
    }
    if (new Date() > invite.expiresAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invite has expired.",
      });
    }

    const user = await this.repo.findUserById(userId);
    const userEmail = user?.email;

    if (invite.email !== userEmail) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This invite was sent to ${invite.email}. Please log in with that account.`,
      });
    }

    await this.billingService.checkMemberLimit(invite.workspaceId);

    await this.repo.acceptTransaction(
      invite.id,
      invite.workspaceId,
      userId,
      invite.role,
      (tx) => this.billingService.incrementTeamMemberCount(invite.workspaceId, tx),
    );

    await this.cache.del(CacheKeys.membership.role(invite.workspaceId, userId));
    log.info({ inviteId: invite.id, userId }, "Invite accepted");

    return { workspaceId: invite.workspaceId };
  }
}
