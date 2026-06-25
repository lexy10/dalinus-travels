/** Booking and payment entities. */
import type { UUID, Timestamp } from "./common";

/**
 * Booking lifecycle.
 * - `PendingPayment` — created when availability > 0; places reserved.
 * - `Confirmed` — payment verified; availability decremented exactly once.
 * - `Cancelled` — terminal state.
 */
export const BookingStatus = {
  PENDING_PAYMENT: "PendingPayment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ALL_BOOKING_STATUSES: readonly BookingStatus[] = Object.values(BookingStatus);

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (ALL_BOOKING_STATUSES as readonly string[]).includes(value);
}

export interface Booking {
  readonly id: UUID;
  readonly travelerId: UUID;
  readonly tourPackageId: UUID;
  readonly reservedPlaces: number;
  readonly status: BookingStatus;
  /** Platform-generated unique idempotency reference. */
  readonly txRef: string;
  /** Provider transaction id once confirmed, else `null`. */
  readonly providerTransactionId: string | null;
  /** Idempotency guard: ensures availability is decremented exactly once. */
  readonly availabilityDecremented: boolean;
  /** Integer minor units (= price × reservedPlaces). */
  readonly amountMinor: number;
  readonly currency: string;
  readonly createdAt: Timestamp;
  readonly confirmedAt: Timestamp | null;
}

export const PaymentProvider = {
  FLUTTERWAVE: "flutterwave",
} as const;

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

/**
 * Payment lifecycle.
 * - `initiated` — submitted to provider, awaiting verification.
 * - `successful` — provider confirmed success.
 * - `failed` — provider reported failure.
 * - `timeout` — no result within 60 seconds.
 */
export const PaymentStatus = {
  INITIATED: "initiated",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  TIMEOUT: "timeout",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ALL_PAYMENT_STATUSES: readonly PaymentStatus[] = Object.values(PaymentStatus);

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (ALL_PAYMENT_STATUSES as readonly string[]).includes(value);
}

export interface Payment {
  readonly id: UUID;
  readonly bookingId: UUID;
  readonly provider: PaymentProvider;
  readonly txRef: string;
  readonly providerTransactionId: string | null;
  readonly status: PaymentStatus;
  readonly amountMinor: number;
  readonly currency: string;
  /** Authoritative provider verify payload, or `null` before resolution. */
  readonly rawVerifyPayload: Readonly<Record<string, unknown>> | null;
  readonly attempts: number;
  readonly createdAt: Timestamp;
  readonly resolvedAt: Timestamp | null;
}
