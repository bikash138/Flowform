import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { toast } from "sonner";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import type { FormTheme } from "@flowform/database/models";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useForms = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.forms.listForms.queryOptions(
      { workspaceId },
      { enabled: !!workspaceId },
    ),
  );
};

export const useFormById = (formId: string, workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.forms.getFormById.queryOptions(
      { formId, workspaceId },
      { enabled: !!formId && !!workspaceId },
    ),
  );
};

export const useThemes = (workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.forms.listThemes.queryOptions(
      { workspaceId },
      { enabled: !!workspaceId, staleTime: Infinity },
    ),
  );
};

export const useFormResponseCount = (formId: string, workspaceId: string) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.forms.getResponseCount.queryOptions(
      { formId, workspaceId },
      { enabled: !!formId && !!workspaceId },
    ),
  );
};

export const useCheckSlugAvailable = (
  workspaceId: string,
  slug: string,
  excludeFormId?: string,
  enabled = true,
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.forms.checkSlugAvailable.queryOptions(
      { workspaceId, slug, excludeFormId },
      { enabled: enabled && slug.length >= 3 },
    ),
  );
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.createForm.mutationOptions(),
    onSuccess: (_, variables) => {
      toast.success("Form created");
      queryClient.invalidateQueries({
        queryKey: trpc.forms.listForms.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to create form"),
  });
};

export const useDeleteForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.deleteForm.mutationOptions(),
    onSuccess: (_, variables) => {
      toast.success("Form deleted");
      queryClient.invalidateQueries({
        queryKey: trpc.forms.listForms.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to delete form"),
  });
};

export const useDuplicateForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.duplicateForm.mutationOptions(),
    onSuccess: (_, variables) => {
      toast.success("Form duplicated");
      queryClient.invalidateQueries({
        queryKey: trpc.forms.listForms.queryKey({
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) =>
      toast.error(error.message || "Failed to duplicate form"),
  });
};

export const useSyncContent = () => {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.forms.syncContent.mutationOptions(),
    onError: (error) => console.error("Background sync failed:", error),
  });
};

export const usePublishForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.publishForm.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Form published");
      useFormEditorStore.getState().publishSuccess(data.publishVersion);
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to publish form"),
  });
};

export const useArchiveForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.archiveForm.mutationOptions(),
    onSuccess: (_, variables) => {
      toast.success("Form archived");
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to archive form"),
  });
};

export const useUpdateSettings = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.updateSettings.mutationOptions(),
    onSuccess: (_, variables) => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to save settings"),
  });
};

export const useUpdateTheme = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateThemeLocally = useFormEditorStore((s) => s.updateThemeLocally);

  return useMutation({
    ...trpc.forms.updateTheme.mutationOptions(),
    onSuccess: (data, variables) => {
      updateThemeLocally(data.theme as FormTheme);
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to apply theme"),
  });
};

export const useUpdateFont = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.updateFont.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to update font"),
  });
};

export const useSetAccessCode = () => {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.forms.setAccessCode.mutationOptions(),
    onSuccess: () => toast.success("Access code updated"),
    onError: (error) =>
      toast.error(error.message || "Failed to update access code"),
  });
};

export const usePatchPublish = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.forms.patchPublish.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Form updated");
      useFormEditorStore.getState().publishSuccess(data.publishVersion);
      // patchPublish increments editVersion on the backend — update local version
      // to prevent CONFLICT on the next auto-save
      const latest = useFormEditorStore.getState();
      if (latest.syncStatus === "dirty") {
        // Pending edits exist — keep dirty but bump editVersion so next sync succeeds
        useFormEditorStore.setState({ editVersion: data.editVersion, syncStatus: "dirty" });
      } else {
        useFormEditorStore.setState({ editVersion: data.editVersion, syncStatus: "synced" });
      }
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to update form"),
  });
};

export const useGetFormLogoUploadUrl = () => {
  const trpc = useTRPC();
  return useMutation(trpc.forms.getFormLogoUploadUrl.mutationOptions());
};

export const useUpdateSlug = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateSlug = useFormEditorStore((s) => s.updateSlug);

  return useMutation({
    ...trpc.forms.updateSlug.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Slug updated");
      updateSlug(data.slug);
      queryClient.invalidateQueries({
        queryKey: trpc.forms.getFormById.queryKey({
          formId: variables.formId,
          workspaceId: variables.workspaceId,
        }),
      });
    },
    onError: (error) => toast.error(error.message || "Failed to update slug"),
  });
};

