/** Catalog entities: Destination, Program, TourPackage. */
import type { UUID, Timestamp, PublicationStatus } from "./common";

export const DestinationKind = {
  STUDY: "study",
  TRAVEL: "travel",
} as const;

export type DestinationKind = (typeof DestinationKind)[keyof typeof DestinationKind];

export const ALL_DESTINATION_KINDS: readonly DestinationKind[] = Object.values(DestinationKind);

export function isDestinationKind(value: unknown): value is DestinationKind {
  return typeof value === "string" && (ALL_DESTINATION_KINDS as readonly string[]).includes(value);
}

export interface Destination {
  readonly id: UUID;
  readonly kind: DestinationKind;
  readonly name: string;
  readonly country: string;
  /** `null` ⇒ "not currently available" indicator. */
  readonly costOfLiving: string | null;
  /** `null` ⇒ "not currently available" indicator. */
  readonly visaInfo: string | null;
  /** Travel only; `null` ⇒ "not currently available". */
  readonly destinationGuide: string | null;
  readonly publishedAt: Timestamp | null;
}

export const DeliveryMode = {
  ON_CAMPUS: "on_campus",
  ONLINE: "online",
} as const;

export type DeliveryMode = (typeof DeliveryMode)[keyof typeof DeliveryMode];

export const ALL_DELIVERY_MODES: readonly DeliveryMode[] = Object.values(DeliveryMode);

export function isDeliveryMode(value: unknown): value is DeliveryMode {
  return typeof value === "string" && (ALL_DELIVERY_MODES as readonly string[]).includes(value);
}

export interface Program {
  readonly id: UUID;
  readonly partnerId: UUID;
  readonly destinationId: UUID;
  readonly title: string;
  readonly institutionName: string;
  readonly studyLevel: string;
  readonly fieldOfStudy: string;
  readonly durationMonths: number;
  /** Integer minor units. */
  readonly tuitionMinor: number;
  readonly tuitionCurrency: string;
  readonly intakeDates: readonly Timestamp[];
  readonly entryRequirements: string;
  /** `null` when no deadline is set. */
  readonly applicationDeadline: Timestamp | null;
  readonly deliveryMode: DeliveryMode;
  readonly status: PublicationStatus;
  readonly createdAt: Timestamp;
}

/**
 * A travel/tourism offering. `availabilityCount` is the invariant-critical
 * remaining-capacity field, decremented exactly once on booking confirmation.
 */
export interface TourPackage {
  readonly id: UUID;
  readonly destinationId: UUID;
  readonly title: string;
  readonly itinerary: string;
  readonly durationDays: number;
  readonly inclusions: readonly string[];
  /** Integer minor units. */
  readonly priceMinor: number;
  readonly priceCurrency: string;
  readonly totalCapacity: number;
  /** Remaining places; invariant-critical for booking logic. */
  readonly availabilityCount: number;
  readonly status: PublicationStatus;
  readonly createdAt: Timestamp;
}
