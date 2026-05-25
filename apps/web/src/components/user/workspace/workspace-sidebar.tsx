"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useWorkspaces, useWorkspace } from "@/hooks/user/use-workspace-core";
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal";
import { CreateFormModal } from "@/components/modals/create-form-modal";
import { WorkspaceSettingsModal } from "@/components/modals/workspace-settings/workspace-settings-modal";
import { SignOutModal } from "@/components/modals/sign-out-modal";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function WorkspaceSidebar() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const selectedWorkspace = params.workspaceId as string;

  const [privateExpanded, setPrivateExpanded] = useState(true);
  const [sharedExpanded, setSharedExpanded] = useState(true);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [createFormModalOpen, setCreateFormModalOpen] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const { data: workspaces = [], isLoading } = useWorkspaces();
  const { data: currentWorkspace } = useWorkspace(selectedWorkspace);
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const privateWorkspaces = workspaces.filter((ws) => ws.isPrivate);
  const sharedWorkspaces = workspaces.filter((ws) => !ws.isPrivate);

  const isFormsTab = pathname.includes("/forms");
  const isPollsTab = pathname.includes("/polls");

  const getWorkspacePath = (wsId: string) => {
    if (isFormsTab) return `/workspace/${wsId}/forms`;
    if (isPollsTab) return `/workspace/${wsId}/polls`;
    return `/workspace/${wsId}`;
  };

  return (
    <aside className="flex flex-col w-[200px] border-r border-border bg-background shrink-0 h-full">
      {/* Contextual Create Button */}
      <div className="p-3 pb-2">
        {isFormsTab ? (
          <CreateFormModal
            workspaceId={selectedWorkspace}
            open={createFormModalOpen}
            onOpenChange={setCreateFormModalOpen}
          >
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark font-semibold text-sm h-9 gap-1.5">
              <Plus className="size-4" />
              Create a Form
            </Button>
          </CreateFormModal>
        ) : isPollsTab ? (
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark font-semibold text-sm h-9 gap-1.5">
            <Plus className="size-4" />
            Launch a Poll
          </Button>
        ) : (
          <CreateWorkspaceModal
            open={createWorkspaceModalOpen}
            onOpenChange={setCreateWorkspaceModalOpen}
          >
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark font-semibold text-sm h-9 gap-1.5">
              <Plus className="size-4" />
              New Workspace
            </Button>
          </CreateWorkspaceModal>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="h-8 pl-8 text-sm border-border bg-background text-foreground placeholder:text-muted-foreground hover:border-primary/40 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
          />
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Workspaces Section */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Workspaces Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Workspaces
              </span>
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-5 text-muted-foreground hover:text-foreground"
                    onClick={() => setWorkspaceSettingsOpen(true)}
                  >
                    <Settings className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Manage workspace</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <WorkspaceSettingsModal
            open={workspaceSettingsOpen}
            onOpenChange={setWorkspaceSettingsOpen}
            workspace={currentWorkspace ? {
              id: currentWorkspace.id,
              title: currentWorkspace.title,
              logo: currentWorkspace.logo,
              isPersonal: currentWorkspace.isPersonal,
              myRole: currentWorkspace.myRole,
            } : undefined}
          />

          {/* Private Section */}
          <div className="mt-3">
            <Collapsible open={privateExpanded} onOpenChange={setPrivateExpanded}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-1 px-1 cursor-pointer">
                  <span>Private</span>
                  {privateExpanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-0.5">
                  {isLoading ? (
                    <div className="flex justify-center py-4 text-muted-foreground">
                      <Spinner className="size-4" />
                    </div>
                  ) : privateWorkspaces.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No private workspaces
                    </div>
                  ) : (
                    privateWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => router.push(getWorkspacePath(ws.id))}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                          selectedWorkspace === ws.id
                            ? "bg-muted/50 text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                        )}
                      >
                        {ws.logo ? (
                          <img
                            src={ws.logo}
                            alt=""
                            className="size-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-950 shrink-0">
                            {ws.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{ws.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Shared Section */}
          {!isLoading && sharedWorkspaces.length > 0 && (
            <div className="mt-4">
              <Collapsible open={sharedExpanded} onOpenChange={setSharedExpanded}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-1 px-1 cursor-pointer">
                    <span>Public</span>
                    {sharedExpanded ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-0.5">
                    {sharedWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => router.push(getWorkspacePath(ws.id))}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                          selectedWorkspace === ws.id
                            ? "bg-muted/50 text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                        )}
                      >
                        {ws.logo ? (
                          <img
                            src={ws.logo}
                            alt=""
                            className="size-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-4 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-950 shrink-0">
                            {ws.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{ws.title}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom: User Section */}
      <div className="mt-auto border-t border-border p-2 space-y-0.5">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors w-full"
        >
          <Avatar className="size-6 shrink-0 border border-primary/30">
            <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-muted-foreground">Profile</span>
        </Link>

        <button
          onClick={() => setSignOutOpen(true)}
          className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-destructive/8 transition-colors w-full text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-3.5 shrink-0" />
          <span className="text-xs font-medium">Sign out</span>
        </button>
      </div>

      <SignOutModal isOpen={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </aside>
  );
}