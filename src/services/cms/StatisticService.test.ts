/**
 * Property-based tests for StatisticService and the admin CMS pipeline.
 *
 * Covers Properties 49, 51, 52 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { StatisticService } from "./StatisticService";
import { InMemoryStatisticRepository } from "@/test/fakes/repositories/InMemoryStatisticRepository";
import {
  AccountStatus,
  Role,
  StatisticKey,
  StatisticValueType,
  type Statistic,
  type StatisticKey as StatisticKeyT,
} from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";

let statRepo: InMemoryStatisticRepository;
let service: StatisticService;

beforeEach(() => {
  statRepo = new InMemoryStatisticRepository();
  service = new StatisticService({ statisticRepo: statRepo });

  // Seed all three statistics at sane initial values
  const now = new Date("2026-01-01");
  const seeded: Statistic[] = [
    {
      id: "s-1",
      key: StatisticKey.PROGRAM_COUNT,
      valueType: StatisticValueType.COUNT,
      value: 100,
      updatedAt: now,
    },
    {
      id: "s-2",
      key: StatisticKey.VISA_SUCCESS_RATE,
      valueType: StatisticValueType.RATE,
      value: 95,
      updatedAt: now,
    },
    {
      id: "s-3",
      key: StatisticKey.STUDENT_SATISFACTION_RATE,
      valueType: StatisticValueType.RATE,
      value: 90,
      updatedAt: now,
    },
  ];
  for (const s of seeded) statRepo.seed(s);
});

const adminActor: ActorContext = {
  userId: "admin-1",
  roles: new Set([Role.ADMINISTRATOR]),
  accountStatus: AccountStatus.ACTIVE,
  profileComplete: true,
  locale: "en",
};

function nonAdminActor(role: Role): ActorContext {
  return {
    userId: "u-1",
    roles: new Set([role]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
}

// ---------------------------------------------------------------------------
// Property 49: Invalid statistic values are rejected and prior values retained
// Feature: edu-travel-platform, Property 49: Invalid statistic values are rejected and prior values retained
// ---------------------------------------------------------------------------

describe("Property 49: Invalid statistic values are rejected and prior values retained", () => {
  it("invalid count or rate values are rejected and the prior value remains", async () => {
    const countKey = StatisticKey.PROGRAM_COUNT;
    const rateKey = StatisticKey.VISA_SUCCESS_RATE;

    const invalidCountArb = fc.oneof(
      fc.integer({ min: -1000, max: -1 }), // negative
      fc.double({ noNaN: true, min: 0.0001, max: 1000 }).filter((v) => !Number.isInteger(v)), // non-integer
      fc.constant(NaN),
    );
    const invalidRateArb = fc.oneof(
      fc.double({ noNaN: true, min: -100, max: -0.0001 }),
      fc.double({ noNaN: true, min: 100.0001, max: 1000 }),
      fc.constant(NaN),
    );

    await fc.assert(
      fc.asyncProperty(invalidCountArb, invalidRateArb, async (badCount, badRate) => {
        const priorCount = (await statRepo.findByKey(countKey))!.value;
        const priorRate = (await statRepo.findByKey(rateKey))!.value;

        const r1 = await service.updateStatistic(countKey, badCount, adminActor);
        expect(r1.ok).toBe(false);
        if (!r1.ok) expect(r1.error.kind).toBe(DomainErrorKind.Validation);

        const r2 = await service.updateStatistic(rateKey, badRate, adminActor);
        expect(r2.ok).toBe(false);
        if (!r2.ok) expect(r2.error.kind).toBe(DomainErrorKind.Validation);

        expect((await statRepo.findByKey(countKey))!.value).toBe(priorCount);
        expect((await statRepo.findByKey(rateKey))!.value).toBe(priorRate);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 51: Administrative operations are denied to non-administrators
// Feature: edu-travel-platform, Property 51: Administrative operations are denied to non-administrators
// ---------------------------------------------------------------------------

describe("Property 51: Administrative operations are denied to non-administrators", () => {
  it("non-admin actors are denied and produce no state change", async () => {
    const nonAdminRoleArb = fc.constantFrom(Role.STUDENT_TRAVELER, Role.RECRUITER, Role.PARTNER);
    const keyArb = fc.constantFrom<StatisticKeyT>(
      StatisticKey.PROGRAM_COUNT,
      StatisticKey.VISA_SUCCESS_RATE,
      StatisticKey.STUDENT_SATISFACTION_RATE,
    );

    await fc.assert(
      fc.asyncProperty(nonAdminRoleArb, keyArb, fc.integer({ min: 0, max: 99 }), async (role, key, value) => {
        const prior = (await statRepo.findByKey(key))!.value;

        const result = await service.updateStatistic(key, value, nonAdminActor(role));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.kind).toBe(DomainErrorKind.Authorization);

        expect((await statRepo.findByKey(key))!.value).toBe(prior);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 52: Invalid CMS operations and persistence failures retain prior state
// Feature: edu-travel-platform, Property 52: Invalid CMS operations and persistence failures retain prior state
// ---------------------------------------------------------------------------

describe("Property 52: Invalid CMS operations and persistence failures retain prior state", () => {
  it("persistence failures surface as PersistenceError and retain prior state", async () => {
    // Drive a persistence failure by attempting to update a non-existent key
    // (the in-memory fake responds with conflictError which the service maps
    // to PersistenceError, mirroring the production "not saved" pathway).
    statRepo.clear();

    const result = await service.updateStatistic(
      StatisticKey.PROGRAM_COUNT,
      42,
      adminActor,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe(DomainErrorKind.Persistence);
    expect(await statRepo.findByKey(StatisticKey.PROGRAM_COUNT)).toBeNull();
  });

  it("listForHome marks allZero when every statistic is zero", async () => {
    await statRepo.updateValue(StatisticKey.PROGRAM_COUNT, 0);
    await statRepo.updateValue(StatisticKey.VISA_SUCCESS_RATE, 0);
    await statRepo.updateValue(StatisticKey.STUDENT_SATISFACTION_RATE, 0);

    const summary = await service.listForHome();
    expect(summary.allZero).toBe(true);
    expect(summary.nonZero.size).toBe(0);
  });
});
