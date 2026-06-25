import { NextResponse } from "next/server";
import { assertCronAuthorized } from "../_authorize";
import { notificationRepo, notificationService } from "@/infra/composition";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const pending = await notificationRepo.listPendingDelivery();
  let delivered = 0;
  let failed = 0;
  let throttled = 0;
  let undelivered = 0;

  for (const n of pending) {
    if (n.channel !== "email") continue;
    const result = await notificationService.attemptDelivery(n.id);
    if (!result.ok) continue;
    if (result.value.delivered) delivered += 1;
    else if (result.value.throttled) throttled += 1;
    else if (result.value.undelivered) undelivered += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: true,
    inspected: pending.length,
    delivered,
    failed,
    throttled,
    undelivered,
  });
}
