/**
 * Property-based tests for BookingService.
 *
 * Covers Properties 41–42 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { BookingService, computeBookingAmount } from "./BookingService";
import { InMemoryBookingRepository } from "@/test/fakes/repositories/InMemoryBookingRepository";
import { InMemoryTourPackageRepository } from "@/test/fakes/repositories/InMemoryTourPackageRepository";
import { BookingStatus, PublicationStatus, type TourPackage } from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";

let bookingRepo: InMemoryBookingRepository;
let tourPackageRepo: InMemoryTourPackageRepository;
let service: BookingService;
let txCounter = 0;

beforeEach(() => {
  bookingRepo = new InMemoryBookingRepository();
  tourPackageRepo = new InMemoryTourPackageRepository();
  txCounter = 0;
  service = new BookingService({
    bookingRepo,
    tourPackageRepo,
    generateTxRef: () => `tx_${++txCounter}`,
  });
});

async function seedPackage(opts: {
  availability: number;
  priceMinor?: number;
}): Promise<TourPackage> {
  const res = await tourPackageRepo.create({
    destinationId: "d-1",
    title: "Trip",
    itinerary: "Day 1 ...",
    durationDays: 5,
    inclusions: ["meals"],
    priceMinor: opts.priceMinor ?? 100_00,
    priceCurrency: "USD",
    totalCapacity: Math.max(opts.availability, 1),
    availabilityCount: opts.availability,
    status: PublicationStatus.PUBLISHED,
  });
  if (!res.ok) throw new Error("seed failed");
  return res.value;
}

// ---------------------------------------------------------------------------
// Property 41: Bookings are created only with availability and complete fields
// Feature: edu-travel-platform, Property 41: Bookings are created only with availability and complete fields
// ---------------------------------------------------------------------------

describe("Property 41: Bookings are created only with availability and complete fields", () => {
  it("creates a PendingPayment booking iff availability > 0 and fields complete", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }), // availability
        fc.integer({ min: 1, max: 5 }), // reserved
        fc.boolean(), // dropTraveler
        async (availability, reservedPlaces, dropTraveler) => {
          bookingRepo.clear();
          tourPackageRepo.clear();
          const pkg = await seedPackage({ availability });

          const result = await service.createPendingBooking({
            travelerId: dropTraveler ? "" : "traveler-1",
            tourPackageId: pkg.id,
            reservedPlaces,
          });

          if (dropTraveler) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error.kind).toBe(DomainErrorKind.Validation);
            }
            expect((await bookingRepo.list())).toHaveLength(0);
            return;
          }

          if (availability === 0 || reservedPlaces > availability) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error.kind).toBe(DomainErrorKind.Availability);
            }
            expect((await bookingRepo.list())).toHaveLength(0);
            return;
          }

          expect(result.ok).toBe(true);
          if (!result.ok) return;
          expect(result.value.status).toBe(BookingStatus.PENDING_PAYMENT);
          expect(result.value.reservedPlaces).toBe(reservedPlaces);
          expect(result.value.availabilityDecremented).toBe(false);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 42: Payment amount equals price times reserved places
// Feature: edu-travel-platform, Property 42: Payment amount equals price times reserved places
// ---------------------------------------------------------------------------

describe("Property 42: Payment amount equals price times reserved places", () => {
  it("amountMinor recorded on the Booking equals priceMinor × reservedPlaces", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100_000 }), // priceMinor
        fc.integer({ min: 1, max: 8 }), // reserved
        async (priceMinor, reservedPlaces) => {
          bookingRepo.clear();
          tourPackageRepo.clear();
          const pkg = await seedPackage({ availability: 10, priceMinor });

          const result = await service.createPendingBooking({
            travelerId: "traveler-1",
            tourPackageId: pkg.id,
            reservedPlaces,
          });

          expect(result.ok).toBe(true);
          if (!result.ok) return;

          const expected = computeBookingAmount(pkg, reservedPlaces);
          expect(result.value.amountMinor).toBe(expected);
          expect(result.value.amountMinor).toBe(priceMinor * reservedPlaces);
          expect(result.value.currency).toBe(pkg.priceCurrency);
        },
      ),
    );
  });
});
