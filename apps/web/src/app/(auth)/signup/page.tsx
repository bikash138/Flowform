import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { SignupPreviewCarousel } from "@/components/auth/signup-preview-carousel";
import { SignupSwappableSection } from "@/components/auth/email-signup-section";

type SignUpPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

function isEmailModeFromSearchParams(
  mode: string | string[] | undefined,
): boolean {
  if (mode === undefined) return false;
  return (Array.isArray(mode) ? mode[0] : mode) === "email";
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const sp = await searchParams;
  const isEmailMode = isEmailModeFromSearchParams(sp.mode);

  return (
    <div className="flex min-h-dvh flex-col bg-background md:h-dvh md:max-h-dvh md:flex-row md:overflow-hidden">
      <div className="flex flex-1 flex-col">
        <header className="flex shrink-0 w-full items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-foreground/72">
            <Globe className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="font-medium">English</span>
            <ChevronDown
              className="size-3 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/72">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-foreground hover:text-primary-dark transition-colors"
              id="signup-login-link"
            >
              Sign in
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[360px] flex flex-col items-center text-center">
            <Link
              href="/"
              className="flex items-center gap-2 mb-6"
              id="signup-logo-link"
            >
              <Image src="/logo.svg" alt="FlowForm" width={32} height={32} />
              <span className="text-2xl font-bold tracking-tight text-foreground [font-family:var(--font-jakarta-sans)]">
                Flowform
              </span>
            </Link>

            <p className="mb-8 max-w-xs text-balance text-base leading-relaxed text-foreground/82 sm:max-w-sm sm:text-lg sm:leading-relaxed">
              Build beautiful forms, collect responses, and automate your
              {"\u00A0"}workflows.
            </p>

            <Suspense>
              <SignupSwappableSection isEmailMode={isEmailMode} />
            </Suspense>
          </div>
        </main>
      </div>

      <div className="hidden md:flex md:w-[48%] lg:w-[52%] flex-col bg-[#1a1523] text-white overflow-hidden">
        <SignupPreviewCarousel />
      </div>
    </div>
  );
}
