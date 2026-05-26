"use client";

import { useState } from "react";
import { Check, ChevronRight, Building2, Crown, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivatePlan, usePlans, useWorkspacePlan } from "@/hooks/user/use-billing";
import { useWorkspaces } from "@/hooks/user/use-workspace-core";
import type { RouterOutputs, RouterInputs } from "@flowform/trpc/client";

type PlanData = RouterOutputs["billing"]["getPlans"][number];
type Plans = RouterOutputs["billing"]["getPlans"];
type PlanId = RouterInputs["billing"]["activatePlan"]["planId"];
type WorkspaceSummary = RouterOutputs["workspace"]["core"]["getUserWorkspaces"][number];

const PLAN_RANK: Record<string, number> = { FREE: 0, PRO: 1, PRO_MAX: 2 };

const PLAN_LABELS: Record<string, string> = { FREE: "Free", PRO: "Pro", PRO_MAX: "Pro Max" };

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PRO: Zap,
  PRO_MAX: Crown,
};

// ─── Feature List (shared) ────────────────────────────────────────────────────

function FeatureList({ plan, dim }: { plan: PlanData; dim?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {plan.features.flatMap((group) =>
        group.items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <Check
              className={cn(
                "size-3 shrink-0",
                dim ? "text-background/60" : "text-primary",
              )}
            />
            <span className={cn("text-xs", dim ? "text-background/80" : "text-foreground/80")}>
              {item.label}
            </span>
          </li>
        )),
      )}
    </ul>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  badge,
  cta,
}: {
  plan: PlanData;
  badge?: React.ReactNode;
  cta: React.ReactNode;
}) {
  const isProMax = plan.id === "PRO_MAX";
  const Icon = PLAN_ICONS[plan.id];

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4",
        isProMax ? "border-foreground/15 bg-foreground" : "border-border bg-muted/30",
      )}
    >
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest",
              isProMax ? "text-background/50" : "text-muted-foreground",
            )}
          >
            {Icon && <Icon className="size-3" />}
            {plan.name}
          </div>
          {badge}
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className={cn("text-2xl font-bold tracking-tight", isProMax ? "text-background" : "text-foreground")}>
            {plan.price}
          </span>
          <span className={cn("ml-0.5 text-xs", isProMax ? "text-background/40" : "text-muted-foreground")}>
            {plan.period}
          </span>
        </div>
        <p className={cn("mt-0.5 text-xs", isProMax ? "text-background/45" : "text-muted-foreground")}>
          {plan.tagline}
        </p>
      </div>

      <div className="mb-4 flex-1">
        <FeatureList plan={plan} dim={isProMax} />
      </div>

      {cta}
    </div>
  );
}

// ─── Workspace Row ────────────────────────────────────────────────────────────

function WorkspaceRow({
  ws,
  targetPlanId,
  selected,
  onSelect,
}: {
  ws: WorkspaceSummary;
  targetPlanId: PlanId;
  selected: boolean;
  onSelect: () => void;
}) {
  const { data: plan, isLoading } = useWorkspacePlan(ws.id);
  const currentPlanId = plan?.planId ?? "FREE";
  const isDowngrade = PLAN_RANK[currentPlanId] >= PLAN_RANK[targetPlanId];
  const isSamePlan = currentPlanId === targetPlanId;
  const disabled = isDowngrade;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
          disabled
            ? "cursor-not-allowed border-border bg-muted/20 opacity-60"
            : selected
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-primary/40 hover:bg-muted/30",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Building2 className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{ws.title}</p>
          <p className="text-xs text-muted-foreground">{ws.isPrivate ? "Private" : "Public"} workspace</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <span className="h-4 w-10 animate-pulse rounded bg-muted" />
          ) : (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                currentPlanId === "PRO_MAX"
                  ? "bg-foreground text-background"
                  : currentPlanId === "PRO"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {PLAN_LABELS[currentPlanId]}
            </span>
          )}
          {isSamePlan && <span className="text-[10px] text-muted-foreground">Current</span>}
          {!isSamePlan && isDowngrade && <span className="text-[10px] text-muted-foreground">No downgrade</span>}
          {selected && !disabled && <Check className="size-4 text-primary" />}
        </div>
      </button>
    </li>
  );
}

// ─── Workspace Picker ─────────────────────────────────────────────────────────

