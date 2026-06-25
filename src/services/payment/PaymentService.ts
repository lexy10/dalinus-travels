/**
 * PaymentService — initiation, idempotent confirmation, timeout.
 *
 * Covers Req 13.1–13.7.
 *
 * The confirmation path is *idempotent*: duplicate successful verification
 * results from the redirect callback and/or the webhook resolve to a single
 * Booking transition, a single availability decrement, and a single
 * confirmation notification. The `availabilityDecremented` flag on the
 * Booking is the idempotency guard.
 */
import type { Booking, CurrencyCode } from "@/domain";
import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  notFoundError,
  paymentError,
} from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { BookingRepository } from "@/ports/repositories/BookingRepository";
import type { PaymentRepository } from "@/ports/repositories/PaymentRepository";
import type { TourPackageRepository } from "@/ports/repositories/TourPackageRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";
import type { PaymentGateway } from "@/ports/PaymentGateway";

export interface PaymentServiceDeps {
  readonly bookingRepo: BookingRepository;
  readonly paymentRepo: PaymentRepository;
  readonly tourPackageRepo: TourPackageRepository;
  readonly notificationRepo: NotificationRepository;
  readonly paymentGateway: PaymentGateway;
  readonly clock?: { now(): Date };
  /** Where Flutterwave should redirect the user after hosted checkout. */
  readonly redirectUrl: string;
}

export interface InitiationResult {
  readonly checkoutUrl: string;
  readonly paymentId: string;
}

export class PaymentService {
  private readonly bookingRepo: BookingRepository;
  private readonly paymentRepo: PaymentRepository;
  private readonly tourPackageRepo: TourPackageRepository;
  private readonly notificationRepo: NotificationRepository;
  private readonly paymentGateway: PaymentGateway;
  private readonly clock: { now(): Date };
  private readonly redirectUrl: string;

  constructor(deps: PaymentServiceDeps) {
    this.bookingRepo = deps.bookingRepo;
    this.paymentRepo = deps.paymentRepo;
    this.tourPackageRepo = deps.tourPackageRepo;
    this.notificationRepo = deps.notificationRepo;
    this.paymentGateway = deps.paymentGateway;
    this.clock = deps.clock ?? { now: () => new Date() };
    this.redirectUrl = deps.redirectUrl;
  }

  // -------------------------------------------------------------------------
  // initiateForBooking (Req 13.1)
  // -------------------------------------------------------------------------

  async initiateForBooking(
    bookingId: string,
    customer: { email: string; name?: string },
  ): Promise<Result<InitiationResult, DomainError>> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) return err(notFoundError("Booking not found.", "Booking"));
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      return err(paymentError("Booking is not awaiting payment.", "failed"));
    }

    // Idempotent payment row per booking
    let payment = await this.paymentRepo.findByBookingId(bookingId);
    if (!payment) {
      const create = await this.paymentRepo.create({
        bookingId,
        provider: PaymentProvider.FLUTTERWAVE,
        txRef: booking.txRef,
        amountMinor: booking.amountMinor,
        currency: booking.currency,
      });
      if (!create.ok) return create;
      payment = create.value;
    }

    const init = await this.paymentGateway.initiate({
      txRef: booking.txRef,
      amountMinor: booking.amountMinor,
      currency: booking.currency as CurrencyCode,
      redirectUrl: this.redirectUrl,
      customer,
      meta: { bookingId },
    });

    return ok({ checkoutUrl: init.checkoutUrl, paymentId: payment.id });
  }

  // -------------------------------------------------------------------------
  // confirmFromVerification (Req 13.2, 13.3, 13.4, 13.7)
  //
  // Idempotent. Safe to call from both the redirect callback and the
  // webhook with the same providerTransactionId.
  // -------------------------------------------------------------------------

  async confirmFromVerification(
    providerTransactionId: string,
  ): Promise<Result<Booking, DomainError>> {
    const verification = await this.paymentGateway.verify(providerTransactionId);

    const booking = await this.bookingRepo.findByTxRef(verification.txRef);
    if (!booking) return err(notFoundError("Booking not found for txRef.", "Booking"));
    const payment = await this.paymentRepo.findByTxRef(verification.txRef);

    if (verification.status !== "successful") {
      // Req 13.4: leave Pending, do not decrement availability.
      if (payment) {
        await this.paymentRepo.update(payment.id, {
          status:
            verification.status === "failed" ? PaymentStatus.FAILED : PaymentStatus.INITIATED,
          providerTransactionId,
          resolvedAt: verification.status === "failed" ? this.clock.now() : null,
        });
      }
      return err(
        paymentError(
          verification.status === "failed"
            ? "Payment was not completed."
            : "Payment result is unconfirmed.",
          verification.status === "failed" ? "failed" : "unconfirmed",
        ),
      );
    }

    // ----- Successful path: idempotent confirmation (Req 13.2, 13.3, 13.7) -----
    const alreadyConfirmed = booking.availabilityDecremented;

    const updated = await this.bookingRepo.confirmWithAvailabilityDecrement(
      booking.id,
      providerTransactionId,
      this.clock.now(),
    );
    if (!updated.ok) return updated;

    if (payment) {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.SUCCESSFUL,
        providerTransactionId,
        resolvedAt: this.clock.now(),
      });
    }

    // Exactly-once confirmation notification (Req 13.3)
    if (!alreadyConfirmed) {
      await this.notificationRepo.create({
        userId: booking.travelerId,
        channel: "email",
        type: "booking_confirmed",
        payload: {
          bookingId: booking.id,
          tourPackageId: booking.tourPackageId,
          amountMinor: booking.amountMinor,
          currency: booking.currency,
          providerTransactionId,
        },
        recipientEmail: "",
      });
    }

    return ok(updated.value);
  }

  // -------------------------------------------------------------------------
  // handleTimeout (Req 13.5, 13.6)
  // -------------------------------------------------------------------------

  /**
   * Mark a payment as timed-out when no result arrives within the 60-second
   * window. Leaves Booking as PendingPayment so a later successful arrival
   * can still confirm (Req 13.5; Property 44 final clause).
   */
  async handleTimeout(bookingId: string): Promise<Result<Booking, DomainError>> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) return err(notFoundError("Booking not found.", "Booking"));
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      return ok(booking);
    }
    const payment = await this.paymentRepo.findByBookingId(bookingId);
    if (payment) {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.TIMEOUT,
        resolvedAt: this.clock.now(),
      });
    }
    return err(paymentError("Payment result is unconfirmed.", "unconfirmed"));
  }

  /** Read-through of the current tour-package availability (test convenience). */
  async getAvailability(tourPackageId: string): Promise<number | null> {
    const pkg = await this.tourPackageRepo.findById(tourPackageId);
    return pkg?.availabilityCount ?? null;
  }
}
