"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutGrid,
  ChevronRight,
  HelpCircle,
  Loader2,
  Globe,
  AlertTriangle,
  User,
  LogOut,
  Building2,
  Sparkles,
} from "lucide-react";
import { authClient } from "@/lib/auth";
import { NavbarLinks } from "./form-editor-nav-links";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { usePublishForm, usePatchPublish } from "@/hooks/user/use-form";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { useWorkspace } from "@/hooks/user/use-workspace-core";
import { ProfileModal } from "@/components/modals/profile-modal";
import { PlansModal } from "@/components/modals/plans-modal";
import { cn } from "@/lib/utils";

// ─── Publish confirm dialog ───────────────────────────────────────────────────

function PublishConfirmModal({
  open,
  onOpenChange,
  changeType,
  onConfirm,
  isPublishing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeType: "soft" | "hard";
  onConfirm: () => void;
  isPublishing: boolean;
}) {
  const isHard = changeType === "hard";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isHard && <AlertTriangle className="size-4 text-amber-500 shrink-0" />}
            {isHard ? "Publish new version?" : "Publish changes?"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {isHard
              ? "You've made structural changes to this form. Publishing will create a new version of the form."
              : "Your edits will go live immediately. This is a minor update and won't affect existing analytics."}
          </DialogDescription>
        </DialogHeader>

        {isHard && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p>
              Changing the form structure (adding, removing, or reordering questions) creates a new version. This may cause gaps or inconsistencies in your analytics dashboard.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isPublishing}
            className={cn(
              isHard
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "",
            )}
          >
            {isPublishing && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {isHard ? "Publish new version" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan badge / button ──────────────────────────────────────────────────────

function PlanButton({
  planId,
  onClick,
}: {
  planId: string;
  onClick: () => void;
}) {
  if (planId === "PRO_MAX") {
    return (
      <Button
        size="sm"
        onClick={onClick}
        className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 text-xs font-bold px-3 gap-1.5 h-7"
      >
        <Sparkles className="size-3" />
        PRO MAX
      </Button>
    );
  }
  if (planId === "PRO") {
    return (
      <Button
        size="sm"
        onClick={onClick}
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 text-xs font-bold px-3 gap-1.5 h-7"
      >
        <Sparkles className="size-3" />
        PRO
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      onClick={onClick}
      className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 text-xs font-semibold px-3 h-7"
    >
      View plans
    </Button>
  );
}

// ─── Workspace + user dropdown ────────────────────────────────────────────────

function EditorUserMenu({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: workspace } = useWorkspace(workspaceId);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/signin"),
      },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-opacity hover:opacity-80">
            <Avatar className="size-7 cursor-pointer border border-primary/30">
              <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 mt-2 p-0 overflow-hidden z-100">
          {/* Workspace header */}
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3 text-muted-foreground shrink-0 translate-y-px" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate leading-none">
                {workspace?.title ?? "Workspace"}
              </span>
            </span>
          </div>

          {/* User identity */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-primary/30 shrink-0">
                <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate leading-none">
                  {user?.name ?? "My Account"}
                </span>
                <span className="block text-[11px] text-muted-foreground truncate leading-none mt-1">
                  {user?.email ?? ""}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <DropdownMenuItem
              onClick={() => setProfileOpen(true)}
              className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md text-sm focus:bg-muted/40"
            >
              <div className="flex items-center justify-center size-6 rounded-md bg-muted/50">
                <User className="size-3.5 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">Profile settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md text-sm text-destructive focus:text-destructive focus:bg-destructive/5"
            >
              <div className="flex items-center justify-center size-6 rounded-md bg-destructive/10">
                <LogOut className="size-3.5" />
              </div>
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

// ─── Main navbar ──────────────────────────────────────────────────────────────

interface FormBuilderNavbarProps {
  workspaceId: string;
  formTitle: string;
}

export function FormBuilderNavbar({ workspaceId, formTitle }: FormBuilderNavbarProps) {
  const router = useRouter();
  const form = useFormEditorStore((s) => s.form);
  const publishChangeType = useFormEditorStore((s) => s.publishChangeType);
  const storeContent = useFormEditorStore((s) => s.content);
  const storeEditVersion = useFormEditorStore((s) => s.editVersion);

  const { mutate: publishForm, isPending: isPublishingFull } = usePublishForm();
  const { mutate: patchPublish, isPending: isPatching } = usePatchPublish();
  const { data: plan } = useWorkspacePlan(workspaceId);

  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const isPublished = form?.status === "PUBLISHED";
  const hasUnpublishedChanges = publishChangeType !== "none";
  const canPublish = !isPublished || hasUnpublishedChanges;
  const isPublishing = isPublishingFull || isPatching;

  const planId = plan?.planId ?? "FREE";

  // For first-time publish or hard changes → full publish; otherwise patch
  const effectiveChangeType = !isPublished || publishChangeType === "hard" ? "hard" : "soft";

  const publishLabel = isPublished ? "Publish edits" : "Publish";
  const publishTooltip = isPublished
    ? hasUnpublishedChanges
      ? "Push your latest changes live"
      : "No new changes to publish"
    : "Make this form live";

  function handlePublishClick() {
    if (!form) return;
    setPublishConfirmOpen(true);
  }

  function handleConfirmPublish() {
    if (!form) return;
    setPublishConfirmOpen(false);

    if (effectiveChangeType === "soft" && storeContent) {
      patchPublish({
        formId: form.id,
        workspaceId,
        draftContent: storeContent,
        editVersion: storeEditVersion,
      });
    } else {
      publishForm(
        { formId: form.id, workspaceId },
        {
          onSuccess: !isPublished
            ? () => router.push(`/ws/${workspaceId}/f/${form.id}/share`)
            : undefined,
        },
      );
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background shrink-0 z-50">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/ws/${workspaceId}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutGrid className="size-4" />
            <span className="text-sm font-medium">Forms</span>
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {formTitle}
          </span>
        </div>

        {/* Center: Nav Links */}
        <NavbarLinks />

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {form && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={canPublish ? "default" : "secondary"}
                  size="sm"
                  className={cn("gap-1.5", !canPublish && "opacity-60")}
                  onClick={handlePublishClick}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Globe className="size-3.5" />
                  )}
                  <span className="text-sm">{publishLabel}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{publishTooltip}</TooltipContent>
            </Tooltip>
          )}

          <PlanButton planId={planId} onClick={() => setPlansOpen(true)} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
              >
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>

          <EditorUserMenu workspaceId={workspaceId} />
        </div>
      </header>

      <PublishConfirmModal
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        changeType={effectiveChangeType}
        onConfirm={handleConfirmPublish}
        isPublishing={isPublishing}
      />

      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />
    </TooltipProvider>
  );
}
