/** Port for the payment provider (Flutterwave). */
import type { CurrencyCode } from "@domain/common";

export interface PaymentInitiateInput {
  readonly txRef: string;
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
  readonly redirectUrl: string;
  readonly customer: {
    readonly email: string;
    readonly name?: string;
  };
  readonly meta: {
    readonly bookingId: string;
  };
}

export interface PaymentInitiateResult {
  readonly checkoutUrl: string;
}

export type PaymentVerificationStatus = "successful" | "failed" | "pending";

export interface PaymentVerificationResult {
  readonly status: PaymentVerificationStatus;
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
  readonly txRef: string;
  readonly providerTransactionId: string;
}

/** Port for hosted-checkout payment initiation and verification. */
export interface PaymentGateway {
  /** Begin a hosted-checkout payment and return the redirect URL. */
  initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult>;

  /** Retrieve the authoritative outcome for a provider transaction. */
  verify(transactionId: string): Promise<PaymentVerificationResult>;

  /** Verify a webhook request's signature against the configured secret. */
  verifyWebhookSignature(rawHeaders: Record<string, string>): boolean;
}
