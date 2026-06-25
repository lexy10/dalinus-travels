import type { MarketingPage, MarketingPageKey } from "@/domain";
import type { MarketingPageRepository, UpsertMarketingPageInput } from "@/ports";
import { ok, type Result, type DomainError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryMarketingPageRepository implements MarketingPageRepository {
  private store = new Map<MarketingPageKey, MarketingPage>();

  async findByKey(key: MarketingPageKey): Promise<MarketingPage | null> {
    return this.store.get(key) ?? null;
  }

  async list(): Promise<readonly MarketingPage[]> {
    return [...this.store.values()];
  }

  async upsert(input: UpsertMarketingPageInput): Promise<Result<MarketingPage, DomainError>> {
    const existing = this.store.get(input.key);
    const page: MarketingPage = {
      id: existing?.id ?? randomUUID(),
      key: input.key,
      localizedContent: input.localizedContent,
      status: input.status,
      updatedAt: new Date(),
    };
    this.store.set(input.key, page);
    return ok(page);
  }

  clear() { this.store.clear(); }
  seed(page: MarketingPage) { this.store.set(page.key, page); }
}
