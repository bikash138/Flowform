"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpCircle,
  Crown,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { useWorkspaces, useWorkspace } from "@/hooks/user/use-workspace-core";
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal";
import { CreateFormModal } from "@/components/modals/create-form-modal";
import { WorkspaceSettingsModal } from "@/components/modals/workspace-settings/workspace-settings-modal";
import { SignOutModal } from "@/components/modals/sign-out-modal";
import { PlansModal } from "@/components/modals/plans-modal";
import { ProfileModal } from "@/components/modals/profile-modal";

export function WorkspaceSidebar() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const selectedWorkspace = params.workspaceId as string;

  const [privateExpanded, setPrivateExpanded] = useState(true);
  const [sharedExpanded, setSharedExpanded] = useState(true);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: workspaces = [], isLoading } = useWorkspaces();
  const { data: currentWorkspace } = useWorkspace(selectedWorkspace);
  const { data: plan } = useWorkspacePlan(selectedWorkspace);
  const { data: session } = authClient.useSession();

  const user = session?.user ?? null;
  const planId = plan?.planId ?? "FREE";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const privateWorkspaces = workspaces.filter((ws) => ws.isPrivate);
  const sharedWorkspaces = workspaces.filter((ws) => !ws.isPrivate);

  const isFormsTab = pathname.includes("/forms");
  const isPollsTab = pathname.includes("/polls");

  const getWorkspacePath = (wsId: string) => {
    if (isFormsTab) return `/ws/${wsId}/forms`;
    if (isPollsTab) return `/ws/${wsId}/polls`;
    return `/ws/${wsId}`;
  };

  const planButton = {
    FREE:    { label: "View Plans",   icon: Sparkles,       className: "bg-foreground/75 text-background hover:bg-foreground hover:text-background tracking-wider [font-family:var(--font-open-sans)] transition-colors duration-200" },
    PRO:     { label: "Upgrade",      icon: ArrowUpCircle,  className: "bg-foreground/75 text-background hover:bg-foreground hover:text-background tracking-wider [font-family:var(--font-open-sans)] transition-colors duration-200" },
    PRO_MAX: { label: "See Features", icon: Crown,          className: "bg-foreground/75 text-background hover:bg-foreground hover:text-background tracking-wider [font-family:var(--font-open-sans)] transition-colors duration-200" },
  }[planId] ?? { label: "View Plans", icon: Sparkles, className: "bg-foreground/75 text-background hover:bg-foreground hover:text-background tracking-wider [font-family:var(--font-open-sans)] transition-colors duration-200" };

  const PlanIcon = planButton.icon;

  const isFormsPage = pathname.includes("/forms");

  return (
    <>
      <Sidebar collapsible="icon">
        {/* ── Header: Logo ── */}
        <SidebarHeader className="border-b border-sidebar-border h-12 flex items-center px-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image
              src="/logo.svg"
              alt="Flowform"
              width={26}
              height={26}
              className="size-6.5 shrink-0"
            />
            {!isCollapsed && (
              <span className="text-base font-bold tracking-tight text-foreground truncate [font-family:var(--font-jakarta-sans)]">
                Flowform
              </span>
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          {/* ── Actions ── */}
          <SidebarGroup className="px-2 pt-3 pb-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Create */}
                <SidebarMenuItem>
                  {isFormsPage ? (
                    <CreateFormModal
                      workspaceId={selectedWorkspace}
                      open={createFormOpen}
                      onOpenChange={setCreateFormOpen}
                    >
                      <SidebarMenuButton tooltip="Create a Form" className="font-medium">
                        <Plus />
                        <span>Create a Form</span>
                      </SidebarMenuButton>
                    </CreateFormModal>
                  ) : (
                    <CreateWorkspaceModal
                      open={createWorkspaceOpen}
                      onOpenChange={setCreateWorkspaceOpen}
                    >
                      <SidebarMenuButton tooltip="New Workspace" className="font-medium">
                        <Plus />
                        <span>New Workspace</span>
                      </SidebarMenuButton>
                    </CreateWorkspaceModal>
                  )}
                </SidebarMenuItem>

                {/* Search */}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Search">
                    <Search />
                    <span>Search</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Settings */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Workspace settings"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* ── Workspaces ── */}
          <SidebarGroup className="px-2 py-2 flex-1">
            <SidebarGroupContent>
              <div className={cn(
                "rounded-lg bg-sidebar-accent/50 p-1.5 space-y-3",
                isCollapsed && "bg-transparent p-0 space-y-1",
              )}>
                {/* Private */}
                <Collapsible open={privateExpanded} onOpenChange={setPrivateExpanded}>
                  {!isCollapsed && (
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                        <span>Private</span>
                        {privateExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent>
                    <SidebarMenu className="gap-1">
                      {isLoading ? (
                        <div className="flex justify-center py-3">
                          <Spinner className="size-4" />
                        </div>
                      ) : privateWorkspaces.length === 0 ? (
                        !isCollapsed && (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                            No private workspaces
                          </p>
                        )
                      ) : (
                        privateWorkspaces.map((ws) => (
                          <SidebarMenuItem key={ws.id}>
                            <SidebarMenuButton
                              tooltip={ws.title}
                              isActive={selectedWorkspace === ws.id}
                              onClick={() => router.push(getWorkspacePath(ws.id))}
                              className={selectedWorkspace === ws.id ? "border-r-2 border-r-red-500 bg-red-200! hover:bg-red-200! transition-colors" : "hover:bg-red-100! transition-colors"}
                            >
                              {ws.logo ? (
                                <img src={ws.logo} alt="" className="size-4 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="size-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-bold text-amber-950 shrink-0">
                                  {ws.title.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate">{ws.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>

                {/* Public */}
                {!isLoading && sharedWorkspaces.length > 0 && <div className="h-px bg-sidebar-border mx-1" />}
                {!isLoading && sharedWorkspaces.length > 0 && (
                  <Collapsible open={sharedExpanded} onOpenChange={setSharedExpanded}>
                    {!isCollapsed && (
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                          <span>Public</span>
                          {sharedExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                      </CollapsibleTrigger>
                    )}
                    <CollapsibleContent>
                      <SidebarMenu className="gap-1">
                        {sharedWorkspaces.map((ws) => (
                          <SidebarMenuItem key={ws.id}>
                            <SidebarMenuButton
                              tooltip={ws.title}
                              isActive={selectedWorkspace === ws.id}
                              onClick={() => router.push(getWorkspacePath(ws.id))}
                              className={selectedWorkspace === ws.id
                                ? (ws.isPersonal ? "border-r-2 border-r-red-500 bg-red-200! hover:bg-red-200! transition-colors" : "border-r-2 border-r-green-600 bg-green-200! hover:bg-green-200! transition-colors")
                                : (ws.isPersonal ? "hover:bg-red-100! transition-colors" : "hover:bg-green-100! transition-colors")}
                            >
                              {ws.logo ? (
                                <img src={ws.logo} alt="" className="size-4 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="size-4 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-950 shrink-0">
                                  {ws.title.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate">{ws.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* ── View Plans ── */}
          <SidebarGroup className="px-2 py-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={planButton.label}
                    onClick={() => setPlansOpen(true)}
                    className={planButton.className}
                  >
                    <PlanIcon />
                    <span>{planButton.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer: Profile + Sign out ── */}
        <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Profile" onClick={() => setProfileOpen(true)}>
                <Avatar className="size-5 shrink-0 border border-primary/30">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user?.name || "Profile"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                onClick={() => setSignOutOpen(true)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/8"
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Modals */}
      <WorkspaceSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        workspace={currentWorkspace ? {
          id: currentWorkspace.id,
          title: currentWorkspace.title,
          logo: currentWorkspace.logo,
          isPersonal: currentWorkspace.isPersonal,
          isPrivate: currentWorkspace.isPrivate,
          myRole: currentWorkspace.myRole,
        } : undefined}
      />
      <SignOutModal isOpen={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
