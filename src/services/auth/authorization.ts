/**
 * Authorization and dashboard-gating helpers (framework-agnostic).
 *
 * These pure functions evaluate whether a given `ActorContext` (plus any
 * resource-specific context such as a `RecruiterStatus`) is entitled to
 * perform an action. They return `Result<void, AuthorizationError>` so callers
 * can short-circuit cleanly without throwing.
 *
 * Realises:
 *   - Req 3.8  — dashboard denied when suspended or profile incomplete
 *   - Req 9.3  — recruiter dashboard granted on approval
 *   - Req 9.5  — recruiter dashboard denied while pending
 *   - Req 18.1 — non-administrators denied CMS/admin access
 *
 * The general dashboard gate also rejects `AccountStatus.PENDING` so the
 * same helper covers any future pending-account flow at the user level.
 */
import type { ActorContext } from "@/domain/kernel/actor";
import { actorHasRole } from "@/domain/kernel/actor";
import { AccountStatus, Role } from "@/domain/kernel/identity";
import type { AuthorizationError, Result } from "@/domain/kernel";
import { err, ok } from "@/domain/kernel";
import { authorizationError } from "@/domain/kernel/errors";
import { RecruiterStatus } from "@/domain/user";

/** Machine-readable reason codes carried on `AuthorizationError.reason`. */
export const DashboardDenialReason = {
  Suspended: "account_suspended",
  ProfileIncomplete: "profile_incomplete",
  AccountPending: "account_pending",
  RecruiterPending: "recruiter_pending",
  RecruiterRejected: "recruiter_rejected",
  MissingRole: "missing_role",
  NotAdministrator: "not_administrator",
  NotOwner: "not_owner",
} as const;

export type DashboardDenialReason =
  (typeof DashboardDenialReason)[keyof typeof DashboardDenialReason];

/**
 * General dashboard access check (Req 3.8).
 *
 * Granted iff `accountStatus === ACTIVE` AND `profileComplete === true`.
 * The profile-incomplete reason takes precedence over a pending account so
 * the most actionable remediation is surfaced first.
 */
export function assertDashboardAccess(
  actor: ActorContext,
): Result<void, AuthorizationError> {
  if (actor.accountStatus === AccountStatus.SUSPENDED) {
    return err(
      authorizationError(
        "Your account has been suspended.",
        DashboardDenialReason.Suspended,
      ),
    );
  }
  if (!actor.profileComplete) {
    return err(
      authorizationError(
        "Please complete your profile to access the dashboard.",
        DashboardDenialReason.ProfileIncomplete,
      ),
    );
  }
  if (actor.accountStatus === AccountStatus.PENDING) {
    return err(
      authorizationError(
        "Your account is pending approval.",
        DashboardDenialReason.AccountPending,
      ),
    );
  }
  return ok(undefined);
}

/**
 * Recruiter-dashboard access check (Req 9.3, 9.5).
 *
 * Extends `assertDashboardAccess` with the recruiter-record approval gate.
 * The recruiter status is passed in because it lives on the `Recruiter`
 * entity, not the `ActorContext`.
 */
export function assertRecruiterDashboardAccess(
  actor: ActorContext,
  recruiterStatus: RecruiterStatus,
): Result<void, AuthorizationError> {
  const base = assertDashboardAccess(actor);
  if (!base.ok) return base;

  if (!actorHasRole(actor, Role.RECRUITER)) {
    return err(
      authorizationError(
        "Recruiter role is required.",
        DashboardDenialReason.MissingRole,
      ),
    );
  }
  if (recruiterStatus === RecruiterStatus.PENDING) {
    return err(
      authorizationError(
        "Your recruiter account is pending approval.",
        DashboardDenialReason.RecruiterPending,
      ),
    );
  }
  if (recruiterStatus === RecruiterStatus.REJECTED) {
    return err(
      authorizationError(
        "Your recruiter application was not approved.",
        DashboardDenialReason.RecruiterRejected,
      ),
    );
  }
  return ok(undefined);
}

/** Administrator-only gate (Req 18.1). */
export function assertAdministrator(
  actor: ActorContext,
): Result<void, AuthorizationError> {
  if (!actorHasRole(actor, Role.ADMINISTRATOR)) {
    return err(
      authorizationError(
        "You lack administrative privileges.",
        DashboardDenialReason.NotAdministrator,
      ),
    );
  }
  return ok(undefined);
}

/** Require that `actor` holds `role`. */
export function assertRole(
  actor: ActorContext,
  role: Role,
): Result<void, AuthorizationError> {
  if (!actorHasRole(actor, role)) {
    return err(
      authorizationError(
        `This action requires the ${role} role.`,
        DashboardDenialReason.MissingRole,
      ),
    );
  }
  return ok(undefined);
}

/**
 * Ownership check used by downstream services (Req 10.3, 10.5).
 *
 * Compares the actor's `userId` against the resource's owner id. Administrators
 * bypass ownership.
 */
export function assertOwnership(
  actor: ActorContext,
  ownerUserId: string,
  resource: string,
): Result<void, AuthorizationError> {
  if (actorHasRole(actor, Role.ADMINISTRATOR)) return ok(undefined);
  if (actor.userId !== ownerUserId) {
    return err(
      authorizationError(
        `You do not have access to this ${resource}.`,
        DashboardDenialReason.NotOwner,
      ),
    );
  }
  return ok(undefined);
}
