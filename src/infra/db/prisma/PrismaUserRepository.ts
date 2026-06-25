/**
 * Prisma adapter for the UserRepository port.
 *
 * Maps between the Prisma `User` row and the domain `User` shape. Unique
 * violations on `email` / `googleId` surface as `ConflictError`.
 */
import type { User as PrismaUser } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { Role, User } from "@/domain";
import { isRole, isAccountStatus } from "@/domain";
import type {
  UserRepository,
  CreateUserInput,
  UpdateUserInput,
} from "@/ports/repositories/UserRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err, type Result, type DomainError } from "@/domain/kernel";
import { conflictError, persistenceError, notFoundError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt,
    googleId: row.googleId,
    roles: row.roles.filter(isRole) as Role[],
    accountStatus: isAccountStatus(row.accountStatus) ? row.accountStatus : "active",
    profileComplete: row.profileComplete,
    failedLoginCount: row.failedLoginCount,
    lockedUntil: row.lockedUntil,
    inAppNotificationsEnabled: row.inAppNotificationsEnabled,
    createdAt: row.createdAt,
  };
}

function mapWriteError(error: unknown, resource = "User"): DomainError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return conflictError("This value is already in use.", resource);
    }
    if (error.code === "P2025") {
      return notFoundError(`${resource} not found.`, resource);
    }
  }
  return persistenceError();
}

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return row ? toDomain(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { googleId } });
    return row ? toDomain(row) : null;
  }

  async create(input: CreateUserInput): RepositoryResult<User> {
    try {
      const row = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          googleId: input.googleId,
          roles: input.roles as string[],
          accountStatus: input.accountStatus,
          profileComplete: input.profileComplete,
          inAppNotificationsEnabled: input.inAppNotificationsEnabled,
        },
      });
      return ok(toDomain(row));
    } catch (error) {
      return err(mapWriteError(error)) as Result<User, DomainError>;
    }
  }

  async update(id: string, input: UpdateUserInput): RepositoryResult<User> {
    try {
      const row = await prisma.user.update({
        where: { id },
        data: {
          ...(input.emailVerifiedAt !== undefined && { emailVerifiedAt: input.emailVerifiedAt }),
          ...(input.passwordHash !== undefined && { passwordHash: input.passwordHash }),
          ...(input.googleId !== undefined && { googleId: input.googleId }),
          ...(input.roles !== undefined && { roles: input.roles as string[] }),
          ...(input.accountStatus !== undefined && { accountStatus: input.accountStatus }),
          ...(input.profileComplete !== undefined && { profileComplete: input.profileComplete }),
          ...(input.failedLoginCount !== undefined && {
            failedLoginCount: input.failedLoginCount,
          }),
          ...(input.lockedUntil !== undefined && { lockedUntil: input.lockedUntil }),
          ...(input.inAppNotificationsEnabled !== undefined && {
            inAppNotificationsEnabled: input.inAppNotificationsEnabled,
          }),
        },
      });
      return ok(toDomain(row));
    } catch (error) {
      return err(mapWriteError(error)) as Result<User, DomainError>;
    }
  }

  async list(pagination?: Pagination): Promise<readonly User[]> {
    const rows = await prisma.user.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
}
