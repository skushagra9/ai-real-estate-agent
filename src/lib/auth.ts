import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn("[Auth] authorize: missing email or password");
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { partner: true },
          });

          if (!user) {
            console.warn("[Auth] authorize: no user for email", email);
            return null;
          }
          if (!user.isActive) {
            console.warn("[Auth] authorize: user inactive", email);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!isValid) {
            console.warn("[Auth] authorize: invalid password for", email);
            return null;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            partnerId: user.partnerId,
          };
        } catch (err) {
          console.error("[Auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  // callbacks (jwt, session, redirect) and cookies come from auth.config
});
