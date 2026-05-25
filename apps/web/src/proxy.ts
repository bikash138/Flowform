import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    },
  });

  const session = data?.session;
  const user = data?.user;

  const hasAuthSession = Boolean(session);

  if (!hasAuthSession) {
    if (
      pathname.startsWith("/ws") ||
      pathname.startsWith("/forms") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    return NextResponse.next();
  }

  const role = user?.role;

  if (!role) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
    const redirectUrl = role === "admin" ? "/admin" : "/ws";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  if (role === "user") {
    const workspaceUrl = user?.personalWorkspaceId
      ? `/ws/${user.personalWorkspaceId}`
      : "/ws";
    if (
      pathname.startsWith("/admin") ||
      pathname === "/ws" ||
      pathname === "/ws/"
    ) {
      return NextResponse.redirect(new URL(workspaceUrl, req.url));
    }
  }

  if (role === "admin") {
    if (pathname.startsWith("/ws") || pathname.startsWith("/forms")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ws/:path*",
    "/forms/:path*",
    "/admin/:path*",
    "/signin",
    "/signup",
  ],
};
