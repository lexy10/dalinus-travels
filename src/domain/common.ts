/** Shared domain value types: identifiers, timestamps, money, and publication status. */

export type UUID = string;

export type Timestamp = Date;

export type CurrencyCode = string;

/**
 * Monetary amount as integer minor units (cents/kobo) plus currency code.
 * Avoids floating-point rounding error.
 */
export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  return { amountMinor, currency };
}

export function isMoney(value: unknown): value is Money {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Money).amountMinor === "number" &&
    typeof (value as Money).currency === "string"
  );
}

/**
 * Publication lifecycle for catalog and content entities.
 * Only `published` records are publicly visible.
 */
export const PublicationStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type PublicationStatus = (typeof PublicationStatus)[keyof typeof PublicationStatus];

export const ALL_PUBLICATION_STATUSES: readonly PublicationStatus[] =
  Object.values(PublicationStatus);

export function isPublicationStatus(value: unknown): value is PublicationStatus {
  return (
    typeof value === "string" && (ALL_PUBLICATION_STATUSES as readonly string[]).includes(value)
  );
}
