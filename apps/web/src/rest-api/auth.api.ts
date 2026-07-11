import env from "@/config/env";
import { authClient } from "@/lib/auth";

function safeCallbackPath(callbackUrl?: string | null): string {
  if (!callbackUrl) return "/ws";
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return "/ws";
  return callbackUrl;
}

export const signInWithGoogle = async (callbackUrl?: string | null) => {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL: `${env.NEXT_PUBLIC_CLIENT_URL}${safeCallbackPath(callbackUrl)}`,
  });
};
