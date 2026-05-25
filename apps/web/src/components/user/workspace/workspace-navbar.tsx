"use client";

import { useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useWorkspace } from "@/hooks/user/use-workspace-core";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { cn } from "@/lib/utils";

export function WorkspaceNavbar() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: plan } = useWorkspacePlan(workspaceId);

  const planId = plan?.planId;

  const planBadge =
    planId === "PRO_MAX"
      ? { label: "Pro Max", className: "bg-red-100 text-red-700 border border-red-200" }
      : planId === "PRO"
        ? { label: "Pro", className: "bg-blue-100 text-blue-700 border border-blue-200" }
        : null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      {workspace?.title && (
        <span className="text-sm font-medium text-foreground truncate">
          {workspace.title}
        </span>
      )}
      {planBadge && (
        <span className={cn(
          "ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest",
          planBadge.className,
        )}>
          {planBadge.label}
        </span>
      )}
    </header>
  );
}
