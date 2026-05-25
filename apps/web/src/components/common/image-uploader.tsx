"use client";

import React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml,image/gif,image/webp";

interface ImageUploaderProps {
  value?: string | null;
  selectedFile?: File | null;
  fallbackLetter?: string;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  maxSize?: number;
  accept?: string;
  hint?: string;
}

export function ImageUploader({
  value,
  selectedFile,
  fallbackLetter = "?",
  disabled,
  onFileSelect,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  hint = "PNG, JPG, SVG · max 5 MB · converted to WebP",
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedFile) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const displayUrl = blobUrl ?? value ?? "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast.error(`Image must be under ${Math.round(maxSize / 1024 / 1024)} MB.`);
      e.target.value = "";
      return;
    }

    onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0">
        <div className="size-16 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-muted">
          {displayUrl ? (
            <img src={displayUrl} alt="Preview" className="size-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">
              {fallbackLetter.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="size-3.5" />
          {selectedFile ? "Change Image" : "Upload Image"}
        </Button>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
