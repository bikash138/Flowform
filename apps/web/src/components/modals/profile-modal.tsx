"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWorkspaces } from "@/hooks/user/use-workspace-core";
import {
  LogOut,
  Loader2,
  Mail,
  ShieldCheck,
  LayoutGrid,
  Lock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: workspaces = [] } = useWorkspaces();

  const user = session?.user;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const privateCount = workspaces.filter((w) => w.isPrivate && !w.isPersonal).length;
  const publicCount = workspaces.filter((w) => !w.isPrivate && !w.isPersonal).length;
  const totalCount = workspaces.length;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully");
          onOpenChange(false);
          router.push("/signup");
        },
      },
    });
    setIsSigningOut(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        {/* Header — avatar + name + email */}
        <div className="relative flex flex-col items-center text-center px-6 pt-8 pb-6">
          {/* Subtle ambient glow */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/6 to-transparent pointer-events-none" />

          <div className="relative z-10 mb-3">
            <Avatar className="size-20 ring-4 ring-background shadow-lg">
              <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {user?.isActive && (
              <span className="absolute bottom-0.5 right-0.5 size-4 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>

          <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
            {user?.name || "Unknown User"}
          </DialogTitle>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="size-3 shrink-0" />
            {user?.email}
          </p>
        </div>

        <Separator />

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { label: "Total", value: totalCount, icon: LayoutGrid },
            { label: "Private", value: privateCount, icon: Lock },
            { label: "Public", value: publicCount, icon: Globe },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-0.5">
              <Icon className="size-3.5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Account details */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Account Details
          </p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-3.5" />
              Role
            </span>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              user?.role === "admin"
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground",
            )}>
              {user?.role || "member"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="size-3.5" />
              Status
            </span>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              user?.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700",
            )}>
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Footer — sign out */}
        <div className="px-5 py-4">
          <Button
            variant="outline"
            className="w-full h-9 text-sm font-semibold gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50 transition-colors"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
