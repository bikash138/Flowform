"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignOutModal({ isOpen, onClose }: SignOutModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/signin");
          },
        },
      });
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">
        {/* Icon + header area */}
        <div className="flex flex-col items-center text-center px-8 pt-8 pb-6">
          <div className="mb-4 flex items-center justify-center size-14 rounded-2xl bg-primary-subtle border border-primary/20">
            <LogOut className="size-6 text-primary-dark" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground mb-1.5">
            Sign out?
          </DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
            You'll need to sign back in to access your workspaces and forms.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-0" />

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 font-medium h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex-1 h-9 font-semibold gap-2 bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {isLoading ? (
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
