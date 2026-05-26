"use client";

import React, { use, useEffect, useRef } from "react";
import { useFormById } from "@/hooks/user/use-form";
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

  const { isLoading, data } = useFormById(formId, workspaceId);
  const initializeEditor = useFormEditorStore((s) => s.initializeEditor);
  const resetEditor      = useFormEditorStore((s) => s.resetEditor);
  const isInitialized    = useFormEditorStore((s) => s.isInitialized);

  // Reset the store whenever the user navigates to a different form.
  // Using a ref so we skip the reset on the very first mount (no stale data yet).
  const prevFormIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevFormIdRef.current !== null && prevFormIdRef.current !== formId) {
      resetEditor();
    }
    prevFormIdRef.current = formId;
  }, [formId, resetEditor]);

  // Also clear on unmount so stale data never bleeds into the next session.
  useEffect(() => {
    return () => { resetEditor(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && !isInitialized) {
      const content: FormContent = (data.draftContent as FormContent) ?? {
        startPage: null,
        pages: [],
        endPage: { heading: "Thank you!", message: null, animation: "none", redirectButton: null },
        logic: [],
      };
      initializeEditor(data, content);
    }
  }, [data, isInitialized, initializeEditor]);

  useSync(isInitialized ? formId : null, workspaceId);

  if (isLoading || !data || !isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <FormBuilderNavbar workspaceId={workspaceId} formTitle={data.title} />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
