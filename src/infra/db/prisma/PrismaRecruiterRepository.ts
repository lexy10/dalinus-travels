import type { Recruiter, RecruiterStatus } from "@/domain";
import { isRecruiterStatus } from "@/domain";
import type {
  RecruiterRepository,
  CreateRecruiterInput,
  UpdateRecruiterInput,
} from "@/ports/repositories/RecruiterRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  userId: string;
  status: string;
  managerRecruiterId: string | null;
  companyName: string;
  appliedAt: Date;
  decisionAt: Date | null;
}): Recruiter {
  return {
    id: row.id,
    userId: row.userId,
    status: (isRecruiterStatus(row.status) ? row.status : "pending") as RecruiterStatus,
    managerRecruiterId: row.managerRecruiterId,
    companyName: row.companyName,
    appliedAt: row.appliedAt,
    decisionAt: row.decisionAt,
  };
}

export class PrismaRecruiterRepository implements RecruiterRepository {
  async findById(id: string) {
    const row = await prisma.recruiter.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findByUserId(userId: string) {
    const row = await prisma.recruiter.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
  }
  async listSubAgents(managerRecruiterId: string) {
    const rows = await prisma.recruiter.findMany({ where: { managerRecruiterId } });
    return rows.map(toDomain);
  }
  async list(
    filter?: { status?: RecruiterStatus },
    pagination?: Pagination,
  ): Promise<readonly Recruiter[]> {
    const rows = await prisma.recruiter.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { appliedAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async create(input: CreateRecruiterInput): RepositoryResult<Recruiter> {
    try {
      const row = await prisma.recruiter.create({
        data: {
          userId: input.userId,
          status: input.status,
          managerRecruiterId: input.managerRecruiterId,
          companyName: input.companyName,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdateRecruiterInput): RepositoryResult<Recruiter> {
    try {
      const row = await prisma.recruiter.update({
        where: { id },
        data: {
          ...(input.status !== undefined && { status: input.status }),
          ...(input.managerRecruiterId !== undefined && {
            managerRecruiterId: input.managerRecruiterId,
          }),
          ...(input.companyName !== undefined && { companyName: input.companyName }),
          ...(input.decisionAt !== undefined && { decisionAt: input.decisionAt }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
