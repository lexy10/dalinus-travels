/**
 * Auth.js v5 *base* config — edge-safe.
 *
 * This file MUST NOT import Node-only modules (Prisma, bcrypt, etc.) because
 * Next.js middleware runs on the edge runtime and will fail at build time
 * if any of its transitive imports are Node-only. Provider configuration
 * with secrets that need Node lives in `auth.ts`.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    /**
     * Edge-safe route protection. The middleware uses this to gate the
     * dashboard area; service-level authorization (status / profile /
     * recruiter-approval) is checked downstream by `assertDashboardAccess`.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      if (isOnDashboard || isOnAdmin) {
        return isLoggedIn;
      }
      return true;
    },
    /**
     * Mirror the user id and email onto the JWT so downstream pages can read
     * them from `auth()` without a DB hit.
     */
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // Concrete providers live in `auth.ts`
} satisfies NextAuthConfig;
