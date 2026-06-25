/** Identity-bearing entities: User, Recruiter, Partner. */
import type { Role, AccountStatus } from "./kernel/identity";
import type { UUID, Timestamp } from "./common";

export interface User {
  readonly id: UUID;
  readonly email: string;
  /** `null` for Google-only accounts. */
  readonly passwordHash: string | null;
  /** `null` if not yet verified. */
  readonly emailVerifiedAt: Timestamp | null;
  /** Linked Google identity; `null` when absent. */
  readonly googleId: string | null;
  readonly roles: readonly Role[];
  readonly accountStatus: AccountStatus;
  readonly profileComplete: boolean;
  /** Consecutive failed login attempts in the current lockout window. */
  readonly failedLoginCount: number;
  /** Lockout expiry; `null` when not locked. */
  readonly lockedUntil: Timestamp | null;
  readonly inAppNotificationsEnabled: boolean;
  readonly createdAt: Timestamp;
}

/**
 * Recruiter approval lifecycle.
 * - `pending` — awaiting admin decision; dashboard denied.
 * - `active` — approved; dashboard granted.
 * - `rejected` — declined; dashboard denied.
 */
export const RecruiterStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;

export type RecruiterStatus = (typeof RecruiterStatus)[keyof typeof RecruiterStatus];

export const ALL_RECRUITER_STATUSES: readonly RecruiterStatus[] = Object.values(RecruiterStatus);

export function isRecruiterStatus(value: unknown): value is RecruiterStatus {
  return typeof value === "string" && (ALL_RECRUITER_STATUSES as readonly string[]).includes(value);
}

export interface Recruiter {
  readonly id: UUID;
  readonly userId: UUID;
  readonly status: RecruiterStatus;
  /** Parent recruiter when this is a sub-agent, else `null`. */
  readonly managerRecruiterId: UUID | null;
  readonly companyName: string;
  readonly appliedAt: Timestamp;
  /** When the approve/reject decision was made, else `null`. */
  readonly decisionAt: Timestamp | null;
}

export interface Partner {
  readonly id: UUID;
  readonly userId: UUID;
  readonly institutionName: string;
  readonly status: AccountStatus;
  readonly createdAt: Timestamp;
}
