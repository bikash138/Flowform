"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoogleIcon } from "@/assets/icons";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/rest-api/auth.api";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-background md:h-dvh md:max-h-dvh md:overflow-hidden md:overscroll-none">
      {/* Header */}
      <header className="flex shrink-0 w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-10">
        <Link href="/" className="flex items-center" id="signin-logo-link">
          <Image src="/logo.svg" alt="FlowForm" width={28} height={28} />
          <span className="text-lg font-bold tracking-tight text-foreground [font-family:var(--font-jakarta-sans)]">
            Flowform
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground sm:text-sm">
            Have a question?{"  "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary-dark"
              id="signin-contact-link"
            >
              Contact us
            </Link>
          </span>
        </div>
      </header>

      <main className="flex min-w-0 flex-1 flex-row gap-3 px-3 pb-6 pt-0 max-md:flex-none max-md:overflow-visible sm:gap-6 sm:px-5 sm:pb-6 md:min-h-0 md:overflow-hidden md:pb-4 md:gap-8 md:px-8 lg:px-10">
        <div className="hidden h-full max-w-[45%] min-h-0 flex-1 flex-col self-center overflow-hidden rounded-2xl bg-primary sm:rounded-none sm:rounded-tr-[3rem] sm:rounded-bl-[1rem] sm:rounded-br-[3rem] sm:rounded-tl-[1rem] md:flex md:max-h-[min(35rem,calc(100dvh-7rem))]">
          <div className="flex min-h-0 flex-1 items-center justify-center p-8 lg:p-12">
            <Image
              src="/form-preview.png"
              alt="Form builder preview"
              width={380}
              height={300}
              className="h-auto max-h-full w-full max-w-md object-contain"
              priority
            />
          </div>
        </div>

        {/* Right — sign-in */}
        <section className="flex w-full min-w-0 flex-none flex-col items-center justify-start py-4 max-md:overflow-visible md:h-full md:min-h-0 md:flex-1 md:justify-center md:overflow-hidden md:py-4">
          <div className="w-full max-w-[400px]">
            <h1 className="mb-1 text-2xl font-normal tracking-tight text-foreground sm:mb-2 sm:text-3xl">
              Sign in
            </h1>
            <p className="mb-6 text-xs leading-snug text-muted-foreground sm:mb-8 sm:text-sm sm:leading-relaxed">
              Continue building forms, gathering responses, and{" "}
              <br className="hidden sm:block" />
              automating your workflows.
            </p>

            <button
              type="button"
              id="signin-google-btn"
              onClick={() => signInWithGoogle(callbackUrl)}
              className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
