/** Consultation and slot entities. */
import type { UUID, Timestamp } from "./common";

export const ContactKind = {
  EMAIL: "email",
  PHONE: "phone",
} as const;

export type ContactKind = (typeof ContactKind)[keyof typeof ContactKind];

export const ALL_CONTACT_KINDS: readonly ContactKind[] = Object.values(ContactKind);

export function isContactKind(value: unknown): value is ContactKind {
  return typeof value === "string" && (ALL_CONTACT_KINDS as readonly string[]).includes(value);
}

export const ConsultationStatus = {
  BOOKED: "booked",
  CANCELLED: "cancelled",
} as const;

export type ConsultationStatus = (typeof ConsultationStatus)[keyof typeof ConsultationStatus];

export const ALL_CONSULTATION_STATUSES: readonly ConsultationStatus[] =
  Object.values(ConsultationStatus);

export function isConsultationStatus(value: unknown): value is ConsultationStatus {
  return (
    typeof value === "string" && (ALL_CONSULTATION_STATUSES as readonly string[]).includes(value)
  );
}

export interface Consultation {
  readonly id: UUID;
  /** `null` for guest bookings. */
  readonly userId: UUID | null;
  readonly name: string;
  readonly contactMethod: string;
  readonly contactKind: ContactKind;
  readonly slotId: UUID;
  readonly status: ConsultationStatus;
  readonly createdAt: Timestamp;
}

export const ConsultationSlotStatus = {
  AVAILABLE: "available",
  BOOKED: "booked",
} as const;

export type ConsultationSlotStatus =
  (typeof ConsultationSlotStatus)[keyof typeof ConsultationSlotStatus];

export const ALL_CONSULTATION_SLOT_STATUSES: readonly ConsultationSlotStatus[] =
  Object.values(ConsultationSlotStatus);

export function isConsultationSlotStatus(value: unknown): value is ConsultationSlotStatus {
  return (
    typeof value === "string" &&
    (ALL_CONSULTATION_SLOT_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * A bookable time slot. First-writer-wins under concurrent claims via a
 * unique partial constraint on `bookedConsultationId`.
 */
export interface ConsultationSlot {
  readonly id: UUID;
  readonly startsAt: Timestamp;
  readonly endsAt: Timestamp;
  readonly status: ConsultationSlotStatus;
  /** The consultation that claimed this slot, else `null`. */
  readonly bookedConsultationId: UUID | null;
}
