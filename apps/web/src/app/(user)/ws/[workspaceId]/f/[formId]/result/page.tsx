"use client";

import { use, useState } from "react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useListResponses } from "@/hooks/user/use-analytics";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { useTRPCClient } from "@/utils/trpc";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Clock,
  Hash,
  Gem,
  Check,
  TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PlansModal } from "@/components/modals/plans-modal";
import type { FormSettings } from "@flowform/database/models";
import type { ResponseColumn } from "@flowform/services/analytics";

// tRPC serializes Date → string; accept both
type WireRow = {
  id: string;
  submittedAt: Date | string;
  respondentEmail: string | null;
  answers: {
    questionId: string;
    type: string;
    value: string | number | boolean | string[] | null;
  }[];
};

// ─── Value formatter ──────────────────────────────────────────────────────────

function resolveOption(
  id: string,
  options: ResponseColumn["options"],
): string {
  return options?.find((o) => o.id === id)?.label ?? id;
}

function formatValue(
  value: WireRow["answers"][number]["value"],
  type: string,
  options?: ResponseColumn["options"],
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value.map((v) => resolveOption(v, options)).join(", ");
  }
  if (
    (type === "radio" || type === "select") &&
    typeof value === "string" &&
    options?.length
  ) {
    return resolveOption(value, options);
  }
  if (type === "date" && typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime())
      ? value
      : d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }
  return String(value);
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return formatDateTime(date);
}

function buildCsv(
  rows: WireRow[],
  columns: ResponseColumn[],
  collectEmail: boolean,
  formTitle: string,
  version: number,
): string {
  const emailCol = collectEmail ? ["Email"] : [];
  const headers = [
    "#",
    "Submitted At",
    ...emailCol,
    ...columns.map((c) => c.label),
  ];

  const dataRows = rows.map((row, i) => {
    const email = collectEmail ? [row.respondentEmail ?? ""] : [];
    const answers = columns.map((col) => {
      const ans = row.answers.find((a) => a.questionId === col.questionId);
      return ans ? formatValue(ans.value, ans.type, col.options) : "";
    });
    return [String(i + 1), formatDateTime(row.submittedAt), ...email, ...answers];
  });

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [headers, ...dataRows]
    .map((r) => r.map(escape).join(","))
    .join("\n");
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  short_text: "Text",
  long_text: "Long text",
  email: "Email",
  number: "Number",
  phone: "Phone",
  url: "URL",
  select: "Select",
  radio: "Radio",
  checkbox: "Checkbox",
  rating: "Rating",
  date: "Date",
  yes_no: "Yes / No",
};

// ─── Response detail drawer ───────────────────────────────────────────────────

