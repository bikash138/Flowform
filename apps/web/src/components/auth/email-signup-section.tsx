"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { GoogleIcon } from "@/assets/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpWithEmail, signInWithGoogle } from "@/rest-api/auth.api";

type SignupSwappableSectionProps = {
  isEmailMode: boolean;
};

export function SignupSwappableSection({
  isEmailMode,
}: SignupSwappableSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      agreed: false,
    },
    onSubmit: async ({ value }) => {
      const result = await signUpWithEmail({
        name: value.name,
        email: value.email,
        password: value.password,
        callbackURL: callbackUrl || undefined,
      });
      if (!callbackUrl && result.data) {
        const dest = result.data.user.personalWorkspaceId
          ? `/ws/${result.data.user.personalWorkspaceId}`
          : "/ws";
        router.push(dest);
      }
    },
  });

  return (
    <div className="w-full min-h-[300px]">
      {isEmailMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex w-full flex-col gap-3 text-left"
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Name is required";
                return undefined;
              },
              onBlur: ({ value }) => {
                if (!value) return "Name is required";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <Input
                  id="signup-name-input"
                  type="text"
                  placeholder="Full Name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="h-12 rounded-lg border-border bg-background px-4 text-sm text-foreground placeholder:text-foreground/48 focus-visible:border-primary focus-visible:ring-primary/20"
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
              <div>
                <Input
                  id="signup-email-input"
                  type="email"
                  placeholder="Email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="h-12 rounded-lg border-border bg-background px-4 text-sm text-foreground placeholder:text-foreground/48 focus-visible:border-primary focus-visible:ring-primary/20"
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
                if (value.length < 8)
                  return "Password must be at least 8 characters";
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
              <div>
                <div className="relative">
                  <Input
                    id="signup-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="h-12 rounded-lg border-border bg-background px-4 pr-11 text-sm text-foreground placeholder:text-foreground/48 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm text-primary-dark/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

          <form.Field
            name="agreed"
            validators={{
              onChange: ({ value }) =>
                !value ? "You must agree to continue" : undefined,
            }}
          >
            {(field) => (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  onBlur={field.handleBlur}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <span className="text-xs leading-relaxed text-foreground/78">
                  I agree to the{" "}
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
                    Data Processing Agreement.
                  </Link>
                </span>
              </label>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) =>
              [state.isSubmitting, state.values.agreed] as const
            }
          >
            {([isSubmitting, agreed]) => (
              <Button
                type="submit"
                id="signup-create-btn"
                disabled={!agreed || isSubmitting}
                className="mt-1 h-12 w-full rounded-lg bg-foreground text-sm font-semibold text-background shadow-sm transition-all duration-200 hover:bg-foreground/90 hover:shadow-md active:scale-[0.99] disabled:opacity-40"
              >
                {isSubmitting
                  ? "Creating account\u2026"
                  : "Create my free account"}
              </Button>
            )}
          </form.Subscribe>

          <Link
            href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="mt-1 flex items-center justify-center gap-1.5 text-xs text-foreground/68 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to all options
          </Link>
        </form>
      ) : (
        <>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              id="signup-google-btn"
              onClick={() => signInWithGoogle(callbackUrl || undefined)}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>

          </div>

          <div className="my-5 flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground/58">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Link
            href={`/signup?mode=email${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            id="signup-email-btn"
            className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition-all duration-200 hover:bg-foreground/90 hover:shadow-md active:scale-[0.99]"
          >
            Sign up with email
          </Link>

          <p className="mt-6 text-xs leading-relaxed text-foreground/62">
            By signing up you agree to our{" "}
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
        </>
      )}
    </div>
  );
}
