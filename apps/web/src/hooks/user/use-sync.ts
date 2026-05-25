import { useEffect, useRef } from "react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useSyncContent } from "@/hooks/user/use-form";

const DEBOUNCE_MS = 2000;

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
            draftContent: snapshot.content,
            editVersion: snapshot.editVersion,
          });

          const latest = useFormEditorStore.getState();
          // Only mark synced if no new edits landed while we were saving
          if (latest.syncStatus === "saving") {
            latest.syncSuccess(result.editVersion);
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
      const { syncStatus, content, editVersion } = useFormEditorStore.getState();
      if (syncStatus !== "dirty" || !content) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      useFormEditorStore.getState().setSyncStatus("saving");

      syncContent({ formId, workspaceId, draftContent: content, editVersion })
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
