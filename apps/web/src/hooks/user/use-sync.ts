import { useEffect, useRef } from "react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useSyncContent } from "@/hooks/user/use-form";
import type { FormContent } from "@flowform/database/models";

const DEBOUNCE_MS = 2000;

// Strip legacy base64 data URLs from coverImage before syncing.
// These were stored by the old FileReader code and must never reach the server.
function sanitizeContent(content: FormContent): FormContent {
  const hasBase64 = content.pages.some((p) => p.coverImage?.startsWith("data:"));
  if (!hasBase64) return content;
  return {
    ...content,
    pages: content.pages.map((page) =>
      page.coverImage?.startsWith("data:") ? { ...page, coverImage: null } : page,
    ),
  };
}

export function useSync(formId: string | null, workspaceId: string | null): void {
  const { mutateAsync: syncContent } = useSyncContent();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  //Debounced auto-save on dirty

  useEffect(() => {
    if (!formId || !workspaceId) return;

    const unsubscribe = useFormEditorStore.subscribe((state, prev) => {
      if (state.syncStatus !== "dirty" || prev.syncStatus === "saving") return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        const snapshot = useFormEditorStore.getState();
        if (!snapshot.content || snapshot.syncStatus !== "dirty") return;

        snapshot.setSyncStatus("saving");

        try {
          const result = await syncContent({
            formId,
            workspaceId,
            draftContent: sanitizeContent(snapshot.content),
            editVersion: snapshot.editVersion,
          });

          const latest = useFormEditorStore.getState();
          if (latest.syncStatus === "saving") {
            // No edits during save — mark synced and update version
            latest.syncSuccess(result.editVersion);
          } else {
            // User edited while save was in flight — bump editVersion so the next
            // sync doesn't CONFLICT, then re-trigger the subscriber by setting
            // syncStatus:"dirty" (prev will be "dirty", not "saving", so the guard
            // passes and the debounce restarts correctly)
            useFormEditorStore.setState({ editVersion: result.editVersion, syncStatus: "dirty" });
          }
        } catch (error: unknown) {
          const tRPCError = error as { data?: { code?: string; httpStatus?: number } };
          if (
            tRPCError?.data?.code === "CONFLICT" ||
            tRPCError?.data?.httpStatus === 409
          ) {
            // TODO: show conflict UI (reload prompt)
            console.error("Edit version conflict — form was modified elsewhere.");
          } else {
            useFormEditorStore.getState().setSyncStatus("error");
          }
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formId, workspaceId, syncContent]);

  // ─── Force-save on tab hide / unload ──────────────────────────────────────

  useEffect(() => {
    if (!formId || !workspaceId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { syncStatus } = useFormEditorStore.getState();
      if (syncStatus === "dirty" || syncStatus === "saving") {
        e.preventDefault();
        return "";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      // Ignore brief visibility changes from native dialogs (file picker, etc.)
      if (document.hasFocus()) return;
      const { syncStatus, content, editVersion } = useFormEditorStore.getState();
      if (syncStatus !== "dirty" || !content) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      useFormEditorStore.getState().setSyncStatus("saving");

      syncContent({ formId, workspaceId, draftContent: sanitizeContent(content), editVersion })
        .then((result) => {
          useFormEditorStore.getState().syncSuccess(result.editVersion);
        })
        .catch(() => {
          useFormEditorStore.getState().setSyncStatus("error");
        });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [formId, workspaceId, syncContent]);
}
