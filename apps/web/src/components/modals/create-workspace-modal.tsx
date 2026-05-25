"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useCreateWorkspace } from "@/hooks/user/use-workspace-core";
import { useForm } from "@tanstack/react-form";
import { BrandingSelector } from "@/components/user/common/branding-selector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CreateWorkspaceModalProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({
  children,
  open,
  onOpenChange,
}: CreateWorkspaceModalProps) {
  const router = useRouter();
  const { mutate: createWorkspace, isPending: isCreating } = useCreateWorkspace(
    {
      onSuccess: (workspaceId) => {
        handleOpenChange(false);
        router.push(`/workspace/${workspaceId}`);
      },
    },
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState("");

  const form = useForm({
    defaultValues: {
      title: "",
      logoUrl: "",
      isPublic: false,
    },

    onSubmit: async ({ value }) => {
      createWorkspace({
        title: value.title,
        logo: previewLogo?.trim() ? previewLogo : null,
        isPublic: value.isPublic,
      });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (previewLogo && previewLogo.startsWith("blob:")) {
        URL.revokeObjectURL(previewLogo);
      }
      setPreviewLogo("");
      setLogoFile(null);
      form.reset();
    }

    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Add a new workspace to organize your forms and team members.
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
              name="isPublic"
              children={(field) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublic" className="text-sm font-medium">
                      {field.state.value ? "Public" : "Private"}
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      {field.state.value
                        ? "Visible to invited members"
                        : "Only visible to you"}
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            />

            <form.Field
              name="title"
              children={(field) => (
                <div className="grid gap-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Workspace Title
                  </label>

                  <Input
                    id={field.name}
                    placeholder="Acme Corp"
                    className="border-border text-foreground bg-background hover:border-primary/40 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            <form.Field name="logoUrl">
              {(urlField) => (
                <BrandingSelector
                  previewLogo={previewLogo}
                  urlValue={urlField.state.value}
                  onLogoChange={(url: string, file: File | null) => {
                    if (previewLogo && previewLogo.startsWith("blob:")) {
                      URL.revokeObjectURL(previewLogo);
                    }
                    setLogoFile(file);
                    setPreviewLogo(url);
                  }}
                  onUrlChange={(url: string) => {
                    urlField.handleChange(url);
                    setPreviewLogo(url);
                  }}
                  onRemove={() => {
                    if (previewLogo && previewLogo.startsWith("blob:")) {
                      URL.revokeObjectURL(previewLogo);
                    }
                    setPreviewLogo("");
                    setLogoFile(null);
                    urlField.handleChange("");
                  }}
                />
              )}
            </form.Field>
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
                  {isCreating ? (
                    <Spinner className="size-4" />
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
