"use client";

import { FormPagesSidebar } from "@/components/user/editor/form-editor-left-sidebar";
import { FormPreviewToolbar } from "@/components/user/editor/form-preview-toolbar";
import { FormPropertiesPanel } from "@/components/user/editor/form-editor-right-sidebar";
import { ThemePalettePanel } from "@/components/user/editor/theme-palette-panel";
import { useFormEditorStore } from "@/store/use-form-editor-store";

export default function FormContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const designPanelOpen = useFormEditorStore((s) => s.designPanelOpen);
  const setDesignPanelOpen = useFormEditorStore((s) => s.setDesignPanelOpen);

  return (
    <div className="flex-1 flex overflow-hidden">
      <FormPagesSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <FormPreviewToolbar />
        {children}
      </div>
      <aside className="flex flex-col w-[280px] border-l border-border bg-background shrink-0 h-full">
        {designPanelOpen ? (
          <ThemePalettePanel onClose={() => setDesignPanelOpen(false)} />
        ) : (
          <FormPropertiesPanel />
        )}
      </aside>
    </div>
  );
}
