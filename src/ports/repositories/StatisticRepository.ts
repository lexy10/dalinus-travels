/** Repository port for Statistic entities. */
import type { Statistic, StatisticKey } from "@/domain";
import type { RepositoryResult } from "./common";

export interface StatisticRepository {
  findByKey(key: StatisticKey): Promise<Statistic | null>;
  list(): Promise<readonly Statistic[]>;
  updateValue(key: StatisticKey, value: number): RepositoryResult<Statistic>;
}
