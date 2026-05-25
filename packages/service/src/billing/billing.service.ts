import { TRPCError } from "@trpc/server";
import { createLogger } from "@flowform/logger";
import { CacheService } from "@flowform/redis";
import type { Tx } from "@flowform/database/connection";
import { CacheKeys, TTL } from "../cache";
import { BillingRepository } from "./billing.repo";
import { PLANS } from "./plans.data";
import type {
  ActivatePlanInput,
  WorkspacePlanOutput,
  RemainingQuotaOutput,
  FormUsageOutput,
} from "./billing.schema";
import type { PlanData } from "./plans.data";

const log = createLogger("billing-service");

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export class BillingService {
  private readonly repo = new BillingRepository();
  private readonly cache = new CacheService();

  getPlans(): PlanData[] {
    return [...PLANS];
  }

  // Returns the plan + features for a workspace.
  async getWorkspacePlan(workspaceId: string): Promise<WorkspacePlanOutput> {
    return this.cache.getOrSet(
      CacheKeys.billing.workspacePlan(workspaceId),
      async () => {
        const row = await this.repo.getWorkspacePlan(workspaceId);

        if (!row) {
          //Treat as FREE plan
          const freePlan = await this.repo.getPlanById("FREE");
          if (!freePlan) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Plan catalog not seeded",
            });
          }
          return {
            planId: "FREE",
            planName: freePlan.name,
            status: "ACTIVE",
            features: freePlan.features,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            formCount: 0,
            teamMemberCount: 0,
          };
        }

        return {
          planId: row.planId,
          planName: row.planName,
          status: row.status,
          features: row.features,
          currentPeriodEnd: row.currentPeriodEnd,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
          formCount: row.formCount,
          teamMemberCount: row.teamMemberCount,
        };
      },
      TTL.WORKSPACE_PLAN,
    );
  }

  // Used UI to show how many responses are left this month.
  async getRemainingQuota(workspaceId: string): Promise<RemainingQuotaOutput> {
    const planData = await this.getWorkspacePlan(workspaceId);
    const yearMonth = getCurrentYearMonth();
    const key = CacheKeys.billing.responseLimitUsage(workspaceId, yearMonth);

    let usedThisMonth: number;
    const cached = await this.cache.get<number>(key);

    if (cached !== null) {
      usedThisMonth = cached;
    } else {
      const usage = await this.repo.getMonthlyUsage(workspaceId, yearMonth);
      usedThisMonth = usage?.responseCount ?? 0;
      await this.cache.set(key, usedThisMonth, TTL.RESPONSE_LIMIT_USAGE);
    }

    const monthlyLimit = planData.features.monthlyResponseLimit;
    const remaining = Math.max(0, monthlyLimit - usedThisMonth);

    return { monthlyLimit, usedThisMonth, remaining, yearMonth };
  }

  // Manual toggle for local testing/ Will be called by Polar webhook after payment.
  async activatePlan(input: ActivatePlanInput): Promise<WorkspacePlanOutput> {
    const planRecord = await this.repo.getPlanById(input.planId);
    if (!planRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `${input.planId} plan not found`,
      });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updated = await this.repo.upsertWorkspacePlan({
      workspaceId: input.workspaceId,
      planId: input.planId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    await this.cache.del(CacheKeys.billing.workspacePlan(input.workspaceId));

    log.info(
      { workspaceId: input.workspaceId, planId: input.planId },
      "Plan activated",
    );

    return {
      planId: input.planId,
      planName: planRecord.name,
      status: "ACTIVE",
      features: planRecord.features,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      formCount: updated.formCount,
      teamMemberCount: updated.teamMemberCount,
    };
  }

  // Called when a new workspace is created.
  async initializeFreePlan(workspaceId: string, tx?: Tx): Promise<void> {
    await this.repo.upsertWorkspacePlan({
      workspaceId,
      planId: "FREE",
      status: "ACTIVE",
    }, tx);

    log.info({ workspaceId }, "Free plan initialized for new workspace");
  }

  //Counter for response
  async incrementUsage(workspaceId: string): Promise<number> {
    const yearMonth = getCurrentYearMonth();
    const key = CacheKeys.billing.responseLimitUsage(workspaceId, yearMonth);

    let newCount = await this.cache.incr(key);

    //When redis restarts it needs to get the latest db data to sync with db
    if (newCount === 1) {
      const usage = await this.repo.getMonthlyUsage(workspaceId, yearMonth);
      if (usage && usage.responseCount > 0) {
        newCount = usage.responseCount + 1;
        await this.cache.set(key, newCount, TTL.RESPONSE_LIMIT_USAGE);
      }
    }

    if (newCount === 1) {
      await this.cache.expire(key, TTL.RESPONSE_LIMIT_USAGE);
    }

    return newCount;
  }

  // ======= FORM COUNT ========

  //Called before creating a new form
  async checkFormLimit(workspaceId: string): Promise<void> {
    const planData = await this.getWorkspacePlan(workspaceId);
    if (planData.formCount >= planData.features.formLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your ${planData.planName} plan allows up to ${planData.features.formLimit} forms. Upgrade to create more.`,
      });
    }
  }

  //Will be used in UI
  async getFormUsage(workspaceId: string): Promise<FormUsageOutput> {
    const planData = await this.getWorkspacePlan(workspaceId);
    return { used: planData.formCount, limit: planData.features.formLimit };
  }

  //Called on after creating form
  async incrementFormCount(workspaceId: string, tx?: Tx): Promise<void> {
    await this.repo.incrementFormCount(workspaceId, tx);
    await this.cache.del(CacheKeys.billing.workspacePlan(workspaceId));
  }

  //Called after a form is deleted
  async decrementFormCount(workspaceId: string, tx?: Tx): Promise<void> {
    await this.repo.decrementFormCount(workspaceId, tx);
    await this.cache.del(CacheKeys.billing.workspacePlan(workspaceId));
  }

  // ===== TEAM MEBER COUNT ======

  //Will be used in UI
  async getMemberUsage(workspaceId: string): Promise<FormUsageOutput> {
    const planData = await this.getWorkspacePlan(workspaceId);
    return { used: planData.teamMemberCount, limit: planData.features.teamMemberLimit };
  }

  //Called before sending an invite
  async checkMemberLimit(workspaceId: string): Promise<void> {
    const planData = await this.getWorkspacePlan(workspaceId);
    if (planData.teamMemberCount >= planData.features.teamMemberLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your ${planData.planName} plan allows up to ${planData.features.teamMemberLimit} team members. Upgrade to add more.`,
      });
    }
  }

  //Called after invite is accepted
  async incrementTeamMemberCount(workspaceId: string, tx?: Tx): Promise<void> {
    await this.repo.incrementTeamMemberCount(workspaceId, tx);
    await this.cache.del(CacheKeys.billing.workspacePlan(workspaceId));
  }

  //Called after a member is removed or leaves
  async decrementTeamMemberCount(workspaceId: string): Promise<void> {
    await this.repo.decrementTeamMemberCount(workspaceId);
    await this.cache.del(CacheKeys.billing.workspacePlan(workspaceId));
  }
}
