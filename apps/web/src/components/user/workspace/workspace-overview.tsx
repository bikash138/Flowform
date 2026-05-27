"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BarChart2,
  Gauge,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Archive,
  Copy,
  MoreHorizontal,
  Users2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import { FormIcon } from "@/assets/icons/form-icon";
import { Spinner } from "@/components/ui/spinner";
import {
  useForms,
  useDeleteForm,
  useDuplicateForm,
  useArchiveForm,
  useUnarchiveForm,
} from "@/hooks/user/use-form";
import { useFormUsage, useMemberUsage, useRemainingQuota } from "@/hooks/user/use-billing";
import { useWorkspace } from "@/hooks/user/use-workspace-core";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CreateFormModal } from "@/components/modals/create-form-modal";
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal";

const WARN_THRESHOLD = 0.8;

// ── Workspace-type notice ──────────────────────────────────────────────────────

function WorkspaceTypeBanner({
  isPersonal,
  isPrivate,
  onCreatePublic,
}: {
  isPersonal: boolean;
  isPrivate: boolean;
  onCreatePublic: () => void;
}) {
  if (!isPersonal && !isPrivate) return null; // public workspace — no banner needed

  const label = isPersonal ? "Personal workspace" : "Private workspace";
  const Icon = isPersonal ? Lock : Users2;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 px-4 py-3.5 mb-6">
      <div className="shrink-0 flex items-center justify-center size-8 rounded-lg bg-amber-200 dark:bg-amber-900/40 mt-0.5">
        <Icon className="size-4 text-amber-700 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-amber-950 dark:text-amber-200 leading-snug mb-1">
          {label}
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300/70 leading-relaxed">
          {isPersonal
            ? "This is your personal workspace — it can't be shared or upgraded to a paid plan."
            : "Private workspaces can't be upgraded to Pro or invite team members."}
          {" "}To collaborate with your team or unlock Pro features, create a{" "}
          <strong>public workspace</strong>.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreatePublic}
        className="shrink-0 flex items-center gap-1 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 transition-colors mt-0.5 whitespace-nowrap"
      >
        Create public workspace
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors",
        warning
          ? "border-red-300 bg-red-50/40 dark:bg-red-950/10"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center justify-center size-9 rounded-lg",
            warning ? "bg-red-100 dark:bg-red-900/30" : "bg-muted/60",
          )}
        >
          {icon}
        </div>
        {warning && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
            <AlertTriangle className="size-3" />
            Upgrade plan
          </span>
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-2xl font-bold leading-none mb-1",
            warning ? "text-red-600 dark:text-red-400" : "text-foreground",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function WorkspaceOverviewSection({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const router = useRouter();

  const { data: forms, isLoading } = useForms(workspaceId);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: formUsage } = useFormUsage(workspaceId);
  const { data: memberUsage } = useMemberUsage(workspaceId);
  const { data: quota } = useRemainingQuota(workspaceId);

  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  const { mutate: deleteForm, isPending: isDeleting } = useDeleteForm();
  const { mutate: duplicateForm } = useDuplicateForm();
  const { mutate: archiveForm } = useArchiveForm();
  const { mutate: unarchiveForm } = useUnarchiveForm();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        {workspace && (workspace.isPersonal || workspace.isPrivate) && (
          <div className="max-w-[960px] w-full mx-auto px-8 pt-6">
            <WorkspaceTypeBanner
              isPersonal={workspace.isPersonal}
              isPrivate={workspace.isPrivate}
              onCreatePublic={() => setCreateWorkspaceOpen(true)}
            />
          </div>
        )}
        <WorkspaceEmptyState workspaceId={workspaceId} />
        <CreateWorkspaceModal
          open={createWorkspaceOpen}
          onOpenChange={setCreateWorkspaceOpen}
        />
      </div>
    );
  }

  const sortedForms = [...forms].sort(
    (a, b) =>
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime(),
  );

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const formsWarn = formUsage
    ? formUsage.used / (formUsage.limit ?? Infinity) >= WARN_THRESHOLD
    : false;
  const membersWarn = memberUsage
    ? memberUsage.used / (memberUsage.limit ?? Infinity) >= WARN_THRESHOLD
    : false;
  const quotaWarn = quota
    ? quota.usedThisMonth / quota.monthlyLimit >= WARN_THRESHOLD
    : false;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="max-w-[960px] w-full mx-auto px-8 py-6">
        {/* ── Personal / Private workspace notice ──────────────────────── */}
        {workspace && (workspace.isPersonal || workspace.isPrivate) && (
          <WorkspaceTypeBanner
            isPersonal={workspace.isPersonal}
            isPrivate={workspace.isPrivate}
            onCreatePublic={() => setCreateWorkspaceOpen(true)}
          />
        )}

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={
              <FileText
                className={cn(
                  "size-4",
                  formsWarn ? "text-red-500" : "text-muted-foreground",
                )}
              />
            }
            label="Active Forms"
            value={
              formUsage
                ? `${formUsage.used} / ${formUsage.limit}`
                : forms.length
            }
            warning={formsWarn}
          />
          <StatCard
            icon={
              <Users
                className={cn(
                  "size-4",
                  membersWarn ? "text-red-500" : "text-muted-foreground",
                )}
              />
            }
            label="Team Members"
            value={
              memberUsage ? `${memberUsage.used} / ${memberUsage.limit}` : "—"
            }
            warning={membersWarn}
          />
          <StatCard
            icon={
              <BarChart2
                className={cn(
                  "size-4",
                  quotaWarn ? "text-red-500" : "text-muted-foreground",
                )}
              />
            }
            label="Responses this month"
            value={quota ? quota.usedThisMonth.toLocaleString() : "—"}
            warning={quotaWarn}
          />
          <StatCard
            icon={
              <Gauge
                className={cn(
                  "size-4",
                  quotaWarn ? "text-red-500" : "text-muted-foreground",
                )}
              />
            }
            label="Response limit left"
            value={
              quota
                ? `${quota.remaining.toLocaleString()} / ${quota.monthlyLimit.toLocaleString()}`
                : "—"
            }
            warning={quotaWarn}
          />
        </div>

        {/* ── Recent Activity header ────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </p>
          <CreateFormModal
            workspaceId={workspaceId}
            open={createFormOpen}
            onOpenChange={setCreateFormOpen}
          >
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              Create Form
            </Button>
          </CreateFormModal>
        </div>

        {/* ── Forms Table ──────────────────────────────────────────────── */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-xs text-muted-foreground font-medium pl-4">
                  Name
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Type
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Total Responses
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Last Updated
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Created At
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Live
                </TableHead>
                {/* actions column — no label */}
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedForms.map((form) => (
                <TableRow
                  key={form.id}
                  className="group cursor-pointer"
                  onClick={() =>
                    router.push(
                      form.status === "PUBLISHED"
                        ? `/ws/${workspaceId}/f/${form.id}/result`
                        : `/ws/${workspaceId}/f/${form.id}/editor`,
                    )
                  }
                >
                  {/* ── Name ── */}
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      {/* FormIcon is an SVG — render as block so it has no
                          baseline gap, then flex items-center centres both */}
                      <FormIcon size={20} className="shrink-0 block" />
                      {/* Use <span> (no browser default margins) instead of
                          <p> to prevent vertical misalignment with the icon */}
                      <span className="text-sm font-medium text-foreground truncate">
                        {form.title}
                      </span>
                    </div>
                  </TableCell>

                  {/* ── Type ── */}
                  <TableCell className="text-sm text-muted-foreground">
                    Form
                  </TableCell>

                  {/* ── Total Responses ── */}
                  <TableCell className="text-sm text-muted-foreground">
                    {form.responseCount.toLocaleString()}
                  </TableCell>

                  {/* ── Last Updated ── */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(form.updatedAt!)}
                  </TableCell>

                  {/* ── Created At ── */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(form.createdAt!)}
                  </TableCell>

                  {/* ── Live indicator ── */}
                  <TableCell>
                    <span className="relative flex items-center justify-center size-4">
                      {form.status === "PUBLISHED" ? (
                        <>
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60" />
                          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                        </>
                      ) : (
                        <span className="relative inline-flex size-2 rounded-full bg-red-400" />
                      )}
                    </span>
                  </TableCell>

                  {/* ── Actions (three-dot menu) ── */}
                  <TableCell className="pr-4">
                    {/* Stop row click from firing when interacting with menu */}
                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          {/* Archive / Unarchive — toggled by current status */}
                          {form.status === "ARCHIVED" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                unarchiveForm({ formId: form.id, workspaceId })
                              }
                            >
                              <Archive className="size-3.5 mr-2 text-muted-foreground" />
                              Unarchive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                archiveForm({ formId: form.id, workspaceId })
                              }
                            >
                              <Archive className="size-3.5 mr-2 text-muted-foreground" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          {/* Duplicate */}
                          <DropdownMenuItem
                            onClick={() =>
                              duplicateForm({ formId: form.id, workspaceId })
                            }
                          >
                            <Copy className="size-3.5 mr-2 text-muted-foreground" />
                            Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Delete — opens confirmation dialog */}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeleteFormId(form.id)}
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Delete confirmation dialog ─────────────────────────────────── */}
      <AlertDialog
        open={!!deleteFormId}
        onOpenChange={(open) => !open && setDeleteFormId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and all its responses. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteFormId) return;
                deleteForm(
                  { formId: deleteFormId, workspaceId },
                  { onSettled: () => setDeleteFormId(null) },
                );
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create public workspace modal ─────────────────────────────── */}
      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
      />
    </div>
  );
}
