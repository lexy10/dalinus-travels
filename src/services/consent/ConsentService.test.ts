/**
 * Property-based tests for ConsentService and the i18n fallback resolver.
 *
 * Covers Properties 50, 55 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  ConsentService,
  resolveTranslation,
  type TranslationCatalog,
} from "./ConsentService";
import { InMemoryCookieConsentRepository } from "@/test/fakes/repositories/InMemoryCookieConsentRepository";
import { COOKIE_CONSENT_VALIDITY_DAYS, CookieConsentChoice, type CookieConsent } from "@/domain";

class FakeClock {
  constructor(private current = new Date("2026-06-01T10:00:00Z")) {}
  now() {
    return this.current;
  }
}

let repo: InMemoryCookieConsentRepository;
let clock: FakeClock;
let service: ConsentService;

beforeEach(() => {
  repo = new InMemoryCookieConsentRepository();
  clock = new FakeClock();
  service = new ConsentService({ consentRepo: repo, clock });
});

// ---------------------------------------------------------------------------
// Property 50: Cookie consent is suppressed within its validity window
// Feature: edu-travel-platform, Property 50: Cookie consent is suppressed within its validity window
// ---------------------------------------------------------------------------

describe("Property 50: Cookie consent is suppressed within its validity window", () => {
  it("suppressed iff recorded ≤ 365 days ago", async () => {
    const visitorArb = fc.uuid();
    const choiceArb = fc.constantFrom(CookieConsentChoice.ACCEPTED, CookieConsentChoice.REJECTED);
    const daysAgoArb = fc.integer({ min: 0, max: 500 });

    await fc.assert(
      fc.asyncProperty(visitorArb, choiceArb, daysAgoArb, async (visitorId, choice, daysAgo) => {
        repo.clear();
        const now = clock.now();
        const recordedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const consent: CookieConsent = {
          id: "c-1",
          visitorId,
          choice,
          recordedAt,
        };
        repo.seed(consent);

        const shouldShow = await service.shouldShowNotice(visitorId);
        const expectedSuppress = daysAgo <= COOKIE_CONSENT_VALIDITY_DAYS;
        expect(shouldShow).toBe(!expectedSuppress);
      }),
    );
  });

  it("shows the notice when no consent has been recorded", async () => {
    expect(await service.shouldShowNotice("first-time-visitor")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 55: Missing translations fall back to the default language
// Feature: edu-travel-platform, Property 55: Missing translations fall back to the default language
// ---------------------------------------------------------------------------

describe("Property 55: Missing translations fall back to the default language", () => {
  it("resolves to requested locale when present, else falls back to default; never throws", () => {
    const keyArb = fc.string({ minLength: 1, maxLength: 20 });
    const localeArb = fc.constantFrom("en", "fr", "es", "de");

    fc.assert(
      fc.property(
        fc.dictionary(keyArb, fc.string()), // default-locale entries
        fc.dictionary(keyArb, fc.string()), // requested-locale entries
        localeArb,
        keyArb,
        (defaultEntries, requestedEntries, locale, key) => {
          fc.pre(locale !== "en");
          const catalog: TranslationCatalog = {
            en: defaultEntries,
            [locale]: requestedEntries,
          };

          const resolved = resolveTranslation(catalog, locale, key, "en");

          if (typeof requestedEntries[key] === "string") {
            expect(resolved.value).toBe(requestedEntries[key]);
            expect(resolved.fellBackToDefault).toBe(false);
            expect(resolved.missing).toBe(false);
          } else if (typeof defaultEntries[key] === "string") {
            expect(resolved.value).toBe(defaultEntries[key]);
            expect(resolved.fellBackToDefault).toBe(true);
            expect(resolved.missing).toBe(false);
          } else {
            // Neither present — fail-safe returns the key itself
            expect(resolved.value).toBe(key);
            expect(resolved.missing).toBe(true);
          }
        },
      ),
    );
  });

  it("a requested-locale entry of the same name as default returns from the requested locale", () => {
    const catalog: TranslationCatalog = {
      en: { greet: "Hello" },
      fr: { greet: "Bonjour" },
    };
    const r = resolveTranslation(catalog, "fr", "greet");
    expect(r.value).toBe("Bonjour");
    expect(r.fellBackToDefault).toBe(false);
  });

  it("when default and requested are both missing the resolver returns the key without throwing", () => {
    const r = resolveTranslation({ en: {} }, "fr", "nonexistent");
    expect(r.value).toBe("nonexistent");
    expect(r.missing).toBe(true);
  });
});
