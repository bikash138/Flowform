"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Star, ChevronLeft, ChevronRight, PlayCircle, Flag, RotateCcw,
  ImageIcon, Lock, ExternalLink, Loader2,
} from "lucide-react";
import type {
  FormContent, FormTheme, FormFont, Question, EndPageAnimation,
} from "@flowform/database/models";
import { usePreviewForm } from "@/hooks/user/use-public-form";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerValue = string | number | string[] | boolean | null;
type Answers = Record<string, AnswerValue>;
type Errors = Record<string, string>;
type ViewState = "start" | "questions" | "end";

type PreviewSettings = {
  accessType: "public" | "unlisted" | "password_protected";
  collectEmail: boolean;
  formLayout: "vertical" | "conversational";
  navbar: { showBranding: false } | { showBranding: true; logoUrl: string; brandName: string };
  progressBar: { enabled: false } | { enabled: true; style: "bar" | "steps" | "percentage" };
  removeWatermark: boolean;
  redirectOnComplete?: { url: string; label: string } | null;
};


// ─── Theme / font helpers ─────────────────────────────────────────────────────

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function radiusVal(r?: "sharp" | "rounded" | "pill", fallback?: "sharp" | "rounded" | "pill"): string {
  const v = r ?? fallback ?? "rounded";
  return v === "sharp" ? "0px" : v === "pill" ? "9999px" : "0.625rem";
}

function fontSizePx(size: "sm" | "md" | "lg"): string {
  return size === "sm" ? "14px" : size === "lg" ? "18px" : "16px";
}

function letterSpacingVal(ls: "tight" | "normal" | "wide"): string {
  return ls === "tight" ? "-0.025em" : ls === "wide" ? "0.05em" : "0em";
}

function themeToVars(theme: FormTheme): React.CSSProperties {
  const bg = theme.backgroundColor;
  const fgOnBg = hexLuminance(bg) > 0.5 ? "#1a1a1a" : "#f5f5f5";
  const fgOnPrimary = hexLuminance(theme.primaryColor) > 0.5 ? "#1a1a1a" : "#f5f5f5";
  return {
    "--primary": theme.primaryColor,
    "--primary-foreground": fgOnPrimary,
    "--background": bg,
    "--foreground": fgOnBg,
    "--muted-foreground": hexLuminance(bg) > 0.5 ? "#666666" : "#999999",
    "--form-label": theme.labelColor ?? fgOnBg,
    "--form-placeholder": theme.placeholderColor ?? (hexLuminance(bg) > 0.5 ? "#9CA3AF" : "#4B5563"),
    "--form-input-bg": theme.inputBackgroundColor ?? bg,
    "--form-input-border": theme.inputBorderColor ?? (hexLuminance(bg) > 0.5 ? "#D1D5DB" : "#374151"),
    "--form-input-text": theme.inputTextColor ?? fgOnBg,
    "--form-choice-bg": theme.choiceColor ?? bg,
    "--form-choice-selected": theme.choiceSelectedColor ?? theme.primaryColor + "22",
    "--form-star": theme.starColor ?? theme.primaryColor,
    "--form-btn-radius": radiusVal(theme.buttonRadius, theme.borderRadius),
    "--form-input-radius": radiusVal(theme.inputRadius, theme.borderRadius),
  } as React.CSSProperties;
}

