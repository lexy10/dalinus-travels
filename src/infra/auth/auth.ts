/**
 * Auth.js v5 — Node-runtime config + handlers.
 *
 * Wires the Credentials provider through our framework-agnostic AuthService,
 * and the Google provider through `upsertFromGoogle`. The middleware only
 * imports `./auth.config` (edge-safe); call sites in server components,
 * server actions, and route handlers import `auth` from here.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { authService, userRepo } from "@/infra/composition";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email : "";
        const password = typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;

        const result = await authService.login({ email, password });
        if (!result.ok) return null;

        return {
          id: result.value.id,
          email: result.value.email,
          name: result.value.email,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * For the Google provider, upsert a User record on first sign-in. The
     * Credentials provider already has a row by the time it reaches here, so
     * it skips this branch.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const googleId = account.providerAccountId;
      const email = user.email;
      if (!googleId || !email) return false;
      const upsert = await authService.upsertFromGoogle({
        googleId,
        email,
        name: user.name ?? undefined,
      });
      if (!upsert.ok) return false;
      // Hydrate the user object so the JWT callback below uses our id, not
      // Google's, as `token.sub`.
      user.id = upsert.value.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      } else if (token.sub) {
        // Refresh email from DB if it ever changes
        const fresh = await userRepo.findById(token.sub);
        if (fresh) token.email = fresh.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
