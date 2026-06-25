/** Repository port for Payment entities. */
import type { Payment, PaymentProvider, PaymentStatus } from "@/domain";
import type { RepositoryResult } from "./common";

export interface CreatePaymentInput {
  readonly bookingId: string;
  readonly provider: PaymentProvider;
  readonly txRef: string;
  readonly amountMinor: number;
  readonly currency: string;
}

export interface UpdatePaymentInput {
  readonly status?: PaymentStatus;
  readonly providerTransactionId?: Payment["providerTransactionId"];
  readonly rawVerifyPayload?: Payment["rawVerifyPayload"];
  readonly attempts?: number;
  readonly resolvedAt?: Payment["resolvedAt"];
}

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByBookingId(bookingId: string): Promise<Payment | null>;
  findByTxRef(txRef: string): Promise<Payment | null>;
  create(input: CreatePaymentInput): RepositoryResult<Payment>;
  update(id: string, input: UpdatePaymentInput): RepositoryResult<Payment>;
}