function defaultPageBg(cardBg: string): string {
  const h = cardBg.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = hexLuminance(cardBg);
  const shift = lum > 0.5 ? -22 : 18;
  const clamp = (v: number) => Math.max(0, Math.min(255, v + shift));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function inputCls(hasError: boolean): React.CSSProperties {
  return {
    backgroundColor: "var(--form-input-bg)",
    borderColor: hasError ? "#ef4444" : "var(--form-input-border)",
    color: "var(--form-input-text)",
    borderRadius: "var(--form-input-radius)",
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "inherit",
  };
}

// ─── Canvas animation ─────────────────────────────────────────────────────────

function EndAnimation({ type }: { type: EndPageAnimation }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (type === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    const COLORS = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#277da1","#9b5de5","#f15bb5","#ff6b6b"];
    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      alpha: number; size: number; color: string;
      rotation?: number; vr?: number; phase?: number;
    };

    let particles: Particle[] = [];
    let alive = true;
    const startTime = Date.now();
    const ACTIVE_MS = 3000;
    const TOTAL_MS = 5000;

    if (type === "confetti") {
      for (let i = 0; i < 130; i++) {
        particles.push({
          x: rand(0, W), y: rand(-H * 0.6, 0),
          vx: rand(-1.5, 1.5), vy: rand(2, 5),
          alpha: 1, size: rand(6, 13), color: pick(COLORS),
          rotation: rand(0, Math.PI * 2), vr: rand(-0.12, 0.12),
        });
      }
    } else if (type === "fireworks") {
      const spawnBurst = (cx: number, cy: number) => {
        const color = pick(COLORS);
        for (let i = 0; i < 36; i++) {
          const angle = (i / 36) * Math.PI * 2;
          const speed = rand(3, 9);
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1, size: rand(3, 6), color,
          });
        }
      };
      spawnBurst(rand(W * 0.2, W * 0.8), rand(H * 0.15, H * 0.5));
      setTimeout(() => spawnBurst(rand(W * 0.2, W * 0.8), rand(H * 0.15, H * 0.5)), 800);
      setTimeout(() => spawnBurst(rand(W * 0.2, W * 0.8), rand(H * 0.15, H * 0.5)), 1600);
      setTimeout(() => spawnBurst(rand(W * 0.2, W * 0.8), rand(H * 0.15, H * 0.5)), 2400);
    } else if (type === "balloons") {
      for (let i = 0; i < 28; i++) {
        particles.push({
          x: rand(0, W), y: H + rand(20, 150),
          vx: 0, vy: -rand(1.5, 3.5),
          alpha: 1, size: rand(22, 50), color: pick(COLORS),
          phase: rand(0, Math.PI * 2),
        });
      }
    }

    function animate() {
      if (!alive) return;
      ctx!.clearRect(0, 0, W, H);
      const elapsed = Date.now() - startTime;

      if (type === "confetti" && elapsed < ACTIVE_MS && Math.random() < 0.25) {
        particles.push({
          x: rand(0, W), y: -10,
          vx: rand(-1, 1), vy: rand(2, 4.5),
          alpha: 1, size: rand(6, 13), color: pick(COLORS),
          rotation: rand(0, Math.PI * 2), vr: rand(-0.12, 0.12),
        });
      }

      particles = particles.filter((p) => p.alpha > 0.01);

      for (const p of particles) {
        ctx!.save();
        ctx!.globalAlpha = p.alpha;

        if (type === "confetti") {
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rotation!);
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.06;
          p.rotation! += p.vr!;
          if (elapsed > ACTIVE_MS && p.y > H) p.alpha -= 0.05;
          if (p.y > H + 20) p.alpha -= 0.08;
        } else if (type === "fireworks") {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.fill();
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha -= 0.013;
        } else if (type === "balloons") {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = p.color + "cc";
          ctx!.fill();
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y + p.size);
          const sway = Math.sin(p.phase! + Date.now() / 800) * 4;
          ctx!.lineTo(p.x + sway, p.y + p.size + 22);
          ctx!.strokeStyle = p.color + "88";
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
          p.phase! += 0.025;
          p.x += Math.sin(p.phase! * 0.6) * 0.4;
          p.y += p.vy;
          if (p.y < -p.size * 2) p.alpha -= 0.04;
        }

        ctx!.restore();
      }

      if (elapsed < TOTAL_MS || particles.length > 0) {
        requestAnimationFrame(animate);
      }
    }

    animate();
    const t = setTimeout(() => { alive = false; }, TOTAL_MS + 500);
    return () => { alive = false; clearTimeout(t); };
  }, [type]);

  if (type === "none") return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavbarBand({
  settings, pageBg, pageFg,
}: {
  settings: PreviewSettings; pageBg: string; pageFg: string;
}) {
  const navbar = settings.navbar;
  const borderColor = pageFg + "18";

  if (navbar.showBranding) {
    return (
      <div
        className="shrink-0 flex items-center gap-3 px-5 h-12 border-b"
        style={{ backgroundColor: pageBg, borderColor }}
      >
        {navbar.logoUrl && (
          <img src={navbar.logoUrl} alt={navbar.brandName} className="h-7 w-auto object-contain" />
        )}
        <span className="text-sm font-semibold" style={{ color: pageFg }}>
          {navbar.brandName}
        </span>
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-5 h-12 border-b"
      style={{ backgroundColor: pageBg, borderColor }}
    >
      <img
        src="/logo.svg"
        alt="Flowform"
        className="h-6 w-auto"
        style={{ filter: hexLuminance(pageBg) > 0.5 ? "none" : "brightness(0) invert(1)", opacity: 0.7 }}
      />
      <span className="text-sm font-semibold" style={{ color: pageFg, opacity: 0.7 }}>Flowform</span>
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function ProgressIndicator({
  settings, pageIndex, totalPages, pageFg,
}: {
  settings: PreviewSettings; pageIndex: number; totalPages: number; pageFg: string;
}) {
  if (!settings.progressBar.enabled || totalPages === 0) return null;
  const style = settings.progressBar.style;
  const pct = Math.round(((pageIndex + 1) / totalPages) * 100);
  const trackBg = pageFg + "20";

  if (style === "steps") {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === pageIndex ? "22px" : "8px",
              height: "8px",
              backgroundColor: i <= pageIndex ? "var(--primary)" : trackBg,
            }}
          />
        ))}
      </div>
    );
  }

  if (style === "percentage") {
    return (
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold tabular-nums" style={{ color: pageFg, opacity: 0.7 }}>
          {pct}%
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: trackBg, minWidth: "60px" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
          />
        </div>
      </div>
    );
  }

  // bar (default)
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: trackBg }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
      />
    </div>
  );
}