function WorkspacePicker({
  planId,
  planName,
  onBack,
  onSuccess,
}: {
  planId: PlanId;
  planName: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { mutate, isPending } = useActivatePlan(selectedId ?? "");

  const eligible = workspaces?.filter((w) => !w.isPersonal) ?? [];

  function handleConfirm() {
    if (!selectedId) return;
    mutate({ workspaceId: selectedId, planId }, { onSuccess });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Choose a workspace for <span className="text-primary">{planName}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Personal workspaces are not eligible. Downgrades are not allowed.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-muted/30" />
          ))}
        </div>
      ) : eligible.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          You have no eligible workspaces. Create a team workspace first.
        </div>
      ) : (
        <ul className="space-y-2">
          {eligible.map((ws) => (
            <WorkspaceRow
              key={ws.id}
              ws={ws}
              targetPlanId={planId}
              selected={selectedId === ws.id}
              onSelect={() => setSelectedId(ws.id)}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedId || isPending}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isPending ? "Activating…" : `Subscribe to ${planName}`}
        </Button>
      </div>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
      ))}
    </div>
  );
}

function FreeView({ plans, onSelect }: { plans: Plans; onSelect: (plan: PlanData) => void }) {
  const upgradePlans = plans.filter((p) => p.id !== "FREE");
  return (
    <div className="grid grid-cols-2 gap-3">
      {upgradePlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          cta={
            <Button
              size="sm"
              onClick={() => onSelect(plan)}
              className={cn(
                "w-full text-xs font-semibold",
                plan.id === "PRO_MAX"
                  ? "bg-background text-foreground hover:bg-background/90"
                  : "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              Subscribe to {plan.name}
              <ChevronRight className="ml-1 size-3" />
            </Button>
          }
        />
      ))}
    </div>
  );
}

function ProView({ plans, onSelect }: { plans: Plans; onSelect: (plan: PlanData) => void }) {
  const proPlan = plans.find((p) => p.id === "PRO");
  const proMaxPlan = plans.find((p) => p.id === "PRO_MAX");

  if (!proPlan || !proMaxPlan) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <PlanCard
        plan={proPlan}
        badge={
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Current
          </span>
        }
        cta={
          <Button size="sm" disabled className="w-full text-xs font-semibold opacity-50 cursor-default">
            Current Plan
          </Button>
        }
      />
      <PlanCard
        plan={proMaxPlan}
        cta={
          <Button
            size="sm"
            onClick={() => onSelect(proMaxPlan)}
            className="w-full bg-background text-foreground text-xs font-semibold hover:bg-background/90"
          >
            Upgrade to Pro Max
            <ChevronRight className="ml-1 size-3" />
          </Button>
        }
      />
    </div>
  );
}

function ProMaxView({ plans, onClose }: { plans: Plans; onClose: () => void }) {
  const proMaxPlan = plans.find((p) => p.id === "PRO_MAX");

  if (!proMaxPlan) return null;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        <PlanCard
          plan={proMaxPlan}
          badge={
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background/70">
              <Crown className="size-2.5" />
              Current
            </span>
          }
          cta={
            <Button
              size="sm"
              onClick={onClose}
              className="w-full bg-background text-foreground text-xs font-semibold hover:bg-background/90"
            >
              You&apos;re on the best plan
            </Button>
          }
        />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function PlansModal({
  open,
  onOpenChange,
  currentPlanId = "FREE",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
}) {
  const { data: plans, isLoading } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);

  function handleClose(value: boolean) {
    if (!value) setSelectedPlan(null);
    onOpenChange(value);
  }

  const titles: Record<string, { title: string; description: string }> = {
    FREE:    { title: "Upgrade your workspace",  description: "Unlock more power for your forms and team." },
    PRO:     { title: "Upgrade to Pro Max",       description: "You're on Pro. Take it further with Pro Max." },
    PRO_MAX: { title: "Your plan",                description: "You're on the most powerful plan available." },
  };

  const meta = titles[currentPlanId] ?? titles.FREE;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-2xl", currentPlanId === "PRO_MAX" && "sm:max-w-sm")}>
        {selectedPlan ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a workspace</DialogTitle>
              <DialogDescription>
                Select which workspace to upgrade to {selectedPlan.name}.
              </DialogDescription>
            </DialogHeader>
            <WorkspacePicker
              planId={selectedPlan.id as PlanId}
              planName={selectedPlan.name}
              onBack={() => setSelectedPlan(null)}
              onSuccess={() => handleClose(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{meta.title}</DialogTitle>
              <DialogDescription>{meta.description}</DialogDescription>
            </DialogHeader>
            {isLoading || !plans ? (
              <PlansSkeleton />
            ) : (
              <>
                {currentPlanId === "FREE" && <FreeView plans={plans} onSelect={setSelectedPlan} />}
                {currentPlanId === "PRO" && <ProView plans={plans} onSelect={setSelectedPlan} />}
                {currentPlanId === "PRO_MAX" && <ProMaxView plans={plans} onClose={() => handleClose(false)} />}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
