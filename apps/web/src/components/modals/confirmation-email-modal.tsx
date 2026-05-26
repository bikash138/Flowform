"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/common/image-uploader";
import { convertToWebp } from "@/lib/image";
import { useGetFormLogoUploadUrl } from "@/hooks/user/use-form";
import { toast } from "sonner";
import type { FormSettings } from "@flowform/database/models";

export type ConfirmationEmailData = NonNullable<FormSettings["confirmationEmail"]>;

const TEMPLATES: { id: ConfirmationEmailData["templateId"]; name: string; description: string }[] = [
  { id: 1, name: "Minimal",      description: "Plain text, clean and distraction-free" },
  { id: 2, name: "Branded",      description: "Prominent logo header with your colors" },
  { id: 3, name: "Warm",         description: "Friendly, conversational tone" },
  { id: 4, name: "Corporate",    description: "Formal, structured business layout" },
  { id: 5, name: "Bold",         description: "High-contrast, strong visual impact" },
  { id: 6, name: "Classic",      description: "Traditional newsletter-style format" },
];

const DEFAULTS: ConfirmationEmailData = {
  templateId: 1,
  subject: "Thanks for your response!",
  brandName: "",
  brandColor: "#4F46E5",
  personalizedMessage: "Thank you for taking the time to fill out our form. We truly appreciate it.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ConfirmationEmailData;
  onApply: (data: ConfirmationEmailData) => void;
  onCancel: () => void;
  formId: string;
  workspaceId: string;
}

export function ConfirmationEmailModal({ open, onOpenChange, initialData, onApply, onCancel, formId, workspaceId }: Props) {
  const [data, setData] = useState<ConfirmationEmailData>(initialData ?? DEFAULTS);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { mutateAsync: getFormLogoUploadUrl } = useGetFormLogoUploadUrl();

  useEffect(() => {
    if (open) {
      setData(initialData ?? DEFAULTS);
      setBrandLogoFile(null);
    }
  }, [open, initialData]);

  function patch<K extends keyof ConfirmationEmailData>(key: K, value: ConfirmationEmailData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleApply() {
    let finalData = data;

    if (brandLogoFile) {
      setIsUploading(true);
      try {
        const { uploadUrl, publicUrl } = await getFormLogoUploadUrl({ formId, workspaceId });
        const webpBlob = await convertToWebp(brandLogoFile);
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: webpBlob,
          headers: { "Content-Type": "image/webp" },
        });
        if (!uploadRes.ok) {
          toast.error("Logo upload failed. Please try again.");
          return;
        }
        finalData = { ...data, brandLogo: publicUrl };
        setBrandLogoFile(null);
      } catch {
        toast.error("Failed to process logo.");
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onApply(finalData);
    onOpenChange(false);
  }

  function handleCancel() {
    onCancel();
    onOpenChange(false);
  }

  const canSave =
    data.subject.trim().length > 0 &&
    data.brandName.trim().length > 0 &&
    data.brandColor.trim().length > 0 &&
    data.personalizedMessage.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold">Confirmation Email</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure the automated email sent to respondents after submission.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Template */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => patch("templateId", t.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    data.templateId === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="text-xs font-semibold text-foreground">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email subject <span className="text-red-500">*</span>
            </label>
            <Input
              value={data.subject}
              onChange={(e) => patch("subject", e.target.value)}
              placeholder="Thanks for your response!"
              className="h-9 text-sm"
              maxLength={100}
            />
          </div>

          {/* Personalized message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.personalizedMessage}
              onChange={(e) => patch("personalizedMessage", e.target.value)}
              placeholder="Thank you for filling out our form…"
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {data.personalizedMessage.length}/500
            </p>
          </div>

          {/* Brand */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Brand identity
            </label>

            {/* Brand name */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Brand name <span className="text-red-500">*</span></label>
              <Input
                value={data.brandName}
                onChange={(e) => patch("brandName", e.target.value)}
                placeholder="Acme Corp"
                className="h-9 text-sm"
                maxLength={100}
              />
            </div>

            {/* Brand color */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Brand color <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <input
                    type="color"
                    value={data.brandColor}
                    onChange={(e) => patch("brandColor", e.target.value)}
                    className="size-9 cursor-pointer rounded-md border border-input p-0.5 bg-background"
                  />
                </div>
                <Input
                  value={data.brandColor}
                  onChange={(e) => patch("brandColor", e.target.value)}
                  placeholder="#4F46E5"
                  className="h-9 text-sm font-mono w-32"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Brand logo */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Brand logo <span className="text-muted-foreground/60">(optional)</span></label>
              <ImageUploader
                value={data.brandLogo ?? null}
                selectedFile={brandLogoFile}
                onFileSelect={setBrandLogoFile}
                hint="PNG, JPG, SVG · max 5 MB · converted to WebP"
              />
            </div>

            {/* Brand link */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Brand link <span className="text-muted-foreground/60">(optional)</span></label>
              <Input
                value={data.brandLink ?? ""}
                onChange={(e) => patch("brandLink", e.target.value || null)}
                placeholder="https://example.com"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 py-3 border-t border-border bg-muted/10">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isUploading}>Cancel</Button>
          <Button size="sm" onClick={handleApply} disabled={!canSave || isUploading} className="px-5">
            {isUploading ? "Uploading…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
