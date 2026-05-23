import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@flowform/database/connection";
import type { Tx } from "@flowform/database/connection";
import { plan, workspacePlan, workspaceUsage } from "@flowform/database/models";
import type { PlanRecord, WorkspacePlanRecord, WorkspaceUsageRecord } from "@flowform/database/models";

export class BillingRepository {
  private get db() {
    return getDb();
  }

  //Plan

  async getPlanById(planId: string): Promise<PlanRecord | null> {
    const [row] = await this.db
      .select()
      .from(plan)
      .where(eq(plan.id, planId as any))
      .limit(1);
    return row ?? null;
  }

  //Workspace Plan

  async getWorkspacePlan(workspaceId: string): Promise<
    (WorkspacePlanRecord & { planName: string; features: PlanRecord["features"] }) | null
  > {
    const [row] = await this.db
      .select({
        id: workspacePlan.id,
        workspaceId: workspacePlan.workspaceId,
        planId: workspacePlan.planId,
        planName: plan.name,
        features: plan.features,
        status: workspacePlan.status,
        polarCustomerId: workspacePlan.polarCustomerId,
        polarSubscriptionId: workspacePlan.polarSubscriptionId,
        currentPeriodStart: workspacePlan.currentPeriodStart,
        currentPeriodEnd: workspacePlan.currentPeriodEnd,
        cancelAtPeriodEnd: workspacePlan.cancelAtPeriodEnd,
        formCount: workspacePlan.formCount,
        teamMemberCount: workspacePlan.teamMemberCount,
        createdAt: workspacePlan.createdAt,
        updatedAt: workspacePlan.updatedAt,
      })
      .from(workspacePlan)
      .innerJoin(plan, eq(workspacePlan.planId, plan.id))
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .limit(1);

    return row ?? null;
  }

  async upsertWorkspacePlan(data: {
    workspaceId: string;
    planId: WorkspacePlanRecord["planId"];
    status: WorkspacePlanRecord["status"];
    polarCustomerId?: string | null;
    polarSubscriptionId?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }, tx?: Tx): Promise<WorkspacePlanRecord> {
    const db = tx ?? this.db;
    const [row] = await db
      .insert(workspacePlan)
      .values({
        workspaceId: data.workspaceId,
        planId: data.planId,
        status: data.status,
        polarCustomerId: data.polarCustomerId ?? null,
        polarSubscriptionId: data.polarSubscriptionId ?? null,
        currentPeriodStart: data.currentPeriodStart ?? null,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      })
      .onConflictDoUpdate({
        target: workspacePlan.workspaceId,
        set: {
          planId: data.planId,
          status: data.status,
          polarCustomerId: data.polarCustomerId ?? null,
          polarSubscriptionId: data.polarSubscriptionId ?? null,
          currentPeriodStart: data.currentPeriodStart ?? null,
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row!;
  }

  //Workspace Usage

  async getMonthlyUsage(
    workspaceId: string,
    yearMonth: string,
  ): Promise<WorkspaceUsageRecord | null> {
    const [row] = await this.db
      .select()
      .from(workspaceUsage)
      .where(
        and(
          eq(workspaceUsage.workspaceId, workspaceId),
          eq(workspaceUsage.yearMonth, yearMonth),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async syncMonthlyUsage(
    workspaceId: string,
    yearMonth: string,
    count: number,
  ): Promise<void> {
    await this.db
      .insert(workspaceUsage)
      .values({ workspaceId, yearMonth, responseCount: count })
      .onConflictDoUpdate({
        target: [workspaceUsage.workspaceId, workspaceUsage.yearMonth],
        set: { responseCount: count, updatedAt: new Date() },
      });
  }

  async incrementMonthlyUsage(
    workspaceId: string,
    yearMonth: string,
  ): Promise<number> {
    const [row] = await this.db
      .insert(workspaceUsage)
      .values({
        workspaceId,
        yearMonth,
        responseCount: 1,
      })
      .onConflictDoUpdate({
        target: [workspaceUsage.workspaceId, workspaceUsage.yearMonth],
        set: {
          responseCount: sql`${workspaceUsage.responseCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ responseCount: workspaceUsage.responseCount });
    return row!.responseCount;
  }

  //Form Count

  async incrementFormCount(workspaceId: string, tx?: Tx): Promise<number> {
    const db = tx ?? this.db;
    const [row] = await db
      .update(workspacePlan)
      .set({
        formCount: sql`${workspacePlan.formCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .returning({ formCount: workspacePlan.formCount });
    return row?.formCount ?? 0;
  }

  async decrementFormCount(workspaceId: string, tx?: Tx): Promise<number> {
    const db = tx ?? this.db;
    const [row] = await db
      .update(workspacePlan)
      .set({
        formCount: sql`GREATEST(${workspacePlan.formCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .returning({ formCount: workspacePlan.formCount });
    return row?.formCount ?? 0;
  }

  async getFormCount(workspaceId: string): Promise<number> {
    const [row] = await this.db
      .select({ formCount: workspacePlan.formCount })
      .from(workspacePlan)
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .limit(1);
    return row?.formCount ?? 0;
  }

  //Team Member Count

  async incrementTeamMemberCount(workspaceId: string, tx?: Tx): Promise<number> {
    const db = tx ?? this.db;
    const [row] = await db
      .update(workspacePlan)
      .set({
        teamMemberCount: sql`${workspacePlan.teamMemberCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .returning({ teamMemberCount: workspacePlan.teamMemberCount });
    return row?.teamMemberCount ?? 0;
  }

  async decrementTeamMemberCount(workspaceId: string): Promise<number> {
    const [row] = await this.db
      .update(workspacePlan)
      .set({
        teamMemberCount: sql`GREATEST(${workspacePlan.teamMemberCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .returning({ teamMemberCount: workspacePlan.teamMemberCount });
    return row?.teamMemberCount ?? 0;
  }

  async getTeamMemberCount(workspaceId: string): Promise<number> {
    const [row] = await this.db
      .select({ teamMemberCount: workspacePlan.teamMemberCount })
      .from(workspacePlan)
      .where(eq(workspacePlan.workspaceId, workspaceId))
      .limit(1);
    return row?.teamMemberCount ?? 0;
  }
}
