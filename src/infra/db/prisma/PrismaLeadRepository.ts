import type { Lead, LeadSource, LeadStatus } from "@/domain";
import { isLeadSource, isLeadStatus } from "@/domain";
import type { LeadRepository, CreateLeadInput } from "@/ports/repositories/LeadRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  source: string;
  name: string;
  email: string;
  message: string | null;
  attributedRecruiterId: string | null;
  attributedPartnerId: string | null;
  status: string;
  createdAt: Date;
}): Lead {
  return {
    id: row.id,
    source: (isLeadSource(row.source) ? row.source : "contact_form") as LeadSource,
    name: row.name,
    email: row.email,
    message: row.message,
    attributedRecruiterId: row.attributedRecruiterId,
    attributedPartnerId: row.attributedPartnerId,
    status: (isLeadStatus(row.status) ? row.status : "new") as LeadStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaLeadRepository implements LeadRepository {
  async findById(id: string) {
    const row = await prisma.lead.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async listByRecruiter(recruiterId: string) {
    const rows = await prisma.lead.findMany({
      where: { attributedRecruiterId: recruiterId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByPartner(partnerId: string) {
    const rows = await prisma.lead.findMany({
      where: { attributedPartnerId: partnerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async list(pagination?: Pagination) {
    const rows = await prisma.lead.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async countByPartner(partnerId: string): Promise<number> {
    return prisma.lead.count({ where: { attributedPartnerId: partnerId } });
  }
  async create(input: CreateLeadInput): RepositoryResult<Lead> {
    try {
      const row = await prisma.lead.create({
        data: {
          source: input.source,
          name: input.name,
          email: input.email,
          message: input.message,
          attributedRecruiterId: input.attributedRecruiterId,
          attributedPartnerId: input.attributedPartnerId,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async updateStatus(id: string, status: LeadStatus): RepositoryResult<Lead> {
    try {
      const row = await prisma.lead.update({ where: { id }, data: { status } });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