function ResponseDrawer({
  row,
  columns,
  collectEmail,
  index,
  open,
  onClose,
}: {
  row: WireRow | null;
  columns: ResponseColumn[];
  collectEmail: boolean;
  index: number;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {row && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-base">Response #{index}</SheetTitle>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  {formatDateTime(row.submittedAt)}
                </div>
                {collectEmail && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    {row.respondentEmail ?? (
                      <span className="italic">No email provided</span>
                    )}
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5">
              {columns.map((col) => {
                const ans = row.answers.find(
                  (a) => a.questionId === col.questionId,
                );
                const display = ans
                  ? formatValue(ans.value, ans.type, col.options)
                  : "—";
                const isEmpty = display === "—";
                return (
                  <div key={col.questionId} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium leading-snug">
                        {col.label}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {TYPE_LABEL[col.type] ?? col.type}
                      </Badge>
                    </div>
                    <p
                      className={
                        isEmpty
                          ? "text-sm text-muted-foreground italic"
                          : "text-sm whitespace-pre-wrap wrap-break-word"
                      }
                    >
                      {display}
                    </p>
                    <div className="border-b border-border/50" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Response table ───────────────────────────────────────────────────────────

function ResponseTable({
  rows,
  columns,
  collectEmail,
  pageOffset,
  onRowClick,
}: {
  rows: WireRow[];
  columns: ResponseColumn[];
  collectEmail: boolean;
  pageOffset: number;
  onRowClick: (row: WireRow, index: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Inbox className="size-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">No responses yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Responses will appear here once your form starts receiving submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-3 py-2.5 text-left">
              <Hash className="size-3.5 text-muted-foreground" />
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
              Submitted
            </th>
            {collectEmail && (
              <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
                Email
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.questionId}
                className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground"
              >
                <span
                  className="block max-w-[160px] truncate"
                  title={col.label}
                >
                  {col.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => {
            const globalIndex = pageOffset + i + 1;
            return (
              <tr
                key={row.id}
                onClick={() => onRowClick(row, globalIndex)}
                className="hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-medium">
                  {globalIndex}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span
                    className="text-xs"
                    title={formatDateTime(row.submittedAt)}
                  >
                    {relativeTime(row.submittedAt)}
                  </span>
                </td>
                {collectEmail && (
                  <td className="px-4 py-2.5 text-xs max-w-[180px]">
                    <span
                      className="block truncate"
                      title={row.respondentEmail ?? undefined}
                    >
                      {row.respondentEmail ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </td>
                )}
                {columns.map((col) => {
                  const ans = row.answers.find(
                    (a) => a.questionId === col.questionId,
                  );
                  const display = ans
                    ? formatValue(ans.value, ans.type, col.options)
                    : "—";
                  const isEmpty = display === "—";
                  return (
                    <td
                      key={col.questionId}
                      className="px-4 py-2.5 max-w-[200px]"
                    >
                      <span
                        className={`block truncate text-xs ${isEmpty ? "text-muted-foreground" : ""}`}
                        title={isEmpty ? undefined : display}
                      >
                        {display}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Upgrade gate ─────────────────────────────────────────────────────────────

function UpgradeGate({ planId }: { planId: string }) {
  const [plansOpen, setPlansOpen] = useState(false);

  const features = [
    "Paginated table of every individual response",
    "Click any row to see the full answer breakdown",
    "Collected email addresses per respondent",
    "Filter by form version",
    "Export all responses as a raw CSV file",
  ];

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred skeleton preview */}
        <div className="pointer-events-none select-none blur-[3px] opacity-50 space-y-4 p-1">
          {/* Toolbar skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            {/* Header */}
            <div className="flex gap-4 px-4 py-2.5 bg-muted/30 border-b">
              {[3, 20, 18, 22, 20, 17].map((w, i) => (
                <Skeleton key={i} className="h-3 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3 border-b last:border-b-0"
                style={{ opacity: 1 - i * 0.08 }}
              >
                {[3, 20, 18, 22, 20, 17].map((w, j) => (
                  <Skeleton key={j} className="h-3 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
        </div>

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-4">
              <TableIcon className="size-6 text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1.5">Unlock Response Data</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Upgrade to <span className="font-semibold text-foreground">Pro</span> to
              view, explore, and export every response your form collects.
            </p>

            <ul className="space-y-2 mb-6 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button className="w-full gap-2" onClick={() => setPlansOpen(true)}>
              <Gem className="size-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>

      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} currentPlanId={planId} />
    </>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export default function ResultPage({
  params,
}: {
  params: Promise<{ workspaceId: string; formId: string }>;
}) {
  const { workspaceId, formId } = use(params);
  const form = useFormEditorStore((s) => s.form);
  const publishVersion = form?.publishVersion ?? 0;
  const collectEmail =
    (form?.settings as FormSettings | undefined)?.collectEmail ?? false;

  const { data: plan, isLoading: planLoading } = useWorkspacePlan(workspaceId);
  const isFree = !planLoading && (plan?.planId ?? "FREE") === "FREE";

  const [selectedVersion, setSelectedVersion] = useState(
    () => (publishVersion > 0 ? publishVersion : 1),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [exporting, setExporting] = useState(false);
  const [drawerRow, setDrawerRow] = useState<WireRow | null>(null);
  const [drawerIndex, setDrawerIndex] = useState(0);

  const trpcClient = useTRPCClient();
  const { data, isLoading } = useListResponses(
    formId,
    workspaceId,
    selectedVersion,
    page,
    pageSize,
  );

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;
  const versions = Array.from(
    { length: publishVersion },
    (_, i) => publishVersion - i,
  );
  const pageOffset = (page - 1) * pageSize;

  async function handleExport() {
    setExporting(true);
    try {
      const result = await trpcClient.analytics.exportResponses.query({
        formId,
        workspaceId,
        publishVersion: selectedVersion,
      });

      const csv = buildCsv(
        result.rows as WireRow[],
        result.columns,
        collectEmail,
        form?.title ?? "responses",
        selectedVersion,
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(form?.title ?? "responses").replace(/\s+/g, "-")}-v${selectedVersion}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  if (publishVersion === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Inbox className="size-10 text-muted-foreground/40" />
          <p className="font-medium">Form not published yet</p>
          <p className="text-sm text-muted-foreground">
            Publish your form to start collecting responses.
          </p>
        </div>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <UpgradeGate planId={plan?.planId ?? "FREE"} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Version
                </span>
                <Select
                  value={String(selectedVersion)}
                  onValueChange={(v) => {
                    setSelectedVersion(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        Version {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Show
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v) as PageSize);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">per page</span>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              {data && (
                <span className="text-xs text-muted-foreground">
                  {data.total.toLocaleString()} response
                  {data.total !== 1 ? "s" : ""}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting || !data?.total}
              >
                <Download className="size-3.5 mr-1.5" />
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : data ? (
              <ResponseTable
                rows={data.rows as WireRow[]}
                columns={data.columns}
                collectEmail={collectEmail}
                pageOffset={pageOffset}
                onRowClick={(row, index) => {
                  setDrawerRow(row);
                  setDrawerIndex(index);
                }}
              />
            ) : null}
          </div>

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response detail drawer */}
      <ResponseDrawer
        row={drawerRow}
        columns={data?.columns ?? []}
        collectEmail={collectEmail}
        index={drawerIndex}
        open={drawerRow !== null}
        onClose={() => setDrawerRow(null)}
      />
    </>
  );
}
