"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { FileText, BarChart2, Gauge, Sparkles } from "lucide-react";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import { FormIcon } from "@/assets/icons/form-icon";
import { PollIcon } from "@/assets/icons/poll-icon";
import { Spinner } from "@/components/ui/spinner";
import { useForms } from "@/hooks/user/use-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center size-9 rounded-lg bg-muted/60">
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none mb-1">
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

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="max-w-[960px] w-full mx-auto px-8 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className="size-4 text-muted-foreground" />}
            label="Forms"
            value={forms.length}
          />
          <StatCard
            icon={<PollIcon size={16} />}
            label="Polls"
            value={0}
            badge={
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/40 bg-primary-subtle text-[10px] font-semibold text-primary-dark uppercase tracking-wider">
                <Sparkles className="size-2.5" />
                Soon
              </span>
            }
          />
          <StatCard
            icon={<BarChart2 className="size-4 text-muted-foreground" />}
            label="Total Responses Collected"
            value={0}
          />
          <StatCard
            icon={<Gauge className="size-4 text-muted-foreground" />}
            label="Response Limit Left"
            value="Unlimited"
          />
        </div>

        {/* Recent Activity */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Recent Activity
        </p>

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
                <TableHead className="text-xs text-muted-foreground font-medium pr-4">
                  Live
                </TableHead>
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
                        ? `/workspace/${workspaceId}/forms/${form.id}/responses`
                        : `/workspace/${workspaceId}/forms/${form.id}/editor`,
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
                  <TableCell className="pr-4">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
