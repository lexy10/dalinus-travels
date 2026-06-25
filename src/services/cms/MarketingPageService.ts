/**
 * MarketingPageService — CMS-managed marketing/guidance/legal pages.
 *
 * Covers Req 7.1–7.6, 14.1–14.5, 15.7, 17.1–17.2.
 *
 * Pages are stored as per-locale bodies; resolution falls back to the default
 * locale when the requested locale is missing (Req 21.4 — exercised end-to-end
 * by Property 55 / the i18n adapter).
 */
import type { MarketingPage, MarketingPageKey } from "@/domain";
import { PublicationStatus, missingFieldsError, notFoundError } from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type { MarketingPageRepository } from "@/ports/repositories/MarketingPageRepository";
import { assertAdministrator } from "@/services/auth/authorization";

export const DEFAULT_LOCALE = "en";

export interface ResolvedPage {
  readonly key: MarketingPageKey;
  readonly locale: string;
  readonly body: string;
  /** True when the body was resolved from the default locale instead of `requestedLocale`. */
  readonly fellBackToDefault: boolean;
}

export interface UpsertPageInput {
  readonly key: MarketingPageKey;
  readonly localizedContent: Readonly<Record<string, string>>;
  readonly status?: PublicationStatus;
}

export interface MarketingPageServiceDeps {
  readonly pageRepo: MarketingPageRepository;
}

export class MarketingPageService {
  private readonly pageRepo: MarketingPageRepository;

  constructor(deps: MarketingPageServiceDeps) {
    this.pageRepo = deps.pageRepo;
  }

  /**
   * Resolve a published marketing page in the requested locale, with i18n
   * fallback to the default locale (Req 21.4).
   */
  async getPublishedContent(
    key: MarketingPageKey,
    requestedLocale: string,
  ): Promise<Result<ResolvedPage, DomainError>> {
    const page = await this.pageRepo.findByKey(key);
    if (!page || page.status !== PublicationStatus.PUBLISHED) {
      return err(notFoundError("Page content is not available.", "MarketingPage"));
    }

    const requestedBody = page.localizedContent[requestedLocale];
    if (typeof requestedBody === "string" && requestedBody.length > 0) {
      return ok({
        key,
        locale: requestedLocale,
        body: requestedBody,
        fellBackToDefault: false,
      });
    }
    const defaultBody = page.localizedContent[DEFAULT_LOCALE];
    if (typeof defaultBody === "string" && defaultBody.length > 0) {
      return ok({
        key,
        locale: DEFAULT_LOCALE,
        body: defaultBody,
        fellBackToDefault: requestedLocale !== DEFAULT_LOCALE,
      });
    }
    return err(notFoundError("Page content is not available.", "MarketingPage"));
  }

  /**
   * Admin-only upsert. Requires at least one non-empty locale body.
   */
  async upsert(
    input: UpsertPageInput,
    actor: ActorContext,
  ): Promise<Result<MarketingPage, DomainError>> {
    const gate = assertAdministrator(actor);
    if (!gate.ok) return gate;

    if (!input.key) {
      return err(missingFieldsError(["key"]));
    }
    const hasContent =
      input.localizedContent &&
      Object.values(input.localizedContent).some((v) => typeof v === "string" && v.length > 0);
    if (!hasContent) {
      return err(missingFieldsError(["localizedContent"]));
    }

    return this.pageRepo.upsert({
      key: input.key,
      localizedContent: input.localizedContent,
      status: input.status ?? PublicationStatus.PUBLISHED,
    });
  }
}
