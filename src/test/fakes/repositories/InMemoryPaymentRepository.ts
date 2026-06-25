import type { Payment } from "@/domain";
import type { PaymentRepository, CreatePaymentInput, UpdatePaymentInput } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.store.get(id) ?? null;
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    for (const p of this.store.values()) {
      if (p.bookingId === bookingId) return p;
    }
    return null;
  }

  async findByTxRef(txRef: string): Promise<Payment | null> {
    for (const p of this.store.values()) {
      if (p.txRef === txRef) return p;
    }
    return null;
  }

  async create(input: CreatePaymentInput): Promise<Result<Payment, DomainError>> {
    const payment: Payment = {
      id: randomUUID(),
      bookingId: input.bookingId,
      provider: input.provider,
      txRef: input.txRef,
      providerTransactionId: null,
      status: "initiated",
      amountMinor: input.amountMinor,
      currency: input.currency,
      rawVerifyPayload: null,
      attempts: 0,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.store.set(payment.id, payment);
    return ok(payment);
  }

  async update(id: string, input: UpdatePaymentInput): Promise<Result<Payment, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Payment not found.", "Payment"));
    const updated: Payment = { ...existing, ...input };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(payment: Payment) { this.store.set(payment.id, payment); }
}
