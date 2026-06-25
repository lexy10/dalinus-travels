import type { PublicationStatus, TourPackage } from "@/domain";
import { isPublicationStatus } from "@/domain";
import type {
  TourPackageRepository,
  CreateTourPackageInput,
  UpdateTourPackageInput,
} from "@/ports/repositories/TourPackageRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  destinationId: string;
  title: string;
  itinerary: string;
  durationDays: number;
  inclusions: string[];
  priceMinor: number;
  priceCurrency: string;
  totalCapacity: number;
  availabilityCount: number;
  status: string;
  createdAt: Date;
}): TourPackage {
  return {
    id: row.id,
    destinationId: row.destinationId,
    title: row.title,
    itinerary: row.itinerary,
    durationDays: row.durationDays,
    inclusions: row.inclusions,
    priceMinor: row.priceMinor,
    priceCurrency: row.priceCurrency,
    totalCapacity: row.totalCapacity,
    availabilityCount: row.availabilityCount,
    status: (isPublicationStatus(row.status) ? row.status : "draft") as PublicationStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaTourPackageRepository implements TourPackageRepository {
  async findById(id: string) {
    const row = await prisma.tourPackage.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async listPublished(pagination?: Pagination) {
    const rows = await prisma.tourPackage.findMany({
      where: { status: "published" },
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByDestination(destinationId: string) {
    const rows = await prisma.tourPackage.findMany({
      where: { destinationId, status: "published" },
    });
    return rows.map(toDomain);
  }
  async create(input: CreateTourPackageInput): RepositoryResult<TourPackage> {
    try {
      const row = await prisma.tourPackage.create({
        data: {
          destinationId: input.destinationId,
          title: input.title,
          itinerary: input.itinerary,
          durationDays: input.durationDays,
          inclusions: [...input.inclusions],
          priceMinor: input.priceMinor,
          priceCurrency: input.priceCurrency,
          totalCapacity: input.totalCapacity,
          availabilityCount: input.availabilityCount,
          status: input.status,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdateTourPackageInput): RepositoryResult<TourPackage> {
    try {
      const row = await prisma.tourPackage.update({
        where: { id },
        data: {
          ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.itinerary !== undefined && { itinerary: input.itinerary }),
          ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
          ...(input.inclusions !== undefined && { inclusions: [...input.inclusions] }),
          ...(input.priceMinor !== undefined && { priceMinor: input.priceMinor }),
          ...(input.priceCurrency !== undefined && { priceCurrency: input.priceCurrency }),
          ...(input.totalCapacity !== undefined && { totalCapacity: input.totalCapacity }),
          ...(input.status !== undefined && { status: input.status }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async delete(id: string): RepositoryResult<TourPackage> {
    try {
      const row = await prisma.tourPackage.delete({ where: { id } });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
