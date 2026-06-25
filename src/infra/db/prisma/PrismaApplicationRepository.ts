import type { Application, ApplicationStatus } from "@/domain";
import { isApplicationStatus } from "@/domain";
import { Prisma } from "@prisma/client";
import type {
  ApplicationRepository,
  CreateApplicationInput,
} from "@/ports/repositories/ApplicationRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { conflictError, persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  studentId: string;
  programId: string;
  recruiterId: string | null;
  status: string;
  submittedFields: Prisma.JsonValue;
  createdAt: Date;
  statusUpdatedAt: Date;
}): Application {
  return {
    id: row.id,
    studentId: row.studentId,
    programId: row.programId,
    recruiterId: row.recruiterId,
    status: (isApplicationStatus(row.status) ? row.status : "Submitted") as ApplicationStatus,
    submittedFields:
      typeof row.submittedFields === "object" && row.submittedFields !== null
        ? (row.submittedFields as Readonly<Record<string, unknown>>)
        : {},
    createdAt: row.createdAt,
    statusUpdatedAt: row.statusUpdatedAt,
  };
}

export class PrismaApplicationRepository implements ApplicationRepository {
  async findById(id: string) {
    const row = await prisma.application.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findByStudentAndProgram(studentId: string, programId: string) {
    const row = await prisma.application.findUnique({
      where: { studentId_programId: { studentId, programId } },
    });
    return row ? toDomain(row) : null;
  }
  async listByStudent(studentId: string) {
    const rows = await prisma.application.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByProgram(programId: string) {
    const rows = await prisma.application.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByPartner(partnerId: string) {
    // Join through programs
    const rows = await prisma.application.findMany({
      where: { program: { partnerId } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByRecruiter(recruiterId: string) {
    const rows = await prisma.application.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async list(pagination?: Pagination) {
    const rows = await prisma.application.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async countByPartner(partnerId: string, status?: ApplicationStatus): Promise<number> {
    return prisma.application.count({
      where: { program: { partnerId }, ...(status ? { status } : {}) },
    });
  }
  async create(input: CreateApplicationInput): RepositoryResult<Application> {
    try {
      const row = await prisma.application.create({
        data: {
          studentId: input.studentId,
          programId: input.programId,
          recruiterId: input.recruiterId,
          submittedFields: input.submittedFields as Prisma.InputJsonValue,
        },
      });
      return ok(toDomain(row));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return err(
          conflictError("An application already exists for this program.", "Application"),
        );
      }
      return err(persistenceError());
    }
  }
  async updateStatus(id: string, status: ApplicationStatus): RepositoryResult<Application> {
    try {
      const row = await prisma.application.update({
        where: { id },
        data: { status, statusUpdatedAt: new Date() },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
