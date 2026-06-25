/**
 * Property-based tests for authorization gating.
 *
 * Covers Property 16 from the design document.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  assertDashboardAccess,
  assertRecruiterDashboardAccess,
  assertAdministrator,
  assertOwnership,
  DashboardDenialReason,
} from "./authorization";
import { actorContextArb } from "@/test/arbitraries/user.arb";
import { AccountStatus, Role } from "@/domain/kernel/identity";
import { RecruiterStatus } from "@/domain/user";
import type { ActorContext } from "@/domain/kernel/actor";

// ---------------------------------------------------------------------------
// Property 16: Dashboard access reflects gating conditions with a reason
// Feature: edu-travel-platform, Property 16: Dashboard access reflects gating conditions with a reason
// ---------------------------------------------------------------------------

describe("Property 16: Dashboard access reflects gating conditions with a reason", () => {
  it("grants iff active+profileComplete; denies with the corresponding reason otherwise", () => {
    fc.assert(
      fc.property(actorContextArb, (actor) => {
        const result = assertDashboardAccess(actor);

        const shouldGrant =
          actor.accountStatus === AccountStatus.ACTIVE && actor.profileComplete;

        if (shouldGrant) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            const reason = result.error.reason;
            // Reason is one of the documented denial codes
            expect([
              DashboardDenialReason.Suspended,
              DashboardDenialReason.ProfileIncomplete,
              DashboardDenialReason.AccountPending,
            ]).toContain(reason);

            // Reason matches the actor state precisely
            if (actor.accountStatus === AccountStatus.SUSPENDED) {
              expect(reason).toBe(DashboardDenialReason.Suspended);
            } else if (!actor.profileComplete) {
              expect(reason).toBe(DashboardDenialReason.ProfileIncomplete);
            } else {
              expect(actor.accountStatus).toBe(AccountStatus.PENDING);
              expect(reason).toBe(DashboardDenialReason.AccountPending);
            }
          }
        }
      }),
    );
  });

  it("recruiter dashboard requires base access AND recruiter role AND approval", () => {
    const recruiterStatusArb = fc.constantFrom(
      RecruiterStatus.PENDING,
      RecruiterStatus.ACTIVE,
      RecruiterStatus.REJECTED,
    );

    fc.assert(
      fc.property(actorContextArb, recruiterStatusArb, (actor, recruiterStatus) => {
        const result = assertRecruiterDashboardAccess(actor, recruiterStatus);

        const baseOk =
          actor.accountStatus === AccountStatus.ACTIVE && actor.profileComplete;
        const hasRecruiterRole = actor.roles.has(Role.RECRUITER);
        const recruiterApproved = recruiterStatus === RecruiterStatus.ACTIVE;

        const shouldGrant = baseOk && hasRecruiterRole && recruiterApproved;

        if (shouldGrant) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            const reason = result.error.reason;
            // Precedence: base gate → role gate → recruiter-status gate
            if (!baseOk) {
              expect([
                DashboardDenialReason.Suspended,
                DashboardDenialReason.ProfileIncomplete,
                DashboardDenialReason.AccountPending,
              ]).toContain(reason);
            } else if (!hasRecruiterRole) {
              expect(reason).toBe(DashboardDenialReason.MissingRole);
            } else if (recruiterStatus === RecruiterStatus.PENDING) {
              expect(reason).toBe(DashboardDenialReason.RecruiterPending);
            } else {
              expect(recruiterStatus).toBe(RecruiterStatus.REJECTED);
              expect(reason).toBe(DashboardDenialReason.RecruiterRejected);
            }
          }
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Targeted unit tests for the remaining helpers (Req 18.1, 10.3, 10.5)
// ---------------------------------------------------------------------------

describe("assertAdministrator", () => {
  const baseActor = {
    userId: "u-1",
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };

  it("grants for administrators", () => {
    const actor: ActorContext = {
      ...baseActor,
      roles: new Set([Role.ADMINISTRATOR]),
    };
    expect(assertAdministrator(actor).ok).toBe(true);
  });

  it("denies non-administrators with NotAdministrator reason", () => {
    const actor: ActorContext = {
      ...baseActor,
      roles: new Set([Role.STUDENT_TRAVELER, Role.RECRUITER, Role.PARTNER]),
    };
    const result = assertAdministrator(actor);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reason).toBe(DashboardDenialReason.NotAdministrator);
    }
  });
});

describe("assertOwnership", () => {
  const owner = "owner-user-id";
  const stranger = "stranger-user-id";

  const make = (userId: string, roles: Role[]): ActorContext => ({
    userId,
    roles: new Set(roles),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  });

  it("grants when actor's userId matches owner", () => {
    expect(
      assertOwnership(make(owner, [Role.PARTNER]), owner, "Program").ok,
    ).toBe(true);
  });

  it("denies when actor's userId differs from owner", () => {
    const result = assertOwnership(make(stranger, [Role.PARTNER]), owner, "Program");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.reason).toBe(DashboardDenialReason.NotOwner);
    }
  });

  it("administrators bypass ownership", () => {
    expect(
      assertOwnership(make(stranger, [Role.ADMINISTRATOR]), owner, "Program").ok,
    ).toBe(true);
  });
});
