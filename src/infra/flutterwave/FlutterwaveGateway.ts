/**
 * Flutterwave Standard checkout adapter for the PaymentGateway port.
 *
 * - `initiate` calls Flutterwave's `/v3/payments` to create a hosted-checkout
 *   session and returns the redirect URL.
 * - `verify` calls `/v3/transactions/:id/verify` and maps the outcome to our
 *   typed `PaymentVerificationResult`.
 * - `verifyWebhookSignature` checks the `verif-hash` header against
 *   `FLW_WEBHOOK_HASH`.
 *
 * Stub mode: when `FLW_SECRET_KEY` is unset, `initiate` returns a synthetic
 * URL and `verify` flags every request as "pending" so dev flows aren't
 * blocked by a missing provider account.
 */
import type {
  PaymentGateway,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/ports/PaymentGateway";

const FLW_BASE = "https://api.flutterwave.com/v3";

interface FlwInitiateResponse {
  readonly status: string;
  readonly data?: { readonly link?: string };
}

interface FlwVerifyResponse {
  readonly status: string;
  readonly data?: {
    readonly status?: string;
    readonly amount?: number;
    readonly currency?: string;
    readonly tx_ref?: string;
    readonly id?: number | string;
  };
}

export class FlutterwaveGateway implements PaymentGateway {
  private readonly secretKey: string | undefined;
  private readonly webhookHash: string | undefined;

  constructor() {
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.webhookHash = process.env.FLW_WEBHOOK_HASH;
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    if (!this.secretKey) {
      return { checkoutUrl: `${input.redirectUrl}?tx_ref=${input.txRef}&status=stub` };
    }
    const response = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: (input.amountMinor / 100).toFixed(2),
        currency: input.currency,
        redirect_url: input.redirectUrl,
        customer: input.customer,
        meta: input.meta,
      }),
    });
    if (!response.ok) {
      throw new Error(`Flutterwave initiate failed: ${response.status}`);
    }
    const body = (await response.json()) as FlwInitiateResponse;
    if (body.status !== "success" || !body.data?.link) {
      throw new Error("Flutterwave initiate returned no checkout link.");
    }
    return { checkoutUrl: body.data.link };
  }

  async verify(transactionId: string): Promise<PaymentVerificationResult> {
    if (!this.secretKey) {
      return {
        status: "pending",
        amountMinor: 0,
        currency: "USD",
        txRef: transactionId,
        providerTransactionId: transactionId,
      };
    }
    const response = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (!response.ok) {
      throw new Error(`Flutterwave verify failed: ${response.status}`);
    }
    const body = (await response.json()) as FlwVerifyResponse;
    const flwStatus = body.data?.status;
    let status: PaymentVerificationResult["status"] = "pending";
    if (flwStatus === "successful") status = "successful";
    else if (flwStatus === "failed" || flwStatus === "cancelled") status = "failed";

    return {
      status,
      amountMinor: Math.round((body.data?.amount ?? 0) * 100),
      currency: body.data?.currency ?? "USD",
      txRef: body.data?.tx_ref ?? transactionId,
      providerTransactionId: String(body.data?.id ?? transactionId),
    };
  }

  verifyWebhookSignature(rawHeaders: Record<string, string>): boolean {
    if (!this.webhookHash) return true; // stub mode accepts anything in dev
    const provided = rawHeaders["verif-hash"] ?? rawHeaders["Verif-Hash"];
    return provided === this.webhookHash;
  }
}
