/**
 * Shared cron-secret check.
 *
 * Vercel Cron sets the Authorization header to `Bearer ${CRON_SECRET}` on
 * scheduled invocations (when `CRON_SECRET` is configured in the project).
 * Reject anything else so the handlers are not publicly invokable.
 */
import { NextResponse } from "next/server";

export function assertCronAuthorized(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // No secret configured — allow in dev so devs can hit the URL manually.
    return null;
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
