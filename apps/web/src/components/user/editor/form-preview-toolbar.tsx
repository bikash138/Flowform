"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Paintbrush,
  Type,
  Play,
  RefreshCw,
  Scissors,
  Settings,
  Monitor,
  Smartphone,
  Cloud,
  Check,
  Loader2,
  CloudAlert,
  RotateCw,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddContentModal } from "@/components/modals/add-content-modal";
import { FormSettingsModal } from "@/components/modals/form-settings-modal";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useSyncContent, useUpdateFont } from "@/hooks/user/use-form";
import { AVAILABLE_FONTS } from "@/data/fonts";
import type { FormTheme } from "@flowform/database";

export function FormPreviewToolbar() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const syncStatus       = useFormEditorStore((s) => s.syncStatus);
  const previewMode      = useFormEditorStore((s) => s.previewMode);
  const activePageId     = useFormEditorStore((s) => s.activePageId);
  const designPanelOpen  = useFormEditorStore((s) => s.designPanelOpen);
  const form             = useFormEditorStore((s) => s.form);
  const setPreviewMode   = useFormEditorStore((s) => s.setPreviewMode);
  const setDesignPanel   = useFormEditorStore((s) => s.setDesignPanelOpen);

  const currentFont = (form?.theme as FormTheme | undefined)?.fontFamily ?? "Inter";
  const { mutate: updateFont } = useUpdateFont();

  const [addContentOpen, setAddContentOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { mutateAsync: syncContent } = useSyncContent();

  function handlePreview() {
    const { form, content } = useFormEditorStore.getState();
    if (!form || !content) return;
    localStorage.setItem(
      `flowform_preview_${form.id}`,
      JSON.stringify({
        title: form.title,
        content,
        theme: form.theme,
        settings: form.settings,
      }),
    );
    window.open(`/preview/${form.id}`, "_blank");
  }

  async function handleRetry() {
    const { content, editVersion, form, setSyncStatus, syncSuccess } =
      useFormEditorStore.getState();
    if (!content || !form?.id || !workspaceId) return;

    setSyncStatus("saving");
    try {
      const res = await syncContent({
        formId: form.id,
        workspaceId,
        draftContent: content,
        editVersion,
      });
      syncSuccess(res.editVersion);
    } catch {
      setSyncStatus("error");
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-between h-11 px-3 border-b border-border bg-background shrink-0">
        {/* Left: Add content + Design + sync status */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary-dark gap-1.5 font-semibold text-xs h-8"
            onClick={() => setAddContentOpen(true)}
          >
            <Plus className="size-3.5" />
            Add content
          </Button>

          <AddContentModal
            pageId={activePageId}
            open={addContentOpen}
            onOpenChange={setAddContentOpen}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDesignPanel(!designPanelOpen)}
            className={cn(
              "gap-1.5 text-xs h-8",
              designPanelOpen
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Paintbrush className="size-3.5" />
            Design
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                <Type className="size-3.5" />
                <span style={{ fontFamily: currentFont }}>{currentFont}</span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Font Style
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AVAILABLE_FONTS.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onSelect={() => {
                    if (!form?.id || !workspaceId) return;
                    updateFont({ formId: form.id, workspaceId, fontFamily: font.value });
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                  {currentFont === font.value && <Check className="size-3.5 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Sync status */}
          <div className="flex items-center min-w-[110px] select-none">
            {syncStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Check className="size-3.5" />
                Saved
              </span>
            )}
            {syncStatus === "dirty" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Cloud className="size-3.5" />
                Unsaved changes
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <CloudAlert className="size-3.5" />
                Sync error
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleRetry}
                      className="ml-0.5 rounded p-0.5 hover:bg-destructive/10 transition-colors"
                      aria-label="Retry sync"
                    >
                      <RotateCw className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Retry sync</TooltipContent>
                </Tooltip>
              </span>
            )}
          </div>
        </div>

        {/* Right: Tool icons + desktop/mobile toggle */}
        <div className="flex items-center gap-0.5">
          {[
            { icon: Play,      label: "Preview",  onClick: handlePreview },
            { icon: RefreshCw, label: "Refresh",  onClick: undefined },
            { icon: Scissors,  label: "Logic",    onClick: undefined },
            { icon: Settings,  label: "Settings", onClick: () => setSettingsOpen(true) },
          ].map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={onClick}
                >
                  <Icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}

          <FormSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

          <div className="w-px h-5 bg-border mx-1" />

          {/* Desktop / Mobile toggle */}
          <div className="flex items-center bg-muted/40 rounded-md p-0.5">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={cn(
                "flex items-center justify-center size-7 rounded-md transition-all",
                previewMode === "desktop"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "flex items-center justify-center size-7 rounded-md transition-all",
                previewMode === "mobile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
