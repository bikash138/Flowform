"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, UserX, ArrowRightLeft } from "lucide-react";
import {
  useGetWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveWorkspaceMember,
} from "@/hooks/user/use-workspace-member";
import { authClient } from "@/lib/auth";

export const roleBadgeStyle: Record<string, string> = {
  owner: "border-primary/40 text-primary bg-primary/10",
  admin: "border-amber-500/40 text-amber-500 bg-amber-500/10",
  editor: "border-blue-500/40 text-blue-500 bg-blue-500/10",
  viewer: "border-border text-muted-foreground bg-transparent",
};

export function ActiveMembersTab({ workspaceId }: { workspaceId: string }) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const { data: members = [], isLoading } = useGetWorkspaceMembers(workspaceId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveWorkspaceMember();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y divide-border">
        {members.map((member) => {
          const roleKey = member.role.toLowerCase();
          const isCurrentUser = member.userId === currentUserId;
          const name = member.user?.name || "Unknown User";
          const email = member.user?.email || "No Email";
          const initial =
            name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase();

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors"
            >
              <Avatar className="size-8 shrink-0">
                {member.user?.image && <AvatarImage src={member.user.image} />}
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {name} {isCurrentUser && "(You)"}
                  </span>
                  {roleKey === "owner" && (
                    <Crown className="size-3 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {email}
                </span>
              </div>

              {roleKey === "owner" ? (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium shrink-0 capitalize ${roleBadgeStyle.owner}`}
                >
                  Owner
                </Badge>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={roleKey}
                    onValueChange={(val) => {
                      updateRole.mutate({
                        workspaceId,
                        targetUserId: member.userId,
                        role: val.toUpperCase() as any,
                      });
                    }}
                    disabled={updateRole.isPending || isCurrentUser}
                  >
                    <SelectTrigger className="h-7 text-xs w-[90px] border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="admin" className="text-xs">
                        Admin
                      </SelectItem>
                      <SelectItem value="editor" className="text-xs">
                        Editor
                      </SelectItem>
                      <SelectItem value="viewer" className="text-xs">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        disabled={true}
                      >
                        <ArrowRightLeft className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Transfer ownership (Coming soon)
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={removeMember.isPending || isCurrentUser}
                        onClick={() => {
                          removeMember.mutate({
                            workspaceId,
                            targetUserId: member.userId,
                          });
                        }}
                      >
                        <UserX className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove member</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
