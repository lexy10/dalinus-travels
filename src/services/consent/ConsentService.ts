/**
 * ConsentService — cookie-consent recording and suppression-window check.
 *
 * Covers Req 17.3–17.5.
 *
 * The 365-day validity window is a domain concept (Req 17.5); the service
 * computes "should the notice be shown" from the latest recorded consent
 * and an injectable clock.
 */
import type { CookieConsent, CookieConsentChoice } from "@/domain";
import { COOKIE_CONSENT_VALIDITY_DAYS } from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok } from "@/domain/kernel";
import type { CookieConsentRepository } from "@/ports/repositories/CookieConsentRepository";

export interface ConsentServiceDeps {
  readonly consentRepo: CookieConsentRepository;
  readonly clock?: { now(): Date };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class ConsentService {
  private readonly consentRepo: CookieConsentRepository;
  private readonly clock: { now(): Date };

  constructor(deps: ConsentServiceDeps) {
    this.consentRepo = deps.consentRepo;
    this.clock = deps.clock ?? { now: () => new Date() };
  }

  /**
   * Determine whether the consent notice should be displayed for `visitorId`.
   * Returns false (suppressed) iff a consent record exists and is within the
   * 365-day window.
   */
  async shouldShowNotice(visitorId: string): Promise<boolean> {
    const latest = await this.consentRepo.findLatestByVisitor(visitorId);
    if (!latest) return true;
    return !this.isWithinValidityWindow(latest);
  }

  async recordChoice(
    visitorId: string,
    choice: CookieConsentChoice,
  ): Promise<Result<CookieConsent, DomainError>> {
    return this.consentRepo.record({ visitorId, choice });
  }

  /** Pure age check — exposed for testing. */
  isWithinValidityWindow(consent: CookieConsent): boolean {
    const now = this.clock.now();
    const ageMs = now.getTime() - consent.recordedAt.getTime();
    const maxAgeMs = COOKIE_CONSENT_VALIDITY_DAYS * MS_PER_DAY;
    return ageMs >= 0 && ageMs <= maxAgeMs;
  }
}

// ---------------------------------------------------------------------------
// i18n fallback resolver (Req 21.1, 21.2, 21.4)
// ---------------------------------------------------------------------------

export interface TranslationCatalog {
  /** Locale → key → translation. */
  readonly [locale: string]: Readonly<Record<string, string>>;
}

export interface ResolvedTranslation {
  readonly value: string;
  /** True when the value came from the default locale rather than the requested one. */
  readonly fellBackToDefault: boolean;
  /** True when neither the requested locale nor the default had this key. */
  readonly missing: boolean;
}

/**
 * Resolve a single translation key with default-locale fallback (Req 21.4).
 *
 * - Returns the requested-locale value if present.
 * - Falls back to the default-locale value when the requested-locale entry
 *   is missing.
 * - When both are missing, returns the key itself so rendering can continue
 *   without failure.
 */
export function resolveTranslation(
  catalog: TranslationCatalog,
  requestedLocale: string,
  key: string,
  defaultLocale = "en",
): ResolvedTranslation {
  const requested = catalog[requestedLocale]?.[key];
  if (typeof requested === "string") {
    return { value: requested, fellBackToDefault: false, missing: false };
  }
  const fallback = catalog[defaultLocale]?.[key];
  if (typeof fallback === "string") {
    return { value: fallback, fellBackToDefault: requestedLocale !== defaultLocale, missing: false };
  }
  return { value: key, fellBackToDefault: false, missing: true };
}
