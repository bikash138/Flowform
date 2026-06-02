"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Settings, Users, Trash2, TriangleAlert } from "lucide-react";
import { useDeleteWorkspace } from "@/hooks/user/use-workspace-core";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { GeneralSettingsTab } from "./general-settings-tab";
import { MemberSettingsTab } from "./member-settings-tab";

type Tab = "general" | "members";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "members", label: "Members", icon: Users },
];

interface WorkspaceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: Tab;
  workspace?: {
    id: string;
    title: string;
    logo: string | null;
    isPersonal?: boolean;
    isPrivate?: boolean;
    myRole?: string;
  };
}

export function WorkspaceSettingsModal({
  open,
  onOpenChange,
  defaultTab = "general",
  workspace,
}: WorkspaceSettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>(defaultTab);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = React.useState("");

  const router = useRouter();
  const deleteWorkspace = useDeleteWorkspace();

  React.useEffect(() => {
    if (open) setActiveTab(defaultTab);
    else setActiveTab("general");
  }, [open, defaultTab]);

  const handleDelete = () => {
    if (!workspace) return;
    deleteWorkspace.mutate(
      { workspaceId: workspace.id },
      {
        onSuccess: async () => {
          setDeleteOpen(false);
          const { data: session } = await authClient.getSession();
          const personalWorkspaceId = session?.user.personalWorkspaceId;
          router.push(personalWorkspaceId ? `/ws/${personalWorkspaceId}` : "/");
        },
      },
    );
  };

  const isOwner = workspace?.myRole === "OWNER";

  const { data: plan } = useWorkspacePlan(workspace?.id ?? "");
  const planId = plan?.planId ?? "FREE";
  const planLabel = plan?.planName ?? "Free";

  const planBadgeClass =
    planId === "PRO_MAX"
      ? "bg-red-100 text-red-700"
      : planId === "PRO"
        ? "bg-blue-100 text-blue-700"
        : "bg-green-100 text-green-700";

  return (
    <React.Fragment>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[780px] p-0 gap-0 overflow-hidden h-[520px] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0 gap-1">
            <DialogTitle className="text-base font-semibold">Workspace Settings</DialogTitle>
            <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", planBadgeClass)}>
              {planLabel}
            </span>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left nav */}
            <aside className="w-44 shrink-0 border-r border-border bg-muted/20 py-2 overflow-y-auto">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeTab === id
                      ? "bg-background text-foreground border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </aside>

            {/* Right content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {activeTab === "general" && (
                  <div className="px-6 py-4">
                    <GeneralSettingsTab
                      workspace={workspace}
                      onDeleteClick={() => setDeleteOpen(true)}
                    />
                  </div>
                )}
                {activeTab === "members" && workspace && (
                  <MemberSettingsTab
                    workspaceId={workspace.id}
                    isOwner={isOwner}
                    isPrivate={workspace.isPrivate ?? workspace.isPersonal ?? false}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteConfirmTitle("");
        }}
      >
        <DialogContent className="sm:max-w-[440px] w-full gap-0 p-0 overflow-hidden" showCloseButton>
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex items-center justify-center size-8 rounded-full bg-destructive/10 shrink-0">
                <TriangleAlert className="size-4 text-destructive" />
              </div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Delete workspace?
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground pl-10">
              This action is <span className="font-medium text-foreground">permanent</span> and cannot be undone.
            </p>
          </DialogHeader>

          <div className="px-6 pb-5 flex flex-col gap-5">
            <ul className="flex flex-col gap-2">
              {[
                "All members will be kicked out of the workspace.",
                "All forms inside this workspace will be permanently deleted.",
                "All recorded responses will be lost.",
              ].map((msg) => (
                <li key={msg} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="mt-0.5 size-1.5 rounded-full bg-destructive/60 shrink-0" />
                  {msg}
                </li>
              ))}
            </ul>

            <Separator className="bg-border" />

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">
                Type <span className="font-semibold text-foreground">{workspace?.title}</span> to confirm
              </label>
              <Input
                value={deleteConfirmTitle}
                onChange={(e) => setDeleteConfirmTitle(e.target.value)}
                placeholder={workspace?.title}
                className="h-9 text-sm bg-background border-border"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs border-border"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-4 text-xs gap-1.5"
                disabled={deleteConfirmTitle !== workspace?.title || deleteWorkspace.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="size-3.5" />
                {deleteWorkspace.isPending ? "Deleting..." : "Delete workspace"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
