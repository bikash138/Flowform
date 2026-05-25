"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FormIcon } from "@/assets/icons/form-icon";
import { PollIcon } from "@/assets/icons/poll-icon";
import { LayoutDashboard, Sparkles, ArrowUpCircle, Crown } from "lucide-react";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { PlansModal } from "@/components/modals/plans-modal";

export function WorkspaceNavbar() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const pathname = usePathname();
  const [plansOpen, setPlansOpen] = useState(false);

  const { data: plan } = useWorkspacePlan(workspaceId);
  const planId = plan?.planId ?? "FREE";

  const navButton = {
    FREE:    { label: "View Plans",   icon: Sparkles,       className: "bg-primary/10 text-primary hover:bg-primary/20" },
    PRO:     { label: "Upgrade",      icon: ArrowUpCircle,  className: "bg-primary/10 text-primary hover:bg-primary/20" },
    PRO_MAX: { label: "See Features", icon: Crown,          className: "bg-muted text-muted-foreground hover:bg-muted/80" },
  }[planId] ?? { label: "View Plans", icon: Sparkles, className: "bg-primary/10 text-primary hover:bg-primary/20" };

  const NavIcon = navButton.icon;

  const tabs = [
    {
      label: "Overview",
      href: `/workspace/${workspaceId}`,
      icon: <LayoutDashboard className="size-3.5" />,
      active: pathname === `/workspace/${workspaceId}`,
    },
    {
      label: "Forms",
      href: `/workspace/${workspaceId}/forms`,
      icon: <FormIcon size={14} />,
      active: pathname.startsWith(`/workspace/${workspaceId}/forms`),
    },
    {
      label: "Polls",
      href: `/workspace/${workspaceId}/polls`,
      icon: <PollIcon size={14} />,
      active: pathname.startsWith(`/workspace/${workspaceId}/polls`),
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="shrink-0 border-b border-border bg-background">
        <div className="relative flex items-center justify-between h-12 px-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-1 hover:opacity-90 transition-opacity focus-visible:outline-none"
          >
            <Image
              src="/logo.svg"
              alt="Flowform"
              width={28}
              height={28}
              className="size-7"
            />
            <span className="text-lg font-bold tracking-tight text-foreground [font-family:var(--font-jakarta-sans)]">
              Flowform
            </span>
          </Link>

          {/* Center: Tabs */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 h-12 text-sm font-medium transition-colors",
                  tab.active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right: Plan button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                navButton.className,
              )}
            >
              <NavIcon className="size-3" />
              {navButton.label}
            </button>
          </div>
        </div>
      </div>

      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />
    </TooltipProvider>
  );
}
