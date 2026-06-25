import type { Payment, PaymentProvider, PaymentStatus } from "@/domain";
import { isPaymentStatus } from "@/domain";
import { Prisma } from "@prisma/client";
import type {
  PaymentRepository,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/ports/repositories/PaymentRepository";
import type { RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  bookingId: string;
  provider: string;
  txRef: string;
  providerTransactionId: string | null;
  status: string;
  amountMinor: number;
  currency: string;
  rawVerifyPayload: Prisma.JsonValue | null;
  attempts: number;
  createdAt: Date;
  resolvedAt: Date | null;
}): Payment {
  return {
    id: row.id,
    bookingId: row.bookingId,
    provider: row.provider as PaymentProvider,
    txRef: row.txRef,
    providerTransactionId: row.providerTransactionId,
    status: (isPaymentStatus(row.status) ? row.status : "initiated") as PaymentStatus,
    amountMinor: row.amountMinor,
    currency: row.currency,
    rawVerifyPayload:
      typeof row.rawVerifyPayload === "object" && row.rawVerifyPayload !== null
        ? (row.rawVerifyPayload as Readonly<Record<string, unknown>>)
        : null,
    attempts: row.attempts,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  async findById(id: string) {
    const row = await prisma.payment.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findByBookingId(bookingId: string) {
    const row = await prisma.payment.findUnique({ where: { bookingId } });
    return row ? toDomain(row) : null;
  }
  async findByTxRef(txRef: string) {
    const row = await prisma.payment.findUnique({ where: { txRef } });
    return row ? toDomain(row) : null;
  }
  async create(input: CreatePaymentInput): RepositoryResult<Payment> {
    try {
      const row = await prisma.payment.create({
        data: {
          bookingId: input.bookingId,
          provider: input.provider,
          txRef: input.txRef,
          amountMinor: input.amountMinor,
          currency: input.currency,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdatePaymentInput): RepositoryResult<Payment> {
    try {
      const row = await prisma.payment.update({
        where: { id },
        data: {
          ...(input.status !== undefined && { status: input.status }),
          ...(input.providerTransactionId !== undefined && {
            providerTransactionId: input.providerTransactionId,
          }),
          ...(input.rawVerifyPayload !== undefined && {
            rawVerifyPayload: input.rawVerifyPayload as Prisma.InputJsonValue,
          }),
          ...(input.attempts !== undefined && { attempts: input.attempts }),
          ...(input.resolvedAt !== undefined && { resolvedAt: input.resolvedAt }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
