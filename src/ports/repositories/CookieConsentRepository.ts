/** Repository port for CookieConsent entities. */
import type { CookieConsent, CookieConsentChoice } from "@/domain";
import type { RepositoryResult } from "./common";

export interface RecordCookieConsentInput {
  readonly visitorId: string;
  readonly choice: CookieConsentChoice;
}

export interface CookieConsentRepository {
  findLatestByVisitor(visitorId: string): Promise<CookieConsent | null>;
  record(input: RecordCookieConsentInput): RepositoryResult<CookieConsent>;
}
