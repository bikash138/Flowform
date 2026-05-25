import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";

export const useWorkspaces = () => {
  const trpc = useTRPC();
  return useQuery(trpc.workspace.core.getUserWorkspaces.queryOptions());
};

export const useWorkspace = (workspaceId: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.workspace.core.getWorkspaceById.queryOptions(
      { workspaceId },
      { enabled: !!workspaceId },
    ),
  });
};

export const useCreateWorkspace = (options?: {
  onSuccess?: (workspaceId: string) => void;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.core.createWorkspace.mutationOptions(),
    onSuccess: (data) => {
      toast.success("Workspace created successfully");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.core.getUserWorkspaces.queryKey(),
      });
      options?.onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create workspace");
    },
  });
};

export const useUpdateWorkspace = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.core.updateWorkspace.mutationOptions(),
    onSuccess: (data, variables, context) => {
      toast.success("Workspace updated successfully");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.core.getUserWorkspaces.queryKey(),
      });
      if (variables.workspaceId) {
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.core.getWorkspaceById.queryKey({
            workspaceId: variables.workspaceId,
          }),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update workspace");
    },
  });
};

export const useDeleteWorkspace = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.workspace.core.deleteWorkspace.mutationOptions(),
    onSuccess: (data, variables, context) => {
      toast.success("Workspace deleted successfully");
      queryClient.invalidateQueries({
        queryKey: trpc.workspace.core.getUserWorkspaces.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete workspace");
    },
  });
};
