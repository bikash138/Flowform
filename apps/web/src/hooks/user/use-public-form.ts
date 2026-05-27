import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";
import { parseErrorMessage } from "@/utils/parse-error-message";
import type { AnswerEntry } from "@flowform/services/public";

//Public form query

export function usePublicForm(
  idOrSlug: string,
  options?: { accessCode?: string },
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.public.getPublicForm.queryOptions(
      { idOrSlug, ...options },
      { enabled: !!idOrSlug },
    ),
  );
}

//Submit response

type SubmitInput = {
  responseId: string;
  formId: string;
  publishVersion: number;
  answers: AnswerEntry[];
  respondentEmail?: string | null;
  _hp?: string;
};

export function useSubmitResponse(onSuccess?: () => void) {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.public.submitResponse.mutationOptions(),
    onSuccess: () => onSuccess?.(),
    onError: (error) =>
      toast.error(parseErrorMessage(error, "Failed to submit response")),
  });
}

export function useTrackView() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.public.trackView.mutationOptions(),
  });
}

export function useStartSession() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.public.startSession.mutationOptions(),
    onError: (error) => toast.error(parseErrorMessage(error, "Failed to start session")),
  });
}

export function usePreviewForm(formId: string) {
  const trpc = useTRPC();
  return useQuery(
    trpc.public.previewForm.queryOptions(
      { formId },
      { enabled: !!formId },
    ),
  );
}

export type { SubmitInput };
