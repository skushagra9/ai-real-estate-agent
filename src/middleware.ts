import { NextResponse } from "next/server";
import { edgeAuth } from "@/lib/auth.config";

/**
 * Auth.js v5: use auth() so the session is read with the v5 cookie (authjs.session-token).
 * getToken from next-auth/jwt expected the v4 cookie name → session was always null in prod.
 */
export default edgeAuth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/status") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (req.auth.user as { role?: string }).role;
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/partner/dashboard", req.url));
  }
  if (pathname.startsWith("/partner") && role !== "PARTNER") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
