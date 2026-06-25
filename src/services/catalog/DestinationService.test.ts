/**
 * Property-based tests for DestinationService.
 *
 * Feature: edu-travel-platform
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { DestinationService } from "./DestinationService";
import {
  InMemoryDestinationRepository,
  InMemoryProgramRepository,
  InMemoryTourPackageRepository,
} from "@/test/fakes";
import { destinationArb, programArb, tourPackageArb } from "@/test/arbitraries/catalog.arb";
import { DestinationKind } from "@/domain";
import type { Program, TourPackage } from "@/domain";

describe("DestinationService", () => {
  let destinationRepo: InMemoryDestinationRepository;
  let programRepo: InMemoryProgramRepository;
  let tourPackageRepo: InMemoryTourPackageRepository;
  let service: DestinationService;

  beforeEach(() => {
    destinationRepo = new InMemoryDestinationRepository();
    programRepo = new InMemoryProgramRepository();
    tourPackageRepo = new InMemoryTourPackageRepository();
    service = new DestinationService({
      destinationRepo,
      programRepo,
      tourPackageRepo,
    });
  });

  // Feature: edu-travel-platform, Property 1: Destination filtering returns only matching items
  // **Validates: Requirements 1.3, 11.3**
  describe("Property 1: Destination filtering returns only matching items", () => {
    it("programs returned by filterProgramsByDestination are exactly those associated with the selected destination", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            destination: destinationArb.filter((d) => d.kind === DestinationKind.STUDY),
            programs: fc.array(programArb, { minLength: 1, maxLength: 10 }),
          }),
          async ({ destination, programs }) => {
            // Setup
            destinationRepo.clear();
            programRepo.clear();
            destinationRepo.seed(destination);

            // Assign some programs to this destination and some to others
            const associatedPrograms: Program[] = [];
            const unassociatedPrograms: Program[] = [];

            for (const p of programs) {
              // Use unique IDs by adjusting if needed
              const shouldAssociate = p.id.localeCompare(destination.id) > 0;
              if (shouldAssociate) {
                const associated = { ...p, destinationId: destination.id };
                programRepo.seed(associated);
                associatedPrograms.push(associated);
              } else {
                const unassociated = { ...p, destinationId: "other-dest-id" };
                programRepo.seed(unassociated);
                unassociatedPrograms.push(unassociated);
              }
            }

            // Act
            const result = await service.filterProgramsByDestination(destination.id);

            // Assert: every returned program is associated with the selected destination
            for (const prog of result) {
              expect(prog.destinationId).toBe(destination.id);
            }

            // Assert: no associated program is omitted
            const returnedIds = new Set(result.map((p) => p.id));
            for (const ap of associatedPrograms) {
              expect(returnedIds.has(ap.id)).toBe(true);
            }

            // Assert: no unassociated program is included
            for (const up of unassociatedPrograms) {
              expect(returnedIds.has(up.id)).toBe(false);
            }
          },
        ),
      );
    });

    it("tour packages returned by filterTourPackagesByDestination are exactly those associated with the selected destination", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            destination: destinationArb.filter((d) => d.kind === DestinationKind.TRAVEL),
            packages: fc.array(tourPackageArb, { minLength: 1, maxLength: 10 }),
          }),
          async ({ destination, packages }) => {
            // Setup
            destinationRepo.clear();
            tourPackageRepo.clear();
            destinationRepo.seed(destination);

            const associatedPackages: TourPackage[] = [];
            const unassociatedPackages: TourPackage[] = [];

            for (const pkg of packages) {
              const shouldAssociate = pkg.id.localeCompare(destination.id) > 0;
              if (shouldAssociate) {
                const associated = { ...pkg, destinationId: destination.id };
                tourPackageRepo.seed(associated);
                associatedPackages.push(associated);
              } else {
                const unassociated = { ...pkg, destinationId: "other-dest-id" };
                tourPackageRepo.seed(unassociated);
                unassociatedPackages.push(unassociated);
              }
            }

            // Act
            const result = await service.filterTourPackagesByDestination(destination.id);

            // Assert: every returned package is associated with the selected destination
            for (const pkg of result) {
              expect(pkg.destinationId).toBe(destination.id);
            }

            // Assert: no associated package is omitted
            const returnedIds = new Set(result.map((p) => p.id));
            for (const ap of associatedPackages) {
              expect(returnedIds.has(ap.id)).toBe(true);
            }

            // Assert: no unassociated package is included
            for (const up of unassociatedPackages) {
              expect(returnedIds.has(up.id)).toBe(false);
            }
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 2: Missing destination info yields indicators while preserving present details
  // **Validates: Requirements 1.6**
  describe("Property 2: Missing destination info yields indicators while preserving present details", () => {
    it("study destination detail shows indicators for absent fields and values for present fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          destinationArb.filter((d) => d.kind === DestinationKind.STUDY),
          async (destination) => {
            // Setup
            destinationRepo.clear();
            programRepo.clear();
            destinationRepo.seed(destination);

            // Act
            const result = await service.getStudyDestinationDetail(destination.id);

            // Assert success
            expect(result.ok).toBe(true);
            if (!result.ok) return;

            const { destination: returnedDest, missingInfoIndicators } = result.value;

            // The destination details are always preserved
            expect(returnedDest.id).toBe(destination.id);
            expect(returnedDest.name).toBe(destination.name);
            expect(returnedDest.country).toBe(destination.country);

            // Check cost of living indicator
            if (destination.costOfLiving === null) {
              expect(missingInfoIndicators.some((i) => i.field === "costOfLiving")).toBe(true);
            } else {
              expect(missingInfoIndicators.some((i) => i.field === "costOfLiving")).toBe(false);
              expect(returnedDest.costOfLiving).toBe(destination.costOfLiving);
            }

            // Check visa info indicator
            if (destination.visaInfo === null) {
              expect(missingInfoIndicators.some((i) => i.field === "visaInfo")).toBe(true);
            } else {
              expect(missingInfoIndicators.some((i) => i.field === "visaInfo")).toBe(false);
              expect(returnedDest.visaInfo).toBe(destination.visaInfo);
            }
          },
        ),
      );
    });

    it("travel destination detail shows indicator for absent guide and value for present guide", async () => {
      await fc.assert(
        fc.asyncProperty(
          destinationArb.filter((d) => d.kind === DestinationKind.TRAVEL),
          async (destination) => {
            // Setup
            destinationRepo.clear();
            tourPackageRepo.clear();
            destinationRepo.seed(destination);

            // Act
            const result = await service.getTravelDestinationDetail(destination.id);

            // Assert success
            expect(result.ok).toBe(true);
            if (!result.ok) return;

            const { destination: returnedDest, missingInfoIndicators } = result.value;

            // The destination details are always preserved
            expect(returnedDest.id).toBe(destination.id);
            expect(returnedDest.name).toBe(destination.name);
            expect(returnedDest.country).toBe(destination.country);

            // Check destination guide indicator
            if (destination.destinationGuide === null) {
              expect(missingInfoIndicators.some((i) => i.field === "destinationGuide")).toBe(true);
            } else {
              expect(missingInfoIndicators.some((i) => i.field === "destinationGuide")).toBe(false);
              expect(returnedDest.destinationGuide).toBe(destination.destinationGuide);
            }
          },
        ),
      );
    });
  });
});
