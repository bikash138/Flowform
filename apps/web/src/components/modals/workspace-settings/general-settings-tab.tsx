"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateWorkspace } from "@/hooks/user/use-workspace-core";
import { BrandingSelector } from "@/components/user/common/branding-selector";

interface GeneralSettingsTabProps {
  workspace?: {
    id: string;
    title: string;
    logo: string | null;
  };
  onDeleteClick: () => void;
}

export function GeneralSettingsTab({
  workspace,
  onDeleteClick,
}: GeneralSettingsTabProps) {
  const [title, setTitle] = React.useState(workspace?.title || "");

  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = React.useState(workspace?.logo || "");
  const [urlValue, setUrlValue] = React.useState(workspace?.logo || "");

  const updateWorkspace = useUpdateWorkspace();

  React.useEffect(() => {
    if (workspace?.title) {
      setTitle(workspace.title);
    }
  }, [workspace?.title]);

  const handleUpdate = () => {
    if (!workspace || (!title.trim() && !previewLogo)) return;
    updateWorkspace.mutate({
      workspaceId: workspace.id,
      title: title.trim(),
      logo: previewLogo?.trim() ? previewLogo : undefined,
    });
  };

  const hasChanges =
    title.trim() !== workspace?.title ||
    previewLogo !== (workspace?.logo || "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {/* Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Workspace Logo
          </label>
          <BrandingSelector
            compact
            previewLogo={previewLogo}
            urlValue={urlValue}
            fallbackText={(workspace?.title || "W").charAt(0).toUpperCase()}
            onLogoChange={(url, file) => {
              if (previewLogo && previewLogo.startsWith("blob:")) {
                URL.revokeObjectURL(previewLogo);
              }
              setLogoFile(file);
              setPreviewLogo(url);
            }}
            onUrlChange={(url) => {
              setUrlValue(url);
              setPreviewLogo(url);
            }}
            onRemove={() => {
              if (previewLogo && previewLogo.startsWith("blob:")) {
                URL.revokeObjectURL(previewLogo);
              }
              setPreviewLogo("");
              setLogoFile(null);
              setUrlValue("");
            }}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Workspace Title
          </label>
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm bg-background border-border"
              placeholder="Enter workspace title"
            />

            <Button
              size="sm"
              className="h-9 px-6 text-sm shrink-0 font-semibold"
              onClick={handleUpdate}
              disabled={
                updateWorkspace.isPending || !title.trim() || !hasChanges
              }
            >
              {updateWorkspace.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-destructive uppercase tracking-wide">
          Danger Zone
        </label>
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Delete workspace
            </span>
            <span className="text-xs text-muted-foreground">
              Permanently delete this workspace and all its forms. This action
              cannot be undone.
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 gap-1.5 text-xs h-8"
            onClick={onDeleteClick}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
