import type { Partner } from "@/domain";
import type { PartnerRepository, CreatePartnerInput, UpdatePartnerInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryPartnerRepository implements PartnerRepository {
  private store = new Map<string, Partner>();

  async findById(id: string): Promise<Partner | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Partner | null> {
    for (const p of this.store.values()) {
      if (p.userId === userId) return p;
    }
    return null;
  }

  async list(pagination?: Pagination): Promise<readonly Partner[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async create(input: CreatePartnerInput): Promise<Result<Partner, DomainError>> {
    const partner: Partner = {
      id: randomUUID(),
      userId: input.userId,
      institutionName: input.institutionName,
      status: input.status,
      createdAt: new Date(),
    };
    this.store.set(partner.id, partner);
    return ok(partner);
  }

  async update(id: string, input: UpdatePartnerInput): Promise<Result<Partner, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Partner not found.", "Partner"));
    const updated: Partner = { ...existing, ...input };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(partner: Partner) { this.store.set(partner.id, partner); }
}
