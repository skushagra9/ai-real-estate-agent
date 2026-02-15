import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config: no Prisma, no bcrypt.
 * Used by middleware so it reads the session with the same cookie/secret as full auth (Auth.js v5).
 * getToken from next-auth/jwt (v4 style) expected next-auth.session-token; v5 uses authjs.session-token.
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
        token.partnerId = user.partnerId ?? null;
      }
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.partnerId = token.partnerId;
      }
      return session;
    },
    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      const resolved = url.startsWith("/") ? `${baseUrl}${url}` : url;
      if (resolved.includes("/login") || resolved.includes("/signin")) return `${baseUrl}/`;
      if (new URL(resolved).origin === baseUrl) return resolved;
      return `${baseUrl}/`;
    },
  },
  cookies: {
    sessionToken: {
      options: {
        path: "/",
        sameSite: "lax" as const,
      },
    },
  },
  providers: [], // no providers in Edge; only used to read session
} satisfies NextAuthConfig;

export const { auth: edgeAuth } = NextAuth(authConfig);
