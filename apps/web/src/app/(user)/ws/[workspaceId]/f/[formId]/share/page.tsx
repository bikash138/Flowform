"use client";

import { useState } from "react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { cn } from "@/lib/utils";
import { Copy, Check, Globe2, Link2, Lock, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "";

const ACCESS_TYPE_META = {
  public: {
    icon: Globe2,
    label: "Public",
    description: "Anyone with the link can view and submit.",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  unlisted: {
    icon: Link2,
    label: "Unlisted",
    description: "Only people with the direct link can access it.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  password_protected: {
    icon: Lock,
    label: "Password protected",
    description: "Respondents must enter an access code before viewing.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
} as const;

const QUOTES = [
  "Every great campaign starts with a single question.",
  "The best forms feel like conversations, not interrogations.",
  "Collect answers. Build relationships.",
  "Your audience is talking — make sure you're listening.",
  "A well-crafted form is the shortest distance between curiosity and insight.",
];

const QUOTE = QUOTES[Math.floor(Math.random() * QUOTES.length)]!;

function CopyLinkRow({ label, url, mono }: { label: string; url: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 h-9">
          <span className={cn("flex-1 text-sm truncate", mono && "font-mono")}>{url}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open link"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 shrink-0"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export default function SharePage() {
  const form = useFormEditorStore((s) => s.form);

  if (!form) return null;

  const isPublished = form.status === "PUBLISHED";
  const accessType = (form.settings as { accessType: string }).accessType ?? "public";
  const meta = ACCESS_TYPE_META[accessType as keyof typeof ACCESS_TYPE_META] ?? ACCESS_TYPE_META.public;
  const AccessIcon = meta.icon;

  const idUrl   = `${BASE_URL}/form/${form.id}`;
  const slugUrl = form.slug ? `${BASE_URL}/form/${form.slug}` : null;

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-muted/20">
      <div className="max-w-[640px] w-full mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Quote */}
        <p className="text-xs text-muted-foreground italic text-center tracking-wide">
          &ldquo;{QUOTE}&rdquo;
        </p>

        {/* Unpublished warning */}
        {!isPublished && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Form not published yet</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Publish your form first — respondents will see a &ldquo;not found&rdquo; page until it goes live.
              </p>
            </div>
          </div>
        )}

        {/* Access type */}
        <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", meta.bg, meta.border)}>
          <AccessIcon className={cn("size-4 mt-0.5 shrink-0", meta.color)} />
          <div>
            <p className={cn("text-sm font-semibold", meta.color)}>{meta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>

        {/* Links */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Share your form</p>
            <p className="text-xs text-muted-foreground">
              Use the link below to share with respondents. The ID link always works — the slug link is a cleaner alias.
            </p>
          </div>

          <CopyLinkRow label="Form link (by ID)" url={idUrl} />

          {slugUrl ? (
            <CopyLinkRow label="Form link (by slug)" url={slugUrl} mono />
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Form link (by slug)</p>
              <p className="text-xs text-muted-foreground/70 italic">
                No slug set — add one in Settings → Visibility to get a cleaner shareable URL.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
