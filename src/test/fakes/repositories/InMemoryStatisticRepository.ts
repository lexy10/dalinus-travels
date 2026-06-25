import type { Statistic, StatisticKey } from "@/domain";
import type { StatisticRepository } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";

export class InMemoryStatisticRepository implements StatisticRepository {
  private store = new Map<StatisticKey, Statistic>();

  async findByKey(key: StatisticKey): Promise<Statistic | null> {
    return this.store.get(key) ?? null;
  }

  async list(): Promise<readonly Statistic[]> {
    return [...this.store.values()];
  }

  async updateValue(key: StatisticKey, value: number): Promise<Result<Statistic, DomainError>> {
    const existing = this.store.get(key);
    if (!existing) return err(conflictError("Statistic not found.", "Statistic"));
    const updated: Statistic = { ...existing, value, updatedAt: new Date() };
    this.store.set(key, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(stat: Statistic) { this.store.set(stat.key, stat); }
}
