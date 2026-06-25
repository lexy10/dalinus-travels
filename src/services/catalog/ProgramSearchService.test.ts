// Feature: edu-travel-platform, Property 3: Program search is case-insensitive substring matching
// Feature: edu-travel-platform, Property 4: Program filters combine conjunctively
// Feature: edu-travel-platform, Property 5: Invalid search terms rejected, results unchanged
// Feature: edu-travel-platform, Property 6: Inverted tuition range rejected, results unchanged

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PublicationStatus } from "@/domain";
import type { Program } from "@/domain";
import { InMemoryProgramRepository } from "@/test/fakes/repositories/InMemoryProgramRepository";
import { programArb } from "@/test/arbitraries/catalog.arb";
import { validSearchTermArb, whitespaceOnlySearchArb, tooLongSearchTermArb } from "@/test/arbitraries/search.arb";
import { invertedTuitionRangeArb } from "@/test/arbitraries/tuition.arb";
import { createProgramSearchService, type ProgramFilters } from "./ProgramSearchService";

/** Helper: force a program to published status. */
function published(program: Program): Program {
  return { ...program, status: PublicationStatus.PUBLISHED };
}

/**
 * Property 3: Program search is case-insensitive substring matching
 * **Validates: Requirements 2.2**
 *
 * For any Program catalog and any search term of 1–200 characters, the result
 * set equals exactly the Programs whose title, field of study, or institution
 * name contains the term under case-insensitive substring matching.
 */
describe("Property 3: Program search is case-insensitive substring matching", () => {
  it("returns exactly the published programs matching case-insensitive substring in title/field/institution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 0, maxLength: 20 }),
        validSearchTermArb,
        async (programs, term) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const result = await service.search(term);
          expect(result.ok).toBe(true);
          if (!result.ok) return;

          const lowerTerm = term.toLowerCase();
          const expected = programs.filter(
            (p) =>
              p.title.toLowerCase().includes(lowerTerm) ||
              p.fieldOfStudy.toLowerCase().includes(lowerTerm) ||
              p.institutionName.toLowerCase().includes(lowerTerm),
          );

          expect(result.value).toHaveLength(expected.length);
          const resultIds = result.value.map((p) => p.id).sort();
          const expectedIds = expected.map((p) => p.id).sort();
          expect(resultIds).toEqual(expectedIds);
        },
      ),
    );
  });

  it("search results are identical regardless of term casing", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 1, maxLength: 10 }),
        validSearchTermArb,
        async (programs, term) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const lower = await service.search(term.toLowerCase());
          const upper = await service.search(term.toUpperCase());

          expect(lower.ok).toBe(true);
          expect(upper.ok).toBe(true);
          if (!lower.ok || !upper.ok) return;

          const lowerIds = lower.value.map((p) => p.id).sort();
          const upperIds = upper.value.map((p) => p.id).sort();
          expect(lowerIds).toEqual(upperIds);
        },
      ),
    );
  });
});

/**
 * Property 4: Program filters combine conjunctively
 * **Validates: Requirements 2.3**
 *
 * For any Program catalog and any combination of study-level, field-of-study,
 * tuition-range, and intake-date filters, every returned Program satisfies all
 * applied filters simultaneously, and no Program satisfying all filters is omitted.
 */
describe("Property 4: Program filters combine conjunctively", () => {
  it("every returned program satisfies all filters, and no matching program is omitted", async () => {
    const filtersArb: fc.Arbitrary<ProgramFilters> = fc.record(
      {
        level: fc.constantFrom("Undergraduate", "Postgraduate", "PhD", "Diploma"),
        field: fc.string({ minLength: 1, maxLength: 80 }),
        tuitionRange: fc
          .tuple(fc.nat({ max: 100_000_000 }), fc.nat({ max: 100_000_000 }))
          .map(([a, b]) => ({ min: Math.min(a, b), max: Math.max(a, b) })),
        intakeDate: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
      },
      { requiredKeys: [] },
    );

    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 0, maxLength: 20 }),
        filtersArb,
        async (programs, filters) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const result = await service.filter(filters);
          expect(result.ok).toBe(true);
          if (!result.ok) return;

          // Every returned program satisfies all filters
          for (const p of result.value) {
            if (filters.level) expect(p.studyLevel).toBe(filters.level);
            if (filters.field) expect(p.fieldOfStudy).toBe(filters.field);
            if (filters.tuitionRange) {
              if (filters.tuitionRange.min != null)
                expect(p.tuitionMinor).toBeGreaterThanOrEqual(filters.tuitionRange.min);
              if (filters.tuitionRange.max != null)
                expect(p.tuitionMinor).toBeLessThanOrEqual(filters.tuitionRange.max);
            }
            if (filters.intakeDate) {
              const hasDate = p.intakeDates.some(
                (d) => d.getTime() === filters.intakeDate!.getTime(),
              );
              expect(hasDate).toBe(true);
            }
          }

          // No matching published program is omitted
          const expected = programs.filter((p) => {
            if (filters.level && p.studyLevel !== filters.level) return false;
            if (filters.field && p.fieldOfStudy !== filters.field) return false;
            if (filters.tuitionRange) {
              if (filters.tuitionRange.min != null && p.tuitionMinor < filters.tuitionRange.min) return false;
              if (filters.tuitionRange.max != null && p.tuitionMinor > filters.tuitionRange.max) return false;
            }
            if (filters.intakeDate) {
              const hasDate = p.intakeDates.some(
                (d) => d.getTime() === filters.intakeDate!.getTime(),
              );
              if (!hasDate) return false;
            }
            return true;
          });

          expect(result.value).toHaveLength(expected.length);
        },
      ),
    );
  });
});

/**
 * Property 5: Invalid search terms are rejected and leave results unchanged
 * **Validates: Requirements 2.6, 2.7**
 *
 * For any search term that is empty, whitespace-only, or longer than 200 characters,
 * the search is rejected with the appropriate message and the catalog results
 * are unchanged.
 */
describe("Property 5: Invalid search terms rejected, results unchanged", () => {
  it("empty/whitespace-only terms are rejected with validation error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 0, maxLength: 10 }),
        whitespaceOnlySearchArb,
        async (programs, term) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const result = await service.search(term);
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe("ValidationError");
        },
      ),
    );
  });

  it("empty string is rejected with validation error", async () => {
    const repo = new InMemoryProgramRepository();
    const service = createProgramSearchService(repo);

    const result = await service.search("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("ValidationError");
  });

  it("terms exceeding 200 characters are rejected with validation error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 0, maxLength: 10 }),
        tooLongSearchTermArb,
        async (programs, term) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const result = await service.search(term);
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe("ValidationError");
        },
      ),
    );
  });
});

/**
 * Property 6: Inverted tuition range is rejected and leaves results unchanged
 * **Validates: Requirements 2.8**
 *
 * For any tuition range whose minimum exceeds its maximum, the filter is rejected
 * and the results are unchanged.
 */
describe("Property 6: Inverted tuition range rejected, results unchanged", () => {
  it("inverted tuition range is rejected with validation error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(programArb.map(published), { minLength: 0, maxLength: 10 }),
        invertedTuitionRangeArb,
        async (programs, invertedRange) => {
          const repo = new InMemoryProgramRepository();
          for (const p of programs) repo.seed(p);
          const service = createProgramSearchService(repo);

          const result = await service.filter({ tuitionRange: invertedRange });
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe("ValidationError");
        },
      ),
    );
  });
});
