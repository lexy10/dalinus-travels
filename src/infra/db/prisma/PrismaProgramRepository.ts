import type { DeliveryMode, Program, PublicationStatus, Timestamp } from "@/domain";
import { isDeliveryMode, isPublicationStatus } from "@/domain";
import type {
  ProgramRepository,
  CreateProgramInput,
  UpdateProgramInput,
} from "@/ports/repositories/ProgramRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  partnerId: string;
  destinationId: string;
  title: string;
  institutionName: string;
  studyLevel: string;
  fieldOfStudy: string;
  durationMonths: number;
  tuitionMinor: number;
  tuitionCurrency: string;
  intakeDates: Date[];
  entryRequirements: string;
  applicationDeadline: Date | null;
  deliveryMode: string;
  status: string;
  createdAt: Date;
}): Program {
  return {
    id: row.id,
    partnerId: row.partnerId,
    destinationId: row.destinationId,
    title: row.title,
    institutionName: row.institutionName,
    studyLevel: row.studyLevel,
    fieldOfStudy: row.fieldOfStudy,
    durationMonths: row.durationMonths,
    tuitionMinor: row.tuitionMinor,
    tuitionCurrency: row.tuitionCurrency,
    intakeDates: row.intakeDates,
    entryRequirements: row.entryRequirements,
    applicationDeadline: row.applicationDeadline,
    deliveryMode: (isDeliveryMode(row.deliveryMode) ? row.deliveryMode : "on_campus") as DeliveryMode,
    status: (isPublicationStatus(row.status) ? row.status : "draft") as PublicationStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaProgramRepository implements ProgramRepository {
  async findById(id: string) {
    const row = await prisma.program.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async listPublished(pagination?: Pagination) {
    const rows = await prisma.program.findMany({
      where: { status: "published" },
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByDestination(destinationId: string) {
    const rows = await prisma.program.findMany({
      where: { destinationId, status: "published" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByPartner(partnerId: string) {
    const rows = await prisma.program.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listWithDeadlineBetween(from: Timestamp, to: Timestamp) {
    const rows = await prisma.program.findMany({
      where: {
        applicationDeadline: { gte: from, lte: to },
        status: "published",
      },
    });
    return rows.map(toDomain);
  }
  async create(input: CreateProgramInput): RepositoryResult<Program> {
    try {
      const row = await prisma.program.create({
        data: {
          partnerId: input.partnerId,
          destinationId: input.destinationId,
          title: input.title,
          institutionName: input.institutionName,
          studyLevel: input.studyLevel,
          fieldOfStudy: input.fieldOfStudy,
          durationMonths: input.durationMonths,
          tuitionMinor: input.tuitionMinor,
          tuitionCurrency: input.tuitionCurrency,
          intakeDates: [...input.intakeDates],
          entryRequirements: input.entryRequirements,
          applicationDeadline: input.applicationDeadline,
          deliveryMode: input.deliveryMode,
          status: input.status,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdateProgramInput): RepositoryResult<Program> {
    try {
      const row = await prisma.program.update({
        where: { id },
        data: {
          ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.institutionName !== undefined && { institutionName: input.institutionName }),
          ...(input.studyLevel !== undefined && { studyLevel: input.studyLevel }),
          ...(input.fieldOfStudy !== undefined && { fieldOfStudy: input.fieldOfStudy }),
          ...(input.durationMonths !== undefined && { durationMonths: input.durationMonths }),
          ...(input.tuitionMinor !== undefined && { tuitionMinor: input.tuitionMinor }),
          ...(input.tuitionCurrency !== undefined && { tuitionCurrency: input.tuitionCurrency }),
          ...(input.intakeDates !== undefined && { intakeDates: [...input.intakeDates] }),
          ...(input.entryRequirements !== undefined && {
            entryRequirements: input.entryRequirements,
          }),
          ...(input.applicationDeadline !== undefined && {
            applicationDeadline: input.applicationDeadline,
          }),
          ...(input.deliveryMode !== undefined && { deliveryMode: input.deliveryMode }),
          ...(input.status !== undefined && { status: input.status }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async delete(id: string): RepositoryResult<Program> {
    try {
      const row = await prisma.program.delete({ where: { id } });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
