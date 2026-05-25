"use client";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Lock } from "lucide-react";
import { useGetWorkspaceMembers } from "@/hooks/user/use-workspace-member";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { ActiveMembersTab } from "@/components/user/workspace/core/active-members-tab";
import { PendingInvitesTab } from "@/components/user/workspace/core/pending-invites-tab";
import { InviteMemberTab } from "@/components/user/workspace/core/invite-member-tab";

interface MemberSettingsTabProps {
  workspaceId: string;
  isOwner?: boolean;
  isPrivate?: boolean;
}

export function MemberSettingsTab({ workspaceId, isOwner, isPrivate }: MemberSettingsTabProps) {
  const { data: members = [], isLoading: membersLoading } = useGetWorkspaceMembers(workspaceId);
  const { data: plan } = useWorkspacePlan(workspaceId);

  const memberLimit = plan?.features.teamMemberLimit ?? null;
  const memberCount = members.length;
  const isLimitReached = memberLimit !== null && memberCount >= memberLimit;

  return (
    <TooltipProvider>
      <Tabs defaultValue="active" className="w-full flex flex-col">
        {/* Sub-tab header with member count */}
        <div className="px-6 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Team Members
            </span>
            <div className="flex items-center gap-1.5">
              <Users className="size-3 text-muted-foreground" />
              {membersLoading ? (
                <span className="h-4 w-10 animate-pulse rounded bg-muted" />
              ) : (
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    isLimitReached ? "text-destructive" : "text-foreground",
                  )}
                >
                  {memberCount}
                  {memberLimit !== null && (
                    <span className="text-muted-foreground font-normal">/{memberLimit}</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {isLimitReached && (
            <p className="text-[11px] text-destructive/80 mb-3">
              Member limit reached — upgrade your plan to invite more.
            </p>
          )}

          <TabsList className="h-8 bg-muted/50 p-0.5">
            <TabsTrigger value="active" className="text-xs h-7 px-4">
              Active
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs h-7 px-4">
              Pending / Expired
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="invite" className="text-xs h-7 px-4 gap-1.5">
                {isPrivate && <Lock className="size-3" />}
                Invite
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="active" className="m-0 focus-visible:outline-none">
          <ActiveMembersTab workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="pending" className="m-0 focus-visible:outline-none">
          <PendingInvitesTab workspaceId={workspaceId} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="invite" className="m-0 focus-visible:outline-none">
            {isPrivate ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-8">
                <div className="flex items-center justify-center size-10 rounded-full bg-muted shrink-0">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Invites unavailable</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Invites can only be sent for public workspaces. Make this workspace public to enable member invitations.
                  </p>
                </div>
              </div>
            ) : (
              <InviteMemberTab workspaceId={workspaceId} isLimitReached={isLimitReached} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </TooltipProvider>
  );
}
