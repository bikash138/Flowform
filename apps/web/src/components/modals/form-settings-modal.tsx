"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import {
  useUpdateSettings,
  useFormResponseCount,
  useSetAccessCode,
  useUpdateSlug,
  useCheckSlugAvailable,
  useGetFormLogoUploadUrl,
} from "@/hooks/user/use-form";
import { ImageUploader } from "@/components/common/image-uploader";
import { convertToWebp } from "@/lib/image";
import { toast } from "sonner";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { useParams } from "next/navigation";
import type { FormSettings } from "@flowform/database/modals";
import { PlansModal } from "@/components/modals/plans-modal";
import { ConfirmationEmailModal, type ConfirmationEmailData } from "@/components/modals/confirmation-email-modal";
import {
  MessageSquare,
  Eye,
  BarChart2,
  LayoutTemplate,
  Globe,
  ExternalLink,
  Gem,
  Mail,
  Check,
  X,
  Loader2,
  Lock,
  Globe2,
  Link2,
} from "lucide-react";

interface FormSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = "responses" | "visibility" | "progressBar" | "navbar" | "language";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "it", name: "Italian" },
] as const;

const MAX_LANGUAGES = 5;

// ─── Field validation schemas ──────────────────────────────────────────────────

const redirectUrlSchema = z.url();
const redirectLabelSchema = z.string().max(25, "Max 25 characters");
const brandNameSchema = z.string().min(1, "Brand name is required").max(50, "Max 50 characters");

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "responses",   label: "Responses",    icon: MessageSquare },
  { id: "visibility",  label: "Visibility",   icon: Eye },
  { id: "progressBar", label: "Progress Bar", icon: BarChart2 },
  { id: "navbar",      label: "Navbar",       icon: LayoutTemplate },
  { id: "language",    label: "Language",     icon: Globe },
];

// ─── Locked badge ─────────────────────────────────────────────────────────────

function LockedBadge({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          <Gem className="size-2.5" />
          Upgrade
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        This feature requires a paid plan
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  locked,
  badge,
  children,
}: {
  label: string;
  description?: string;
  locked?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-6 py-3", locked && "opacity-60")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className={cn("shrink-0", locked && "pointer-events-none")}>{children}</div>
    </div>
  );
}

// ─── Access type option ───────────────────────────────────────────────────────

function AccessTypeCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left w-full transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <div className="size-2 rounded-full bg-primary" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium">{label}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function FormSettingsModal({ open, onOpenChange }: FormSettingsModalProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const form = useFormEditorStore((s) => s.form);
  const updateSettingsLocal = useFormEditorStore((s) => s.updateSettings);

  const { mutate: saveSettings, isPending } = useUpdateSettings();
  const { mutate: saveAccessCode } = useSetAccessCode();
  const { mutate: saveSlug, isPending: isSavingSlug } = useUpdateSlug();
  const { mutateAsync: getFormLogoUploadUrl } = useGetFormLogoUploadUrl();
  const { data: plan } = useWorkspacePlan(workspaceId);

  const [activeTab, setActiveTab] = useState<TabId>("responses");
  const [draft, setDraft] = useState<FormSettings | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [navbarLogoFile, setNavbarLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Access code (password-protected) — handled separately from settings
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeChanged, setAccessCodeChanged] = useState(false);

  // Slug — handled via its own endpoint, not the settings save
  const [slugInput, setSlugInput] = useState("");
  const [lastCheckedSlug, setLastCheckedSlug] = useState<string | null>(null);
  const { data: slugCheck, isFetching: isCheckingSlug, refetch: runSlugCheck } = useCheckSlugAvailable(
    workspaceId,
    slugInput.trim(),
    form?.id ?? undefined,
    false,
  );

  const features = plan?.features;
  const planId = plan?.planId ?? "FREE";
  const planResponseLimit = plan?.features.monthlyResponseLimit ?? 100;

  const { data: responseCountData } = useFormResponseCount(form?.id ?? "", workspaceId);

  // Tanstack form for fields requiring Zod validation
  const validationForm = useForm({
    defaultValues: { redirectUrl: "", redirectLabel: "", brandName: "" },
    onSubmit: async () => { await handleSave(); },
  });

  useEffect(() => {
    if (open && form?.settings) {
      const newDraft = structuredClone(form.settings);
      setDraft(newDraft);
      setSlugInput(form.slug ?? "");
      setLastCheckedSlug(null);
      setAccessCode("");
      setAccessCodeChanged(false);
      setNavbarLogoFile(null);
      validationForm.reset(
        {
          redirectUrl: newDraft.redirectOnComplete?.url ?? "",
          redirectLabel: newDraft.redirectOnComplete?.label ?? "",
          brandName: newDraft.navbar.showBranding ? newDraft.navbar.brandName : "",
        },
      );
    }
  }, [open, form?.settings, form?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <Dialog open={open} onOpenChange={onOpenChange} />;

  function set<K extends keyof FormSettings>(key: K, value: FormSettings[K]) {
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function setNested<K extends "progressBar">(
    section: K,
    key: keyof FormSettings[K],
    value: unknown,
  ) {
    setDraft((prev) =>
      prev
        ? { ...prev, [section]: { ...(prev[section] as object), [key]: value } }
        : prev,
    );
  }

  async function handleSave() {
    if (!draft) return;

    let finalDraft = draft;

    // Trim validated text fields before saving
    if (finalDraft.redirectOnComplete) {
      finalDraft = {
        ...finalDraft,
        redirectOnComplete: {
          url: validationForm.state.values.redirectUrl.trim(),
          label: validationForm.state.values.redirectLabel.trim(),
        },
      };
    }

    if (navbarLogoFile && draft.navbar.showBranding) {
      setIsUploadingLogo(true);
      try {
        const { uploadUrl, publicUrl } = await getFormLogoUploadUrl({ formId: form!.id, workspaceId });
        const webpBlob = await convertToWebp(navbarLogoFile);
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: webpBlob,
          headers: { "Content-Type": "image/webp" },
        });
        if (!uploadRes.ok) {
          toast.error("Logo upload failed. Please try again.");
          return;
        }
        finalDraft = {
          ...finalDraft,
          navbar: { ...finalDraft.navbar, logoUrl: publicUrl },
        };
        setNavbarLogoFile(null);
      } catch {
        toast.error("Failed to process logo.");
        return;
      } finally {
        setIsUploadingLogo(false);
      }
    }

    updateSettingsLocal(finalDraft);
    saveSettings({ formId: form!.id, workspaceId, settings: finalDraft });
    if (finalDraft.accessType === "password_protected" && accessCodeChanged && accessCode.trim()) {
      saveAccessCode({ formId: form!.id, workspaceId, accessCode: accessCode.trim() });
    }
    onOpenChange(false);
  }

  // ─── Slug helpers ─────────────────────────────────────────────────────────

  const slugTrimmed = slugInput.trim();
  const slugRegex = /^[a-z0-9-]+$/;
  const isSlugValid =
    slugTrimmed.length === 0 ||
    (slugTrimmed.length >= 3 && slugTrimmed.length <= 60 && slugRegex.test(slugTrimmed));
  const isSlugChecked = lastCheckedSlug === slugTrimmed && slugTrimmed.length > 0;
  const slugAvailable = isSlugChecked && slugCheck?.available === true;
  const slugTaken = isSlugChecked && slugCheck?.available === false;
  const slugChanged = slugTrimmed !== (form.slug ?? "");

  function handleCheckSlug() {
    setLastCheckedSlug(slugTrimmed);
    runSlugCheck();
  }

  function handleSaveSlug() {
    saveSlug({ formId: form!.id, workspaceId, slug: slugTrimmed || null });
  }

  if (!draft) return <Dialog open={open} onOpenChange={onOpenChange} />;

  // ─── Navbar helpers ───────────────────────────────────────────────────────

  const navbarOn = draft.navbar.showBranding;
  const navbarLogoUrl = draft.navbar.showBranding ? draft.navbar.logoUrl : "";
  const navbarBrandName = draft.navbar.showBranding ? draft.navbar.brandName : "";

  function setNavbarOn(enabled: boolean) {
    set("navbar", enabled
      ? { showBranding: true, logoUrl: navbarLogoUrl, brandName: navbarBrandName }
      : { showBranding: false },
    );
    if (!enabled) validationForm.setFieldValue("brandName", "");
  }
  function setNavbarBrandName(name: string) {
    if (!draft?.navbar.showBranding) return;
    set("navbar", { showBranding: true, logoUrl: navbarLogoUrl, brandName: name });
  }

  // ─── Redirect helpers ─────────────────────────────────────────────────────

  const redirectOn = !!draft.redirectOnComplete;
  const redirectUrl = draft.redirectOnComplete?.url ?? "";
  const redirectLabel = draft.redirectOnComplete?.label ?? "";

  function setRedirectOn(enabled: boolean) {
    set("redirectOnComplete", enabled ? { url: "", label: "Visit our website" } : null);
    if (enabled) {
      validationForm.setFieldValue("redirectUrl", "");
      validationForm.setFieldValue("redirectLabel", "Visit our website");
    }
  }
  function setRedirectUrl(url: string) {
    set("redirectOnComplete", { url, label: redirectLabel });
  }
  function setRedirectLabel(label: string) {
    set("redirectOnComplete", { url: redirectUrl, label });
  }

  // ─── Confirmation email helpers ───────────────────────────────────────────

  const confirmEmailOn = !!draft.confirmationEmail;

  function handleConfirmEmailToggle(enabled: boolean) {
    if (enabled) {
      setConfirmEmailOpen(true);
    } else {
      set("confirmationEmail", undefined);
    }
  }

  function handleConfirmEmailApply(data: ConfirmationEmailData) {
    set("confirmationEmail", data);
  }

  function handleConfirmEmailCancel() {
    // Only clear if there was no previously saved config
    if (!form!.settings.confirmationEmail) {
      set("confirmationEmail", undefined);
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[780px] p-0 gap-0 overflow-hidden h-[520px] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-base font-semibold">Form Settings</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left nav */}
            <aside className="w-44 shrink-0 border-r border-border bg-muted/20 py-2 overflow-y-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeTab === id
                      ? "bg-background text-foreground border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </aside>

            {/* Right content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4">

                {/* ── Responses ─────────────────────────────────── */}
                {activeTab === "responses" && (
                  <div className="space-y-1">
                    <SettingRow
                      label="Collect email"
                      description="Ask respondents for their email before submitting"
                    >
                      <Switch
                        checked={draft.collectEmail}
                        onCheckedChange={(v) => set("collectEmail", v)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      label="Response limit"
                      description={
                        responseCountData !== undefined
                          ? `${responseCountData.total} collected — plan max: ${planResponseLimit}`
                          : `Plan max: ${planResponseLimit}`
                      }
                    >
                      <Input
                        type="number"
                        min={1}
                        max={planResponseLimit}
                        value={draft.responseLimit ?? ""}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : 1;
                          set("responseLimit", Math.min(val, planResponseLimit));
                        }}
                        className="h-8 w-28 text-sm"
                        placeholder={String(planResponseLimit)}
                      />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      label="Close after days"
                      description="Days after first publish before the form stops accepting responses"
                      locked={!features?.customCloseDate}
                      badge={!features?.customCloseDate && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={draft.closeAtDays ?? ""}
                          onChange={(e) =>
                            set("closeAtDays", e.target.value ? Math.min(Number(e.target.value), 365) : 10)
                          }
                          className="h-8 w-24 text-sm"
                          placeholder="10"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">days</span>
                      </div>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      label="Confirmation email"
                      description={
                        confirmEmailOn && draft.confirmationEmail
                          ? `Template ${draft.confirmationEmail.templateId} · ${draft.confirmationEmail.subject}`
                          : "Send an automated email to respondents after they submit"
                      }
                      locked={!features?.confirmationEmail}
                      badge={!features?.confirmationEmail && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                    >
                      <div className="flex items-center gap-2">
                        {confirmEmailOn && features?.confirmationEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => setConfirmEmailOpen(true)}
                          >
                            <Mail className="size-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Switch
                          checked={confirmEmailOn}
                          onCheckedChange={handleConfirmEmailToggle}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </SettingRow>
                  </div>
                )}

                {/* ── Visibility ─────────────────────────────────── */}
                {activeTab === "visibility" && (
                  <div className="space-y-4">

                    {/* Access type */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Access type
                      </p>
                      <div className="space-y-2">
                        <AccessTypeCard
                          icon={Globe2}
                          label="Public"
                          description="Anyone with the link can view and submit"
                          selected={draft.accessType === "public"}
                          onClick={() => set("accessType", "public")}
                        />
                        <AccessTypeCard
                          icon={Link2}
                          label="Unlisted"
                          description="Not listed on /explore — only accessible via direct link"
                          selected={draft.accessType === "unlisted"}
                          onClick={() => set("accessType", "unlisted")}
                        />
                        <AccessTypeCard
                          icon={Lock}
                          label="Password protected"
                          description="Requires an access code to view and submit"
                          selected={draft.accessType === "password_protected"}
                          onClick={() => set("accessType", "password_protected")}
                        />
                      </div>

                      {draft.accessType === "password_protected" && (
                        <div className="mt-2 pl-7 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Access code
                          </label>
                          <Input
                            value={accessCode}
                            onChange={(e) => {
                              setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                              setAccessCodeChanged(true);
                            }}
                            className="h-8 w-44 text-sm font-mono tracking-widest"
                            placeholder="e.g. MYCODE123"
                            maxLength={15}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Uppercase letters and numbers only · max 15 characters
                            {form.settings.accessType === "password_protected" && !accessCodeChanged && (
                              <span className="ml-1 text-green-600 dark:text-green-400">· Code already set</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Custom slug */}
                    <div className={cn("space-y-2", !features?.customSlug && "opacity-60")}>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Custom slug
                        </p>
                        {!features?.customSlug && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use a readable URL instead of the form ID. Saves immediately — not bound to the Save button.
                      </p>
                      <div className={cn("space-y-2", !features?.customSlug && "pointer-events-none")}>
                        <div className="flex items-center gap-2">
                          <Input
                            value={slugInput}
                            onChange={(e) => {
                              setSlugInput(e.target.value.toLowerCase());
                              setLastCheckedSlug(null);
                            }}
                            className={cn(
                              "h-8 text-sm flex-1 font-mono",
                              !isSlugValid && slugTrimmed.length > 0 && "border-red-400 focus-visible:ring-red-400",
                            )}
                            placeholder="my-form-slug"
                            maxLength={60}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs shrink-0"
                            onClick={handleCheckSlug}
                            disabled={!isSlugValid || slugTrimmed.length < 3 || isCheckingSlug}
                          >
                            {isCheckingSlug
                              ? <Loader2 className="size-3 animate-spin" />
                              : "Check"
                            }
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs shrink-0"
                            onClick={handleSaveSlug}
                            disabled={
                              isSavingSlug ||
                              !isSlugValid ||
                              !slugChanged ||
                              (slugTrimmed.length > 0 && !slugAvailable)
                            }
                          >
                            {isSavingSlug ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                          </Button>
                        </div>

                        {/* Slug status */}
                        {slugTrimmed.length > 0 && !isSlugValid && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <X className="size-3" />
                            Lowercase letters, numbers and hyphens only · 3–60 characters
                          </p>
                        )}
                        {isSlugChecked && slugAvailable && (
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Check className="size-3" />
                            Available
                          </p>
                        )}
                        {isSlugChecked && slugTaken && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <X className="size-3" />
                            Already taken — try a different slug
                          </p>
                        )}
                        {form.slug && (
                          <p className="text-[10px] text-muted-foreground">
                            Current: <span className="font-mono">{form.slug}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Redirect on completion */}
                    <div className="space-y-1">
                      <SettingRow
                        label="Redirect on completion"
                        description="Send respondents to a URL after they submit"
                        locked={!features?.redirectOnComplete}
                        badge={!features?.redirectOnComplete && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                      >
                        <Switch
                          checked={redirectOn}
                          onCheckedChange={setRedirectOn}
                          className="data-[state=checked]:bg-primary"
                        />
                      </SettingRow>

                      {redirectOn && features?.redirectOnComplete && (
                        <>
                          <Separator />
                          <div className="flex flex-col gap-3 py-3 pl-2">
                            {/* Redirect URL */}
                            <validationForm.Field
                              name="redirectUrl"
                              validators={{
                                onChange: ({ value }) => {
                                  if (!value.trim()) return "URL is required";
                                  return redirectUrlSchema.safeParse(value.trim()).success
                                    ? undefined
                                    : "Enter a valid URL (e.g. https://example.com)";
                                },
                                onSubmit: ({ value }) => {
                                  if (!value.trim()) return "URL is required";
                                  return redirectUrlSchema.safeParse(value.trim()).success
                                    ? undefined
                                    : "Enter a valid URL (e.g. https://example.com)";
                                },
                              }}
                            >
                              {(field) => (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">Redirect URL</label>
                                  <div className="flex items-center gap-2">
                                    <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                                    <Input
                                      value={field.state.value}
                                      onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        setRedirectUrl(e.target.value);
                                      }}
                                      onBlur={field.handleBlur}
                                      className={cn(
                                        "h-8 text-sm flex-1",
                                        field.state.meta.isTouched && field.state.meta.errors.length > 0 && "border-red-400 focus-visible:ring-red-400",
                                      )}
                                      placeholder="https://example.com/thank-you"
                                    />
                                  </div>
                                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                                  )}
                                </div>
                              )}
                            </validationForm.Field>

                            {/* Button label */}
                            <validationForm.Field
                              name="redirectLabel"
                              validators={{
                                onChange: ({ value }) => {
                                  const result = redirectLabelSchema.safeParse(value.trim());
                                  return result.success ? undefined : result.error.issues[0]?.message;
                                },
                                onSubmit: ({ value }) => {
                                  const result = redirectLabelSchema.safeParse(value.trim());
                                  return result.success ? undefined : result.error.issues[0]?.message;
                                },
                              }}
                            >
                              {(field) => (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Button label <span className="text-muted-foreground/60 font-normal">(optional)</span>
                                    </label>
                                    <span className={cn(
                                      "text-[10px]",
                                      field.state.value.length > 25 ? "text-destructive" : "text-muted-foreground",
                                    )}>
                                      {field.state.value.trim().length}/25
                                    </span>
                                  </div>
                                  <Input
                                    value={field.state.value}
                                    onChange={(e) => {
                                      field.handleChange(e.target.value);
                                      setRedirectLabel(e.target.value);
                                    }}
                                    onBlur={field.handleBlur}
                                    className={cn(
                                      "h-8 text-sm",
                                      field.state.meta.isTouched && field.state.meta.errors.length > 0 && "border-red-400 focus-visible:ring-red-400",
                                    )}
                                    placeholder="Visit our website"
                                    maxLength={30}
                                  />
                                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                                  )}
                                </div>
                              )}
                            </validationForm.Field>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Progress Bar ───────────────────────────────── */}
                {activeTab === "progressBar" && (
                  <div className="space-y-1">
                    <SettingRow
                      label="Show progress bar"
                      description="Display navigation and progress to respondents"
                    >
                      <Switch
                        checked={draft.progressBar.enabled}
                        onCheckedChange={(v) => setNested("progressBar", "enabled", v)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </SettingRow>

                    {draft.progressBar.enabled && (
                      <>
                        <Separator />
                        <SettingRow label="Style" description="Visual style of the progress indicator">
                          <Select
                            value={draft.progressBar.style}
                            onValueChange={(v) => setNested("progressBar", "style", v)}
                          >
                            <SelectTrigger className="h-8 w-36 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="steps">Steps</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        </SettingRow>
                      </>
                    )}
                  </div>
                )}

                {/* ── Navbar ─────────────────────────────────────── */}
                {activeTab === "navbar" && (
                  <div className="space-y-1">
                    <SettingRow
                      label="Custom branding"
                      description="Replace Flowform branding with your own logo and name"
                      locked={!features?.customBranding}
                      badge={!features?.customBranding && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                    >
                      <Switch
                        checked={navbarOn}
                        onCheckedChange={setNavbarOn}
                        className="data-[state=checked]:bg-primary"
                      />
                    </SettingRow>

                    <Separator />
                    <SettingRow
                      label="Remove watermark"
                      description='Hide the "Powered by Flowform" footer from your form'
                      locked={!features?.removeWatermark}
                      badge={!features?.removeWatermark && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                    >
                      <Switch
                        checked={draft.removeWatermark}
                        onCheckedChange={(v) => set("removeWatermark", v)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </SettingRow>

                    {navbarOn && features?.customBranding && (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-3 py-3 pl-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Logo</label>
                            <ImageUploader
                              value={navbarLogoUrl || null}
                              selectedFile={navbarLogoFile}
                              onFileSelect={setNavbarLogoFile}
                              hint="PNG, JPG, SVG · max 5 MB · converted to WebP"
                            />
                          </div>
                          <validationForm.Field
                            name="brandName"
                            validators={{
                              onChange: ({ value }) => {
                                const result = brandNameSchema.safeParse(value.trim());
                                return result.success ? undefined : result.error.issues[0]?.message;
                              },
                              onSubmit: ({ value }) => {
                                const result = brandNameSchema.safeParse(value.trim());
                                return result.success ? undefined : result.error.issues[0]?.message;
                              },
                            }}
                          >
                            {(field) => (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Brand name</label>
                                <Input
                                  value={field.state.value}
                                  onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    setNavbarBrandName(e.target.value);
                                  }}
                                  onBlur={field.handleBlur}
                                  className={cn(
                                    "h-8 text-sm",
                                    field.state.meta.isTouched && field.state.meta.errors.length > 0 && "border-red-400 focus-visible:ring-red-400",
                                  )}
                                  placeholder="Your brand"
                                  maxLength={55}
                                />
                                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                  <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                                )}
                              </div>
                            )}
                          </validationForm.Field>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Language ───────────────────────────────────── */}
                {activeTab === "language" && (() => {
                  const selectedLangs: string[] = Array.isArray(draft.languages) ? draft.languages : ["en"];
                  const atLimit = selectedLangs.length >= MAX_LANGUAGES;
                  const locked = !features?.multiLanguage;

                  function toggleLanguage(code: string) {
                    const isSelected = selectedLangs.includes(code);
                    let next: string[];
                    if (isSelected) {
                      next = selectedLangs.filter((c) => c !== code);
                      if (next.length === 0) next = ["en"];
                    } else {
                      if (atLimit) return;
                      next = [...selectedLangs, code];
                    }
                    set("languages", next);
                    if (!next.includes(draft.defaultLanguage)) {
                      set("defaultLanguage", next[0]!);
                    }
                  }

                  return (
                    <div className={cn("space-y-4", locked && "opacity-60 pointer-events-none")}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Supported languages</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Select up to {MAX_LANGUAGES} languages for your form
                          </p>
                        </div>
                        {locked && <LockedBadge onUpgrade={() => setPlansOpen(true)} />}
                        {!locked && (
                          <span className="text-xs text-muted-foreground">
                            {selectedLangs.length}/{MAX_LANGUAGES}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {SUPPORTED_LANGUAGES.map(({ code, name }) => {
                          const isSelected = selectedLangs.includes(code);
                          const isDisabled = !isSelected && atLimit;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => toggleLanguage(code)}
                              disabled={isDisabled}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border hover:bg-muted/40",
                                isDisabled && "opacity-40 cursor-not-allowed",
                              )}
                            >
                              <div className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
                              )}>
                                {isSelected && <Check className="size-2.5 text-primary-foreground" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{code}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Default language</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            The language your form renders in on first load — choose based on your target audience
                          </p>
                        </div>
                        <Select
                          value={draft.defaultLanguage ?? "en"}
                          onValueChange={(v) => set("defaultLanguage", v)}
                        >
                          <SelectTrigger className="h-8 w-44 text-sm shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_LANGUAGES
                              .filter(({ code }) => selectedLangs.includes(code))
                              .map(({ code, name }) => (
                                <SelectItem key={code} value={code}>{name}</SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-t border-border bg-muted/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => validationForm.handleSubmit()}
                  disabled={isPending || isUploadingLogo}
                  className="text-sm px-5"
                >
                  {isUploadingLogo ? "Uploading…" : isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />

      <ConfirmationEmailModal
        open={confirmEmailOpen}
        onOpenChange={setConfirmEmailOpen}
        initialData={draft.confirmationEmail}
        onApply={handleConfirmEmailApply}
        onCancel={handleConfirmEmailCancel}
        formId={form!.id}
        workspaceId={workspaceId}
      />
    </TooltipProvider>
  );
}
