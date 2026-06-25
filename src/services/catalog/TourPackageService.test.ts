// Feature: edu-travel-platform, Property 7: Tour package search matches title or destination
// Feature: edu-travel-platform, Property 8: Tour package filters combine conjunctively

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PublicationStatus, DestinationKind } from "@/domain";
import type { TourPackage, Destination } from "@/domain";
import { InMemoryTourPackageRepository } from "@/test/fakes/repositories/InMemoryTourPackageRepository";
import { InMemoryDestinationRepository } from "@/test/fakes/repositories/InMemoryDestinationRepository";
import { tourPackageArb } from "@/test/arbitraries/catalog.arb";
import { validSearchTermArb } from "@/test/arbitraries/search.arb";
import { createTourPackageService, type TourPackageFilters } from "./TourPackageService";

/** Helper: force a tour package to published status. */
function published(pkg: TourPackage): TourPackage {
  return { ...pkg, status: PublicationStatus.PUBLISHED };
}

/** Helper: create a travel destination with a given id and name. */
function travelDestination(id: string, name: string): Destination {
  return {
    id,
    kind: DestinationKind.TRAVEL,
    name,
    country: "TestCountry",
    costOfLiving: null,
    visaInfo: null,
    destinationGuide: "A guide",
    publishedAt: new Date(),
  };
}

/**
 * Property 7: Tour package search matches title or destination
 * **Validates: Requirements 12.2**
 *
 * For any Tour_Package catalog and any search term, the result set equals
 * exactly the Tour_Packages whose title or associated travel Destination name
 * matches the term under case-insensitive substring matching.
 */
describe("Property 7: Tour package search matches title or destination", () => {
  it("returns exactly the published packages matching title or destination name", async () => {
    // Generate destinations and packages where packages reference real destinations
    const destNameArb = fc.string({ minLength: 1, maxLength: 50 });

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(fc.uuid(), destNameArb),
          { minLength: 1, maxLength: 5 },
        ),
        fc.array(tourPackageArb.map(published), { minLength: 0, maxLength: 15 }),
        validSearchTermArb,
        async (destPairs, packages, term) => {
          const destRepo = new InMemoryDestinationRepository();
          const pkgRepo = new InMemoryTourPackageRepository();

          // Seed destinations
          const destinations: Destination[] = destPairs.map(([id, name]) =>
            travelDestination(id, name),
          );
          for (const d of destinations) destRepo.seed(d);

          // Assign packages to random destinations so lookup works
          const seededPackages = packages.map((pkg, i) => ({
            ...pkg,
            destinationId: destinations[i % destinations.length]!.id,
          }));
          for (const p of seededPackages) pkgRepo.seed(p);

          const service = createTourPackageService(pkgRepo, destRepo);
          const result = await service.search(term);
          expect(result.ok).toBe(true);
          if (!result.ok) return;

          const lowerTerm = term.toLowerCase();

          // Compute expected set
          const expected = seededPackages.filter((pkg) => {
            const titleMatch = pkg.title.toLowerCase().includes(lowerTerm);
            const dest = destinations.find((d) => d.id === pkg.destinationId);
            const destMatch = dest ? dest.name.toLowerCase().includes(lowerTerm) : false;
            return titleMatch || destMatch;
          });

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
        fc.array(
          fc.tuple(fc.uuid(), fc.string({ minLength: 1, maxLength: 50 })),
          { minLength: 1, maxLength: 3 },
        ),
        fc.array(tourPackageArb.map(published), { minLength: 1, maxLength: 10 }),
        validSearchTermArb,
        async (destPairs, packages, term) => {
          const destRepo = new InMemoryDestinationRepository();
          const pkgRepo = new InMemoryTourPackageRepository();

          const destinations = destPairs.map(([id, name]) => travelDestination(id, name));
          for (const d of destinations) destRepo.seed(d);

          const seededPackages = packages.map((pkg, i) => ({
            ...pkg,
            destinationId: destinations[i % destinations.length]!.id,
          }));
          for (const p of seededPackages) pkgRepo.seed(p);

          const service = createTourPackageService(pkgRepo, destRepo);

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
 * Property 8: Tour package filters combine conjunctively
 * **Validates: Requirements 12.4**
 *
 * For any Tour_Package catalog and any combination of destination, price-range,
 * and duration filters, every returned Tour_Package satisfies all applied filters
 * simultaneously, and no Tour_Package satisfying all filters is omitted.
 */
describe("Property 8: Tour package filters combine conjunctively", () => {
  it("every returned package satisfies all filters, and no matching package is omitted", async () => {
    const filtersArb: fc.Arbitrary<TourPackageFilters> = fc.record(
      {
        destinationId: fc.uuid(),
        priceRange: fc
          .tuple(fc.nat({ max: 50_000_000 }), fc.nat({ max: 50_000_000 }))
          .map(([a, b]) => ({ min: Math.min(a, b), max: Math.max(a, b) })),
        durationDays: fc.integer({ min: 1, max: 90 }),
      },
      { requiredKeys: [] },
    );

    await fc.assert(
      fc.asyncProperty(
        fc.array(tourPackageArb.map(published), { minLength: 0, maxLength: 20 }),
        filtersArb,
        async (packages, filters) => {
          const pkgRepo = new InMemoryTourPackageRepository();
          const destRepo = new InMemoryDestinationRepository();
          for (const p of packages) pkgRepo.seed(p);
          const service = createTourPackageService(pkgRepo, destRepo);

          const result = await service.filter(filters);
          expect(result.ok).toBe(true);
          if (!result.ok) return;

          // Every returned package satisfies all filters
          for (const pkg of result.value) {
            if (filters.destinationId) {
              expect(pkg.destinationId).toBe(filters.destinationId);
            }
            if (filters.priceRange) {
              if (filters.priceRange.min != null) {
                expect(pkg.priceMinor).toBeGreaterThanOrEqual(filters.priceRange.min);
              }
              if (filters.priceRange.max != null) {
                expect(pkg.priceMinor).toBeLessThanOrEqual(filters.priceRange.max);
              }
            }
            if (filters.durationDays != null) {
              expect(pkg.durationDays).toBe(filters.durationDays);
            }
          }

          // No matching published package is omitted
          const expected = packages.filter((pkg) => {
            if (filters.destinationId && pkg.destinationId !== filters.destinationId) return false;
            if (filters.priceRange) {
              if (filters.priceRange.min != null && pkg.priceMinor < filters.priceRange.min)
                return false;
              if (filters.priceRange.max != null && pkg.priceMinor > filters.priceRange.max)
                return false;
            }
            if (filters.durationDays != null && pkg.durationDays !== filters.durationDays)
              return false;
            return true;
          });

          expect(result.value).toHaveLength(expected.length);
        },
      ),
    );
  });
});
