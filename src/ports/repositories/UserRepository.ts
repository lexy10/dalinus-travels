/** Repository port for User entities. */
import type { Role, User } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateUserInput {
  readonly email: string;
  readonly passwordHash: string | null;
  readonly googleId: string | null;
  readonly roles: readonly Role[];
  readonly accountStatus: User["accountStatus"];
  readonly profileComplete: boolean;
  readonly inAppNotificationsEnabled: boolean;
}

export interface UpdateUserInput {
  readonly emailVerifiedAt?: User["emailVerifiedAt"];
  readonly passwordHash?: User["passwordHash"];
  readonly googleId?: User["googleId"];
  readonly roles?: readonly Role[];
  readonly accountStatus?: User["accountStatus"];
  readonly profileComplete?: boolean;
  readonly failedLoginCount?: number;
  readonly lockedUntil?: User["lockedUntil"];
  readonly inAppNotificationsEnabled?: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(input: CreateUserInput): RepositoryResult<User>;
  update(id: string, input: UpdateUserInput): RepositoryResult<User>;
  list(pagination?: Pagination): Promise<readonly User[]>;
}
