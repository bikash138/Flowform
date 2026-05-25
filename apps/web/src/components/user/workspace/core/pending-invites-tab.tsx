"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserX, RefreshCw } from "lucide-react";
import {
  useGetPendingAndExpiredInvites,
  useRevokeInvite,
  useResendInvite,
} from "@/hooks/user/use-workspace-invite";

export function PendingInvitesTab({ workspaceId }: { workspaceId: string }) {
  const { data: invites = [], isLoading } =
    useGetPendingAndExpiredInvites(workspaceId);
  const revokeInvite = useRevokeInvite();
  const resendInvite = useResendInvite();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y divide-border">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors"
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {invite.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {invite.email}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-medium shrink-0 uppercase px-1.5 py-0 ${
                    invite.status === "EXPIRED"
                      ? "bg-destructive/10 text-destructive border-transparent"
                      : "bg-amber-500/10 text-amber-600 border-transparent"
                  }`}
                >
                  {invite.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground truncate capitalize">
                Role: {invite.role.toLowerCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1.5"
                    disabled={resendInvite.isPending}
                    onClick={() => {
                      resendInvite.mutate({
                        workspaceId,
                        inviteId: invite.id,
                      });
                    }}
                  >
                    <RefreshCw
                      className={`size-3 ${
                        resendInvite.isPending &&
                        resendInvite.variables?.inviteId === invite.id
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    Resend
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Resend invite</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    disabled={revokeInvite.isPending}
                    onClick={() => {
                      revokeInvite.mutate({ workspaceId, inviteId: invite.id });
                    }}
                  >
                    <UserX className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {invite.status === "EXPIRED"
                    ? "Remove invite"
                    : "Cancel invite"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}

        {!isLoading && invites.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No pending invitations.
          </div>
        )}
      </div>
    </div>
  );
}
