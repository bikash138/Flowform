"use client";

import { useState, useDeferredValue } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Eye,
  FileText,
  Clock,
  MessageSquare,
  AlignJustify,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExploreForms } from "@/hooks/user/use-public-form";
import type { ExploreFormCard } from "@flowform/services/public";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(ms: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  return `~${minutes} min`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── Form card ───────────────────────────────────────────────────────────────

function FormCard({ item }: { item: ExploreFormCard }) {
  const href = `/form/${item.slug ?? item.id}`;
  const duration = formatDuration(item.avgTimeMs);
  const isConversational = item.formLayout === "conversational";

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Accent strip — only primaryColor, no images */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: item.primaryColor }}
      />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Title + description */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-2">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {isConversational ? (
              <>
                <MessageSquare className="size-3" />
                Conversational
              </>
            ) : (
              <>
                <AlignJustify className="size-3" />
                Classic
              </>
            )}
          </span>
          {item.collectEmail && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Mail className="size-3" />
              Collects email
            </span>
          )}
        </div>

        {/* Meta row — questions + completion time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="size-3.5 shrink-0" />
            {item.questionCount}{" "}
            {item.questionCount === 1 ? "question" : "questions"}
          </span>
          {duration && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {duration}
              </span>
            </>
          )}
        </div>

        {/* Analytics row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5 shrink-0" />
            {formatCount(item.views)} views
          </span>
          <span className="text-border">·</span>
          <span>{formatCount(item.submissions)} responses</span>
          {item.publishedAt && (
            <>
              <span className="text-border">·</span>
              <span className="ml-auto">{timeAgo(item.publishedAt)}</span>
            </>
          )}
        </div>

        {/* CTA */}
        <Link href={href} className="mt-auto" target="_blank" rel="noopener noreferrer">
          <Button
            variant="outline"
            className="w-full h-9 text-sm font-medium gap-1.5 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors duration-200"
          >
            Fill out form
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}

// ─── Skeleton card ───────────────────────────────────────────────────────────

function FormCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      <div className="h-1.5 w-full bg-muted animate-pulse" />
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
          <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
          <div className="h-3 w-2/3 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-24 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-3 w-1/2 bg-muted rounded-md animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded-md animate-pulse" />
        <div className="h-9 w-full bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Search className="size-6 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        {search ? `No results for "${search}"` : "No public forms yet"}
      </p>
      <p className="text-sm text-muted-foreground">
        {search
          ? "Try a different keyword."
          : "Be the first to publish a public form!"}
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Defer the search so typing doesn't fire a request on every keystroke
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, isFetching } = useExploreForms(deferredSearch, limit);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLimit(PAGE_SIZE); // reset pagination on new search
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const isStale = deferredSearch !== search || isFetching;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5"
          aria-label="Flowform home"
        >
          <Image src="/logo.svg" alt="Flowform" width={26} height={26} />
          <span className="text-base font-bold tracking-tight text-foreground [font-family:var(--font-jakarta-sans)]">
            Flowform
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/signin">
            <Button variant="ghost" size="sm" className="text-sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-sm">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Explore public forms
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Discover forms created by the community. Fill them out or get
            inspired.
          </p>
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="relative max-w-sm mx-auto mb-8">
          {isStale && !isLoading ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            placeholder="Search forms…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-11"
            aria-label="Search forms"
          />
        </div>

        {/* ── Result count ──────────────────────────────────────────────── */}
        {!isLoading && data && (
          <p className="text-sm text-muted-foreground mb-6 text-center">
            {total === 0
              ? null
              : `Showing ${items.length} of ${total} form${total === 1 ? "" : "s"}`}
          </p>
        )}

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <FormCardSkeleton key={i} />
            ))
          ) : items.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            items.map((item) => <FormCard key={item.id} item={item} />)
          )}
        </div>

        {/* ── Load more ─────────────────────────────────────────────────── */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              className="min-w-32"
              disabled={isFetching}
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
            >
              {isFetching ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Flowform
        </Link>{" "}
        · Build and share beautiful forms
      </footer>
    </div>
  );
}
