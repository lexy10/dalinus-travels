/** Repository port for MarketingPage entities. */
import type { MarketingPage, MarketingPageKey, PublicationStatus } from "@/domain";
import type { RepositoryResult } from "./common";

export interface UpsertMarketingPageInput {
  readonly key: MarketingPageKey;
  readonly localizedContent: Readonly<Record<string, string>>;
  readonly status: PublicationStatus;
}

export interface MarketingPageRepository {
  findByKey(key: MarketingPageKey): Promise<MarketingPage | null>;
  list(): Promise<readonly MarketingPage[]>;
  upsert(input: UpsertMarketingPageInput): RepositoryResult<MarketingPage>;
}
