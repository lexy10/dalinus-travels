import type { CookieConsent } from "@/domain";
import type { CookieConsentRepository, RecordCookieConsentInput } from "@/ports";
import { ok, type Result, type DomainError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryCookieConsentRepository implements CookieConsentRepository {
  private store: CookieConsent[] = [];

  async findLatestByVisitor(visitorId: string): Promise<CookieConsent | null> {
    const matching = this.store.filter(c => c.visitorId === visitorId);
    if (matching.length === 0) return null;
    return matching[matching.length - 1]!;
  }

  async record(input: RecordCookieConsentInput): Promise<Result<CookieConsent, DomainError>> {
    const consent: CookieConsent = {
      id: randomUUID(),
      visitorId: input.visitorId,
      choice: input.choice,
      recordedAt: new Date(),
    };
    this.store.push(consent);
    return ok(consent);
  }

  clear() { this.store = []; }
  seed(consent: CookieConsent) { this.store.push(consent); }
}
