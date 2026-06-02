"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Plus, Home, Settings, Bell, LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { useWorkspaces, useWorkspace } from "@/hooks/user/use-workspace-core";
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal";
import { WorkspaceSettingsModal } from "@/components/modals/workspace-settings/workspace-settings-modal";
import { SignOutModal } from "@/components/modals/sign-out-modal";
import { PlansModal } from "@/components/modals/plans-modal";
import { ProfileModal } from "@/components/modals/profile-modal";

function NavPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background rounded-full px-1.5 py-1.5 shadow-sm flex flex-col items-center gap-0.5">
      {children}
    </div>
  );
}

function NavBtn({
  label,
  active,
  onClick,
  className,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "size-11 rounded-full flex items-center justify-center transition-colors",
            active
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function WorkspaceAvatar({
  ws,
  isActive,
  onClick,
  fallbackClass,
}: {
  ws: { id: string; title: string; logo: string | null };
  isActive: boolean;
  onClick: () => void;
  fallbackClass: string;
}) {
  return (
    <Tooltip key={ws.id}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "size-7 rounded-full flex items-center justify-center overflow-hidden transition-all",
            isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:opacity-80",
          )}
        >
          {ws.logo ? (
            <Image src={ws.logo} alt={ws.title} width={28} height={28} sizes="28px" className="size-full object-cover rounded-full" />
          ) : (
            <div className={cn("size-full rounded-full flex items-center justify-center text-xs font-bold", fallbackClass)}>
              {ws.title.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{ws.title}</TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceSidebar() {
  const router = useRouter();
  const params = useParams();

  const selectedWorkspace = params.workspaceId as string;

  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
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

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-20 shrink-0 h-screen flex flex-col items-center py-5 gap-3 overflow-y-auto" style={{ background: "#EDE8E0" }}>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-1">
          <div className="size-12 rounded-2xl bg-linear-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md">
            <Image src="/logo.svg" alt="Flowform" width={26} height={26} sizes="26px" />
          </div>
        </Link>

        {/* Pill 1: Home + Plus + all workspaces */}
        <NavPill>
          <NavBtn label="Home" onClick={() => router.push("/")}>
            <Home size={17} />
          </NavBtn>

          <NavBtn label="New Workspace" onClick={() => setCreateWorkspaceOpen(true)}>
            <Plus size={17} />
          </NavBtn>

          <div className="flex flex-col items-center gap-3.5 mt-1">
            {isLoading ? (
              <div className="size-9 flex items-center justify-center">
                <Spinner className="size-4" />
              </div>
            ) : (
              <>
                {workspaces.filter((ws) => ws.isPersonal).map((ws) => (
                  <WorkspaceAvatar
                    key={ws.id}
                    ws={ws}
                    isActive={selectedWorkspace === ws.id}
                    onClick={() => router.push(`/ws/${ws.id}`)}
                    fallbackClass="bg-amber-400 text-amber-950"
                  />
                ))}

                {workspaces.some((ws) => ws.isPersonal) && workspaces.some((ws) => !ws.isPersonal) && (
                  <div className="w-5 h-px bg-border rounded-full" />
                )}

                {workspaces.filter((ws) => !ws.isPersonal).map((ws) => (
                  <WorkspaceAvatar
                    key={ws.id}
                    ws={ws}
                    isActive={selectedWorkspace === ws.id}
                    onClick={() => router.push(`/ws/${ws.id}`)}
                    fallbackClass="bg-primary/20 text-primary"
                  />
                ))}
              </>
            )}
          </div>
        </NavPill>

        {/* Notifications + Settings */}
        <NavPill>
          <NavBtn label="Notifications">
            <Bell size={17} />
          </NavBtn>
          <NavBtn label="Workspace settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={17} />
          </NavBtn>
        </NavPill>

        <div className="flex-1" />

        {/* Profile + Sign out */}
        <NavPill>
          <NavBtn label={user?.name || "Profile"} onClick={() => setProfileOpen(true)} className="size-9">
            <div className="size-8 rounded-full overflow-hidden border border-primary/30 relative bg-primary flex items-center justify-center">
              {user?.image ? (
                <Image src={user.image} alt={user?.name || "User"} width={32} height={32} sizes="32px" className="object-cover rounded-full" />
              ) : (
                <span className="text-primary-foreground text-[13px] font-semibold">{initials}</span>
              )}
            </div>
          </NavBtn>

          <NavBtn label="Sign out" onClick={() => setSignOutOpen(true)}>
            <LogOut size={17} />
          </NavBtn>
        </NavPill>
      </aside>

      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
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
    </TooltipProvider>
  );
}
