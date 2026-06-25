/**
 * StatisticService — social-proof statistics management.
 *
 * Covers Req 16.1–16.4 and the admin-only pipeline aspects of Req 18.1, 18.4, 18.5.
 */
import type { Statistic, StatisticKey, StatisticValueType } from "@/domain";
import { StatisticKey as Key, StatisticValueType as VType, persistenceError } from "@/domain";
import { validateStatisticValue } from "@/domain/validation/statistic";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type { StatisticRepository } from "@/ports/repositories/StatisticRepository";
import { assertAdministrator } from "@/services/auth/authorization";

export interface StatisticServiceDeps {
  readonly statisticRepo: StatisticRepository;
}

/** Inferred value-type per known statistic key. */
const VALUE_TYPE_BY_KEY: Readonly<Record<StatisticKey, StatisticValueType>> = {
  [Key.PROGRAM_COUNT]: VType.COUNT,
  [Key.VISA_SUCCESS_RATE]: VType.RATE,
  [Key.STUDENT_SATISFACTION_RATE]: VType.RATE,
};

export interface StatisticsForHome {
  /** Map of key → value for statistics with non-zero values. */
  readonly nonZero: ReadonlyMap<StatisticKey, number>;
  /** True when every statistic value is zero. */
  readonly allZero: boolean;
}

export class StatisticService {
  private readonly statisticRepo: StatisticRepository;

  constructor(deps: StatisticServiceDeps) {
    this.statisticRepo = deps.statisticRepo;
  }

  /**
   * Public read for the home page (Req 16.1, 16.2). Callers display
   * placeholder text when `allZero` is true.
   */
  async listForHome(): Promise<StatisticsForHome> {
    const all = await this.statisticRepo.list();
    const nonZero = new Map<StatisticKey, number>();
    for (const stat of all) {
      if (stat.value !== 0) nonZero.set(stat.key, stat.value);
    }
    return { nonZero, allZero: all.length > 0 && nonZero.size === 0 };
  }

  /**
   * Admin update of a single statistic.
   * - Non-admin → AuthorizationError (Req 18.1)
   * - Invalid value → ValidationError, prior value retained (Req 16.4, 18.4)
   * - Persistence failure → PersistenceError, prior value retained (Req 18.5)
   */
  async updateStatistic(
    key: StatisticKey,
    value: unknown,
    actor: ActorContext,
  ): Promise<Result<Statistic, DomainError>> {
    const gate = assertAdministrator(actor);
    if (!gate.ok) return gate;

    const valueType = VALUE_TYPE_BY_KEY[key];
    const validation = validateStatisticValue(valueType, value);
    if (!validation.ok) return validation;

    const updateResult = await this.statisticRepo.updateValue(key, validation.value);
    if (!updateResult.ok) {
      // Map repository "not found" to a PersistenceError so callers can
      // surface a unified "change was not saved" message (Req 18.5).
      return err(persistenceError("The change was not saved."));
    }
    return ok(updateResult.value);
  }
}
