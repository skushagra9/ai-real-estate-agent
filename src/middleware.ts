import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware runs in the Edge runtime and must not import @/lib/auth
 * (that would pull in Prisma/bcrypt and Node's crypto).
 * We use getToken from next-auth/jwt to read the session and enforce role-based redirects.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth check
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/status") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.sub) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string | undefined;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/partner/dashboard", req.url));
  }

  if (pathname.startsWith("/partner") && role !== "PARTNER") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
