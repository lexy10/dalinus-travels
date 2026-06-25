/** Cookie consent entity. */
import type { UUID, Timestamp } from "./common";

export const CookieConsentChoice = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type CookieConsentChoice = (typeof CookieConsentChoice)[keyof typeof CookieConsentChoice];

export const ALL_COOKIE_CONSENT_CHOICES: readonly CookieConsentChoice[] =
  Object.values(CookieConsentChoice);

export function isCookieConsentChoice(value: unknown): value is CookieConsentChoice {
  return (
    typeof value === "string" && (ALL_COOKIE_CONSENT_CHOICES as readonly string[]).includes(value)
  );
}

/** Days a consent choice remains valid before the notice is re-shown. */
export const COOKIE_CONSENT_VALIDITY_DAYS = 365;

export interface CookieConsent {
  readonly id: UUID;
  readonly visitorId: string;
  readonly choice: CookieConsentChoice;
  readonly recordedAt: Timestamp;
}
