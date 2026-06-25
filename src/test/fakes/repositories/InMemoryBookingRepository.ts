import type { Booking, Timestamp } from "@/domain";
import type { BookingRepository, CreatePendingBookingInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";
import type { InMemoryTourPackageRepository } from "./InMemoryTourPackageRepository";

export class InMemoryBookingRepository implements BookingRepository {
  private store = new Map<string, Booking>();
  /**
   * Optional tour-package repo. When provided, `confirmWithAvailabilityDecrement`
   * also decrements the tour package's availabilityCount in lockstep with the
   * booking transition — mirroring the production single-transaction behaviour.
   */
  private readonly tourPackageRepo?: InMemoryTourPackageRepository;

  constructor(tourPackageRepo?: InMemoryTourPackageRepository) {
    this.tourPackageRepo = tourPackageRepo;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.store.get(id) ?? null;
  }

  async findByTxRef(txRef: string): Promise<Booking | null> {
    for (const b of this.store.values()) {
      if (b.txRef === txRef) return b;
    }
    return null;
  }

  async listByTraveler(travelerId: string): Promise<readonly Booking[]> {
    return [...this.store.values()].filter(b => b.travelerId === travelerId);
  }

  async list(pagination?: Pagination): Promise<readonly Booking[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async createPendingBooking(input: CreatePendingBookingInput): Promise<Result<Booking, DomainError>> {
    const dupTxRef = await this.findByTxRef(input.txRef);
    if (dupTxRef) return err(conflictError("Duplicate txRef.", "Booking"));
    const booking: Booking = {
      id: randomUUID(),
      travelerId: input.travelerId,
      tourPackageId: input.tourPackageId,
      reservedPlaces: input.reservedPlaces,
      status: "PendingPayment",
      txRef: input.txRef,
      providerTransactionId: null,
      availabilityDecremented: false,
      amountMinor: input.amountMinor,
      currency: input.currency,
      createdAt: new Date(),
      confirmedAt: null,
    };
    this.store.set(booking.id, booking);
    return ok(booking);
  }

  async confirmWithAvailabilityDecrement(
    id: string,
    providerTransactionId: string,
    confirmedAt: Timestamp,
  ): Promise<Result<Booking, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Booking not found.", "Booking"));
    if (existing.availabilityDecremented) return ok(existing);
    if (this.tourPackageRepo) {
      const dec = this.tourPackageRepo.decrementAvailability(
        existing.tourPackageId,
        existing.reservedPlaces,
      );
      if (!dec.ok) return dec;
    }
    const updated: Booking = {
      ...existing,
      status: "Confirmed",
      providerTransactionId,
      availabilityDecremented: true,
      confirmedAt,
    };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(booking: Booking) { this.store.set(booking.id, booking); }
}
