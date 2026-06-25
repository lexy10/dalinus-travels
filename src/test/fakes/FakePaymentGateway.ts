import type {
  PaymentGateway,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentVerificationResult,
  PaymentVerificationStatus,
} from "@/ports";

export interface FakePaymentGatewayConfig {
  initiateResult?: PaymentInitiateResult;
  verifyStatus?: PaymentVerificationStatus;
  webhookValid?: boolean;
}

export class FakePaymentGateway implements PaymentGateway {
  readonly initiated: PaymentInitiateInput[] = [];
  readonly verified: string[] = [];
  private config: FakePaymentGatewayConfig;

  constructor(config: FakePaymentGatewayConfig = {}) {
    this.config = {
      initiateResult: config.initiateResult ?? { checkoutUrl: "https://checkout.test/pay" },
      verifyStatus: config.verifyStatus ?? "successful",
      webhookValid: config.webhookValid ?? true,
    };
  }

  configure(config: Partial<FakePaymentGatewayConfig>) {
    Object.assign(this.config, config);
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    this.initiated.push(input);
    return this.config.initiateResult!;
  }

  async verify(transactionId: string): Promise<PaymentVerificationResult> {
    this.verified.push(transactionId);
    const lastInitiated = this.initiated[this.initiated.length - 1];
    return {
      status: this.config.verifyStatus!,
      amountMinor: lastInitiated?.amountMinor ?? 0,
      currency: lastInitiated?.currency ?? "USD",
      txRef: lastInitiated?.txRef ?? "tx-ref",
      providerTransactionId: transactionId,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyWebhookSignature(_rawHeaders: Record<string, string>): boolean {
    return this.config.webhookValid!;
  }

  reset() {
    this.initiated.length = 0;
    this.verified.length = 0;
  }
}
