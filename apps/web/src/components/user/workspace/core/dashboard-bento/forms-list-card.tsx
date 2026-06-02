"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, MoreHorizontal, Archive, Copy, Trash2 } from "lucide-react";
import {
  useDeleteForm,
  useDuplicateForm,
  useArchiveForm,
  useUnarchiveForm,
} from "@/hooks/user/use-form";
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
import { CreateFormModal } from "@/components/modals/create-form-modal";

const FORMS_PER_PAGE = 8;

const FORM_COLORS = [
  "#C4956A", "#22C55E", "#60A5FA", "#F59E0B",
  "#A78BFA", "#EC4899", "#14B8A6", "#F97316",
];

type FormItem = {
  id: string;
  title: string;
  responseCount?: number | null;
  updatedAt?: string | null;
  status: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function FormsListCard({
  workspaceId,
  forms,
}: {
  workspaceId: string;
  forms: FormItem[];
}) {
  const router = useRouter();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [formsPage, setFormsPage] = useState(0);

  const { mutate: deleteForm, isPending: isDeleting } = useDeleteForm();
  const { mutate: duplicateForm } = useDuplicateForm();
  const { mutate: archiveForm } = useArchiveForm();
  const { mutate: unarchiveForm } = useUnarchiveForm();

  const totalPages = Math.max(1, Math.ceil(forms.length / FORMS_PER_PAGE));
  const safePage = Math.min(formsPage, totalPages - 1);
  const pagedForms = forms.slice(safePage * FORMS_PER_PAGE, safePage * FORMS_PER_PAGE + FORMS_PER_PAGE);

  return (
    <>
      <div
        className="ws-left-col"
        style={{
          background: "white", borderRadius: 24, padding: "22px 24px",
          display: "flex", flexDirection: "column", overflow: "hidden",
          gridColumn: 1, gridRow: "1 / 4",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, flexShrink: 0,
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1C1610" }}>My Forms</p>
          <CreateFormModal workspaceId={workspaceId} open={createFormOpen} onOpenChange={setCreateFormOpen}>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#1C1610", border: "none", borderRadius: 999,
              padding: "7px 14px 7px 10px", cursor: "pointer",
            }}>
              <Plus size={14} color="white" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>New Form</span>
            </button>
          </CreateFormModal>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {pagedForms.map((form, idx) => {
            const color = FORM_COLORS[idx % FORM_COLORS.length];
            const blocks = Math.min(14, Math.round(((form.responseCount ?? 0) / 350) * 14));
            return (
              <div
                key={form.id}
                style={{
                  display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
                  alignItems: "center", padding: "14px 0", cursor: "pointer",
                  borderBottom: idx < pagedForms.length - 1 ? "1px solid #F5F0EA" : "none",
                }}
                onClick={() =>
                  router.push(
                    form.status === "PUBLISHED"
                      ? `/ws/${workspaceId}/f/${form.id}/result`
                      : `/ws/${workspaceId}/f/${form.id}/editor`,
                  )
                }
              >
                {/* Left: icon + title/date — cols 1-2 */}
                <div style={{ gridColumn: "1 / 3", display: "flex", alignItems: "center", gap: 12, minWidth: 0, overflow: "hidden" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `${color}18`, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FileText size={16} color={color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: "#1C1610",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      lineHeight: 1.2, margin: 0,
                    }}>
                      {form.title}
                    </p>
                    <p style={{ fontSize: 11, color: "#B3A89E", lineHeight: 1.2, margin: 0, marginTop: 2 }}>
                      Updated {formatDate(form.updatedAt!)}
                    </p>
                  </div>
                </div>

                {/* Middle: response count + bars — cols 3-5 */}
                <div style={{ gridColumn: "3 / 6", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7A6E62" }}>
                    {form.responseCount ?? 0}/350
                  </span>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                    {Array.from({ length: 14 }).map((_, i) => {
                      const filled = i < blocks;
                      const height = filled ? 14 + Math.round((i / 13) * 28) : 14;
                      return (
                        <div key={i} style={{
                          width: 8, height, borderRadius: 4,
                          background: filled ? color : "#F0EBE4",
                          transition: "height 0.3s ease",
                        }} />
                      );
                    })}
                  </div>
                </div>

                {/* Right: three dots + status dot — col 6 */}
                <div
                  style={{ gridColumn: "6 / 7", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingRight: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#D9CFC5", lineHeight: 0 }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {form.status === "ARCHIVED" ? (
                        <DropdownMenuItem onClick={() => unarchiveForm({ formId: form.id, workspaceId })}>
                          <Archive className="size-3.5 mr-2 text-muted-foreground" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => archiveForm({ formId: form.id, workspaceId })}>
                          <Archive className="size-3.5 mr-2 text-muted-foreground" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => duplicateForm({ formId: form.id, workspaceId })}>
                        <Copy className="size-3.5 mr-2 text-muted-foreground" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => setDeleteFormId(form.id)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0 }}>
                    {form.status === "PUBLISHED" ? (
                      <>
                        <span className="ws-ripple-1" style={{
                          position: "absolute", inset: 0, margin: "auto",
                          width: 12, height: 12, borderRadius: "50%",
                          border: "1.5px solid #22c55e", background: "transparent",
                        }} />
                        <span className="ws-ripple-2" style={{
                          position: "absolute", inset: 0, margin: "auto",
                          width: 12, height: 12, borderRadius: "50%",
                          border: "1.5px solid #22c55e", background: "transparent",
                        }} />
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "block", flexShrink: 0, zIndex: 1 }} />
                      </>
                    ) : (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", display: "block" }} />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 12, borderTop: "1px solid #F5F0EA", flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: "#B3A89E" }}>
              Page {safePage + 1} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={safePage === 0}
                onClick={() => setFormsPage((p) => Math.max(0, p - 1))}
                style={{
                  fontSize: 11, fontWeight: 600, border: "none", borderRadius: 999, padding: "5px 14px",
                  cursor: safePage === 0 ? "default" : "pointer",
                  background: safePage === 0 ? "#F5F0EA" : "#1C1610",
                  color: safePage === 0 ? "#B3A89E" : "white",
                }}
              >
                Prev
              </button>
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => setFormsPage((p) => Math.min(totalPages - 1, p + 1))}
                style={{
                  fontSize: 11, fontWeight: 600, border: "none", borderRadius: 999, padding: "5px 14px",
                  cursor: safePage >= totalPages - 1 ? "default" : "pointer",
                  background: safePage >= totalPages - 1 ? "#F5F0EA" : "#1C1610",
                  color: safePage >= totalPages - 1 ? "#B3A89E" : "white",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
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
    </>
  );
}
