/**
 * Catalog service: Destination listing, filtering, and detail views.
 *
 * Covers:
 * - Study destination listing (Req 1.1, 1.5)
 * - Travel destination listing (Req 11.1)
 * - Study destination detail with programs + missing-info indicators (Req 1.2, 1.4, 1.6)
 * - Travel destination detail with tour packages + missing-guide indicator (Req 11.2, 11.4, 11.5)
 * - Filter programs by destination (Req 1.3)
 * - Filter tour packages by destination (Req 11.3)
 */
import type { Destination, Program, TourPackage } from "@/domain";
import { DestinationKind, notFoundError } from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { DestinationRepository } from "@/ports/repositories/DestinationRepository";
import type { ProgramRepository } from "@/ports/repositories/ProgramRepository";
import type { TourPackageRepository } from "@/ports/repositories/TourPackageRepository";

/** Indicator for a missing info field. */
export interface MissingInfoIndicator {
  readonly field: string;
  readonly message: string;
}

/** Detail view for a study destination. */
export interface StudyDestinationDetail {
  readonly destination: Destination;
  readonly programs: readonly Program[];
  readonly missingInfoIndicators: readonly MissingInfoIndicator[];
}

/** Detail view for a travel destination. */
export interface TravelDestinationDetail {
  readonly destination: Destination;
  readonly tourPackages: readonly TourPackage[];
  readonly missingInfoIndicators: readonly MissingInfoIndicator[];
}

export interface DestinationServiceDeps {
  readonly destinationRepo: DestinationRepository;
  readonly programRepo: ProgramRepository;
  readonly tourPackageRepo: TourPackageRepository;
}

export class DestinationService {
  private readonly destinationRepo: DestinationRepository;
  private readonly programRepo: ProgramRepository;
  private readonly tourPackageRepo: TourPackageRepository;

  constructor(deps: DestinationServiceDeps) {
    this.destinationRepo = deps.destinationRepo;
    this.programRepo = deps.programRepo;
    this.tourPackageRepo = deps.tourPackageRepo;
  }

  /** List all study destinations regardless of associated programs (Req 1.1, 1.5). */
  async listStudyDestinations(): Promise<readonly Destination[]> {
    return this.destinationRepo.listByKind(DestinationKind.STUDY);
  }

  /** List all travel destinations regardless of associated packages (Req 11.1). */
  async listTravelDestinations(): Promise<readonly Destination[]> {
    return this.destinationRepo.listByKind(DestinationKind.TRAVEL);
  }

  /**
   * Get study destination detail: destination + associated programs + missing-info indicators.
   * (Req 1.2, 1.4, 1.6)
   */
  async getStudyDestinationDetail(id: string): Promise<Result<StudyDestinationDetail, DomainError>> {
    const destination = await this.destinationRepo.findById(id);
    if (!destination) {
      return err(notFoundError("Study destination not found.", "Destination"));
    }
    if (destination.kind !== DestinationKind.STUDY) {
      return err(notFoundError("Study destination not found.", "Destination"));
    }

    const programs = await this.programRepo.listByDestination(id);
    const missingInfoIndicators = this.buildStudyMissingIndicators(destination);

    return ok({ destination, programs, missingInfoIndicators });
  }

  /**
   * Get travel destination detail: destination + associated tour packages + missing-guide indicator.
   * (Req 11.2, 11.4, 11.5)
   */
  async getTravelDestinationDetail(id: string): Promise<Result<TravelDestinationDetail, DomainError>> {
    const destination = await this.destinationRepo.findById(id);
    if (!destination) {
      return err(notFoundError("Travel destination not found.", "Destination"));
    }
    if (destination.kind !== DestinationKind.TRAVEL) {
      return err(notFoundError("Travel destination not found.", "Destination"));
    }

    const tourPackages = await this.tourPackageRepo.listByDestination(id);
    const missingInfoIndicators = this.buildTravelMissingIndicators(destination);

    return ok({ destination, tourPackages, missingInfoIndicators });
  }

  /** Filter programs by destination (Req 1.3). */
  async filterProgramsByDestination(destinationId: string): Promise<readonly Program[]> {
    return this.programRepo.listByDestination(destinationId);
  }

  /** Filter tour packages by destination (Req 11.3). */
  async filterTourPackagesByDestination(destinationId: string): Promise<readonly TourPackage[]> {
    return this.tourPackageRepo.listByDestination(destinationId);
  }

  /** Build missing-info indicators for a study destination (Req 1.6). */
  private buildStudyMissingIndicators(destination: Destination): readonly MissingInfoIndicator[] {
    const indicators: MissingInfoIndicator[] = [];
    if (destination.costOfLiving === null) {
      indicators.push({
        field: "costOfLiving",
        message: "Cost of living information is not currently available.",
      });
    }
    if (destination.visaInfo === null) {
      indicators.push({
        field: "visaInfo",
        message: "Visa information is not currently available.",
      });
    }
    return indicators;
  }

  /** Build missing-info indicators for a travel destination. */
  private buildTravelMissingIndicators(destination: Destination): readonly MissingInfoIndicator[] {
    const indicators: MissingInfoIndicator[] = [];
    if (destination.destinationGuide === null) {
      indicators.push({
        field: "destinationGuide",
        message: "Destination guide is not currently available.",
      });
    }
    return indicators;
  }
}
