import type { Destination, DestinationKind } from "@/domain";
import type { DestinationRepository, CreateDestinationInput, UpdateDestinationInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryDestinationRepository implements DestinationRepository {
  private store = new Map<string, Destination>();

  async findById(id: string): Promise<Destination | null> {
    return this.store.get(id) ?? null;
  }

  async listByKind(kind: DestinationKind, pagination?: Pagination): Promise<readonly Destination[]> {
    const all = [...this.store.values()].filter(d => d.kind === kind);
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async create(input: CreateDestinationInput): Promise<Result<Destination, DomainError>> {
    const dest: Destination = { id: randomUUID(), ...input };
    this.store.set(dest.id, dest);
    return ok(dest);
  }

  async update(id: string, input: UpdateDestinationInput): Promise<Result<Destination, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Destination not found.", "Destination"));
    const updated: Destination = { ...existing, ...input };
    this.store.set(id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<Destination, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Destination not found.", "Destination"));
    this.store.delete(id);
    return ok(existing);
  }

  clear() { this.store.clear(); }
  seed(dest: Destination) { this.store.set(dest.id, dest); }
}
