/**
 * BookingService — pending booking creation with availability guard.
 *
 * Covers Req 12.6, 12.7, 12.8, 13.1.
 *
 * Payment initiation against the Flutterwave gateway lives in
 * `PaymentService`; this service only creates the Booking and computes the
 * authoritative amount.
 */
import type { Booking, TourPackage } from "@/domain";
import {
  availabilityError,
  missingFieldsError,
  notFoundError,
  validationError,
} from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { err } from "@/domain/kernel";
import type { BookingRepository } from "@/ports/repositories/BookingRepository";
import type { TourPackageRepository } from "@/ports/repositories/TourPackageRepository";

export interface CreateBookingInput {
  readonly travelerId: unknown;
  readonly tourPackageId: unknown;
  readonly reservedPlaces: unknown;
}

export interface BookingServiceDeps {
  readonly bookingRepo: BookingRepository;
  readonly tourPackageRepo: TourPackageRepository;
  /** Idempotency-key generator. Injected so tests can supply deterministic values. */
  readonly generateTxRef?: () => string;
}

/** Computes the authoritative booking amount per Req 13.1. */
export function computeBookingAmount(pkg: TourPackage, reservedPlaces: number): number {
  return pkg.priceMinor * reservedPlaces;
}

export class BookingService {
  private readonly bookingRepo: BookingRepository;
  private readonly tourPackageRepo: TourPackageRepository;
  private readonly generateTxRef: () => string;

  constructor(deps: BookingServiceDeps) {
    this.bookingRepo = deps.bookingRepo;
    this.tourPackageRepo = deps.tourPackageRepo;
    this.generateTxRef =
      deps.generateTxRef ??
      (() => `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`);
  }

  /**
   * Create a Booking with status "Pending Payment".
   * - Missing fields → ValidationError (Req 12.7)
   * - Availability == 0 → AvailabilityError (Req 12.8)
   * - Otherwise: persist a PendingPayment booking (Req 12.6) with amount =
   *   price × reservedPlaces (Req 13.1).
   *
   * Note: `availabilityCount` is NOT decremented here. It is only decremented
   * on payment confirmation (Req 13.3 / 13.6). The pending-availability
   * reservation is implicit while the booking is PendingPayment.
   */
  async createPendingBooking(
    input: CreateBookingInput,
  ): Promise<Result<Booking, DomainError>> {
    // ----- Missing required fields (Req 12.7) -----
    const missing: string[] = [];
    if (typeof input.travelerId !== "string" || input.travelerId.trim() === "") {
      missing.push("travelerId");
    }
    if (typeof input.tourPackageId !== "string" || input.tourPackageId.trim() === "") {
      missing.push("tourPackageId");
    }
    if (typeof input.reservedPlaces !== "number" || !Number.isFinite(input.reservedPlaces)) {
      missing.push("reservedPlaces");
    }
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    const reservedPlaces = input.reservedPlaces as number;
    if (!Number.isInteger(reservedPlaces) || reservedPlaces < 1) {
      return err(
        validationError({
          field: "reservedPlaces",
          message: "reservedPlaces must be a positive integer.",
        }),
      );
    }

    // ----- Availability check (Req 12.8) -----
    const pkg = await this.tourPackageRepo.findById(input.tourPackageId as string);
    if (!pkg) return err(notFoundError("Tour package not found.", "TourPackage"));

    if (pkg.availabilityCount <= 0) {
      return err(availabilityError("This tour package is fully booked."));
    }
    if (reservedPlaces > pkg.availabilityCount) {
      return err(
        availabilityError(
          `Only ${pkg.availabilityCount} place(s) remaining for this tour package.`,
        ),
      );
    }

    // ----- Persist PendingPayment booking (Req 12.6) -----
    return this.bookingRepo.createPendingBooking({
      travelerId: input.travelerId as string,
      tourPackageId: pkg.id,
      reservedPlaces,
      txRef: this.generateTxRef(),
      amountMinor: computeBookingAmount(pkg, reservedPlaces),
      currency: pkg.priceCurrency,
    });
  }
}
