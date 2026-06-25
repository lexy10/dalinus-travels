import * as fc from "fast-check";
import type { TuitionRange } from "@/domain/validation/tuition";

export const validTuitionRangeArb: fc.Arbitrary<TuitionRange> = fc
  .tuple(
    fc.nat({ max: 1_000_000 }),
    fc.nat({ max: 1_000_000 }),
  )
  .map(([a, b]) => ({ min: Math.min(a, b), max: Math.max(a, b) }));

export const invertedTuitionRangeArb: fc.Arbitrary<TuitionRange> = fc
  .tuple(
    fc.integer({ min: 1, max: 1_000_000 }),
    fc.integer({ min: 1, max: 1_000_000 }),
  )
  .filter(([a, b]) => a > b)
  .map(([a, b]) => ({ min: a, max: b }));

export const negativeTuitionRangeArb: fc.Arbitrary<TuitionRange> = fc.oneof(
  fc.integer({ min: -1_000_000, max: -1 }).map(n => ({ min: n, max: 100 })),
  fc.integer({ min: -1_000_000, max: -1 }).map(n => ({ min: 0, max: n })),
);
