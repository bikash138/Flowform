"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/common/image-uploader";
import { useUpdateWorkspace, useGetLogoUploadUrl } from "@/hooks/user/use-workspace-core";
import { toast } from "sonner";

async function convertToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("webp conversion failed"))),
        "image/webp",
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = blobUrl;
  });
}

interface GeneralSettingsTabProps {
  workspace?: {
    id: string;
    title: string;
    logo: string | null;
  };
  onDeleteClick: () => void;
}

export function GeneralSettingsTab({ workspace, onDeleteClick }: GeneralSettingsTabProps) {
  const [title, setTitle] = React.useState(workspace?.title ?? "");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const updateWorkspace = useUpdateWorkspace();
  const getLogoUploadUrl = useGetLogoUploadUrl();

  const [isSaving, setIsSaving] = React.useState(false);
  const isBusy = isSaving || updateWorkspace.isPending || getLogoUploadUrl.isPending;

  React.useEffect(() => {
    if (workspace?.title) setTitle(workspace.title);
  }, [workspace?.title]);

  const hasChanges =
    title.trim() !== (workspace?.title ?? "") || selectedFile !== null;

  const handleSave = async () => {
    if (!workspace) return;
    setIsSaving(true);

    let logoUrl: string | undefined = workspace.logo ?? undefined;

    try {
      if (selectedFile) {
        // 1. Get presigned URL
        const { uploadUrl, publicUrl } = await new Promise<{ uploadUrl: string; publicUrl: string }>(
          (resolve, reject) =>
            getLogoUploadUrl.mutate(
              { workspaceId: workspace.id },
              { onSuccess: resolve, onError: reject },
            ),
        );

        // 2. Convert to webp
        let webpBlob: Blob;
        try {
          webpBlob = await convertToWebp(selectedFile);
        } catch {
          toast.error("Failed to process image.");
          return;
        }

        // 3. Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: webpBlob,
          headers: { "Content-Type": "image/webp" },
        });

        if (!uploadRes.ok) {
          toast.error("Upload failed. Please try again.");
          return;
        }

        logoUrl = publicUrl;
        setSelectedFile(null);
      }

      // 4. Update workspace in DB
      updateWorkspace.mutate({
        workspaceId: workspace.id,
        title: title.trim(),
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {/* Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Workspace Logo
          </label>
          <ImageUploader
            value={workspace?.logo}
            selectedFile={selectedFile}
            fallbackLetter={workspace?.title ?? "W"}
            disabled={isBusy}
            onFileSelect={setSelectedFile}
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
              onClick={handleSave}
              disabled={isBusy || !title.trim() || !hasChanges}
            >
              {isBusy ? "Saving..." : "Save"}
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
            <span className="text-sm font-medium text-foreground">Delete workspace</span>
            <span className="text-xs text-muted-foreground">
              Permanently delete this workspace and all its forms. This action cannot be undone.
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
