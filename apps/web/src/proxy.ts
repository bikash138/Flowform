import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth";
import { getRetryAfterSeconds } from "@/utils/rate-limit";

const SESSION_TIMEOUT_MS = 2500;

type SessionUser = {
  role?: string | null;
  personalWorkspaceId?: string | null;
};

type SessionLookup =
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated" }
  | { status: "rate-limited"; retryAfter: number }
  | { status: "unavailable" };


async function lookupSession(req: NextRequest): Promise<SessionLookup> {
  let retryAfter = 0;

  try {
    const { data, error } = await authClient.getSession({
      fetchOptions: {
        headers: { cookie: req.headers.get("cookie") ?? "" },
        // Avoids the server unavailabel scenario
        signal: AbortSignal.timeout(SESSION_TIMEOUT_MS),
        onError: (ctx) => {
          retryAfter = getRetryAfterSeconds(ctx.response);
        },
      },
    });
    
    if (error?.status === 429) {
      return { status: "rate-limited", retryAfter };
    }

    if (error) return { status: "unavailable" };

    if (!data?.session) return { status: "unauthenticated" };

    return { status: "authenticated", user: data.user };
  } catch {
    return { status: "unavailable" };
  }
}

function isProtected(pathname: string): boolean {
  return (
    pathname.startsWith("/ws") ||
    pathname.startsWith("/forms") ||
    pathname.startsWith("/admin")
  );
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const result = await lookupSession(req);

  if (result.status === "unavailable") {
    return NextResponse.rewrite(new URL("/server-unavailable", req.url), {
      status: 503,
    });
  }

  if (result.status === "rate-limited") {
    const url = new URL("/server-unavailable", req.url);
    url.searchParams.set("reason", "rate-limit");
    if (result.retryAfter > 0) {
      url.searchParams.set("retryAfter", String(result.retryAfter));
    }
    return NextResponse.rewrite(url, { status: 429 });
  }

  if (result.status === "unauthenticated") {
    return isProtected(pathname)
      ? NextResponse.redirect(new URL("/signup", req.url))
      : NextResponse.next();
  }

  const { user } = result;
  const role = user?.role;

  if (!role) {
    return isProtected(pathname)
      ? NextResponse.redirect(new URL("/signup", req.url))
      : NextResponse.next();
  }

  const workspaceUrl = user.personalWorkspaceId
    ? `/ws/${user.personalWorkspaceId}`
    : null;

  if (pathname.startsWith("/signup")) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL(workspaceUrl ?? "/ws", req.url));
  }

  if (role === "admin") {
    if (pathname.startsWith("/ws") || pathname.startsWith("/forms")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(workspaceUrl ?? "/ws", req.url));
  }

  if ((pathname === "/ws" || pathname === "/ws/") && workspaceUrl) {
    return NextResponse.redirect(new URL(workspaceUrl, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ws/:path*", "/forms/:path*", "/admin/:path*", "/signup"],
};
