import type { User } from "@/domain";
import type { CreateUserInput, UpdateUserInput, UserRepository, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    for (const u of this.store.values()) {
      if (u.email.toLowerCase() === lower) return u;
    }
    return null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    for (const u of this.store.values()) {
      if (u.googleId === googleId) return u;
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<Result<User, DomainError>> {
    const existing = await this.findByEmail(input.email);
    if (existing) return err(conflictError("Email already registered.", "User"));
    const user: User = {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      emailVerifiedAt: null,
      googleId: input.googleId,
      roles: [...input.roles],
      accountStatus: input.accountStatus,
      profileComplete: input.profileComplete,
      failedLoginCount: 0,
      lockedUntil: null,
      inAppNotificationsEnabled: input.inAppNotificationsEnabled,
      createdAt: new Date(),
    };
    this.store.set(user.id, user);
    return ok(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<Result<User, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("User not found.", "User"));
    const updated: User = { ...existing, ...input, roles: input.roles ? [...input.roles] : existing.roles };
    this.store.set(id, updated);
    return ok(updated);
  }

  async list(pagination?: Pagination): Promise<readonly User[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  clear() { this.store.clear(); }
  seed(user: User) { this.store.set(user.id, user); }
}
