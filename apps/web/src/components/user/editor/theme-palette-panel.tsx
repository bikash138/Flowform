"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Gem, Check } from "lucide-react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useUpdateTheme, useThemes } from "@/hooks/user/use-form";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { PlansModal } from "@/components/modals/plans-modal";
import type { FormTheme } from "@flowform/database/models";

type ThemeEntry = NonNullable<ReturnType<typeof useThemes>["data"]>[number];

// ─── Theme card ───────────────────────────────────────────────────────────────

function ThemeCard({
  name,
  theme,
  isActive,
  isLocked,
  onSelect,
  onHoverEnter,
  onHoverLeave,
}: {
  name: string;
  theme: ThemeEntry["theme"];
  isActive: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      className={cn(
        "relative group flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-150 text-left w-full",
        isActive
          ? "border-primary ring-1 ring-primary"
          : "border-transparent hover:border-border",
      )}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Color swatches strip */}
      <div className="flex h-8 w-full">
        <div className="flex-1" style={{ backgroundColor: theme.primaryColor }} />
        <div className="flex-1" style={{ backgroundColor: theme.accentColor ?? theme.primaryColor }} />
        <div className="flex-1" style={{ backgroundColor: theme.inputBackgroundColor ?? theme.backgroundColor }} />
      </div>

      {/* Content preview */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Label bar */}
        <div
          className="h-1.5 rounded-full w-2/3"
          style={{ backgroundColor: theme.labelColor ?? theme.primaryColor, opacity: 0.85 }}
        />
        {/* Simulated input */}
        <div
          className="h-6 w-full border flex items-center px-2 gap-1.5"
          style={{
            backgroundColor: theme.inputBackgroundColor ?? theme.backgroundColor,
            borderColor: theme.inputBorderColor ?? theme.primaryColor + "44",
            borderRadius: theme.inputRadius === "sharp" ? "0px" : theme.inputRadius === "pill" ? "9999px" : "4px",
          }}
        >
          <div
            className="h-1 rounded-full flex-1"
            style={{ backgroundColor: theme.placeholderColor ?? theme.primaryColor, opacity: 0.4 }}
          />
        </div>
        {/* Simulated choice row */}
        <div
          className="h-5 w-full border flex items-center px-2 gap-1.5"
          style={{
            backgroundColor: theme.choiceSelectedColor ?? theme.primaryColor + "18",
            borderColor: theme.primaryColor + "66",
            borderRadius: theme.inputRadius === "sharp" ? "0px" : theme.inputRadius === "pill" ? "9999px" : "4px",
          }}
        >
          <div
            className="size-2.5 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: theme.primaryColor }}
          >
            <div className="size-1 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
          </div>
          <div
            className="h-1 rounded-full w-10"
            style={{ backgroundColor: theme.labelColor ?? theme.primaryColor, opacity: 0.5 }}
          />
        </div>
        {/* Button */}
        <div
          className="h-5 w-14 flex items-center justify-center"
          style={{
            backgroundColor: theme.primaryColor,
            borderRadius: theme.buttonRadius === "sharp" ? "0px" : theme.buttonRadius === "pill" ? "9999px" : "4px",
          }}
        >
          <div className="h-1 w-6 rounded-full bg-white opacity-80" />
        </div>
      </div>

      {/* Name */}
      <div
        className="px-3 pb-2.5"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <span
          className="text-[11px] font-semibold leading-none truncate block"
          style={{ color: theme.primaryColor }}
        >
          {name}
        </span>
      </div>

      {/* Active checkmark */}
      {isActive && (
        <div className="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-xl">
          <div className="flex flex-col items-center gap-1.5">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Gem className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-semibold text-primary">Upgrade</span>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Tier section header ──────────────────────────────────────────────────────

function TierHeader({ label, badge }: { label: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      {badge}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function ThemePalettePanel({ onClose }: { onClose: () => void }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const form = useFormEditorStore((s) => s.form);
  const setHoverTheme = useFormEditorStore((s) => s.setHoverTheme);
  const { mutate: applyTheme, isPending } = useUpdateTheme();
  const { data: plan } = useWorkspacePlan(workspaceId);
  const { data: themes = [], isLoading: themesLoading } = useThemes(workspaceId);
  const [plansOpen, setPlansOpen] = useState(false);

  const planId = plan?.planId ?? "FREE";
  const currentTheme = form?.theme as FormTheme | undefined;

  const freeThemes = themes.filter((t) => t.tier === "FREE");
  const proThemes = themes.filter((t) => t.tier === "PRO");
  const proMaxThemes = themes.filter((t) => t.tier === "PRO_MAX");

  function isActive(theme: ThemeEntry["theme"]) {
    return (
      currentTheme?.primaryColor === theme.primaryColor &&
      currentTheme?.backgroundColor === theme.backgroundColor
    );
  }

  function handleSelect(themeId: string, locked: boolean) {
    if (locked) {
      setPlansOpen(true);
      return;
    }
    if (!form?.id || !workspaceId || isPending) return;
    applyTheme({ formId: form.id, workspaceId, themeId });
  }

  function handleHoverEnter(theme: ThemeEntry["theme"]) {
    if (!currentTheme) return;
    setHoverTheme({
      ...currentTheme,
      primaryColor: theme.primaryColor,
      backgroundColor: theme.backgroundColor,
      accentColor: theme.accentColor,
      borderRadius: theme.borderRadius,
    });
  }

  function handleHoverLeave() {
    setHoverTheme(null);
  }

  const isProLocked = planId === "FREE";
  const isProMaxLocked = planId === "FREE" || planId === "PRO";

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-border shrink-0">
          <span className="text-xs font-bold text-foreground uppercase tracking-widest">
            Design
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-6">
            {themesLoading ? (
              <div className="py-16 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Loading themes…</span>
              </div>
            ) : (
              <>
                {/* FREE tier */}
                <TierHeader label="Free themes" />
                <div className="grid grid-cols-2 gap-2">
                  {freeThemes.map((t) => (
                    <ThemeCard
                      key={t.id}
                      name={t.name}
                      theme={t.theme}
                      isActive={isActive(t.theme)}
                      isLocked={false}
                      onSelect={() => handleSelect(t.id, false)}
                      onHoverEnter={() => handleHoverEnter(t.theme)}
                      onHoverLeave={handleHoverLeave}
                    />
                  ))}
                </div>

                {/* PRO tier */}
                <TierHeader
                  label="Pro themes"
                  badge={
                    isProLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        <Gem className="size-2.5" />
                        Pro
                      </span>
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  {proThemes.map((t) => (
                    <ThemeCard
                      key={t.id}
                      name={t.name}
                      theme={t.theme}
                      isActive={isActive(t.theme)}
                      isLocked={isProLocked}
                      onSelect={() => handleSelect(t.id, isProLocked)}
                      onHoverEnter={() => !isProLocked && handleHoverEnter(t.theme)}
                      onHoverLeave={handleHoverLeave}
                    />
                  ))}
                </div>

                {/* PRO_MAX tier */}
                <TierHeader
                  label="Pro Max themes"
                  badge={
                    isProMaxLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                        <Gem className="size-2.5" />
                        Pro Max
                      </span>
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  {proMaxThemes.map((t) => (
                    <ThemeCard
                      key={t.id}
                      name={t.name}
                      theme={t.theme}
                      isActive={isActive(t.theme)}
                      isLocked={isProMaxLocked}
                      onSelect={() => handleSelect(t.id, isProMaxLocked)}
                      onHoverEnter={() => !isProMaxLocked && handleHoverEnter(t.theme)}
                      onHoverLeave={handleHoverLeave}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />
    </>
  );
}
