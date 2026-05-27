import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";
import { parseErrorMessage } from "@/utils/parse-error-message";

export const useGetWorkspaceMembers = (workspaceId: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.workspace.members.getWorkspaceMembers.queryOptions(
      { workspaceId },
      { enabled: !!workspaceId },
    ),
  });
};

export const useUpdateMemberRole = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.members.updateMemberRole.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Member role updated successfully!");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.members.getWorkspaceMembers.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error, "Failed to update role"));
    },
  });
};

export const useRemoveWorkspaceMember = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.members.removeWorkspaceMember.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Member removed from workspace");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.members.getWorkspaceMembers.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error, "Failed to remove member"));
    },
  });
};

export const useLeaveWorkspace = (workspaceId: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.members.leaveWorkspace.mutationOptions(),
    onSuccess: () => {
      toast.success("You have left the workspace");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.members.getWorkspaceMembers.queryKey({
          workspaceId,
        }),
      });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error, "Failed to leave workspace"));
    },
  });
};