import { NextResponse } from "next/server";
import { assertCronAuthorized } from "../_authorize";
import { bookingRepo, paymentService } from "@/infra/composition";

const TIMEOUT_THRESHOLD_MS = 60 * 1000; // Req 13.5

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const all = await bookingRepo.list({ offset: 0, limit: 500 });
  const cutoff = new Date(Date.now() - TIMEOUT_THRESHOLD_MS);
  const stale = all.filter(
    (b) => b.status === "PendingPayment" && b.createdAt <= cutoff,
  );

  let timedOut = 0;
  for (const b of stale) {
    await paymentService.handleTimeout(b.id);
    timedOut += 1;
  }

  return NextResponse.json({ ok: true, inspected: all.length, timedOut });
}
