import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Copy, Check, UserX } from "lucide-react";
import { useCreateInvite } from "@/hooks/user/use-workspace-invite";

interface InviteMemberTabProps {
  workspaceId: string;
  isLimitReached?: boolean;
}

export function InviteMemberTab({ workspaceId, isLimitReached }: InviteMemberTabProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: createInvite, isPending } = useCreateInvite();

  const form = useForm({
    defaultValues: {
      email: "",
      role: "VIEWER" as "ADMIN" | "EDITOR" | "VIEWER",
    },
    onSubmit: async ({ value }) => {
      createInvite(
        { workspaceId, email: value.email, role: value.role },
        {
          onSuccess: (data) => {
            form.reset();
            setInviteLink(data.inviteLink);
          },
        },
      );
    },
  });

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {isLimitReached ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <UserX className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Member limit reached</span>
            <p className="text-xs text-muted-foreground">
              You&apos;ve hit the member cap for your current plan. Upgrade to invite more people.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Invite a new member
            </span>
            <p className="text-xs text-muted-foreground">
              Send an email invitation to collaborate on your workspace. They will
              be added as pending until they accept.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex gap-2 items-start"
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value || !value.includes("@") ? "Invalid email" : undefined,
              }}
              children={(field) => (
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="h-9 text-sm bg-background border-border w-full"
                  />
                  {field.state.meta.errors.length > 0 &&
                    field.state.meta.isTouched && (
                      <span className="text-[10px] text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                </div>
              )}
            />

            <form.Field
              name="role"
              children={(field) => (
                <Select
                  value={field.state.value.toLowerCase()}
                  onValueChange={(val) =>
                    field.handleChange(val.toUpperCase() as any)
                  }
                >
                  <SelectTrigger className="h-9 text-xs w-[100px] shrink-0 border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                    <SelectItem value="editor" className="text-xs">Editor</SelectItem>
                    <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit]) => (
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-4 text-xs shrink-0 gap-1.5"
                  disabled={!canSubmit || isPending}
                >
                  <Send className="size-3.5" />
                  {isPending ? "Inviting..." : "Invite"}
                </Button>
              )}
            />
          </form>

          {inviteLink && (
            <div className="mt-4 p-3 border border-border bg-muted/30 rounded-md flex flex-col gap-2">
              <p className="text-xs font-medium text-foreground">
                Invitation Sent! You can also share this direct link:
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  value={inviteLink}
                  readOnly
                  className="h-8 text-xs bg-muted/50 font-mono text-muted-foreground"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="h-8 px-3 shrink-0 gap-1.5"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
