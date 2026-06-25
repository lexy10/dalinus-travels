/**
 * Next.js middleware (edge runtime).
 *
 * Only imports the edge-safe auth config — no Node-only modules. Gates the
 * `/dashboard/*` and `/admin/*` routes via the `authorized` callback in
 * `authConfig`.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/infra/auth/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match everything except Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|hero.jpg|.*\\.).*)"],
};
