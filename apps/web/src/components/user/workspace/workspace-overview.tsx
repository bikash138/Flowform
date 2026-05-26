"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, BarChart2, Gauge, Users, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import { FormIcon } from "@/assets/icons/form-icon";
import { Spinner } from "@/components/ui/spinner";
import { useForms, useDeleteForm } from "@/hooks/user/use-form";
import { useFormUsage, useMemberUsage, useRemainingQuota } from "@/hooks/user/use-billing";
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
import { Button } from "@/components/ui/button";
import { CreateFormModal } from "@/components/modals/create-form-modal";

const WARN_THRESHOLD = 0.8;

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
    <div className={cn(
      "flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors",
      warning ? "border-red-300 bg-red-50/40 dark:bg-red-950/10" : "border-border",
    )}>
      <div className="flex items-center justify-between">
        <div className={cn(
          "flex items-center justify-center size-9 rounded-lg",
          warning ? "bg-red-100 dark:bg-red-900/30" : "bg-muted/60",
        )}>
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
        <p className={cn(
          "text-2xl font-bold leading-none mb-1",
          warning ? "text-red-600 dark:text-red-400" : "text-foreground",
        )}>
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
  const { data: formUsage } = useFormUsage(workspaceId);
  const { data: memberUsage } = useMemberUsage(workspaceId);
  const { data: quota } = useRemainingQuota(workspaceId);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const { mutate: deleteForm, isPending: isDeleting } = useDeleteForm();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="flex flex-1">
        <WorkspaceEmptyState workspaceId={workspaceId} />
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
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className={cn("size-4", formsWarn ? "text-red-500" : "text-muted-foreground")} />}
            label="Active Forms"
            value={formUsage ? `${formUsage.used} / ${formUsage.limit}` : forms.length}
            warning={formsWarn}
          />
          <StatCard
            icon={<Users className={cn("size-4", membersWarn ? "text-red-500" : "text-muted-foreground")} />}
            label="Team Members"
            value={memberUsage ? `${memberUsage.used} / ${memberUsage.limit}` : "—"}
            warning={membersWarn}
          />
          <StatCard
            icon={<BarChart2 className={cn("size-4", quotaWarn ? "text-red-500" : "text-muted-foreground")} />}
            label="Responses this month"
            value={quota ? quota.usedThisMonth.toLocaleString() : "—"}
            warning={quotaWarn}
          />
          <StatCard
            icon={<Gauge className={cn("size-4", quotaWarn ? "text-red-500" : "text-muted-foreground")} />}
            label="Response limit left"
            value={quota ? `${quota.remaining.toLocaleString()} / ${quota.monthlyLimit.toLocaleString()}` : "—"}
            warning={quotaWarn}
          />
        </div>

        {/* Recent Activity header */}
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
                <TableHead className="text-xs text-muted-foreground font-medium pr-4 w-12" />
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
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <FormIcon size={20} className="shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate leading-none">
                        {form.title}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    Form
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(form.updatedAt!)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(form.createdAt!)}
                  </TableCell>
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
                  <TableCell className="pr-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFormId(form.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteFormId} onOpenChange={(open) => !open && setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and all its responses. This action cannot be undone.
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
    </div>
  );
}
