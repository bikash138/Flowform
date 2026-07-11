"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleIcon } from "@/assets/icons";
import { signInWithGoogle } from "@/rest-api/auth.api";

export function SignupOptions() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return (
    <div className="w-full">
      <button
        type="button"
        id="signup-google-btn"
        onClick={() => signInWithGoogle(callbackUrl)}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <GoogleIcon />
        <span>Sign up with Google</span>
      </button>

      <p className="mt-6 text-xs leading-relaxed text-foreground/62">
        By signing up you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Terms of Service
        </Link>
        ,{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/dpa"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Data Processing Agreement
        </Link>
        .
      </p>
    </div>
  );
}
