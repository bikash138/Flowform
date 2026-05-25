"use client";

import { ImagePlus, Link, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BrandingSelectorProps {
  previewLogo: string;
  onLogoChange: (url: string, file: File | null) => void;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
  urlValue: string;
  fallbackText?: string;
  className?: string;
  compact?: boolean;
}

export function BrandingSelector({
  previewLogo,
  onLogoChange,
  onUrlChange,
  onRemove,
  urlValue,
  fallbackText = "W",
  className,
  compact = false,
}: BrandingSelectorProps) {
  return (
    <div
      className={cn(
        "flex gap-6 p-4 rounded-2xl border border-border bg-muted/5",
        compact && "gap-4 p-3 rounded-xl",
        className,
      )}
    >
      {/* Left: Large Square Preview */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div
          className={cn(
            "size-32 rounded-2xl border border-border bg-background flex items-center justify-center overflow-hidden shadow-sm relative group text-foreground",
            compact && "size-20 rounded-lg",
          )}
        >
          {previewLogo ? (
            <img src={previewLogo} alt="Brand Preview" className="size-full object-cover" />
          ) : (
            <span
              className={cn("text-4xl font-bold text-muted-foreground/40", compact && "text-2xl")}
            >
              {fallbackText}
            </span>
          )}
          {previewLogo && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <X className={cn("size-6", compact && "size-4")} />
            </button>
          )}
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
          Preview
        </span>
      </div>

      {/* Right Inputs */}
      <div className="flex-1 flex flex-col gap-3 justify-center">
        {/* Upload Area */}
        <div className="relative">
          <div
            className={cn(
              "flex items-center justify-center w-full h-11 border-2 border-dashed rounded-xl transition-all duration-200 border-border bg-background hover:border-primary/40 hover:bg-muted/5 group cursor-pointer relative",
              compact && "h-9 rounded-lg border",
            )}
          >
            <div className="flex items-center gap-2">
              <ImagePlus
                className={cn(
                  "size-4 text-muted-foreground group-hover:text-primary transition-colors",
                  compact && "size-3.5",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors",
                  compact && "text-[11px]",
                )}
              >
                Choose an image
              </span>
            </div>
            <Input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onLogoChange(url, file);
                }
              }}
            />
          </div>
        </div>

        <div className={cn("flex items-center gap-3", compact && "gap-2")}>
          <div className="h-px bg-border flex-1" />
          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase">
            OR
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* URL Input Area */}
        <div className="relative group text-foreground">
          <Link
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors",
              compact && "size-3.5",
            )}
          />
          <Input
            placeholder="Paste image URL"
            type="url"
            className={cn(
              "h-11 pl-10 text-xs border-2 border-border rounded-xl bg-background text-foreground transition-all duration-200 hover:border-primary/40 focus-visible:ring-primary/20 focus-visible:border-primary",
              compact && "h-9 pl-9 border rounded-lg",
            )}
            value={urlValue}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
