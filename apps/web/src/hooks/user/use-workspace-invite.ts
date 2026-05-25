import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";

export const useCreateInvite = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.invites.sendInvite.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Invitation sent successfully!");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.invites.getWorkspaceInvites.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });
};

export const useGetPendingAndExpiredInvites = (workspaceId: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.workspace.invites.getWorkspaceInvites.queryOptions(
      { workspaceId },
      { enabled: !!workspaceId },
    ),
  });
};

export const useRevokeInvite = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.invites.revokeInvite.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.invites.getWorkspaceInvites.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke invitation");
    },
  });
};

export const useResendInvite = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.invites.resendInvite.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Invitation link resent!");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.invites.getWorkspaceInvites.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });
};

export const useValidateInviteToken = (token: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.workspace.invites.validateInviteToken.queryOptions(
      { token },
      {
        enabled: !!token,
        retry: false,
      },
    ),
  });
};

export const useAcceptInvite = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.invites.acceptInvite.mutationOptions(),
    onSuccess: () => {
      toast.success("Welcome to the workspace!");
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });
};