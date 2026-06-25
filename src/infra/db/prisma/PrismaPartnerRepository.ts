import type { AccountStatus, Partner } from "@/domain";
import { isAccountStatus } from "@/domain";
import type {
  PartnerRepository,
  CreatePartnerInput,
  UpdatePartnerInput,
} from "@/ports/repositories/PartnerRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  userId: string;
  institutionName: string;
  status: string;
  createdAt: Date;
}): Partner {
  return {
    id: row.id,
    userId: row.userId,
    institutionName: row.institutionName,
    status: (isAccountStatus(row.status) ? row.status : "active") as AccountStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaPartnerRepository implements PartnerRepository {
  async findById(id: string) {
    const row = await prisma.partner.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findByUserId(userId: string) {
    const row = await prisma.partner.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
  }
  async list(pagination?: Pagination) {
    const rows = await prisma.partner.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async create(input: CreatePartnerInput): RepositoryResult<Partner> {
    try {
      const row = await prisma.partner.create({
        data: {
          userId: input.userId,
          institutionName: input.institutionName,
          status: input.status,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdatePartnerInput): RepositoryResult<Partner> {
    try {
      const row = await prisma.partner.update({
        where: { id },
        data: {
          ...(input.institutionName !== undefined && { institutionName: input.institutionName }),
          ...(input.status !== undefined && { status: input.status }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
