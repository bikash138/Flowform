import env from "@/config/env";
import { authClient } from "@/lib/auth";
import { toast } from "sonner";

export const signUpWithEmail = async (
  data: Parameters<typeof authClient.signUp.email>[0],
) => {
  return await authClient.signUp.email(data, {
    onSuccess: (ctx) => {
      toast.success("Account created successfully!");
      if (data.callbackURL) {
        window.location.href = data.callbackURL;
      }
    },
    onError: (ctx) => {
      toast.error(ctx.error.message || "Sign-up failed");
    },
  });
};

export const signInWithEmail = async (
  data: Parameters<typeof authClient.signIn.email>[0],
) => {
  return await authClient.signIn.email(data, {
    onSuccess: (ctx) => {
      toast.success("Signed in successfully!");
      if (data.callbackURL) {
        window.location.href = data.callbackURL;
      }
    },
    onError: (ctx) => {
      toast.error(ctx.error.message || "Sign-in failed");
    },
  });
};

export const signInWithGithub = async (callbackUrl?: string) => {
  return await authClient.signIn.social({
    provider: "github",
    callbackURL: callbackUrl || `${env.NEXT_PUBLIC_CLIENT_URL}/workspace`,
  });
};

export const signInWithGoogle = async (callbackUrl?: string) => {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL: callbackUrl || `${env.NEXT_PUBLIC_CLIENT_URL}/workspace`,
  });
};
