"use client";

import { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth";
import {
  useValidateInviteToken,
  useAcceptInvite,
} from "@/hooks/user/use-workspace-invite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Mail,
  Users,
  UserPlus,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  MailWarning,
} from "lucide-react";
import { toast } from "sonner";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const {
    data: invite,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useValidateInviteToken(token);

  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const session = sessionData?.session;
  const user = sessionData?.user;

  const acceptInvite = useAcceptInvite();

  const handleAccept = async () => {
    if (!token) return;
    acceptInvite.mutate(
      { token },
      {
        onSuccess: (data) => {
          router.push(`/workspace/${data.workspaceId}`);
        },
      },
    );
  };

  const handleLoginRedirect = () => {
    router.push(
      `/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`,
    );
  };

  const handleSignupRedirect = () => {
    router.push(
      `/signup?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`,
    );
  };

  const handleLogout = async () => {
    await authClient.signOut();
    toast.info("Logged out. Please sign in with the invited email.");
  };

  //Initial Loader
  if (isLoadingInvite || isSessionPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="size-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">
          Verifying invitation…
        </p>
      </div>
    );
  }

  if (inviteError || !invite) {
    const isNetworkError = inviteError?.message
      ?.toLowerCase()
      .includes("fetch");
    const errorMessage = isNetworkError
      ? "Unable to reach the server. Please check your connection and try again."
      : inviteError?.message ||
        "This invitation link is invalid, expired, or has already been used.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-destructive/10 mx-auto">
            <MailWarning className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Invalid Invite
            </h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-11"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isEmailMatching = user?.email === invite.email;

  return (
    <div className="min-h-screen flex items-stretch bg-background">
      {/* Ambient blobs — subtle, behind everything */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[140px]" />
      </div>

      {/* Centered wrapper — full height on md+, auto on mobile */}
      <div className="relative z-10 flex items-center justify-center w-full p-4 md:p-8">
        <div
          className="
            w-full max-w-4xl
            flex flex-col md:flex-row
            rounded-2xl overflow-hidden
            border border-border/60
            shadow-[0_8px_60px_rgba(0,0,0,0.08)]
            bg-card
            md:max-h-[calc(100vh-4rem)]
          "
        >
          {/*Left panel: branding */}
          <div
            className="
              md:w-[38%] shrink-0
              flex flex-col items-center justify-between
              text-center
              p-8 md:p-10
              border-b md:border-b-0 md:border-r border-border/50
              bg-muted/30
            "
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <Avatar className="size-20 md:size-24 ring-4 ring-background shadow-xl">
                  {invite.workspaceLogo ? (
                    <AvatarImage
                      src={invite.workspaceLogo}
                      alt={invite.workspaceName}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {invite.workspaceName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute -bottom-1.5 -right-1.5 bg-background border border-border rounded-full p-1.5 shadow-md">
                  <Users className="size-4 text-primary" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  You&apos;re invited!
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                  <span className="font-semibold text-foreground">
                    {invite.inviterName}
                  </span>{" "}
                  invited you to join{" "}
                  <span className="font-semibold text-foreground">
                    {invite.workspaceName}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Bottom Branding*/}
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/40 mt-6">
              <Image
                src="/logo.svg"
                alt="App logo"
                width={20}
                height={20}
                className="size-5 dark:invert opacity-60"
              />
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Flowform
              </span>
            </div>
          </div>

          {/*Right panel: details + actions */}
          <div className="flex-1 flex flex-col md:overflow-y-auto">
            <div className="flex-1 p-6 md:p-8 space-y-6">
              {/* Role & destination */}
              <section className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Role & Destination
                </p>
                <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium">
                      Assigned role
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px] px-2.5"
                    >
                      {invite.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium">
                      Target email
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {invite.email}
                    </span>
                  </div>
                </div>
              </section>

              {/* Account verification */}
              <section className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Account Verification
                </p>

                {!session ? (
                  /* Not logged in */
                  <div className="rounded-xl border border-primary/25 bg-primary-subtle p-4 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <MailWarning className="size-5 text-primary-dark dark:text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">
                          Sign in required
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Use{" "}
                          <span className="font-semibold text-foreground">
                            {invite.email}
                          </span>{" "}
                          — other accounts will be rejected.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleLoginRedirect}
                        className="flex-1 gap-2 font-semibold h-10 text-sm"
                      >
                        <UserPlus className="size-4" />
                        Sign In
                      </Button>
                      <Button
                        onClick={handleSignupRedirect}
                        variant="outline"
                        className="flex-1 font-semibold h-10 text-sm"
                      >
                        Create Account
                      </Button>
                    </div>
                  </div>
                ) : isEmailMatching ? (
                  /* Correct account */
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">
                        Signed in as{" "}
                        <span className="text-primary">{user?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your session matches the invited email. You&apos;re all
                        set.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Wrong account */
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <MailWarning className="size-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">
                          Account Conflict
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Signed in as{" "}
                          <span className="font-semibold text-foreground">
                            {user?.email}
                          </span>
                          . This invite is for{" "}
                          <span className="font-semibold text-foreground">
                            {invite.email}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="flex-1 gap-2 font-semibold h-10 text-sm"
                      >
                        <LogOut className="size-4" />
                        Switch Account
                      </Button>
                      <Button
                        onClick={handleLoginRedirect}
                        variant="outline"
                        className="flex-1 font-semibold h-10 text-sm"
                      >
                        Sign In Again
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* CTA footer */}
            <div className="p-6 md:p-8 border-t border-border/50 space-y-2.5">
              <Button
                onClick={handleAccept}
                disabled={
                  !session || !isEmailMatching || acceptInvite.isPending
                }
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/15 active:scale-[0.99] transition-transform"
              >
                {acceptInvite.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="size-5 mr-2" />
                    Join {invite.workspaceName} Team
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Joining grants you{" "}
                <span className="font-bold uppercase tracking-wide">
                  {invite.role}
                </span>{" "}
                access to all workspace assets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