// ─── Interactive field (all 12 question types) ────────────────────────────────

function InteractiveField({
  question, value, onChange, hasError,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  hasError: boolean;
}) {
  const placeholder = question.placeholder ?? undefined;
  const style = inputCls(hasError);
  const commonCls = "w-full border outline-none transition-colors";
  const inputCls2 = `${commonCls} h-10 px-3 text-sm`;

  switch (question.type) {
    case "short_text":
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Short answer"}
          style={style}
          className={inputCls2}
          maxLength={question.config?.maxLength}
        />
      );

    case "long_text":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Your answer…"}
          rows={4}
          style={style}
          className={`${commonCls} px-3 py-2.5 text-sm resize-none`}
          maxLength={question.config?.maxLength}
        />
      );

    case "email":
      return (
        <input
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "name@email.com"}
          style={style}
          className={inputCls2}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={placeholder ?? "0"}
          min={question.config?.min}
          max={question.config?.max}
          style={style}
          className={inputCls2}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "+1 555 000 0000"}
          style={style}
          className={inputCls2}
        />
      );

    case "url":
      return (
        <input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "https://example.com"}
          style={style}
          className={inputCls2}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={style}
          className={inputCls2}
        />
      );

    case "select":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          style={style}
          className={`${inputCls2} appearance-none cursor-pointer`}
        >
          <option value="" style={{ color: "var(--form-placeholder)" }}>
            {placeholder ?? "Select an option…"}
          </option>
          {(question.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      );

    case "radio": {
      const selected = value as string | null;
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(isSelected ? null : opt.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 border transition-colors text-left w-full"
                style={{
                  backgroundColor: isSelected ? "var(--form-choice-selected)" : "var(--form-choice-bg)",
                  borderColor: isSelected ? "var(--primary)" : hasError ? "#ef4444" : "var(--form-input-border)",
                  borderRadius: "var(--form-input-radius)",
                  color: "var(--form-label)",
                }}
              >
                <div
                  className="size-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? "var(--primary)" : "var(--form-input-border)",
                    backgroundColor: isSelected ? "var(--primary)" : "transparent",
                  }}
                >
                  {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "checkbox": {
      const selected = (value as string[] | null) ?? [];
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => {
            const isChecked = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const next = isChecked
                    ? selected.filter((v) => v !== opt.id)
                    : [...selected, opt.id];
                  onChange(next);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 border transition-colors text-left w-full"
                style={{
                  backgroundColor: isChecked ? "var(--form-choice-selected)" : "var(--form-choice-bg)",
                  borderColor: isChecked ? "var(--primary)" : hasError ? "#ef4444" : "var(--form-input-border)",
                  borderRadius: "var(--form-input-radius)",
                  color: "var(--form-label)",
                }}
              >
                <div
                  className="size-4 rounded shrink-0 border-2 flex items-center justify-center"
                  style={{
                    borderColor: isChecked ? "var(--primary)" : "var(--form-input-border)",
                    backgroundColor: isChecked ? "var(--primary)" : "transparent",
                  }}
                >
                  {isChecked && (
                    <svg viewBox="0 0 10 8" className="size-2.5 fill-white">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "rating": {
      const scale = question.config?.scale ?? 5;
      const current = (value as number | null) ?? 0;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: scale }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1 === current ? null : i + 1)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className="size-7"
                style={{
                  color: "var(--form-star)",
                  fill: i < current ? "var(--form-star)" : "transparent",
                  opacity: i < current ? 1 : 0.3,
                }}
              />
            </button>
          ))}
        </div>
      );
    }

    case "yes_no": {
      const val = value as boolean | null;
      return (
        <div className="flex gap-3">
          {(["Yes", "No"] as const).map((label) => {
            const isYes = label === "Yes";
            const isSelected = val === isYes;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(isSelected ? null : isYes)}
                className="flex-1 py-3 text-sm font-semibold border-2 transition-colors"
                style={{
                  borderColor: isSelected ? "var(--primary)" : hasError ? "#ef4444" : "var(--form-input-border)",
                  backgroundColor: isSelected ? "var(--primary)" : "var(--form-input-bg)",
                  color: isSelected ? "var(--primary-foreground)" : "var(--form-label)",
                  borderRadius: "var(--form-input-radius)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({
  title, pageBg, pageFg, themeVars, fontFamily, onVerified,
}: {
  title: string; pageBg: string; pageFg: string;
  themeVars: React.CSSProperties; fontFamily: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!code.trim()) {
      setError("Please enter the access code.");
      return;
    }
    onVerified();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: pageBg, fontFamily }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-xl p-8 flex flex-col items-center gap-5"
        style={{ ...themeVars, backgroundColor: "var(--background)", borderColor: "var(--form-input-border)" }}
      >
        <div
          className="size-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--primary)" + "20" }}
        >
          <Lock className="size-6" style={{ color: "var(--primary)" }} />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--form-label)" }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            This form is password protected. Enter the access code to continue.
          </p>
        </div>

        <div className="w-full space-y-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="ACCESS CODE"
            maxLength={15}
            className="w-full h-11 px-4 border text-sm font-mono tracking-widest outline-none transition-colors"
            style={{
              ...inputCls(!!error),
              borderRadius: "var(--form-input-radius)",
            }}
          />
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            borderRadius: "var(--form-btn-radius)",
          }}
        >
          Continue
        </button>

        <p className="text-[11px] text-center" style={{ color: pageFg, opacity: 0.45 }}>
          Preview mode · any access code is accepted
        </p>
      </div>
    </div>
  );
}

