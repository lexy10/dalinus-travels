import type { TourPackage } from "@/domain";
import type { TourPackageRepository, CreateTourPackageInput, UpdateTourPackageInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError, availabilityError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryTourPackageRepository implements TourPackageRepository {
  private store = new Map<string, TourPackage>();

  async findById(id: string): Promise<TourPackage | null> {
    return this.store.get(id) ?? null;
  }

  async listPublished(pagination?: Pagination): Promise<readonly TourPackage[]> {
    const all = [...this.store.values()].filter(p => p.status === "published");
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async listByDestination(destinationId: string): Promise<readonly TourPackage[]> {
    return [...this.store.values()].filter(p => p.destinationId === destinationId);
  }

  async create(input: CreateTourPackageInput): Promise<Result<TourPackage, DomainError>> {
    const pkg: TourPackage = {
      id: randomUUID(),
      ...input,
      inclusions: [...input.inclusions],
      createdAt: new Date(),
    };
    this.store.set(pkg.id, pkg);
    return ok(pkg);
  }

  async update(id: string, input: UpdateTourPackageInput): Promise<Result<TourPackage, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Tour package not found.", "TourPackage"));
    const updated: TourPackage = {
      ...existing,
      ...input,
      inclusions: input.inclusions ? [...input.inclusions] : existing.inclusions,
    };
    this.store.set(id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<TourPackage, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Tour package not found.", "TourPackage"));
    this.store.delete(id);
    return ok(existing);
  }

  decrementAvailability(id: string, count: number): Result<TourPackage, DomainError> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Tour package not found.", "TourPackage"));
    if (existing.availabilityCount < count) {
      return err(availabilityError("Insufficient availability."));
    }
    const updated: TourPackage = { ...existing, availabilityCount: existing.availabilityCount - count };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(pkg: TourPackage) { this.store.set(pkg.id, pkg); }
}
