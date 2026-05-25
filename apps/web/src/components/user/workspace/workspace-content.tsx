"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Copy, Trash2, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  useForms,
  useDeleteForm,
  useDuplicateForm,
} from "@/hooks/user/use-form";

export function WorkspaceContent({ workspaceId }: { workspaceId: string }) {
  const { data: forms, isLoading: formsLoading } = useForms(workspaceId);
  const { mutate: deleteForm } = useDeleteForm();
  const { mutate: duplicateForm } = useDuplicateForm();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="max-w-[960px] w-full mx-auto px-8 py-6">
          {/* Forms Table */}
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_100px_100px_110px_80px_40px] gap-x-4 items-center px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border">
              <span />
              <span />
              <span>Responses</span>
              <span>Completion</span>
              <span>Updated</span>
              <span>Integrations</span>
              <span />
            </div>

            <div className="divide-y divide-border">
              {formsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-6" />
                </div>
              ) : !forms || forms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-muted/40">
                    <FileText className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No forms yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create your first form to get started.
                  </p>
                </div>
              ) : (
                forms.map((form) => (
                  <Link
                    key={form.id}
                    href={`/workspace/${workspaceId}/forms/${form.id}/editor`}
                    className="grid grid-cols-[1fr_auto_100px_100px_110px_80px_40px] gap-x-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors group cursor-pointer rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-md bg-primary/20 shrink-0">
                        <FileText className="size-4 text-primary-dark" />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">
                        {form.title}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span />
                    </div>

                    <span className="text-sm text-muted-foreground text-center">
                      —
                    </span>

                    <span className="text-sm text-muted-foreground text-center">
                      —
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {new Date(form.updatedAt!).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <div className="flex items-center justify-center" />

                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.preventDefault()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-background border-border"
                        >
                          <DropdownMenuItem className="text-foreground">
                            <Pencil className="size-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-foreground"
                            onClick={() =>
                              duplicateForm({ formId: form.id, workspaceId })
                            }
                          >
                            <Copy className="size-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              deleteForm({ formId: form.id, workspaceId })
                            }
                          >
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