// ─── Watermark ────────────────────────────────────────────────────────────────

function WatermarkFooter({ pageFg, pageBg }: { pageFg: string; pageBg: string }) {
  return (
    <div className="shrink-0 flex items-center justify-center gap-1.5 py-3">
      <img
        src="/logo.svg"
        alt="Flowform"
        className="h-3.5 w-auto"
        style={{ filter: hexLuminance(pageBg) > 0.5 ? "none" : "brightness(0) invert(1)", opacity: 0.5 }}
      />
      <span className="text-xs" style={{ color: pageFg, opacity: 0.5 }}>Powered by Flowform</span>
    </div>
  );
}

// ─── Vertical layout nav ──────────────────────────────────────────────────────

function VerticalNavActions({
  settings, pages, pageIndex, view, isLastPage, pageFg,
  onPrev, onNext, onRestart, prevDisabled,
}: {
  settings: PreviewSettings;
  pages: FormContent["pages"];
  pageIndex: number;
  view: ViewState;
  isLastPage: boolean;
  pageFg: string;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  prevDisabled: boolean;
}) {
  if (view === "end") {
    return (
      <div className="flex items-center justify-end mt-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: pageFg, opacity: 0.6 }}
        >
          <RotateCcw className="size-3" />
          Restart preview
        </button>
      </div>
    );
  }

  if (view !== "questions") return null;

  return (
    <div className="mt-3 space-y-2">
      {settings.progressBar.enabled && pages.length > 0 && (
        <ProgressIndicator
          settings={settings}
          pageIndex={pageIndex}
          totalPages={pages.length}
          pageFg={pageFg}
        />
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          className="flex items-center gap-1 text-xs font-semibold border px-3 py-1.5 rounded-md transition-opacity hover:opacity-70 disabled:opacity-30 shrink-0"
          style={{ borderColor: pageFg, color: pageFg }}
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-md transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {isLastPage ? "Submit" : (<>Next <ChevronRight className="size-3.5" /></>)}
        </button>
      </div>
    </div>
  );
}

// ─── Conversational question page ─────────────────────────────────────────────

function ConvQuestionPage({
  currentPage, pageIndex, pagesLength, conversationalQuestion,
  answers, errors, prevDisabled, showNextButton, isLastPage,
  theme, settings, pageFg, onPrev, onNext, onAnswer,
}: {
  currentPage: FormContent["pages"][number] | undefined;
  pageIndex: number;
  pagesLength: number;
  conversationalQuestion: Question | undefined;
  answers: Answers;
  errors: Errors;
  prevDisabled: boolean;
  showNextButton: boolean;
  isLastPage: boolean;
  theme: FormTheme;
  settings: PreviewSettings;
  pageFg: string;
  onPrev: () => void;
  onNext: () => void;
  onAnswer: (id: string, v: AnswerValue, type: Question["type"]) => void;
}) {
  const imagePosition = currentPage?.imagePosition ?? "left";
  const cardBg = theme.backgroundColor;

  function ImageSlot({ className }: { className?: string }) {
    return (
      <div className={className}>
        {currentPage?.coverImage ? (
          <img src={currentPage.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: theme.primaryColor + "15" }}
          >
            <ImageIcon className="size-8 opacity-30" style={{ color: theme.primaryColor }} />
            <p className="text-xs text-center px-4 opacity-40" style={{ color: "var(--form-label)" }}>
              No cover image
            </p>
          </div>
        )}
      </div>
    );
  }

  function QuestionContent() {
    return (
      <>
        {settings.progressBar.enabled && (
          <div className="mb-4">
            <ProgressIndicator
              settings={settings}
              pageIndex={pageIndex}
              totalPages={pagesLength}
              pageFg={pageFg}
            />
          </div>
        )}
        <p className="text-xs font-bold mb-3" style={{ color: "var(--primary)", opacity: 0.7 }}>
          {pageIndex + 1} / {pagesLength}
        </p>
        {conversationalQuestion ? (
          <div id={`q-${conversationalQuestion.id}`}>
            <label className="text-xl font-bold mb-1 block leading-snug" style={{ color: "var(--form-label)" }}>
              {conversationalQuestion.label || "Untitled question"}
              {conversationalQuestion.required && (
                <span style={{ color: "var(--primary)" }} className="ml-0.5">*</span>
              )}
            </label>
            {conversationalQuestion.placeholder && conversationalQuestion.type !== "short_text" && conversationalQuestion.type !== "long_text" && (
              <p className="text-sm mb-3 mt-1" style={{ color: "var(--muted-foreground)" }}>
                {conversationalQuestion.placeholder}
              </p>
            )}
            <div className="mt-3">
              <InteractiveField
                question={conversationalQuestion}
                value={answers[conversationalQuestion.id] ?? null}
                onChange={(v) => onAnswer(conversationalQuestion.id, v, conversationalQuestion.type)}
                hasError={!!errors[conversationalQuestion.id]}
              />
            </div>
            {errors[conversationalQuestion.id] && (
              <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>
                {errors[conversationalQuestion.id]}
              </p>
            )}
            {(conversationalQuestion.type === "radio" || conversationalQuestion.type === "rating" || conversationalQuestion.type === "yes_no") && (
              <p className="mt-3 text-xs opacity-50" style={{ color: "var(--muted-foreground)" }}>
                Advances automatically on selection
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No question on this page.</p>
        )}
      </>
    );
  }

  function NavButtons({ borderTop = false }: { borderTop?: boolean }) {
    return (
      <div
        className={`flex items-center justify-between ${borderTop ? "pt-4 border-t" : ""}`}
        style={borderTop ? { borderColor: "var(--form-input-border)" } : {}}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border disabled:opacity-30 transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--form-input-border)", color: "var(--form-label)", borderRadius: "var(--form-btn-radius)" }}
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        {showNextButton && (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}
          >
            {isLastPage ? "Submit" : (<>Next <ChevronRight className="size-4" /></>)}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: image top, question bottom */}
      <div className="md:hidden flex flex-col h-full ff-card-enter">
        {ImageSlot({ className: "relative h-1/2 shrink-0 overflow-hidden" })}
        <div className="relative h-1/2 overflow-hidden flex flex-col">
          <div className="absolute inset-0 overflow-y-auto px-5 flex flex-col">
            <div className="my-auto py-4 pb-24">
              {QuestionContent()}
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-12"
            style={{ background: `linear-gradient(to bottom, transparent, ${cardBg} 40%)` }}
          >
            {NavButtons({})}
          </div>
        </div>
      </div>

      {/* Desktop: two columns */}
      <div className="hidden md:flex flex-row h-full ff-card-enter">
        {imagePosition === "left" && (
          ImageSlot({ className: "relative w-[45%] shrink-0 overflow-hidden" })
        )}
        <div className="flex-1 flex flex-col p-8 xl:p-10 overflow-y-auto min-w-0">
          <div className="flex-1 flex flex-col justify-center">
            {QuestionContent()}
          </div>
          <div className="shrink-0 mt-4">
            {NavButtons({ borderTop: true })}
          </div>
        </div>
        {imagePosition === "right" && (
          ImageSlot({ className: "relative w-[45%] shrink-0 overflow-hidden" })
        )}
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FormPreviewPage() {
  const { formId } = useParams<{ formId: string }>();
  const { data, isLoading, isError } = usePreviewForm(formId ?? "");

  const [view, setView] = useState<ViewState>("start");
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Errors>({});
  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine initial view when data loads
  useEffect(() => {
    if (!data?.content) return;
    const content = data.content as FormContent;
    if (!content.startPage?.heading?.trim()) {
      setView("questions");
    }
  }, [data]);

  // Cleanup
  useEffect(() => () => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
  }, []);

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Form not found</p>
          <p className="text-sm text-gray-500">This form doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const theme = data.theme as FormTheme;
  const font = data.font as FormFont;
  const settings = data.settings as PreviewSettings;
  const content = (data.content ?? null) as FormContent | null;

  const pages = content?.pages ?? [];
  const isConversational = settings.formLayout === "conversational";
  const themeVars = themeToVars(theme);
  const pageBg = theme.pageBackgroundColor ?? defaultPageBg(theme.backgroundColor);
  const pageFg = hexLuminance(pageBg) > 0.5 ? "#1a1a1a" : "#f0f0f0";
  const fontFamily = font.fontFamily;
  const googleFontSlug = fontFamily.replace(/\s+/g, "+");

  const currentPage = pages[pageIndex];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === pages.length - 1;
  const prevDisabled = isFirstPage && !content?.startPage?.heading?.trim();
  const hasStartPage = !!(content?.startPage?.heading?.trim());

  const rootStyle: React.CSSProperties = {
    fontFamily,
    fontSize: fontSizePx(font.fontSize),
    letterSpacing: letterSpacingVal(font.letterSpacing),
    ...(theme.backgroundImage
      ? { backgroundImage: `url(${theme.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {}),
  };

  // Conversational: first question per page
  const AUTO_ADVANCE_TYPES = new Set<Question["type"]>(["radio", "rating", "yes_no"]);
  const conversationalQuestion = currentPage?.questions[0];
  const convType = conversationalQuestion?.type;
  const showConvNextButton =
    isConversational &&
    view === "questions" &&
    !!conversationalQuestion &&
    !AUTO_ADVANCE_TYPES.has(convType!);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateCurrentPage(): boolean {
    if (!currentPage) return true;
    const newErrors: Errors = {};

    for (const q of currentPage.questions) {
      const ans = answers[q.id];
      const isEmpty =
        ans === null ||
        ans === undefined ||
        (typeof ans === "string" && ans.trim() === "") ||
        (Array.isArray(ans) && ans.length === 0);

      if (q.required && isEmpty) {
        newErrors[q.id] = "This field is required";
        continue;
      }
      if (isEmpty) continue;

      if (q.type === "email" && typeof ans === "string") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim()))
          newErrors[q.id] = "Please enter a valid email address";
      }
      if (q.type === "number" && typeof ans === "number") {
        if (q.config?.min !== undefined && ans < q.config.min)
          newErrors[q.id] = `Minimum value is ${q.config.min}`;
        else if (q.config?.max !== undefined && ans > q.config.max)
          newErrors[q.id] = `Maximum value is ${q.config.max}`;
      }
      if ((q.type === "short_text" || q.type === "long_text") && typeof ans === "string" && q.config?.maxLength) {
        if (ans.length > q.config.maxLength)
          newErrors[q.id] = `Maximum ${q.config.maxLength} characters`;
      }
      if (q.type === "url" && typeof ans === "string") {
        try { new URL(ans.trim()); } catch { newErrors[q.id] = "Please enter a valid URL"; }
      }
    }

    setErrors(newErrors);
    const firstId = Object.keys(newErrors)[0];
    if (firstId) {
      setTimeout(() => {
        document.getElementById(`q-${firstId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
    return Object.keys(newErrors).length === 0;
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStart() {
    if (settings.collectEmail) {
      const trimmed = emailValue.trim();
      if (!trimmed) { setEmailError("Email is required."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError("Please enter a valid email."); return; }
      setEmailError("");
    }
    setView(pages.length === 0 ? "end" : "questions");
    setPageIndex(0);
    if (pages.length === 0) setAnimationKey((k) => k + 1);
  }

  function handleRestart() {
    setAnswers({});
    setErrors({});
    setEmailValue("");
    setEmailError("");
    setPageIndex(0);
    setView(hasStartPage ? "start" : "questions");
  }

  function advanceForward() {
    if (isLastPage) {
      setView("end");
      setAnimationKey((k) => k + 1);
    } else {
      setPageIndex((p) => p + 1);
      setErrors({});
    }
  }

  function handleNext() {
    if (!validateCurrentPage()) return;
    advanceForward();
  }

  function handlePrev() {
    if (!isFirstPage) {
      setPageIndex((p) => p - 1);
      setErrors({});
    } else if (hasStartPage) {
      setView("start");
      setErrors({});
    }
  }

  function setAnswer(questionId: string, val: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
    if (errors[questionId]) {
      setErrors((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
    }
  }

  function setAnswerWithAutoAdvance(questionId: string, val: AnswerValue, type: Question["type"]) {
    setAnswer(questionId, val);
    if (isConversational && AUTO_ADVANCE_TYPES.has(type) && val !== null) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        advanceForward();
      }, 450);
    }
  }

  // ── Password gate ───────────────────────────────────────────────────────────

  const needsPassword = settings.accessType === "password_protected" && !passwordVerified;
  if (needsPassword) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${googleFontSlug}:wght@400;500;600;700&display=swap');`}</style>
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-950 text-xs font-semibold text-center py-1.5 select-none">
          Preview Mode · Responses will not be saved
        </div>
        <div className="pt-8">
          <PasswordGate
            title={data.title}
            pageBg={pageBg}
            pageFg={pageFg}
            themeVars={themeVars}
            fontFamily={fontFamily}
            onVerified={() => setPasswordVerified(true)}
          />
        </div>
      </>
    );
  }

  // ── No content ──────────────────────────────────────────────────────────────

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Form not set up yet</p>
          <p className="text-sm text-gray-500">Open the editor and add some questions to preview.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── CONVERSATIONAL LAYOUT ──────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  if (isConversational) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=${googleFontSlug}:wght@400;500;600;700&display=swap');
          @keyframes ff-card-enter { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
          .ff-card-enter { animation: ff-card-enter 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
        `}</style>

        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-950 text-xs font-semibold text-center py-1.5 select-none">
          Preview Mode · Responses will not be saved
        </div>

        {view === "end" && <EndAnimation key={animationKey} type={content.endPage?.animation ?? "none"} />}

        <div className="h-dvh flex flex-col pt-8" style={{ ...rootStyle, backgroundColor: pageBg }}>
          {/* Navbar — desktop */}
          <div className="hidden md:block">
            <NavbarBand settings={settings} pageBg={pageBg} pageFg={pageFg} />
          </div>

          <div className="flex-1 flex flex-col min-h-0 md:items-center md:justify-center md:px-4 md:py-6 md:gap-3">
            {/* Card */}
            <div
              className="flex-1 w-full md:flex-none md:max-w-4xl md:rounded-2xl md:h-[560px] overflow-hidden shadow-xl flex flex-col"
              style={{ ...themeVars, backgroundColor: theme.backgroundColor }}
              key={`${view}-${pageIndex}`}
            >
              {/* Start page */}
              {view === "start" && hasStartPage && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16 px-8 text-center ff-card-enter">
                  <div className="size-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "20" }}>
                    <PlayCircle className="size-7" style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold" style={{ color: "var(--form-label)" }}>
                      {content.startPage.heading}
                    </h1>
                    {content.startPage.description && (
                      <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
                        {content.startPage.description}
                      </p>
                    )}
                  </div>
                  {settings.collectEmail && (
                    <div className="w-full max-w-xs space-y-1.5">
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => { setEmailValue(e.target.value); setEmailError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleStart()}
                        placeholder="your@email.com"
                        className="w-full h-10 px-3 border text-sm outline-none transition-colors text-center"
                        style={inputCls(!!emailError)}
                      />
                      {emailError && <p className="text-xs" style={{ color: "#ef4444" }}>{emailError}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStart}
                    className="px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}
                  >
                    {content.startPage.buttonLabel || "Start"}
                  </button>
                </div>
              )}

              {/* End page */}
              {view === "end" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16 px-8 text-center ff-card-enter">
                  <div className="size-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "20" }}>
                    <Flag className="size-7" style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold" style={{ color: "var(--form-label)" }}>
                      {content.endPage?.heading || "Thank you!"}
                    </h2>
                    {content.endPage?.message && (
                      <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
                        {content.endPage.message}
                      </p>
                    )}
                  </div>
                  {settings.redirectOnComplete && (
                    <a
                      href={settings.redirectOnComplete.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}
                    >
                      <ExternalLink className="size-4" />
                      {settings.redirectOnComplete.label || "Visit our website"}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                    style={{ color: "var(--primary)" }}
                  >
                    <RotateCcw className="size-4" />
                    Restart preview
                  </button>
                </div>
              )}

              {/* Questions */}
              {view === "questions" && (
                <ConvQuestionPage
                  key={`q-${pageIndex}`}
                  currentPage={currentPage}
                  pageIndex={pageIndex}
                  pagesLength={pages.length}
                  conversationalQuestion={conversationalQuestion}
                  answers={answers}
                  errors={errors}
                  prevDisabled={prevDisabled}
                  showNextButton={showConvNextButton}
                  isLastPage={isLastPage}
                  theme={theme}
                  settings={settings}
                  pageFg={pageFg}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onAnswer={setAnswerWithAutoAdvance}
                />
              )}
            </div>
          </div>

          {!settings.removeWatermark && (
            <div className="hidden md:flex shrink-0 items-center justify-center gap-1.5 py-3">
              <img
                src="/logo.svg"
                alt="Flowform"
                className="h-3.5 w-auto"
                style={{ filter: hexLuminance(pageBg) > 0.5 ? "none" : "brightness(0) invert(1)", opacity: 0.5 }}
              />
              <span className="text-xs" style={{ color: pageFg, opacity: 0.5 }}>Powered by Flowform</span>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── VERTICAL LAYOUT ───────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${googleFontSlug}:wght@400;500;600;700&display=swap');
        @keyframes ff-enter { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .ff-enter { animation: ff-enter 0.28s cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-950 text-xs font-semibold text-center py-1.5 select-none">
        Preview Mode · Responses will not be saved
      </div>

      {view === "end" && <EndAnimation key={animationKey} type={content.endPage?.animation ?? "none"} />}

      <div className="min-h-screen flex flex-col pt-8" style={{ ...rootStyle, backgroundColor: pageBg }}>
        <NavbarBand settings={settings} pageBg={pageBg} pageFg={pageFg} />

        <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-6">
          <div className="w-full max-w-[560px] flex flex-col" style={themeVars}>

            {/* Form card */}
            <div
              className="w-full rounded-xl border shadow-md overflow-hidden"
              style={{ backgroundColor: theme.backgroundColor, borderColor: "var(--form-input-border)" }}
            >
              <div key={`${view}-${pageIndex}`} className="ff-enter">

                {/* Start page */}
                {view === "start" && hasStartPage && (
                  <div className="flex flex-col items-center gap-6 py-16 text-center px-6">
                    <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "15" }}>
                      <PlayCircle className="size-6" style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold" style={{ color: "var(--form-label)" }}>
                        {content.startPage.heading}
                      </h1>
                      {content.startPage.description && (
                        <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
                          {content.startPage.description}
                        </p>
                      )}
                    </div>
                    {settings.collectEmail && (
                      <div className="w-full max-w-xs space-y-1.5">
                        <input
                          type="email"
                          value={emailValue}
                          onChange={(e) => { setEmailValue(e.target.value); setEmailError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleStart()}
                          placeholder="your@email.com"
                          className="w-full h-10 px-3 border text-sm outline-none transition-colors"
                          style={inputCls(!!emailError)}
                        />
                        {emailError && <p className="text-xs text-left" style={{ color: "#ef4444" }}>{emailError}</p>}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleStart}
                      className="px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}
                    >
                      {content.startPage.buttonLabel || "Start"}
                    </button>
                  </div>
                )}

                {/* Questions */}
                {view === "questions" && (
                  <div className="p-6 md:p-8">
                    {!currentPage || currentPage.questions.length === 0 ? (
                      <div className="flex items-center justify-center py-16">
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No questions on this page.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-7">
                        {currentPage.questions.map((question) => (
                          <div key={question.id} id={`q-${question.id}`}>
                            <label className="text-sm font-semibold mb-2.5 block" style={{ color: "var(--form-label)" }}>
                              {question.label || "Untitled question"}
                              {question.required && (
                                <span style={{ color: "var(--primary)" }} className="ml-0.5">*</span>
                              )}
                            </label>
                            <InteractiveField
                              question={question}
                              value={answers[question.id] ?? null}
                              onChange={(v) => setAnswer(question.id, v)}
                              hasError={!!errors[question.id]}
                            />
                            {errors[question.id] && (
                              <p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>
                                {errors[question.id]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* End page */}
                {view === "end" && (
                  <div className="flex flex-col items-center gap-6 py-16 text-center px-6">
                    <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "15" }}>
                      <Flag className="size-6" style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold" style={{ color: "var(--form-label)" }}>
                        {content.endPage?.heading || "Thank you!"}
                      </h2>
                      {content.endPage?.message && (
                        <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
                          {content.endPage.message}
                        </p>
                      )}
                    </div>
                    {settings.redirectOnComplete && (
                      <a
                        href={settings.redirectOnComplete.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--form-btn-radius)" }}
                      >
                        <ExternalLink className="size-4" />
                        {settings.redirectOnComplete.label || "Visit our website"}
                      </a>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Nav below card */}
            <VerticalNavActions
              settings={settings}
              pages={pages}
              pageIndex={pageIndex}
              view={view}
              isLastPage={isLastPage}
              pageFg={pageFg}
              onPrev={handlePrev}
              onNext={handleNext}
              onRestart={handleRestart}
              prevDisabled={prevDisabled}
            />
          </div>
        </div>

        {!settings.removeWatermark && <WatermarkFooter pageFg={pageFg} pageBg={pageBg} />}
      </div>
    </>
  );
}
