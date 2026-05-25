import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export const useHealth = () => {
  const trpc = useTRPC();
  return useQuery(trpc.health.getHealth.queryOptions());
};
