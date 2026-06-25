/** Repository port for TourPackage entities. */
import type { PublicationStatus, TourPackage } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateTourPackageInput {
  readonly destinationId: string;
  readonly title: string;
  readonly itinerary: string;
  readonly durationDays: number;
  readonly inclusions: readonly string[];
  readonly priceMinor: number;
  readonly priceCurrency: string;
  readonly totalCapacity: number;
  readonly availabilityCount: number;
  readonly status: PublicationStatus;
}

export interface UpdateTourPackageInput {
  readonly destinationId?: string;
  readonly title?: string;
  readonly itinerary?: string;
  readonly durationDays?: number;
  readonly inclusions?: readonly string[];
  readonly priceMinor?: number;
  readonly priceCurrency?: string;
  readonly totalCapacity?: number;
  readonly status?: PublicationStatus;
}

export interface TourPackageRepository {
  findById(id: string): Promise<TourPackage | null>;
  listPublished(pagination?: Pagination): Promise<readonly TourPackage[]>;
  listByDestination(destinationId: string): Promise<readonly TourPackage[]>;
  create(input: CreateTourPackageInput): RepositoryResult<TourPackage>;
  update(id: string, input: UpdateTourPackageInput): RepositoryResult<TourPackage>;
  delete(id: string): RepositoryResult<TourPackage>;
}
