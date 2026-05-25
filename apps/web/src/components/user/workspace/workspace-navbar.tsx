"use client";

import { useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useWorkspace } from "@/hooks/user/use-workspace-core";

export function WorkspaceNavbar() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: workspace } = useWorkspace(workspaceId);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      {workspace?.title && (
        <span className="text-sm font-medium text-foreground truncate">
          {workspace.title}
        </span>
      )}
    </header>
  );
}
