import type { Destination, DestinationKind } from "@/domain";
import { isDestinationKind } from "@/domain";
import type {
  DestinationRepository,
  CreateDestinationInput,
  UpdateDestinationInput,
} from "@/ports/repositories/DestinationRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  kind: string;
  name: string;
  country: string;
  costOfLiving: string | null;
  visaInfo: string | null;
  destinationGuide: string | null;
  publishedAt: Date | null;
}): Destination {
  return {
    id: row.id,
    kind: (isDestinationKind(row.kind) ? row.kind : "study") as DestinationKind,
    name: row.name,
    country: row.country,
    costOfLiving: row.costOfLiving,
    visaInfo: row.visaInfo,
    destinationGuide: row.destinationGuide,
    publishedAt: row.publishedAt,
  };
}

export class PrismaDestinationRepository implements DestinationRepository {
  async findById(id: string) {
    const row = await prisma.destination.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async listByKind(kind: DestinationKind, pagination?: Pagination) {
    const rows = await prisma.destination.findMany({
      where: { kind },
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { name: "asc" },
    });
    return rows.map(toDomain);
  }
  async create(input: CreateDestinationInput): RepositoryResult<Destination> {
    try {
      const row = await prisma.destination.create({
        data: {
          kind: input.kind,
          name: input.name,
          country: input.country,
          costOfLiving: input.costOfLiving,
          visaInfo: input.visaInfo,
          destinationGuide: input.destinationGuide,
          publishedAt: input.publishedAt,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdateDestinationInput): RepositoryResult<Destination> {
    try {
      const row = await prisma.destination.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.country !== undefined && { country: input.country }),
          ...(input.costOfLiving !== undefined && { costOfLiving: input.costOfLiving }),
          ...(input.visaInfo !== undefined && { visaInfo: input.visaInfo }),
          ...(input.destinationGuide !== undefined && { destinationGuide: input.destinationGuide }),
          ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async delete(id: string): RepositoryResult<Destination> {
    try {
      const row = await prisma.destination.delete({ where: { id } });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
