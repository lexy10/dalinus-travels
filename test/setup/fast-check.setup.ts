import { configureGlobal } from "fast-check";

/**
 * Global fast-check configuration applied to every property-based test in the
 * suite (loaded via `setupFiles` in `vitest.config.ts`).
 *
 * Per the design's Testing Strategy, each property test runs a minimum of 100
 * iterations. Setting `numRuns` here establishes that floor globally so
 * individual tests do not need to repeat it; a test may still raise the count
 * for a specific property by passing `{ numRuns }` to `fc.assert`.
 */
export const DEFAULT_NUM_RUNS = 100;

configureGlobal({
  numRuns: DEFAULT_NUM_RUNS,
});
