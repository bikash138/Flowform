"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { GoogleIcon, GitHubIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
} from "@/rest-api/auth.api";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const result = await signInWithEmail({
        email: value.email,
        password: value.password,
        callbackURL: callbackUrl || undefined,
      });

      // Only manually redirect if Better Auth isn't handling a callbackUrl
      if (!callbackUrl && result.data) {
        const dest = result.data.user.personalWorkspaceId
          ? `/ws/${result.data.user.personalWorkspaceId}`
          : "/ws";
        router.push(dest);
      }
    },
  });

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

        {/* Right — sign-in form */}
        <section className="flex w-full min-w-0 flex-none flex-col items-center justify-start py-4 max-md:overflow-visible md:h-full md:min-h-0 md:flex-1 md:justify-center md:overflow-hidden md:py-4">
          <div className="w-full max-w-[400px]">
            <h1 className="mb-1 text-2xl font-normal tracking-tight text-foreground sm:mb-2 sm:text-3xl">
              Sign in
            </h1>
            <p className="mb-4 text-xs leading-snug text-muted-foreground sm:mb-6 sm:text-sm sm:leading-relaxed md:mb-8">
              Continue building forms, gathering responses, and{" "}
              <br className="hidden sm:block" />
              automating your workflows.
            </p>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                id="signin-google-btn"
                onClick={() => signInWithGoogle(callbackUrl || undefined)}
                className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                id="signin-github-btn"
                onClick={() => signInWithGithub(callbackUrl || undefined)}
                className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <GitHubIcon />
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-3 flex items-center gap-3 sm:my-5 md:my-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Email Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-3">
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "Email is required";
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                        return "Please enter a valid email";
                      return undefined;
                    },
                    onBlur: ({ value }) => {
                      if (!value) return "Email is required";
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                        return "Please enter a valid email";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="signin-email"
                        className="mb-1.5 block text-sm font-normal text-foreground"
                      >
                        Email<span className="text-foreground">*</span>
                      </label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Email address"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-11 rounded-lg border-border bg-background px-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20"
                      />
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="mt-1.5 text-xs text-destructive">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "Password is required";
                      if (value.length < 8) return "At least 8 characters";
                      return undefined;
                    },
                    onBlur: ({ value }) => {
                      if (!value) return "Password is required";
                      if (value.length < 8)
                        return "Password must be at least 8 characters";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="signin-password"
                        className="mb-1.5 block text-sm font-normal text-foreground"
                      >
                        Password<span className="text-foreground">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-11 rounded-lg border-border bg-background px-3.5 pr-11 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20"
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="mt-1.5 text-xs text-destructive">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    id="signin-email-btn"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-foreground text-sm font-semibold text-background shadow-sm transition-all duration-200 hover:bg-foreground/90 hover:shadow-md active:scale-[0.99]"
                  >
                    {isSubmitting ? "Continuing\u2026" : "Continue with email"}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            {/* Sign Up Link */}
            <div className="mt-5 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary-dark"
                  id="signin-signup-link"
                >
                  Sign up.
                </Link>
              </p>
            </div>
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
