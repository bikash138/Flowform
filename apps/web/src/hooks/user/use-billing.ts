import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";

const PLAN_STALE_TIME = 1000 * 60 * 10; // 10 minutes

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
    staleTime: PLAN_STALE_TIME,
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

export const useActivatePlan = (workspaceId: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.billing.activatePlan.mutationOptions(),
    onSuccess: (data) => {
      toast.success(`${data.planName} plan activated`);
      queryClient.invalidateQueries({
        queryKey: trpc.billing.getWorkspacePlan.queryKey({ workspaceId }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to activate plan");
    },
  });
};
