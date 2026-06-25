import type { Recruiter, RecruiterStatus } from "@/domain";
import type { RecruiterRepository, CreateRecruiterInput, UpdateRecruiterInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryRecruiterRepository implements RecruiterRepository {
  private store = new Map<string, Recruiter>();

  async findById(id: string): Promise<Recruiter | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Recruiter | null> {
    for (const r of this.store.values()) {
      if (r.userId === userId) return r;
    }
    return null;
  }

  async listSubAgents(managerRecruiterId: string): Promise<readonly Recruiter[]> {
    return [...this.store.values()].filter(r => r.managerRecruiterId === managerRecruiterId);
  }

  async list(filter?: { readonly status?: RecruiterStatus }, pagination?: Pagination): Promise<readonly Recruiter[]> {
    let all = [...this.store.values()];
    if (filter?.status) all = all.filter(r => r.status === filter.status);
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async create(input: CreateRecruiterInput): Promise<Result<Recruiter, DomainError>> {
    const recruiter: Recruiter = {
      id: randomUUID(),
      userId: input.userId,
      status: input.status,
      managerRecruiterId: input.managerRecruiterId,
      companyName: input.companyName,
      appliedAt: new Date(),
      decisionAt: null,
    };
    this.store.set(recruiter.id, recruiter);
    return ok(recruiter);
  }

  async update(id: string, input: UpdateRecruiterInput): Promise<Result<Recruiter, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Recruiter not found.", "Recruiter"));
    const updated: Recruiter = { ...existing, ...input };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(recruiter: Recruiter) { this.store.set(recruiter.id, recruiter); }
}
