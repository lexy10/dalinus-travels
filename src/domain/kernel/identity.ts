/** Role and account-status value types for the domain layer. */

export const Role = {
  STUDENT_TRAVELER: "STUDENT_TRAVELER",
  RECRUITER: "RECRUITER",
  PARTNER: "PARTNER",
  ADMINISTRATOR: "ADMINISTRATOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: readonly Role[] = Object.values(Role);

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}

/**
 * Account lifecycle status.
 * - `active` — fully usable.
 * - `suspended` — dashboard access denied.
 * - `pending` — awaiting approval; dashboard access denied.
 */
export const AccountStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  PENDING: "pending",
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const ALL_ACCOUNT_STATUSES: readonly AccountStatus[] = Object.values(AccountStatus);

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === "string" && (ALL_ACCOUNT_STATUSES as readonly string[]).includes(value);
}
