import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { DEFAULT_NUM_RUNS } from "./setup/fast-check.setup";
// Imported via the `@domain/*` path alias to confirm Vitest resolves the
// tsconfig path aliases used throughout the application.
import * as domain from "@domain/index";

/**
 * Property-Based Testing (PBT) tagging convention for this spec.
 *
 * Every property-based test in the codebase MUST be tagged with a comment that
 * references its design property using the format:
 *
 *   // Feature: edu-travel-platform, Property {number}: {property_text}
 *
 * where {number} is the design's Correctness Property number and {property_text}
 * is that property's statement. This keeps each of the 55 correctness properties
 * traceable to exactly one property-based test.
 *
 * The tests below are harness smoke tests (not numbered design properties): they
 * confirm that Vitest runs, fast-check is wired in, and the global minimum of
 * 100 iterations (`numRuns`) is in effect.
 */
describe("PBT harness", () => {
  it("runs Vitest assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves tsconfig path aliases (e.g. @domain/*)", () => {
    // The domain barrel currently exports nothing, but a successful import
    // proves the `@domain/*` alias resolves under Vitest.
    expect(domain).toBeTypeOf("object");
  });

  it("applies the global fast-check numRuns floor of at least 100", () => {
    const { numRuns } = fc.readConfigureGlobal() ?? {};
    expect(numRuns).toBe(DEFAULT_NUM_RUNS);
    expect(numRuns).toBeGreaterThanOrEqual(100);
  });

  it("verifies a simple property across generated inputs", () => {
    // Example only — real property tests carry the tagging comment shown above,
    // e.g. `// Feature: edu-travel-platform, Property 3: ...`.
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
    );
  });

  it("honors the global iteration count without a per-call override", () => {
    let invocations = 0;
    fc.assert(
      fc.property(fc.nat(), () => {
        invocations += 1;
        return true;
      }),
    );
    // The global configuration drives at least 100 generated cases.
    expect(invocations).toBeGreaterThanOrEqual(100);
  });
});
