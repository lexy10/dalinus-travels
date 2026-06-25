import type { Lead, LeadStatus } from "@/domain";
import type { LeadRepository, CreateLeadInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryLeadRepository implements LeadRepository {
  private store = new Map<string, Lead>();

  async findById(id: string): Promise<Lead | null> {
    return this.store.get(id) ?? null;
  }

  async listByRecruiter(recruiterId: string): Promise<readonly Lead[]> {
    return [...this.store.values()].filter(l => l.attributedRecruiterId === recruiterId);
  }

  async listByPartner(partnerId: string): Promise<readonly Lead[]> {
    return [...this.store.values()].filter(l => l.attributedPartnerId === partnerId);
  }

  async list(pagination?: Pagination): Promise<readonly Lead[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async countByPartner(partnerId: string): Promise<number> {
    return [...this.store.values()].filter(l => l.attributedPartnerId === partnerId).length;
  }

  async create(input: CreateLeadInput): Promise<Result<Lead, DomainError>> {
    const lead: Lead = {
      id: randomUUID(),
      source: input.source,
      name: input.name,
      email: input.email,
      message: input.message,
      attributedRecruiterId: input.attributedRecruiterId,
      attributedPartnerId: input.attributedPartnerId,
      status: "new",
      createdAt: new Date(),
    };
    this.store.set(lead.id, lead);
    return ok(lead);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Result<Lead, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Lead not found.", "Lead"));
    const updated: Lead = { ...existing, status };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(lead: Lead) { this.store.set(lead.id, lead); }
}
