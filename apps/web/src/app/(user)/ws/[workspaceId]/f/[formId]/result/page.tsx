"use client";

import { use, useState } from "react";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useListResponses } from "@/hooks/user/use-analytics";
import { useTRPCClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { FormSettings } from "@flowform/database";
import type { ResponseColumn } from "@flowform/services/analytics";

// tRPC serializes Date → string over JSON; accept both
type WireRow = {
  id: string;
  submittedAt: Date | string;
  respondentEmail: string | null;
  answers: { questionId: string; type: string; value: string | number | boolean | string[] | null }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildCsv(
  rows: WireRow[],
  columns: ResponseColumn[],
  collectEmail: boolean,
  formTitle: string,
  version: number,
): string {
  const emailCol = collectEmail ? ["Email"] : [];
  const headers = ["Submitted At", ...emailCol, ...columns.map((c) => c.label)];

  const dataRows = rows.map((row) => {
    const email = collectEmail ? [row.respondentEmail ?? ""] : [];
    const answers = columns.map((col) => {
      const ans = row.answers.find((a) => a.questionId === col.questionId);
      return ans ? formatCellValue(ans.value) : "";
    });
    return [formatDate(row.submittedAt), ...email, ...answers];
  });

  return [headers, ...dataRows]
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

// ─── Response table ───────────────────────────────────────────────────────────

function ResponseTable({
  rows,
  columns,
  collectEmail,
}: {
  rows: WireRow[];
  columns: ResponseColumn[];
  collectEmail: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        No responses for this version yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
              Submitted At
            </th>
            {collectEmail && (
              <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
                Email
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.questionId}
                className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap"
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
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(row.submittedAt)}
              </td>
              {collectEmail && (
                <td className="px-4 py-2.5 text-xs">
                  {row.respondentEmail ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              )}
              {columns.map((col) => {
                const ans = row.answers.find((a) => a.questionId === col.questionId);
                const display = formatCellValue(ans?.value);
                return (
                  <td key={col.questionId} className="px-4 py-2.5 text-xs max-w-[200px]">
                    <span className="block truncate" title={display === "—" ? undefined : display}>
                      {display}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const [selectedVersion, setSelectedVersion] = useState(
    () => (publishVersion > 0 ? publishVersion : 1),
  );
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const trpcClient = useTRPCClient();
  const { data, isLoading } = useListResponses(
    formId,
    workspaceId,
    selectedVersion,
    page,
  );

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const versions = Array.from({ length: publishVersion }, (_, i) => publishVersion - i);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await trpcClient.analytics.exportResponses.query({
        formId,
        workspaceId,
        publishVersion: selectedVersion,
      });

      const csv = buildCsv(
        result.rows,
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
        <div className="text-center space-y-2">
          <p className="font-medium">Form not published yet</p>
          <p className="text-sm text-muted-foreground">
            Publish your form to start collecting responses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Version</span>
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

          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-muted-foreground">
                {data.total} response{data.total !== 1 ? "s" : ""}
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

        {/* Table card */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : data ? (
              <ResponseTable
                rows={data.rows}
                columns={data.columns}
                collectEmail={collectEmail}
              />
            ) : null}
          </CardContent>
        </Card>

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
  );
}
