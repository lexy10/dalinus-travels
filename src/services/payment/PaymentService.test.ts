/**
 * Property-based tests for PaymentService.
 *
 * Covers Properties 43–44 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { PaymentService } from "./PaymentService";
import { BookingService } from "../booking/BookingService";
import { InMemoryBookingRepository } from "@/test/fakes/repositories/InMemoryBookingRepository";
import { InMemoryPaymentRepository } from "@/test/fakes/repositories/InMemoryPaymentRepository";
import { InMemoryTourPackageRepository } from "@/test/fakes/repositories/InMemoryTourPackageRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import { BookingStatus, PublicationStatus, type Booking } from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";
import type {
  PaymentGateway,
  PaymentVerificationResult,
} from "@/ports/PaymentGateway";

// ---------------------------------------------------------------------------
// Test gateway double — drives verification outcomes from the test
// ---------------------------------------------------------------------------

class FakeGateway implements PaymentGateway {
  outcomes = new Map<string, PaymentVerificationResult>();
  initiateCount = 0;

  async initiate() {
    this.initiateCount += 1;
    return { checkoutUrl: `https://checkout.example/${this.initiateCount}` };
  }

  async verify(transactionId: string): Promise<PaymentVerificationResult> {
    const out = this.outcomes.get(transactionId);
    if (!out) throw new Error(`No verification result configured for ${transactionId}`);
    return out;
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  set(
    transactionId: string,
    result: Omit<PaymentVerificationResult, "providerTransactionId">,
  ) {
    this.outcomes.set(transactionId, { ...result, providerTransactionId: transactionId });
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let tourPackageRepo: InMemoryTourPackageRepository;
let bookingRepo: InMemoryBookingRepository;
let paymentRepo: InMemoryPaymentRepository;
let notificationRepo: InMemoryNotificationRepository;
let gateway: FakeGateway;
let bookingService: BookingService;
let paymentService: PaymentService;
let txCounter = 0;
const NOW = new Date("2026-06-01T10:00:00Z");

beforeEach(() => {
  tourPackageRepo = new InMemoryTourPackageRepository();
  bookingRepo = new InMemoryBookingRepository(tourPackageRepo);
  paymentRepo = new InMemoryPaymentRepository();
  notificationRepo = new InMemoryNotificationRepository();
  gateway = new FakeGateway();
  txCounter = 0;
  bookingService = new BookingService({
    bookingRepo,
    tourPackageRepo,
    generateTxRef: () => `tx_${++txCounter}`,
  });
  paymentService = new PaymentService({
    bookingRepo,
    paymentRepo,
    tourPackageRepo,
    notificationRepo,
    paymentGateway: gateway,
    clock: { now: () => NOW },
    redirectUrl: "https://app.example/cb",
  });
});

async function seedAndBook(opts: {
  availability: number;
  reservedPlaces: number;
  priceMinor?: number;
}): Promise<Booking> {
  const pkg = await tourPackageRepo.create({
    destinationId: "d",
    title: "Trip",
    itinerary: "x",
    durationDays: 5,
    inclusions: [],
    priceMinor: opts.priceMinor ?? 100_00,
    priceCurrency: "USD",
    totalCapacity: opts.availability,
    availabilityCount: opts.availability,
    status: PublicationStatus.PUBLISHED,
  });
  if (!pkg.ok) throw new Error("seed failed");

  const b = await bookingService.createPendingBooking({
    travelerId: "traveler-1",
    tourPackageId: pkg.value.id,
    reservedPlaces: opts.reservedPlaces,
  });
  if (!b.ok) throw new Error("booking failed");

  await paymentService.initiateForBooking(b.value.id, { email: "t@x.co" });
  return b.value;
}

// ---------------------------------------------------------------------------
// Property 43: Confirmation decrements availability exactly once
// Feature: edu-travel-platform, Property 43: Confirmation decrements availability exactly once and records the transaction
// ---------------------------------------------------------------------------

describe("Property 43: Confirmation decrements availability exactly once and records the transaction", () => {
  it("any number of duplicate successful verifications produces exactly one confirmation, one decrement, one notification", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // duplicates
        fc.integer({ min: 1, max: 4 }), // reserved
        fc.integer({ min: 5, max: 10 }), // availability
        async (duplicates, reservedPlaces, availability) => {
          fc.pre(reservedPlaces <= availability);

          tourPackageRepo.clear();
          bookingRepo.clear();
          paymentRepo.clear();
          notificationRepo.clear();
          gateway.outcomes.clear();
          gateway.initiateCount = 0;
          txCounter = 0;

          const booking = await seedAndBook({ availability, reservedPlaces });

          const providerTxId = `flw_${booking.id}`;
          gateway.set(providerTxId, {
            status: "successful",
            amountMinor: booking.amountMinor,
            currency: booking.currency as "USD",
            txRef: booking.txRef,
          });

          const results = [];
          for (let i = 0; i < duplicates; i++) {
            results.push(await paymentService.confirmFromVerification(providerTxId));
          }

          for (const r of results) expect(r.ok).toBe(true);

          // Booking transitioned exactly once
          const final = await bookingRepo.findById(booking.id);
          expect(final?.status).toBe(BookingStatus.CONFIRMED);
          expect(final?.availabilityDecremented).toBe(true);
          expect(final?.providerTransactionId).toBe(providerTxId);

          // Availability decremented exactly once
          expect((await paymentService.getAvailability(booking.tourPackageId))).toBe(
            availability - reservedPlaces,
          );

          // Exactly one confirmation notification
          const notifs = await notificationRepo.listPendingDelivery();
          const confirms = notifs.filter((n) => n.type === "booking_confirmed");
          expect(confirms).toHaveLength(1);
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 44: Non-success outcomes preserve Pending Payment and availability
// Feature: edu-travel-platform, Property 44: Non-success outcomes preserve Pending Payment and availability
// ---------------------------------------------------------------------------

describe("Property 44: Non-success outcomes preserve Pending Payment and availability", () => {
  it("failed/pending/timeout outcomes never confirm or decrement", async () => {
    const outcomeArb = fc.constantFrom<"failed" | "pending" | "timeout">(
      "failed",
      "pending",
      "timeout",
    );

    await fc.assert(
      fc.asyncProperty(
        outcomeArb,
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 5, max: 10 }),
        async (outcome, reservedPlaces, availability) => {
          tourPackageRepo.clear();
          bookingRepo.clear();
          paymentRepo.clear();
          notificationRepo.clear();
          gateway.outcomes.clear();
          gateway.initiateCount = 0;
          txCounter = 0;

          const booking = await seedAndBook({ availability, reservedPlaces });
          const providerTxId = `flw_${booking.id}`;

          if (outcome === "timeout") {
            const r = await paymentService.handleTimeout(booking.id);
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.error.kind).toBe(DomainErrorKind.Payment);
          } else {
            gateway.set(providerTxId, {
              status: outcome,
              amountMinor: booking.amountMinor,
              currency: booking.currency as "USD",
              txRef: booking.txRef,
            });
            const r = await paymentService.confirmFromVerification(providerTxId);
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.error.kind).toBe(DomainErrorKind.Payment);
          }

          const after = await bookingRepo.findById(booking.id);
          expect(after?.status).toBe(BookingStatus.PENDING_PAYMENT);
          expect(after?.availabilityDecremented).toBe(false);
          expect((await paymentService.getAvailability(booking.tourPackageId))).toBe(
            availability,
          );
        },
      ),
      { numRuns: 30 },
    );
  });

  it("a successful arrival after a timeout still confirms the Booking exactly once", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (reservedPlaces) => {
        tourPackageRepo.clear();
        bookingRepo.clear();
        paymentRepo.clear();
        notificationRepo.clear();
        gateway.outcomes.clear();
        gateway.initiateCount = 0;
        txCounter = 0;

        const availability = 5;
        const booking = await seedAndBook({ availability, reservedPlaces });

        // First, the timeout fires
        await paymentService.handleTimeout(booking.id);

        // Then a successful verification arrives
        const providerTxId = `flw_${booking.id}`;
        gateway.set(providerTxId, {
          status: "successful",
          amountMinor: booking.amountMinor,
          currency: booking.currency as "USD",
          txRef: booking.txRef,
        });

        const r = await paymentService.confirmFromVerification(providerTxId);
        expect(r.ok).toBe(true);

        // Re-runs are still idempotent post-timeout
        await paymentService.confirmFromVerification(providerTxId);

        const after = await bookingRepo.findById(booking.id);
        expect(after?.status).toBe(BookingStatus.CONFIRMED);
        expect((await paymentService.getAvailability(booking.tourPackageId))).toBe(
          availability - reservedPlaces,
        );

        const confirms = (await notificationRepo.listPendingDelivery()).filter(
          (n) => n.type === "booking_confirmed",
        );
        expect(confirms).toHaveLength(1);
      }),
      { numRuns: 15 },
    );
  });
});
