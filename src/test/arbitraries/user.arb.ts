import * as fc from "fast-check";
import type { User } from "@/domain";
import type { ActorContext } from "@/domain/kernel/actor";
import { Role, AccountStatus } from "@/domain/kernel/identity";

const uuidArb = fc.uuid();
const timestampArb = fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") });

export const roleArb = fc.constantFrom(
  Role.STUDENT_TRAVELER,
  Role.RECRUITER,
  Role.PARTNER,
  Role.ADMINISTRATOR,
);

export const accountStatusArb = fc.constantFrom(
  AccountStatus.ACTIVE,
  AccountStatus.SUSPENDED,
  AccountStatus.PENDING,
);

export const userArb: fc.Arbitrary<User> = fc.record({
  id: uuidArb,
  email: fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.stringMatching(/^[a-z]{2,4}$/),
  ).map(([l, d, t]) => `${l}@${d}.${t}`),
  passwordHash: fc.option(fc.string({ minLength: 60, maxLength: 60 }), { nil: null }),
  emailVerifiedAt: fc.option(timestampArb, { nil: null }),
  googleId: fc.option(fc.string({ minLength: 10, maxLength: 30 }), { nil: null }),
  roles: fc.subarray([Role.STUDENT_TRAVELER, Role.RECRUITER, Role.PARTNER, Role.ADMINISTRATOR], { minLength: 1 }),
  accountStatus: accountStatusArb,
  profileComplete: fc.boolean(),
  failedLoginCount: fc.nat({ max: 10 }),
  lockedUntil: fc.option(timestampArb, { nil: null }),
  inAppNotificationsEnabled: fc.boolean(),
  createdAt: timestampArb,
});

export const actorContextArb: fc.Arbitrary<ActorContext> = fc.record({
  userId: uuidArb,
  roles: fc.subarray([Role.STUDENT_TRAVELER, Role.RECRUITER, Role.PARTNER, Role.ADMINISTRATOR], { minLength: 1 })
    .map(r => new Set(r) as ReadonlySet<(typeof Role)[keyof typeof Role]>),
  accountStatus: accountStatusArb,
  profileComplete: fc.boolean(),
  locale: fc.constantFrom("en", "fr", "de"),
});

const activeStatus: AccountStatus = AccountStatus.ACTIVE;

export const studentActorArb: fc.Arbitrary<ActorContext> = fc.record({
  userId: uuidArb,
  roles: fc.constant(new Set([Role.STUDENT_TRAVELER]) as ReadonlySet<(typeof Role)[keyof typeof Role]>),
  accountStatus: fc.constant(activeStatus),
  profileComplete: fc.constant(true),
  locale: fc.constant("en"),
});

export const adminActorArb: fc.Arbitrary<ActorContext> = fc.record({
  userId: uuidArb,
  roles: fc.constant(new Set([Role.ADMINISTRATOR]) as ReadonlySet<(typeof Role)[keyof typeof Role]>),
  accountStatus: fc.constant(activeStatus),
  profileComplete: fc.constant(true),
  locale: fc.constant("en"),
});
