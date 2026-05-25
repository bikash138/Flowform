"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutModal } from "@/components/modals/sign-out-modal";
import { User, LogOut, Sparkles } from "lucide-react";

export function UserAvatar() {
  const { data: session, isPending } = authClient.useSession();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const user = session?.user || null;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  if (isPending) {
    return (
      <Skeleton className="size-7 rounded-full bg-muted/40 border border-border" />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-opacity hover:opacity-80">
            <Avatar className="size-7 cursor-pointer border border-primary/30">
              <AvatarImage
                src={user?.image || undefined}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 mt-2 z-[100] p-0 overflow-hidden"
        >
          {/* User identity header */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border-2 border-primary/30 shrink-0">
                <AvatarImage
                  src={user?.image || undefined}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {user?.name || "My Account"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            {/* Plan badge */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
              <Sparkles className="size-3 text-primary-dark" />
              <span className="text-[10px] font-semibold text-primary-dark tracking-wide uppercase">
                Pro Plan
              </span>
            </div>
          </div>

          <div className="p-1.5">
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md text-sm focus:bg-muted/40"
            >
              <Link
                href="/profile"
                className="flex items-center w-full gap-2.5"
              >
                <div className="flex items-center justify-center size-6 rounded-md bg-muted/50">
                  <User className="size-3.5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">
                  Profile settings
                </span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={() => setIsSignOutModalOpen(true)}
              className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md text-sm text-destructive focus:text-destructive focus:bg-destructive/5"
            >
              <div className="flex items-center justify-center size-6 rounded-md bg-destructive/8">
                <LogOut className="size-3.5" />
              </div>
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
    </>
  );
}
