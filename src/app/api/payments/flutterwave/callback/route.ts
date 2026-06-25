import { NextResponse } from "next/server";
import { paymentService } from "@/infra/composition";

/**
 * Flutterwave redirects the user here after hosted checkout with
 * `transaction_id`, `tx_ref`, and `status` query params. We always verify
 * server-side via `paymentService.confirmFromVerification`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transaction_id");
  if (!transactionId) {
    return NextResponse.redirect(new URL("/dashboard/bookings?payment=missing", url));
  }

  const result = await paymentService.confirmFromVerification(transactionId);
  const next = new URL("/dashboard/bookings", url);
  next.searchParams.set("payment", result.ok ? "confirmed" : "failed");
  return NextResponse.redirect(next);
}
