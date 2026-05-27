import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";
import { parseErrorMessage } from "@/utils/parse-error-message";

export const usePlans = () => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.billing.getPlans.queryOptions({}),
    staleTime: Infinity,
  });
};

export const useWorkspacePlan = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.billing.getWorkspacePlan.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });
};

export const useRemainingQuota = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.billing.getRemainingQuota.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });
};

export const useFormUsage = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.billing.getFormUsage.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });
};

export const useMemberUsage = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.billing.getMemberUsage.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });
};

export const useActivatePlan = (workspaceId: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.billing.activatePlan.mutationOptions(),
    onSuccess: (data) => {
      toast.success(`${data.planName} plan activated`);
      // Immediately write the new plan into the cache so all observers update without waiting for a refetch
      queryClient.setQueryData(
        trpc.billing.getWorkspacePlan.queryKey({ workspaceId }),
        data,
      );
      // Then invalidate to schedule a background refetch
      queryClient.invalidateQueries({
        queryKey: trpc.billing.getWorkspacePlan.queryKey({ workspaceId }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.billing.getRemainingQuota.queryKey({ workspaceId }),
      });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error, "Failed to activate plan"));
    },
  });
};
