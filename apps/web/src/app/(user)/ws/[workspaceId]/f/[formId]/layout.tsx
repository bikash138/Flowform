"use client";

import React, { use, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useSync } from "@/hooks/user/use-sync";
import { FormBuilderNavbar } from "@/components/user/editor/form-editor-navbar";
import { Spinner } from "@/components/ui/spinner";
import type { FormContent } from "@flowform/database/models";

export default function FormRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string; formId: string }>;
}) {
  const { workspaceId, formId } = use(params);

  const trpc           = useTRPC();
  const queryClient    = useQueryClient();
  const initializeEditor = useFormEditorStore((s) => s.initializeEditor);
  const resetEditor      = useFormEditorStore((s) => s.resetEditor);
  const isInitialized    = useFormEditorStore((s) => s.isInitialized);
  // Read title from the store — populated once fresh data has been loaded.
  const formTitle        = useFormEditorStore((s) => s.form?.title ?? "");

  // On every mount (and whenever formId / workspaceId change) we:
  //   1. Immediately reset the store so no stale data leaks in.
  //   2. Fetch the form straight from the DB — staleTime:0 bypasses any
  //      React Query cache, guaranteeing the Zustand editVersion matches
  //      the server and preventing CONFLICT errors on the first auto-save.
  useEffect(() => {
    let cancelled = false;

    // Clear any previously loaded form so the UI shows a spinner while
    // the fresh fetch is in flight.
    resetEditor();

    queryClient
      .fetchQuery(
        trpc.forms.getFormById.queryOptions(
          { formId, workspaceId },
          { staleTime: 0 }, // always go to the DB — never serve from cache
        ),
      )
      .then((data) => {
        if (cancelled) return;

        const content: FormContent = (data.draftContent as FormContent) ?? {
          startPage: null,
          pages: [],
          endPage: {
            heading: "Thank you!",
            message: null,
            animation: "none",
            redirectButton: null,
          },
          logic: [],
        };

        initializeEditor(data, content);
      })
      .catch((err) => {
        // TODO: surface an error UI rather than a perpetual spinner
        console.error("[FormRootLayout] Failed to load form:", err);
      });

    // If the component unmounts while the fetch is in flight (e.g. the user
    // navigates away), cancel the in-flight callback and wipe the store so
    // the next mount starts clean.
    return () => {
      cancelled = true;
      resetEditor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, workspaceId]); // re-run only when the route changes

  // Auto-save wires up only after a successful initialization.
  useSync(isInitialized ? formId : null, workspaceId);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <FormBuilderNavbar workspaceId={workspaceId} formTitle={formTitle} />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
