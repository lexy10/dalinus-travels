import type { Program, Timestamp } from "@/domain";
import type { ProgramRepository, CreateProgramInput, UpdateProgramInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryProgramRepository implements ProgramRepository {
  private store = new Map<string, Program>();

  async findById(id: string): Promise<Program | null> {
    return this.store.get(id) ?? null;
  }

  async listPublished(pagination?: Pagination): Promise<readonly Program[]> {
    const all = [...this.store.values()].filter(p => p.status === "published");
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async listByDestination(destinationId: string): Promise<readonly Program[]> {
    return [...this.store.values()].filter(p => p.destinationId === destinationId);
  }

  async listByPartner(partnerId: string): Promise<readonly Program[]> {
    return [...this.store.values()].filter(p => p.partnerId === partnerId);
  }

  async listWithDeadlineBetween(from: Timestamp, to: Timestamp): Promise<readonly Program[]> {
    return [...this.store.values()].filter(p =>
      p.applicationDeadline !== null &&
      p.applicationDeadline >= from &&
      p.applicationDeadline <= to
    );
  }

  async create(input: CreateProgramInput): Promise<Result<Program, DomainError>> {
    const program: Program = {
      id: randomUUID(),
      ...input,
      intakeDates: [...input.intakeDates],
      createdAt: new Date(),
    };
    this.store.set(program.id, program);
    return ok(program);
  }

  async update(id: string, input: UpdateProgramInput): Promise<Result<Program, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Program not found.", "Program"));
    const updated: Program = {
      ...existing,
      ...input,
      intakeDates: input.intakeDates ? [...input.intakeDates] : existing.intakeDates,
    };
    this.store.set(id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<Program, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Program not found.", "Program"));
    this.store.delete(id);
    return ok(existing);
  }

  clear() { this.store.clear(); }
  seed(program: Program) { this.store.set(program.id, program); }
}
