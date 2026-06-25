/**
 * Tour package discovery service.
 *
 * Provides case-insensitive substring search over tour package title or
 * associated destination name; conjunctive (AND) filtering by destination,
 * price range, and duration; and detail retrieval including availability.
 *
 * Only published packages are surfaced through search/filter.
 */
import type { TourPackage, DomainError, Result } from "@/domain";
import { ok, err } from "@/domain/kernel";
import { validateSearchTerm } from "@/domain/validation/search";
import type { TourPackageRepository } from "@/ports";
import type { DestinationRepository } from "@/ports";

export interface TourPackageFilters {
  readonly destinationId?: string;
  readonly priceRange?: { readonly min?: number; readonly max?: number };
  readonly durationDays?: number;
}

export interface TourPackageService {
  /** Case-insensitive substring search over title or associated destination name. */
  search(term: string): Promise<Result<readonly TourPackage[], DomainError>>;
  /** Conjunctive filtering; all applied filters must be satisfied. */
  filter(filters: TourPackageFilters): Promise<Result<readonly TourPackage[], DomainError>>;
  /** Retrieve tour package detail by ID including availability. */
  getDetail(id: string): Promise<Result<TourPackage, DomainError>>;
}

export function createTourPackageService(
  tourPackageRepository: TourPackageRepository,
  destinationRepository: DestinationRepository,
): TourPackageService {
  return {
    async search(term: string): Promise<Result<readonly TourPackage[], DomainError>> {
      const validated = validateSearchTerm(term);
      if (!validated.ok) {
        return err(validated.error);
      }

      const published = await tourPackageRepository.listPublished();
      const lowerTerm = validated.value.toLowerCase();

      // Build a map of destination names for matching
      const destinationNames = new Map<string, string>();
      for (const pkg of published) {
        if (!destinationNames.has(pkg.destinationId)) {
          const dest = await destinationRepository.findById(pkg.destinationId);
          if (dest) {
            destinationNames.set(pkg.destinationId, dest.name.toLowerCase());
          }
        }
      }

      const results = published.filter((pkg) => {
        const titleMatch = pkg.title.toLowerCase().includes(lowerTerm);
        const destName = destinationNames.get(pkg.destinationId) ?? "";
        const destMatch = destName.includes(lowerTerm);
        return titleMatch || destMatch;
      });

      return ok(results);
    },

    async filter(
      filters: TourPackageFilters,
    ): Promise<Result<readonly TourPackage[], DomainError>> {
      const published = await tourPackageRepository.listPublished();

      const results = published.filter((pkg) => {
        if (filters.destinationId && pkg.destinationId !== filters.destinationId) {
          return false;
        }
        if (filters.priceRange) {
          const { min, max } = filters.priceRange;
          if (min != null && pkg.priceMinor < min) {
            return false;
          }
          if (max != null && pkg.priceMinor > max) {
            return false;
          }
        }
        if (filters.durationDays != null && pkg.durationDays !== filters.durationDays) {
          return false;
        }
        return true;
      });

      return ok(results);
    },

    async getDetail(id: string): Promise<Result<TourPackage, DomainError>> {
      const pkg = await tourPackageRepository.findById(id);
      if (!pkg) {
        return err({
          kind: "NotFoundError" as const,
          message: "Tour package not found.",
          resource: "TourPackage",
        });
      }
      return ok(pkg);
    },
  };
}
