"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeletePageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeletePageModal({ open, onOpenChange, onConfirm }: DeletePageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">
        {/* Icon + header */}
        <div className="flex flex-col items-center text-center px-8 pt-8 pb-6">
          <div className="mb-4 flex items-center justify-center size-14 rounded-2xl bg-red-50 border border-red-100">
            <Trash2 className="size-6 text-red-500" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground mb-1.5">
            Delete this page?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
            All questions inside this page will be permanently deleted. This action cannot be undone.
          </DialogDescription>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-medium h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 h-9 font-bold gap-2 bg-red-500 hover:bg-red-600 text-white border-0"
          >
            <Trash2 className="size-4" />
            Delete page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
