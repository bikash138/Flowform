"use client";

import { useState } from "react";
import { FormIcon } from "@/assets/icons/form-icon";
import { CreateFormModal } from "@/components/modals/create-form-modal";

interface WorkspaceEmptyStateProps {
  workspaceId: string;
  title?: string;
  description?: string;
}

export function WorkspaceEmptyState({
  workspaceId,
  title = "Nothing here yet",
  description = "Get started by choosing what you want to create.",
}: WorkspaceEmptyStateProps) {
  const [createFormOpen, setCreateFormOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 gap-6">
      <div className="text-center">
        <p className="text-base font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex gap-4">
        <CreateFormModal
          workspaceId={workspaceId}
          open={createFormOpen}
          onOpenChange={setCreateFormOpen}
        >
          <button
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary-subtle transition-all w-44 text-center group"
          >
            <FormIcon size={48} />
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Create a Form
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                Collect responses with multi-step forms
              </p>
            </div>
          </button>
        </CreateFormModal>

      </div>
    </div>
  );
}
