"use client";

import { useFormEditorStore } from "@/store/use-form-editor-store";
import type { Question, FormTheme } from "@/store/use-form-editor-store";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  PlayCircle,
  Flag,
  ImageIcon,
  GitBranch,
} from "lucide-react";
// LogicRule comes from form-core, not the database package: form-core widens the
// condition union (is_empty, not_contains, …) ahead of the DB type, so its rule
// type is the superset and the one every consumer should read.
import { visibilityRuleOf, type LogicRule } from "@flowform/form-core";
import { cn } from "@/lib/utils";
import type { FormSettings, FormPage, FormFont } from "@flowform/database/models";

/** "Shown when X" and "Hidden when X" are opposite meanings — never collapse them. */
function ruleBadge(rule: LogicRule, triggerLabel: string): string {
  const verb = rule.action === "HIDE" ? "Hidden" : "Shown";
  return `${verb} when “${triggerLabel || "Untitled question"}” matches`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function defaultPageBg(cardBg: string): string {
  const h = cardBg.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const shift = hexLuminance(cardBg) > 0.5 ? -22 : 18;
  const clamp = (v: number) => Math.max(0, Math.min(255, v + shift));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function radiusVal(r?: "sharp" | "rounded" | "pill", fallback?: "sharp" | "rounded" | "pill"): string {
  const v = r ?? fallback ?? "rounded";
  return v === "sharp" ? "0px" : v === "pill" ? "9999px" : "0.625rem";
}

function themeToVars(theme: FormTheme): React.CSSProperties {
  const bg = theme.backgroundColor;
  const fgOnBg = hexLuminance(bg) > 0.5 ? "#1a1a1a" : "#f5f5f5";
  const fgOnPrimary = hexLuminance(theme.primaryColor) > 0.5 ? "#1a1a1a" : "#f5f5f5";

  return {
    "--primary": theme.primaryColor,
    "--primary-foreground": fgOnPrimary,
    "--primary-dark": theme.accentColor,
    "--background": bg,
    "--card": bg,
    "--card-foreground": fgOnBg,
    "--foreground": fgOnBg,
    "--muted-foreground": hexLuminance(bg) > 0.5 ? "#666666" : "#999999",
    "--form-label": theme.labelColor ?? fgOnBg,
    "--form-placeholder": theme.placeholderColor ?? (hexLuminance(bg) > 0.5 ? "#9CA3AF" : "#4B5563"),
    "--form-input-bg": theme.inputBackgroundColor ?? bg,
    "--form-input-border": theme.inputBorderColor ?? (hexLuminance(bg) > 0.5 ? "#D1D5DB" : "#374151"),
    "--form-input-text": theme.inputTextColor ?? fgOnBg,
    "--form-choice-bg": theme.choiceColor ?? bg,
    "--form-choice-selected": theme.choiceSelectedColor ?? (theme.primaryColor + "22"),
    "--form-star": theme.starColor ?? theme.primaryColor,
    "--form-btn-radius": radiusVal(theme.buttonRadius, theme.borderRadius),
    "--form-input-radius": radiusVal(theme.inputRadius, theme.borderRadius),
  } as React.CSSProperties;
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--form-input-bg)",
  borderColor: "var(--form-input-border)",
  color: "var(--form-input-text)",
  borderRadius: "var(--form-input-radius)",
  fontFamily: "inherit",
};

// ─── Field renderers ──────────────────────────────────────────────────────────

function QuestionField({ question }: { question: Question }) {
  const placeholder = question.placeholder ?? undefined;

  switch (question.type) {
    case "short_text":
      return (
        <input
          disabled
          placeholder={placeholder ?? "Short answer"}
          style={inputStyle}
          className="w-full border h-10 px-3 text-sm outline-none pointer-events-none"
        />
      );

    case "long_text":
      return (
        <textarea
          disabled
          placeholder={placeholder ?? "Your answer…"}
          rows={3}
          style={inputStyle}
          className="w-full resize-none border px-3 py-2 text-sm outline-none pointer-events-none"
        />
      );

    case "email":
      return (
        <input disabled type="email" placeholder={placeholder ?? "name@email.com"}
          style={inputStyle} className="w-full border h-10 px-3 text-sm outline-none pointer-events-none" />
      );

    case "number":
      return (
        <input disabled type="number" placeholder={placeholder ?? "0"}
          style={inputStyle} className="w-full border h-10 px-3 text-sm outline-none pointer-events-none" />
      );

    case "phone":
      return (
        <input disabled type="tel" placeholder={placeholder ?? "+1-555-000-0000"}
          style={inputStyle} className="w-full border h-10 px-3 text-sm outline-none pointer-events-none" />
      );

    case "url":
      return (
        <input disabled type="url" placeholder={placeholder ?? "https://example.com"}
          style={inputStyle} className="w-full border h-10 px-3 text-sm outline-none pointer-events-none" />
      );

    case "date":
      return (
        <input disabled type="date" style={inputStyle}
          className="w-full border h-10 px-3 text-sm outline-none pointer-events-none" />
      );

    case "select":
      return (
        <select disabled style={inputStyle}
          className="w-full border h-10 px-3 text-sm outline-none pointer-events-none appearance-none">
          <option style={{ color: "var(--form-placeholder)" }}>{placeholder ?? "Select an option…"}</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt.id} style={{ color: "var(--form-input-text)" }}>{opt.label}</option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt, i) => (
            <label key={opt.id}
              className="flex items-center gap-2.5 cursor-default px-3 py-2.5 border transition-colors"
              style={{
                backgroundColor: i === 0 ? "var(--form-choice-selected)" : "var(--form-choice-bg)",
                borderColor: i === 0 ? "var(--primary)" : "var(--form-input-border)",
                borderRadius: "var(--form-input-radius)",
                color: "var(--form-label)",
              }}
            >
              <div className="size-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{
                  borderColor: i === 0 ? "var(--primary)" : "var(--form-input-border)",
                  backgroundColor: i === 0 ? "var(--primary)" : "transparent",
                }}
              >
                {i === 0 && <div className="size-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt, i) => (
            <label key={opt.id}
              className="flex items-center gap-2.5 cursor-default px-3 py-2.5 border transition-colors"
              style={{
                backgroundColor: i === 0 ? "var(--form-choice-selected)" : "var(--form-choice-bg)",
                borderColor: i === 0 ? "var(--primary)" : "var(--form-input-border)",
                borderRadius: "var(--form-input-radius)",
                color: "var(--form-label)",
              }}
            >
              <div className="size-4 rounded shrink-0 border-2 flex items-center justify-center"
                style={{
                  borderColor: i === 0 ? "var(--primary)" : "var(--form-input-border)",
                  backgroundColor: i === 0 ? "var(--primary)" : "transparent",
                }}
              >
                {i === 0 && (
                  <svg viewBox="0 0 10 8" className="size-2.5 fill-white">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case "rating": {
      const scale = question.config?.scale ?? 5;
      return (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: scale }).map((_, i) => (
            <Star key={i} className="size-7" style={{
              color: "var(--form-star)",
              fill: i < 3 ? "var(--form-star)" : "transparent",
              opacity: i < 3 ? 1 : 0.3,
            }} />
          ))}
        </div>
      );
    }

    case "yes_no":
      return (
        <div className="flex gap-3">
          {(["Yes", "No"] as const).map((label, i) => (
            <div key={label}
              className="flex-1 py-3 text-sm font-semibold border-2 text-center pointer-events-none"
              style={{
                borderColor: i === 0 ? "var(--primary)" : "var(--form-input-border)",
                backgroundColor: i === 0 ? "var(--primary)" : "var(--form-input-bg)",
                color: i === 0 ? "var(--primary-foreground)" : "var(--form-label)",
                borderRadius: "var(--form-input-radius)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ─── Progress indicator (vertical only) ──────────────────────────────────────

function ProgressIndicator() {
  const content          = useFormEditorStore((s) => s.content);
  const form             = useFormEditorStore((s) => s.form);
  const currentPageIndex = useFormEditorStore((s) => s.currentPageIndex);

  const progressBar = form?.settings?.progressBar;
  if (!progressBar?.enabled) return null;

  const pages = content?.pages ?? [];
  const total = pages.length;
  const current = currentPageIndex + 1;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  if (progressBar.style === "steps") {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
        Step {current} of {total}
      </span>
    );
  }

  if (progressBar.style === "percentage") {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{pct}%</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {pages.map((_, idx) => (
        <div key={idx} className="rounded-full transition-all"
          style={{
            width: idx === currentPageIndex ? "1.25rem" : "0.5rem",
            height: "0.5rem",
            backgroundColor: idx === currentPageIndex ? "var(--primary)" : "var(--muted-foreground)",
            opacity: idx === currentPageIndex ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ─── Start page preview ───────────────────────────────────────────────────────

function StartPagePreview() {
  const content = useFormEditorStore((s) => s.content);
  const startPage = content?.startPage;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center px-6">
      <div className="size-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary)", opacity: 0.12 }}>
        <PlayCircle className="size-6" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ color: "var(--form-label)" }}>
          {startPage?.heading || "Welcome to our form"}
        </h2>
        {startPage?.description && (
          <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
            {startPage.description}
          </p>
        )}
      </div>
      <button disabled className="px-6 py-2.5 text-sm font-semibold pointer-events-none"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}>
        {startPage?.buttonLabel || "Start"}
      </button>
    </div>
  );
}

// ─── End page preview ─────────────────────────────────────────────────────────

function EndPagePreview() {
  const content = useFormEditorStore((s) => s.content);
  const endPage = content?.endPage;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center px-6">
      <div className="size-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary)", opacity: 0.12 }}>
        <Flag className="size-6" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ color: "var(--form-label)" }}>
          {endPage?.heading || "Thank you!"}
        </h2>
        {endPage?.message && (
          <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
            {endPage.message}
          </p>
        )}
      </div>
      {endPage?.animation && endPage.animation !== "none" && (
        <span className="text-xs px-2 py-1 rounded-full border"
          style={{ color: "var(--muted-foreground)", borderColor: "var(--form-input-border)" }}>
          Animation: {endPage.animation}
        </span>
      )}
    </div>
  );
}

// ─── Conversational canvas ────────────────────────────────────────────────────

function ConversationalCanvas({
  page,
  onSelectQuestion,
  selectedQuestionId,
  isMobile,
  visibilityRules,
  allQs,
}: {
  page: FormPage | undefined;
  onSelectQuestion: (questionId: string) => void;
  selectedQuestionId?: string;
  isMobile: boolean;
  /** questionId -> the SHOW or HIDE rule controlling it. Derived from the rule list. */
  visibilityRules: Map<string, LogicRule>;
  allQs: Question[];
}) {
  // A conversational page leads with one question, but may also carry the
  // follow-ups that question reveals — they live on the same card by design.
  // The canvas shows ALL of them (unlike the live form, which hides the
  // follow-ups until their condition fires) because an author has to be able to
  // see and select a conditional question in order to edit it.
  const questions = [...(page?.questions ?? [])].sort((a, b) => a.order - b.order);
  const [lead, ...followUps] = questions;

  const coverImage = page?.coverImage;
  const imagePosition = page?.imagePosition ?? "left";

  function ImageSlot({ className }: { className?: string }) {
    return (
      <div className={cn("relative overflow-hidden", className)}
        style={{ backgroundColor: coverImage ? undefined : "var(--form-choice-bg)" }}>
        {coverImage ? (
          <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon className="size-7" style={{ color: "var(--muted-foreground)", opacity: 0.35 }} />
            <p className="text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
              Drag & drop image in Properties
            </p>
          </div>
        )}
      </div>
    );
  }

  function QuestionSlot({ withOverlayNav }: { withOverlayNav?: boolean }) {
    // The card only auto-advances while the lead question stands alone. Once it
    // reveals a follow-up, the respondent has to answer that too — so a Next
    // button appears instead. Mirrors the live renderer.
    const autoAdvances =
      !!lead && followUps.length === 0 && (lead.type === "radio" || lead.type === "rating" || lead.type === "yes_no");
    const showNextBtn = !!lead && !autoAdvances;

    return (
      <div className={cn(
        "flex flex-col",
        withOverlayNav ? "relative flex-1 overflow-hidden" : "flex-1 p-5 min-h-0 overflow-y-auto",
      )}>
        {/* Scrollable content */}
        <div className={cn(
          withOverlayNav ? "absolute inset-0 overflow-y-auto px-5 pt-4 pb-20 flex flex-col" : "flex-1 flex flex-col justify-center"
        )}>
          {lead ? (
            <div className={cn("flex flex-col", withOverlayNav && "flex-1 justify-center")}>
              {/* Lead question */}
              <div
                className="flex flex-col p-3 rounded-lg border-2 transition-all cursor-pointer"
                style={{
                  borderColor: selectedQuestionId === lead.id ? "var(--primary)" : "transparent",
                  backgroundColor: selectedQuestionId === lead.id ? "var(--form-choice-selected)" : "transparent",
                }}
                onClick={() => onSelectQuestion(lead.id)}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>1 →</p>
                <Label className="text-base font-semibold mb-3 block" style={{ color: "var(--form-label)", fontFamily: "inherit" }}>
                  {lead.label || "Untitled question"}
                  {lead.required && <span style={{ color: "var(--primary)" }} className="ml-0.5">*</span>}
                </Label>
                <QuestionField question={lead} />
              </div>

              {/* Follow-ups. Shown here even though the live form hides them
                  until their condition fires — otherwise they would be
                  unselectable and therefore uneditable. */}
              {followUps.map((q) => {
                const vRule = visibilityRules.get(q.id);
                const triggerLabel = vRule
                  ? allQs.find((x) => x.id === vRule.triggerId)?.label ?? ""
                  : "";

                return (
                  <div
                    key={q.id}
                    className="mt-3 ml-4 p-3 rounded-lg border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: selectedQuestionId === q.id ? "var(--primary)" : "transparent",
                      backgroundColor: selectedQuestionId === q.id ? "var(--form-choice-selected)" : "transparent",
                      borderLeftColor: "var(--primary)",
                      borderLeftWidth: "2px",
                    }}
                    onClick={() => onSelectQuestion(q.id)}
                  >
                    <p className="flex items-center gap-1 text-[10px] font-semibold mb-1.5 opacity-70"
                      style={{ color: "var(--primary)" }}>
                      <GitBranch className="size-3" />
                      {vRule
                        ? ruleBadge(vRule, triggerLabel)
                        : "Always shown — add a condition in Properties"}
                    </p>
                    <Label className="text-sm font-semibold mb-2 block" style={{ color: "var(--form-label)", fontFamily: "inherit" }}>
                      {q.label || "Untitled question"}
                      {q.required && <span style={{ color: "var(--primary)" }} className="ml-0.5">*</span>}
                    </Label>
                    <QuestionField question={q} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
              <div className="size-10 rounded-full border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: "var(--form-input-border)" }}>
                <span className="text-lg" style={{ color: "var(--muted-foreground)" }}>+</span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Click <span className="font-semibold" style={{ color: "var(--form-label)" }}>Add content</span> to add a question
              </p>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        {withOverlayNav ? (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
            style={{ background: `linear-gradient(to bottom, transparent, var(--card) 45%)` }}>
            <div className="flex items-center justify-between">
              <button disabled className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border pointer-events-none opacity-40"
                style={{ borderColor: "var(--form-input-border)", color: "var(--form-label)", borderRadius: "var(--form-btn-radius)" }}>
                <ChevronLeft className="size-3.5" />Back
              </button>
              {showNextBtn && (
                <button disabled className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold pointer-events-none"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}>
                  Next →
                </button>
              )}
              {autoAdvances && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Auto-advances</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-4 pt-4 shrink-0"
            style={{ borderTop: "1px solid var(--form-input-border)" }}>
            <button disabled className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border pointer-events-none opacity-40"
              style={{ borderColor: "var(--form-input-border)", color: "var(--form-label)", borderRadius: "var(--form-btn-radius)" }}>
              <ChevronLeft className="size-3.5" />Back
            </button>
            {showNextBtn && (
              <button disabled className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold pointer-events-none"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}>
                Next →
              </button>
            )}
            {autoAdvances && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Auto-advances on selection</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {isMobile ? (
        <>
          <ImageSlot className="h-1/2 shrink-0" />
          <QuestionSlot withOverlayNav />
        </>
      ) : (
        <div className={cn("flex flex-1 min-h-0", imagePosition === "right" ? "flex-row-reverse" : "flex-row")}>
          <ImageSlot className="w-[45%] shrink-0" />
          <QuestionSlot />
        </div>
      )}
    </div>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export function FormEditorCanvas() {
  const activePageId     = useFormEditorStore((s) => s.activePageId);
  const selectedItem     = useFormEditorStore((s) => s.selectedItem);
  const previewMode      = useFormEditorStore((s) => s.previewMode);
  const form             = useFormEditorStore((s) => s.form);
  const content          = useFormEditorStore((s) => s.content);
  const hoverTheme       = useFormEditorStore((s) => s.hoverTheme);
  const selectItem       = useFormEditorStore((s) => s.selectItem);
  const goToNextPage     = useFormEditorStore((s) => s.goToNextPage);
  const goToPreviousPage = useFormEditorStore((s) => s.goToPreviousPage);
  const isFirstPage      = useFormEditorStore((s) => s.isFirstPage);
  const isLastPage       = useFormEditorStore((s) => s.isLastPage);

  const effectiveTheme = (hoverTheme ?? form?.theme) as FormTheme | undefined;
  const fontFamily = (form?.font as FormFont | undefined)?.fontFamily;
  const formLayout = (form?.settings as FormSettings | undefined)?.formLayout ?? "vertical";
  const isConversational = formLayout === "conversational";
  const isMobile = previewMode === "mobile";

  const canvasStyle = effectiveTheme
    ? { ...themeToVars(effectiveTheme), ...(fontFamily ? { fontFamily } : {}) }
    : undefined;

  const activePage = content?.pages.find((p) => p.id === activePageId);
  const activePageQuestions = activePage?.questions ?? [];
  const hasActivePage = content?.pages.some((p) => p.id === activePageId) ?? false;

  // questionId -> the SHOW or HIDE rule controlling it. Derived from the flat
  // rule list on every render; nothing about nesting is stored on the question.
  const visibilityRules = content ? visibilityRuleOf(content) : new Map<string, LogicRule>();
  const allQs = content?.pages.flatMap((p) => p.questions) ?? [];

  const showProgressBar = form?.settings?.progressBar?.enabled ?? false;
  const showStartPage = selectedItem?.type === "startPage";
  const showEndPage   = selectedItem?.type === "endPage";

  const selectedQuestionId =
    selectedItem?.type === "question" ? selectedItem.questionId : undefined;

  const mobileMaxW = "max-w-[390px]";

  // ── Conversational layout ─────────────────────────────────────────────────
  if (isConversational) {
    const pageBg = effectiveTheme
      ? (effectiveTheme.pageBackgroundColor ?? defaultPageBg(effectiveTheme.backgroundColor))
      : "#e5e7eb";

    return (
      <div
        className="flex-1 flex flex-col overflow-hidden items-center justify-center"
        style={{ backgroundColor: pageBg }}
        onClick={() => selectItem(null)}
      >
        {/* Card — mirrors exact real-form dimensions: max-w-4xl × h-[560px] rounded-2xl shadow-xl */}
        <div
          className={cn(
            "overflow-hidden shadow-xl flex flex-col",
            isMobile
              ? cn("w-full", mobileMaxW, "flex-1 my-4 rounded-2xl mx-auto")
              : "w-full max-w-4xl rounded-2xl h-[560px]",
          )}
          style={canvasStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {showStartPage && <StartPagePreview />}
          {showEndPage && <EndPagePreview />}
          {!showStartPage && !showEndPage && (
            <ConversationalCanvas
              page={activePage}
              onSelectQuestion={(questionId) => {
                if (activePageId) {
                  selectItem({ type: "question", pageId: activePageId, questionId });
                }
              }}
              selectedQuestionId={selectedQuestionId}
              isMobile={isMobile}
              visibilityRules={visibilityRules}
              allQs={allQs}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Vertical layout ───────────────────────────────────────────────────────
  return (
    <div
      className="flex-1 flex flex-col items-center bg-muted/20 py-8 px-4 overflow-auto"
      onClick={() => selectItem(null)}
    >
      <div
        className={cn("form-preview-card w-full transition-all duration-300", isMobile ? mobileMaxW : "max-w-[560px]")}
        style={canvasStyle}
      >
        {/* ── Start / End page ──────────────────────────────────────────────── */}
        {(showStartPage || showEndPage) && (
          <div className="rounded-xl shadow-sm"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--form-input-border)" }}
            onClick={(e) => e.stopPropagation()}>
            {showStartPage && <StartPagePreview />}
            {showEndPage && <EndPagePreview />}
          </div>
        )}

        {/* ── Question page ─────────────────────────────────────────────────── */}
        {!showStartPage && !showEndPage && (
          <div
            className="rounded-xl shadow-sm"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--form-input-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {!hasActivePage || activePageQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="size-10 rounded-full border-2 border-dashed flex items-center justify-center"
                    style={{ borderColor: "var(--form-input-border)" }}>
                    <span className="text-lg" style={{ color: "var(--muted-foreground)" }}>+</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Click <span className="font-semibold" style={{ color: "var(--form-label)" }}>Add content</span> or the{" "}
                    <span className="font-semibold" style={{ color: "var(--form-label)" }}>+</span> on a page to add your first question.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {activePageQuestions.map((question) => {
                    const isSelected =
                      selectedItem?.type === "question" &&
                      selectedItem.questionId === question.id;

                    // A conditional question is flagged with the rule that controls
                    // it. Computed from the flat rule list — nothing is nested in
                    // the data, so there is no second copy to keep in sync.
                    //
                    // Only SHOW targets get the indent: they are genuine follow-ups,
                    // hidden until revealed. A HIDE target is visible by default and
                    // merely suppressed for one group, so it stays inline.
                    const vRule = visibilityRules.get(question.id);
                    const triggerLabel = vRule
                      ? allQs.find((q) => q.id === vRule.triggerId)?.label ?? ""
                      : "";
                    const isRevealed = vRule?.action === "SHOW";

                    return (
                      <div key={question.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem({ type: "question", pageId: activePageId!, questionId: question.id });
                        }}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all cursor-pointer",
                          isRevealed && "ml-6",
                        )}
                        style={{
                          borderColor: isSelected ? "var(--primary)" : "transparent",
                          backgroundColor: isSelected ? "var(--form-choice-selected)" : "transparent",
                          ...(isRevealed ? { borderLeftColor: "var(--primary)", borderLeftWidth: "2px" } : {}),
                        }}
                      >
                        {vRule && (
                          <p className="flex items-center gap-1 text-[10px] font-semibold mb-1.5 opacity-70"
                            style={{ color: "var(--primary)" }}>
                            <GitBranch className="size-3" />
                            {ruleBadge(vRule, triggerLabel)}
                          </p>
                        )}
                        <Label className="text-sm font-semibold mb-2.5 block"
                          style={{ color: "var(--form-label)", fontFamily: "inherit" }}>
                          {question.label || "Untitled question"}
                          {question.required && (
                            <span style={{ color: "var(--primary)" }} className="ml-0.5">*</span>
                          )}
                        </Label>
                        <QuestionField question={question} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Vertical Navigation ─────────────────────────────── */}
              {showProgressBar && hasActivePage && activePageQuestions.length > 0 && (
                <div className="mt-8 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}>
                  <button onClick={goToPreviousPage} disabled={isFirstPage}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border disabled:opacity-30 transition-colors"
                    style={{
                      borderColor: "var(--form-input-border)",
                      color: "var(--form-label)",
                      borderRadius: "var(--form-btn-radius)",
                      fontFamily: "inherit",
                      backgroundColor: "var(--form-choice-bg)",
                    }}>
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </button>
                  <ProgressIndicator />
                  <button onClick={isLastPage ? undefined : goToNextPage}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                      borderRadius: "var(--form-btn-radius)",
                      fontFamily: "inherit",
                    }}>
                    {isLastPage ? "Submit" : (
                      <>Next <ChevronRight className="size-3.5" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
