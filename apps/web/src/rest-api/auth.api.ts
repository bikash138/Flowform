import env from "@/config/env";
import { authClient } from "@/lib/auth";
import {
  handlePublicApiError,
  redirectToServerUnavailable,
} from "@/utils/api-error";

function safeCallbackPath(callbackUrl?: string | null): string {
  if (!callbackUrl) return "/ws";
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return "/ws";
  return callbackUrl;
}

export const signInWithGoogle = async (callbackUrl?: string | null) => {
  try {
    return await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_CLIENT_URL}${safeCallbackPath(callbackUrl)}`,
      },
      {
        onError: (ctx) => handlePublicApiError("sign-in", ctx.response),
      },
    );
  } catch {
    redirectToServerUnavailable();
  }
};
