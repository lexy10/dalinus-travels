import type { Booking, BookingStatus, Timestamp } from "@/domain";
import { isBookingStatus } from "@/domain";
import { Prisma } from "@prisma/client";
import type {
  BookingRepository,
  CreatePendingBookingInput,
} from "@/ports/repositories/BookingRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { availabilityError, conflictError, notFoundError, persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  travelerId: string;
  tourPackageId: string;
  reservedPlaces: number;
  status: string;
  txRef: string;
  providerTransactionId: string | null;
  availabilityDecremented: boolean;
  amountMinor: number;
  currency: string;
  createdAt: Date;
  confirmedAt: Date | null;
}): Booking {
  return {
    id: row.id,
    travelerId: row.travelerId,
    tourPackageId: row.tourPackageId,
    reservedPlaces: row.reservedPlaces,
    status: (isBookingStatus(row.status) ? row.status : "PendingPayment") as BookingStatus,
    txRef: row.txRef,
    providerTransactionId: row.providerTransactionId,
    availabilityDecremented: row.availabilityDecremented,
    amountMinor: row.amountMinor,
    currency: row.currency,
    createdAt: row.createdAt,
    confirmedAt: row.confirmedAt,
  };
}

export class PrismaBookingRepository implements BookingRepository {
  async findById(id: string) {
    const row = await prisma.booking.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findByTxRef(txRef: string) {
    const row = await prisma.booking.findUnique({ where: { txRef } });
    return row ? toDomain(row) : null;
  }
  async listByTraveler(travelerId: string) {
    const rows = await prisma.booking.findMany({
      where: { travelerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async list(pagination?: Pagination) {
    const rows = await prisma.booking.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async createPendingBooking(input: CreatePendingBookingInput): RepositoryResult<Booking> {
    try {
      const row = await prisma.booking.create({
        data: {
          travelerId: input.travelerId,
          tourPackageId: input.tourPackageId,
          reservedPlaces: input.reservedPlaces,
          txRef: input.txRef,
          amountMinor: input.amountMinor,
          currency: input.currency,
        },
      });
      return ok(toDomain(row));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return err(conflictError("Duplicate booking reference.", "Booking"));
      }
      return err(persistenceError());
    }
  }
  /**
   * Confirm a booking and decrement the tour package's availability in a
   * single transaction. Idempotent via the `availabilityDecremented` flag.
   */
  async confirmWithAvailabilityDecrement(
    id: string,
    providerTransactionId: string,
    confirmedAt: Timestamp,
  ): RepositoryResult<Booking> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.booking.findUnique({ where: { id } });
        if (!existing) return { kind: "not_found" as const };
        if (existing.availabilityDecremented) {
          return { kind: "already" as const, booking: existing };
        }

        // Atomic conditional decrement: only proceed if availability suffices.
        const decremented = await tx.tourPackage.updateMany({
          where: {
            id: existing.tourPackageId,
            availabilityCount: { gte: existing.reservedPlaces },
          },
          data: { availabilityCount: { decrement: existing.reservedPlaces } },
        });
        if (decremented.count === 0) {
          return { kind: "no_availability" as const };
        }

        const updated = await tx.booking.update({
          where: { id },
          data: {
            status: "Confirmed",
            providerTransactionId,
            availabilityDecremented: true,
            confirmedAt,
          },
        });
        return { kind: "ok" as const, booking: updated };
      });

      if (result.kind === "not_found") {
        return err(notFoundError("Booking not found.", "Booking"));
      }
      if (result.kind === "no_availability") {
        return err(availabilityError("Tour package availability changed."));
      }
      return ok(toDomain(result.booking));
    } catch {
      return err(persistenceError());
    }
  }
}
