import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export function useFormSummary(formId: string, workspaceId: string) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.getFormSummary.queryOptions(
      { formId, workspaceId },
      { enabled: !!formId && !!workspaceId, refetchInterval: 30_000 },
    ),
  );
}

export function useQuestionStats(
  formId: string,
  workspaceId: string,
  publishVersion: number,
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.getQuestionStats.queryOptions(
      { formId, workspaceId, publishVersion },
      { enabled: !!formId && !!workspaceId && publishVersion > 0 },
    ),
  );
}

export function useListResponses(
  formId: string,
  workspaceId: string,
  publishVersion: number,
  page: number,
  pageSize = 20,
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.listResponses.queryOptions(
      { formId, workspaceId, publishVersion, page, pageSize },
      { enabled: !!formId && !!workspaceId && publishVersion > 0 },
    ),
  );
}

export function useExportResponses(
  formId: string,
  workspaceId: string,
  publishVersion: number,
  enabled: boolean,
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.exportResponses.queryOptions(
      { formId, workspaceId, publishVersion },
      { enabled: enabled && !!formId && !!workspaceId && publishVersion > 0 },
    ),
  );
}

export function useGeoStats(formId: string, workspaceId: string) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.getGeoStats.queryOptions(
      { formId, workspaceId },
      { enabled: !!formId && !!workspaceId },
    ),
  );
}

export function useTopCities(
  formId: string,
  workspaceId: string,
  continent: string | null,
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.analytics.getTopCities.queryOptions(
      { formId, workspaceId, continent: continent ?? "", limit: 10 },
      { enabled: !!formId && !!workspaceId && !!continent },
    ),
  );
}
