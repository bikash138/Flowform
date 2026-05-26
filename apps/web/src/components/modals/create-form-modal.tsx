"use client";

import { useState } from "react";
import { useCreateForm } from "@/hooks/user/use-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { AlignJustify, Columns2 } from "lucide-react";

type FormLayout = "vertical" | "conversational";

interface LayoutOption {
  value: FormLayout;
  icon: React.ElementType;
  label: string;
  description: string;
  disabled?: boolean;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: "vertical",
    icon: AlignJustify,
    label: "Vertical",
    description: "All questions on one page — clean, familiar, and easy to scroll through.",
  },
  {
    value: "conversational",
    icon: Columns2,
    label: "Conversational",
    description: "One question at a time, full-screen — feels like a natural conversation.",
  },
];

interface CreateFormModalProps {
  workspaceId: string;
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (formId: string) => void;
}

export function CreateFormModal({
  workspaceId,
  children,
  open,
  onOpenChange,
  onSuccess,
}: CreateFormModalProps) {
  const { mutate: createForm, isPending: isCreating } = useCreateForm();
  const [selectedLayout, setSelectedLayout] = useState<FormLayout>("vertical");

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      createForm(
        {
          workspaceId,
          title: value.title,
          description: value.description?.trim() || undefined,
          formLayout: selectedLayout,
        },
        {
          onSuccess: (data) => {
            handleOpenChange(false);
            onSuccess?.(data.id);
          },
        },
      );
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedLayout("vertical");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Create Form</DialogTitle>
          <DialogDescription>
            Give your form a name and choose a layout to get started.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <form.Field
              name="title"
              children={(field) => (
                <div className="grid gap-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Form Title
                  </label>
                  <Input
                    id={field.name}
                    placeholder="My New Form"
                    className="border-border text-foreground bg-background hover:border-primary/40 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            <form.Field
              name="description"
              children={(field) => (
                <div className="grid gap-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id={field.name}
                    placeholder="What is this form about?"
                    rows={2}
                    className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 resize-none"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            {/* Layout picker */}
            <div className="grid gap-2">
              <p className="text-sm font-medium">Layout</p>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_OPTIONS.map(({ value, icon: Icon, label, description, disabled }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedLayout(value)}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all duration-150",
                      disabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : selectedLayout === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {disabled && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        Coming soon
                      </span>
                    )}
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-md",
                      !disabled && selectedLayout === value ? "bg-primary/10" : "bg-muted",
                    )}>
                      <Icon className={cn("size-4", !disabled && selectedLayout === value ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", !disabled && selectedLayout === value ? "text-foreground" : "text-muted-foreground")}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.values.title]}
              children={([canSubmit, title]) => (
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary-dark"
                  disabled={
                    !canSubmit || isCreating || !(title as string)?.trim()
                  }
                >
                  {isCreating ? <Spinner className="size-4" /> : "Create Form"}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
