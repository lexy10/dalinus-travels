import { NextResponse } from "next/server";
import { paymentGateway, paymentService } from "@/infra/composition";

interface FlwWebhookPayload {
  readonly data?: { readonly id?: number | string };
}

export async function POST(request: Request) {
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  if (!paymentGateway.verifyWebhookSignature(headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = (await request.json()) as FlwWebhookPayload;
  const transactionId = payload.data?.id ? String(payload.data.id) : "";
  if (!transactionId) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
  }

  const result = await paymentService.confirmFromVerification(transactionId);
  return NextResponse.json({ ok: result.ok });
}
