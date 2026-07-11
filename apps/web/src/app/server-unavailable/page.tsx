import Image from "next/image";
import { ServerCrash, Hourglass } from "lucide-react";
import { RetryButton } from "@/components/common/retry-button";
import { formatRetryAfter } from "@/utils/rate-limit";

export const metadata = {
  title: "Server unavailable — Flowform",
};

type PageProps = {
  searchParams: Promise<{ reason?: string; retryAfter?: string }>;
};

export default async function ServerUnavailablePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const isRateLimited = sp.reason === "rate-limit";
  const retryAfter = Number(sp.retryAfter ?? 0);

  const Icon = isRateLimited ? Hourglass : ServerCrash;

  const heading = isRateLimited ? "Too many requests" : "Server unavailable";

  // Reachable both from the proxy (signed in, mid-navigation) and from a failed
  // sign-in on the public page (not signed in, no workspace). The copy must
  // hold in both, so it claims nothing about the user's session.
  const body = isRateLimited
    ? `Too many requests came through in a short time, so we've paused things briefly. Nothing is broken — try again in ${formatRetryAfter(retryAfter)}.`
    : "We can't reach our servers right now. This is a problem on our end, not yours — please try again in a moment.";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/logo.svg" alt="FlowForm" width={28} height={28} />
          <span className="text-lg font-bold tracking-tight text-foreground [font-family:var(--font-jakarta-sans)]">
            Flowform
          </span>
        </div>

        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle">
          <Icon className="size-6 text-primary-dark" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          {heading}
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>

        <RetryButton />
      </div>
    </div>
  );
}
