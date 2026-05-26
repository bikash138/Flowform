"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFormEditorStore, type QuestionType } from "@/store/use-form-editor-store";
import {
  Type,
  AlignLeft,
  List,
  CircleDot,
  Mail,
  Hash,
  CheckSquare,
  Star,
  Calendar,
  Phone,
  Link2,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionOption {
  type: QuestionType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const QUESTION_OPTIONS: QuestionOption[] = [
  {
    type: "short_text",
    label: "Short Text",
    description: "Single-line open-ended answer",
    icon: Type,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    type: "long_text",
    label: "Long Text",
    description: "Multi-line textarea for longer answers",
    icon: AlignLeft,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40",
  },
  {
    type: "email",
    label: "Email",
    description: "Validated email address field",
    icon: Mail,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 hover:border-sky-500/40",
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric input with validation",
    icon: Hash,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 hover:border-orange-500/40",
  },
  {
    type: "phone",
    label: "Phone",
    description: "Phone number with country code",
    icon: Phone,
    color: "text-green-500",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/40",
  },
  {
    type: "url",
    label: "Website URL",
    description: "Validated URL / link field",
    icon: Link2,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    type: "select",
    label: "Dropdown",
    description: "Select one option from a list",
    icon: List,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/40",
  },
  {
    type: "radio",
    label: "Multiple Choice",
    description: "Pick one from visible choices",
    icon: CircleDot,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    type: "checkbox",
    label: "Checkboxes",
    description: "Select one or more options",
    icon: CheckSquare,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 hover:border-teal-500/40",
  },
  {
    type: "rating",
    label: "Rating",
    description: "Star or numeric scale rating",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/40",
  },
  {
    type: "date",
    label: "Date",
    description: "Date picker input",
    icon: Calendar,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 hover:border-pink-500/40",
  },
  {
    type: "yes_no",
    label: "Yes / No",
    description: "Simple boolean Yes or No answer",
    icon: ToggleLeft,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 hover:border-rose-500/40",
  },
];

interface AddContentModalProps {
  pageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContentModal({ pageId, open, onOpenChange }: AddContentModalProps) {
  const addQuestion = useFormEditorStore((s) => s.addQuestion);

  const handleSelect = (type: QuestionType) => {
    if (!pageId) return;
    addQuestion(pageId, type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">Add a question</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a question type to add to this page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 p-5">
          {QUESTION_OPTIONS.map(({ type, label, description, icon: Icon, color, bgColor }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                bgColor,
              )}
            >
              <div className="flex items-center justify-center size-9 rounded-lg bg-background/60 shadow-sm">
                <Icon className={cn("size-4", color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
