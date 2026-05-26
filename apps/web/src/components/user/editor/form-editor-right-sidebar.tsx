"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MousePointerClick,
  Plus,
  Trash2,
  PlayCircle,
  Flag,
  SlidersHorizontal,
  Mail,
  Info,
  Upload,
  X,
  Check,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import type { EndPageAnimation, FormSettings } from "@flowform/database/models";
import { cn } from "@/lib/utils";
import { convertToWebp } from "@/lib/image";
import { useGetCoverImageUploadUrl } from "@/hooks/user/use-form";
import { toast } from "sonner";

// ─── Shared section label ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ─── Question panel ───────────────────────────────────────────────────────────

function CoverImageDropzone({ pageId }: { pageId: string }) {
  const { workspaceId, formId } = useParams<{ workspaceId: string; formId: string }>();
  const page                    = useFormEditorStore((s) => s.content?.pages.find((p) => p.id === pageId));
  const updatePageCoverImage    = useFormEditorStore((s) => s.updatePageCoverImage);
  const updatePageImagePosition = useFormEditorStore((s) => s.updatePageImagePosition);
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Blob URL lives in a ref so React Strict Mode's double-invoke never revokes it mid-render
  const blobUrlRef = useRef<string | null>(null);
  const { mutateAsync: getUploadUrl } = useGetCoverImageUploadUrl();

  // Revoke blob URL only on component unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Stage the file locally — zero Zustand writes, no sync triggered
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(file);
    setPendingFile(file);
  }, []);

  // Discard the pending preview without uploading
  const handleDiscard = useCallback(() => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
    setPendingFile(null);
  }, []);

  // Upload to S3 then write the public URL to the store → triggers auto-sync
  const handleConfirmUpload = useCallback(async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } = await getUploadUrl({ formId, pageId, workspaceId });
      const webpBlob = await convertToWebp(pendingFile);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: webpBlob,
        headers: { "Content-Type": "image/webp" },
      });
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setPendingFile(null);
      updatePageCoverImage(pageId, publicUrl);
    } catch (err) {
      console.error("[CoverImageDropzone] upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }, [pendingFile, pageId, formId, workspaceId, getUploadUrl, updatePageCoverImage]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const imagePosition = page?.imagePosition ?? "left";
  const coverImage = page?.coverImage;
  // blobUrlRef.current is read at render time — pendingFile state drives re-renders
  const displayImage = (pendingFile ? blobUrlRef.current : null) ?? coverImage;
  const isPending = !!pendingFile;

  return (
    <div className="space-y-3">
      <SectionLabel>Cover image</SectionLabel>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors overflow-hidden",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          displayImage ? "h-28" : "h-20",
        )}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <Loader2 className="size-4 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        ) : displayImage ? (
          <>
            <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover" />

            {/* Pending state: confirm or discard */}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleConfirmUpload(); }}
                  className="size-8 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                  title="Upload image"
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                  className="size-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  title="Discard"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Uploaded state: remove */}
            {!isPending && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updatePageCoverImage(pageId, null); }}
                className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </>
        ) : (
          <label className="flex flex-col items-center justify-center h-full gap-1.5 cursor-pointer">
            <Upload className="size-4 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">
              Drop image or <span className="text-primary font-medium">browse</span>
            </span>
            <input type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
        )}
      </div>

      {/* Image position toggle */}
      <div className="space-y-1.5">
        <SectionLabel>Image side</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {(["left", "right"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => updatePageImagePosition(pageId, pos)}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition-all",
                imagePosition === pos
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              <LayoutTemplate className="size-3.5" />
              {pos === "left" ? "Image left" : "Image right"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionPanel({
  pageId,
  questionId,
}: {
  pageId: string;
  questionId: string;
}) {
  const question = useFormEditorStore((s) => {
    const page = s.content?.pages.find((p) => p.id === pageId);
    return page?.questions.find((q) => q.id === questionId) ?? null;
  });
  const form           = useFormEditorStore((s) => s.form);
  const updateQuestion = useFormEditorStore((s) => s.updateQuestion);
  const addOption      = useFormEditorStore((s) => s.addOption);
  const updateOption   = useFormEditorStore((s) => s.updateOption);
  const deleteOption   = useFormEditorStore((s) => s.deleteOption);
  const deleteQuestion = useFormEditorStore((s) => s.deleteQuestion);

  const isConversational = (form?.settings as FormSettings | undefined)?.formLayout === "conversational";

  if (!question) return null;

  const hasOptions     = question.type === "select" || question.type === "radio" || question.type === "checkbox";
  const hasPlaceholder = question.type === "short_text" || question.type === "long_text"
    || question.type === "email" || question.type === "number"
    || question.type === "phone" || question.type === "url" || question.type === "date";
  const isTextType = question.type === "short_text" || question.type === "long_text";
  const isNumber   = question.type === "number";
  const isRating   = question.type === "rating";
  const isDate     = question.type === "date";

  return (
    <div className="space-y-5">
      {/* Conversational: cover image + image position */}
      {isConversational && (
        <>
          <CoverImageDropzone pageId={pageId} />
          <Separator />
        </>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground capitalize">
          {question.type}
        </span>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <SectionLabel>Question label</SectionLabel>
        <Input
          value={question.label}
          onChange={(e) => updateQuestion(pageId, question.id, { label: e.target.value })}
          className="h-9"
          placeholder="Enter question label"
        />
      </div>

      {/* Placeholder */}
      {hasPlaceholder && (
        <div className="space-y-1.5">
          <SectionLabel>Placeholder</SectionLabel>
          <Input
            value={question.placeholder ?? ""}
            onChange={(e) =>
              updateQuestion(pageId, question.id, { placeholder: e.target.value || null })
            }
            className="h-9"
            placeholder="Hint text shown inside the field"
          />
        </div>
      )}

      {/* Required */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold cursor-pointer">Required</Label>
        <Switch
          checked={question.required}
          onCheckedChange={(checked) => updateQuestion(pageId, question.id, { required: checked })}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* ── Type-specific settings ─────────────────────────────────────── */}

      {/* Short / Long text: maxLength */}
      {isTextType && (
        <>
          <Separator />
          <SectionLabel>Text settings</SectionLabel>
          <div className="space-y-1.5">
            <SectionLabel>Max length</SectionLabel>
            <Input
              type="number"
              min={1}
              value={question.config?.maxLength ?? ""}
              onChange={(e) =>
                updateQuestion(pageId, question.id, {
                  config: { ...question.config, maxLength: e.target.value ? Number(e.target.value) : undefined },
                })
              }
              className="h-9"
              placeholder="No limit"
            />
          </div>
        </>
      )}

      {/* Number: min + max */}
      {isNumber && (
        <>
          <Separator />
          <SectionLabel>Number range</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                value={question.config?.min ?? ""}
                onChange={(e) =>
                  updateQuestion(pageId, question.id, {
                    config: { ...question.config, min: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="h-9"
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                value={question.config?.max ?? ""}
                onChange={(e) =>
                  updateQuestion(pageId, question.id, {
                    config: { ...question.config, max: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="h-9"
                placeholder="—"
              />
            </div>
          </div>
        </>
      )}

      {/* Rating: scale */}
      {isRating && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <SectionLabel>Scale</SectionLabel>
            <Select
              value={String(question.config?.scale ?? 5)}
              onValueChange={(v) =>
                updateQuestion(pageId, question.id, { config: { ...question.config, scale: Number(v) } })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Date: includeTime */}
      {isDate && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold cursor-pointer">Include time</Label>
            <Switch
              checked={question.config?.includeTime ?? false}
              onCheckedChange={(checked) =>
                updateQuestion(pageId, question.id, { config: { ...question.config, includeTime: checked } })
              }
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </>
      )}

      {/* Options: select / radio / checkbox */}
      {hasOptions && (
        <>
          <Separator />
          <SectionLabel>Options</SectionLabel>
          <div className="space-y-2">
            {(question.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2 group">
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(pageId, question.id, opt.id, e.target.value)}
                  className="h-8 text-sm"
                />
                <button
                  onClick={() => deleteOption(pageId, question.id, opt.id)}
                  disabled={(question.options?.length ?? 0) <= 1}
                  className="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addOption(pageId, question.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1"
          >
            <Plus className="size-3.5" />
            Add option
          </button>
        </>
      )}

      {/* Delete */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => deleteQuestion(pageId, question.id)}
          className="group w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-white bg-red-500/5 hover:bg-red-500 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500 transition-all duration-200 active:scale-[0.98]"
        >
          <Trash2 className="size-3.5" />
          Delete question
        </button>
      </div>
    </div>
  );
}

// ─── Start page panel ─────────────────────────────────────────────────────────

function StartPagePanel() {
  const content         = useFormEditorStore((s) => s.content);
  const form            = useFormEditorStore((s) => s.form);
  const updateStartPage = useFormEditorStore((s) => s.updateStartPage);

  const startPage    = content?.startPage;
  const collectEmail = form?.settings?.collectEmail ?? false;
  const hasStartPage = !!startPage;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <PlayCircle className="size-4 text-primary" />
        <span className="text-sm font-semibold">Start page</span>
      </div>

      {/* Collect email notice */}
      {collectEmail && (
        <div className="flex gap-2.5 rounded-lg border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40 p-3">
          <Mail className="size-3.5 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
            <span className="font-semibold">Collect email is on.</span>{" "}
            {hasStartPage
              ? "An email field will appear on this start page — respondents must enter their email before they can begin."
              : "No start page is set. A required email question will be added as the first field on page 1."}
          </p>
        </div>
      )}

      {!collectEmail && (
        <div className="flex gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
          <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enable <span className="font-semibold">Collect email</span> in form settings to require respondents to provide their email address.
          </p>
        </div>
      )}

      <Separator />

      <div className="space-y-1.5">
        <SectionLabel>Heading</SectionLabel>
        <Input
          value={startPage?.heading ?? ""}
          onChange={(e) => updateStartPage({ heading: e.target.value })}
          className="h-9"
          placeholder="Welcome to our form"
        />
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Description</SectionLabel>
        <Textarea
          value={startPage?.description ?? ""}
          onChange={(e) => updateStartPage({ description: e.target.value || null })}
          className="resize-none text-sm min-h-[72px]"
          placeholder="Tell respondents what this form is about"
        />
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Button label</SectionLabel>
        <Input
          value={startPage?.buttonLabel ?? ""}
          onChange={(e) => updateStartPage({ buttonLabel: e.target.value })}
          className="h-9"
          placeholder="Start"
        />
      </div>
    </div>
  );
}

// ─── End page panel ───────────────────────────────────────────────────────────

const ANIMATION_OPTIONS: { value: EndPageAnimation; label: string; emoji: string }[] = [
  { value: "confetti",  label: "Confetti",  emoji: "🎊" },
  { value: "fireworks", label: "Fireworks", emoji: "🎆" },
  { value: "balloons",  label: "Balloons",  emoji: "🎈" },
  { value: "none",      label: "None",      emoji: "—" },
];

function previewAnimation(animation: EndPageAnimation) {
  if (animation === "confetti") {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  if (animation === "fireworks") {
    const burst = (x: number) =>
      confetti({ particleCount: 80, spread: 360, startVelocity: 28, origin: { x, y: 0.45 }, ticks: 60 });
    burst(0.25);
    setTimeout(() => burst(0.75), 180);
    setTimeout(() => burst(0.5),  360);
  }

  if (animation === "balloons") {
    confetti({
      particleCount: 80,
      spread: 60,
      gravity: -0.5,
      shapes: ["circle"],
      scalar: 2,
      origin: { y: 1.1 },
      colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bdf"],
    });
  }
}

function EndPagePanel() {
  const content       = useFormEditorStore((s) => s.content);
  const updateEndPage = useFormEditorStore((s) => s.updateEndPage);

  const endPage = content?.endPage;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Flag className="size-4 text-primary" />
        <span className="text-sm font-semibold">End page</span>
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Heading</SectionLabel>
        <Input
          value={endPage?.heading ?? ""}
          onChange={(e) => updateEndPage({ heading: e.target.value })}
          className="h-9"
          placeholder="Thanks for your response!"
        />
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Message</SectionLabel>
        <Textarea
          value={endPage?.message ?? ""}
          onChange={(e) => updateEndPage({ message: e.target.value || null })}
          className="resize-none text-sm min-h-[72px]"
          placeholder="We'll get back to you shortly."
        />
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Animation</SectionLabel>
        <Select
          value={endPage?.animation ?? "none"}
          onValueChange={(v) => {
            const anim = v as EndPageAnimation;
            updateEndPage({ animation: anim });
            previewAnimation(anim);
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANIMATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Root panel ───────────────────────────────────────────────────────────────

export function FormPropertiesPanel() {
  const selectedItem = useFormEditorStore((s) => s.selectedItem);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-11 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-bold text-foreground uppercase tracking-widest">
          Properties
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Empty state */}
          {!selectedItem && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="size-10 rounded-full border border-dashed border-border flex items-center justify-center mb-3">
                <MousePointerClick className="size-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                Select a question, start page, or end page to edit its properties.
              </p>
            </div>
          )}

          {selectedItem?.type === "startPage" && <StartPagePanel />}

          {selectedItem?.type === "endPage" && <EndPagePanel />}

          {selectedItem?.type === "question" && (
            <QuestionPanel
              pageId={selectedItem.pageId}
              questionId={selectedItem.questionId}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
