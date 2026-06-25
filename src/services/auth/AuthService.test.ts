/**
 * Property-based tests for AuthService.
 *
 * Tests properties 9–15, 17–18 from the design document.
 * Uses in-memory fakes for UserRepository, NotificationRepository.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { AuthService, type PasswordHasher, type TokenStore, type Clock } from "./AuthService";
import { InMemoryUserRepository } from "@/test/fakes/repositories/InMemoryUserRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import { validEmailArb, malformedEmailArb } from "@/test/arbitraries/email.arb";
import { validPasswordArb, tooShortPasswordArb, tooLongPasswordArb } from "@/test/arbitraries/password.arb";
import { AccountStatus, Role } from "@/domain/kernel/identity";
import type { User } from "@/domain";

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/** Trivial hasher that prepends "hashed:" for deterministic testing. */
const trivialHasher: PasswordHasher = {
  async hash(password: string) {
    return `hashed:${password}`;
  },
  async verify(password: string, hash: string) {
    return hash === `hashed:${password}`;
  },
};

/** In-memory token store for testing. */
class InMemoryTokenStore implements TokenStore {
  private tokens = new Map<string, { token: string; email: string; expiresAt: Date }>();
  private counter = 0;

  async create(email: string, ttlMs: number) {
    const token = `tok_${++this.counter}`;
    const entry = { token, email, expiresAt: new Date(Date.now() + ttlMs) };
    this.tokens.set(token, entry);
    return entry;
  }

  async find(token: string) {
    return this.tokens.get(token) ?? null;
  }

  async consume(token: string) {
    this.tokens.delete(token);
  }

  clear() {
    this.tokens.clear();
    this.counter = 0;
  }

  /** Create a token with a specific expiry for time-based testing. */
  createWithExpiry(email: string, expiresAt: Date) {
    const token = `tok_${++this.counter}`;
    const entry = { token, email, expiresAt };
    this.tokens.set(token, entry);
    return entry;
  }
}

/** Controllable clock for time-sensitive tests. */
class FakeClock implements Clock {
  private _now: Date;
  constructor(now = new Date()) {
    this._now = now;
  }
  now() {
    return this._now;
  }
  set(date: Date) {
    this._now = date;
  }
  advance(ms: number) {
    this._now = new Date(this._now.getTime() + ms);
  }
}

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

let userRepo: InMemoryUserRepository;
let notificationRepo: InMemoryNotificationRepository;
let tokenStore: InMemoryTokenStore;
let clock: FakeClock;
let service: AuthService;

beforeEach(() => {
  userRepo = new InMemoryUserRepository();
  notificationRepo = new InMemoryNotificationRepository();
  tokenStore = new InMemoryTokenStore();
  clock = new FakeClock(new Date("2024-06-01T12:00:00Z"));
  service = new AuthService({
    userRepo,
    notificationRepo,
    hasher: trivialHasher,
    tokenStore,
    clock,
  });
});

// ---------------------------------------------------------------------------
// Property 9: Valid registration creates an account and triggers verification
// Feature: edu-travel-platform, Property 9: Valid registration creates an account and triggers verification
// ---------------------------------------------------------------------------

describe("Property 9: Valid registration creates an account and triggers verification", () => {
  it("creates exactly one User and enqueues exactly one verification notification", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, validPasswordArb, async (email, password) => {
        // Fresh repos per iteration
        userRepo.clear();
        notificationRepo = new InMemoryNotificationRepository();
        service = new AuthService({
          userRepo,
          notificationRepo,
          hasher: trivialHasher,
          tokenStore,
          clock,
        });

        const result = await service.register({ email, password });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        // Exactly one user created with matching email
        const user = result.value;
        expect(user.email).toBe(email.toLowerCase());
        expect(user.passwordHash).toBe(`hashed:${password}`);
        expect(user.roles).toContain(Role.STUDENT_TRAVELER);

        // Exactly one verification notification
        const notifications = await notificationRepo.listByUser(user.id);
        expect(notifications.length).toBe(1);
        expect(notifications[0]!.type).toBe("email_verification");
        expect(notifications[0]!.recipientEmail).toBe(user.email);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Duplicate email registration is rejected
// Feature: edu-travel-platform, Property 10: Duplicate email registration is rejected
// ---------------------------------------------------------------------------

describe("Property 10: Duplicate email registration is rejected", () => {
  it("rejects registration with already-used email regardless of case", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, validPasswordArb, validPasswordArb, async (email, pw1, pw2) => {
        userRepo.clear();
        notificationRepo = new InMemoryNotificationRepository();
        service = new AuthService({
          userRepo,
          notificationRepo,
          hasher: trivialHasher,
          tokenStore,
          clock,
        });

        // First registration succeeds
        const first = await service.register({ email, password: pw1 });
        expect(first.ok).toBe(true);

        // Second registration with same email (possibly different case) is rejected
        const caseVariant = email.toUpperCase();
        const second = await service.register({ email: caseVariant, password: pw2 });
        expect(second.ok).toBe(false);
        if (!second.ok) {
          expect(second.error.kind).toBe("ConflictError");
          expect(second.error.message).toContain("already in use");
        }

        // No new user was created
        const allUsers = await userRepo.list();
        expect(allUsers.length).toBe(1);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Malformed registration input is rejected with per-field feedback
// Feature: edu-travel-platform, Property 11: Malformed registration input is rejected with per-field feedback
// ---------------------------------------------------------------------------

describe("Property 11: Malformed registration input is rejected with per-field feedback", () => {
  it("rejects malformed email with field-level feedback", async () => {
    await fc.assert(
      fc.asyncProperty(malformedEmailArb, validPasswordArb, async (badEmail, password) => {
        userRepo.clear();

        const result = await service.register({ email: badEmail, password });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("ValidationError");
          if (result.error.kind === "ValidationError") {
            expect(result.error.issues.some((i) => i.field === "email")).toBe(true);
          }
        }

        // No account created
        const allUsers = await userRepo.list();
        expect(allUsers.length).toBe(0);
      }),
    );
  });

  it("rejects too-short password with field-level feedback", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, tooShortPasswordArb, async (email, shortPw) => {
        userRepo.clear();

        const result = await service.register({ email, password: shortPw });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("ValidationError");
          if (result.error.kind === "ValidationError") {
            expect(result.error.issues.some((i) => i.field === "password")).toBe(true);
          }
        }

        const allUsers = await userRepo.list();
        expect(allUsers.length).toBe(0);
      }),
    );
  });

  it("rejects too-long password with field-level feedback", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, tooLongPasswordArb, async (email, longPw) => {
        userRepo.clear();

        const result = await service.register({ email, password: longPw });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("ValidationError");
          if (result.error.kind === "ValidationError") {
            expect(result.error.issues.some((i) => i.field === "password")).toBe(true);
          }
        }

        const allUsers = await userRepo.list();
        expect(allUsers.length).toBe(0);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Authentication outcome is independent of dashboard authorization
// Feature: edu-travel-platform, Property 12: Authentication outcome is independent of dashboard authorization
// ---------------------------------------------------------------------------

describe("Property 12: Authentication outcome is independent of dashboard authorization", () => {
  it("authenticates valid credentials regardless of account status or profile completeness", async () => {
    const accountStatusArb = fc.constantFrom(
      AccountStatus.ACTIVE,
      AccountStatus.SUSPENDED,
      AccountStatus.PENDING,
    );

    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        accountStatusArb,
        fc.boolean(),
        async (email, password, status, profileComplete) => {
          userRepo.clear();

          // Seed a user with the given status and profile completeness
          const passwordHash = await trivialHasher.hash(password);
          const user: User = {
            id: `user-${email}`,
            email: email.toLowerCase(),
            passwordHash,
            emailVerifiedAt: null,
            googleId: null,
            roles: [Role.STUDENT_TRAVELER],
            accountStatus: status,
            profileComplete,
            failedLoginCount: 0,
            lockedUntil: null,
            inAppNotificationsEnabled: true,
            createdAt: new Date(),
          };
          userRepo.seed(user);

          const result = await service.login({ email, password });

          // Auth succeeds regardless of status/profile
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.id).toBe(user.id);
          }
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Google login establishes a linked account
// Feature: edu-travel-platform, Property 13: Google login establishes a linked account
// ---------------------------------------------------------------------------

describe("Property 13: Google login establishes a linked account", () => {
  it("creates account on first call, returns existing on second", async () => {
    const googleIdArb = fc.string({ minLength: 10, maxLength: 30 });

    await fc.assert(
      fc.asyncProperty(googleIdArb, validEmailArb, async (googleId, email) => {
        userRepo.clear();

        // First call creates
        const first = await service.upsertFromGoogle({ googleId, email });
        expect(first.ok).toBe(true);
        if (!first.ok) return;

        const createdUser = first.value;
        expect(createdUser.googleId).toBe(googleId);
        expect(createdUser.email).toBe(email.toLowerCase());

        // Second call returns same user
        const second = await service.upsertFromGoogle({ googleId, email });
        expect(second.ok).toBe(true);
        if (!second.ok) return;

        expect(second.value.id).toBe(createdUser.id);

        // Exactly one user in the store
        const allUsers = await userRepo.list();
        expect(allUsers.length).toBe(1);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Login error messages do not disclose which credential was wrong
// Feature: edu-travel-platform, Property 14: Login error messages do not disclose which credential was wrong
// ---------------------------------------------------------------------------

describe("Property 14: Login error messages do not disclose which credential was wrong", () => {
  it("returns identical error message for unknown email and wrong password", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, validPasswordArb, validPasswordArb, async (email, correctPw, wrongPw) => {
        // Ensure wrongPw differs
        if (correctPw === wrongPw) return;

        userRepo.clear();

        // Register a user
        const passwordHash = await trivialHasher.hash(correctPw);
        const user: User = {
          id: `user-${email}`,
          email: email.toLowerCase(),
          passwordHash,
          emailVerifiedAt: null,
          googleId: null,
          roles: [Role.STUDENT_TRAVELER],
          accountStatus: AccountStatus.ACTIVE,
          profileComplete: true,
          failedLoginCount: 0,
          lockedUntil: null,
          inAppNotificationsEnabled: true,
          createdAt: new Date(),
        };
        userRepo.seed(user);

        // Attempt login with wrong password
        const wrongPwResult = await service.login({ email, password: wrongPw });
        expect(wrongPwResult.ok).toBe(false);

        // Attempt login with unknown email
        const unknownEmailResult = await service.login({
          email: `unknown_${email}`,
          password: correctPw,
        });
        expect(unknownEmailResult.ok).toBe(false);

        // Both should give the same generic error message
        if (!wrongPwResult.ok && !unknownEmailResult.ok) {
          expect(wrongPwResult.error.message).toBe(unknownEmailResult.error.message);
          // The message should not mention "email" or "password" specifically
          expect(wrongPwResult.error.message).not.toMatch(/email.*not found/i);
          expect(wrongPwResult.error.message).not.toMatch(/password.*incorrect/i);
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Account locks after five consecutive failures within fifteen minutes
// Feature: edu-travel-platform, Property 15: Account locks after five consecutive failures within fifteen minutes
// ---------------------------------------------------------------------------

describe("Property 15: Account locks after five consecutive failures within fifteen minutes", () => {
  it("locks after exactly 5 consecutive failures and resets on success", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, validPasswordArb, async (email, password) => {
        userRepo.clear();
        clock.set(new Date("2024-06-01T12:00:00Z"));

        // Seed user
        const passwordHash = await trivialHasher.hash(password);
        const user: User = {
          id: `user-lockout-${email}`,
          email: email.toLowerCase(),
          passwordHash,
          emailVerifiedAt: null,
          googleId: null,
          roles: [Role.STUDENT_TRAVELER],
          accountStatus: AccountStatus.ACTIVE,
          profileComplete: true,
          failedLoginCount: 0,
          lockedUntil: null,
          inAppNotificationsEnabled: true,
          createdAt: new Date(),
        };
        userRepo.seed(user);

        // 4 failures should not lock
        for (let i = 0; i < 4; i++) {
          const r = await service.login({ email, password: "wrong_pw" });
          expect(r.ok).toBe(false);
          if (!r.ok) {
            // Should NOT be locked yet
            expect(r.error.message).toBe("Invalid email or password.");
          }
        }

        // 5th failure should lock
        const fifth = await service.login({ email, password: "wrong_pw" });
        expect(fifth.ok).toBe(false);
        if (!fifth.ok) {
          expect(fifth.error.message).toContain("temporarily locked");
        }

        // Subsequent attempts while locked are rejected
        const lockedAttempt = await service.login({ email, password });
        expect(lockedAttempt.ok).toBe(false);
        if (!lockedAttempt.ok) {
          expect(lockedAttempt.error.message).toContain("temporarily locked");
        }

        // Advance past lockout
        clock.advance(15 * 60 * 1000 + 1);

        // Successful login resets counter
        const afterLockout = await service.login({ email, password });
        expect(afterLockout.ok).toBe(true);

        // Verify counter is reset
        const updatedUser = await userRepo.findByEmail(email);
        expect(updatedUser?.failedLoginCount).toBe(0);
        expect(updatedUser?.lockedUntil).toBeNull();
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: Password reset tokens are valid for exactly sixty minutes
// Feature: edu-travel-platform, Property 17: Password reset tokens are valid for exactly sixty minutes
// ---------------------------------------------------------------------------

describe("Property 17: Password reset tokens are valid for exactly sixty minutes", () => {
  it("token validates before 60min and is rejected at or after 60min", async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        validPasswordArb,
        fc.integer({ min: 0, max: 59 }),
        async (email, originalPw, newPw, minutesBefore) => {
          userRepo.clear();
          tokenStore.clear();
          const baseTime = new Date("2024-06-01T12:00:00Z");
          clock.set(baseTime);

          // Create user
          const passwordHash = await trivialHasher.hash(originalPw);
          const user: User = {
            id: `user-reset-${email}`,
            email: email.toLowerCase(),
            passwordHash,
            emailVerifiedAt: null,
            googleId: null,
            roles: [Role.STUDENT_TRAVELER],
            accountStatus: AccountStatus.ACTIVE,
            profileComplete: true,
            failedLoginCount: 0,
            lockedUntil: null,
            inAppNotificationsEnabled: true,
            createdAt: new Date(),
          };
          userRepo.seed(user);

          // Create token with known expiry (60 min from base)
          const expiresAt = new Date(baseTime.getTime() + 60 * 60 * 1000);
          const resetToken = tokenStore.createWithExpiry(email.toLowerCase(), expiresAt);

          // Before 60 min: should succeed
          clock.set(new Date(baseTime.getTime() + minutesBefore * 60 * 1000));
          const validResult = await service.resetPassword(resetToken.token, newPw);
          expect(validResult.ok).toBe(true);
        },
      ),
    );
  });

  it("token is rejected at exactly 60 minutes", async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        validPasswordArb,
        fc.integer({ min: 60, max: 120 }),
        async (email, originalPw, newPw, minutesAfter) => {
          userRepo.clear();
          tokenStore.clear();
          const baseTime = new Date("2024-06-01T12:00:00Z");
          clock.set(baseTime);

          // Create user
          const passwordHash = await trivialHasher.hash(originalPw);
          const user: User = {
            id: `user-reset-expired-${email}`,
            email: email.toLowerCase(),
            passwordHash,
            emailVerifiedAt: null,
            googleId: null,
            roles: [Role.STUDENT_TRAVELER],
            accountStatus: AccountStatus.ACTIVE,
            profileComplete: true,
            failedLoginCount: 0,
            lockedUntil: null,
            inAppNotificationsEnabled: true,
            createdAt: new Date(),
          };
          userRepo.seed(user);

          // Create token with known expiry (60 min from base)
          const expiresAt = new Date(baseTime.getTime() + 60 * 60 * 1000);
          const resetToken = tokenStore.createWithExpiry(email.toLowerCase(), expiresAt);

          // At or after 60 min: should fail
          clock.set(new Date(baseTime.getTime() + minutesAfter * 60 * 1000));
          const expiredResult = await service.resetPassword(resetToken.token, newPw);
          expect(expiredResult.ok).toBe(false);
          if (!expiredResult.ok) {
            expect(expiredResult.error.kind).toBe("AuthenticationError");
          }
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Password reset does not reveal registration status
// Feature: edu-travel-platform, Property 18: Password reset does not reveal registration status
// ---------------------------------------------------------------------------

describe("Property 18: Password reset does not reveal registration status", () => {
  it("returns identical confirmation for registered and unregistered emails", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, validPasswordArb, async (email, password) => {
        userRepo.clear();
        notificationRepo = new InMemoryNotificationRepository();
        tokenStore.clear();
        service = new AuthService({
          userRepo,
          notificationRepo,
          hasher: trivialHasher,
          tokenStore,
          clock,
        });

        // Request reset for unregistered email
        const unregisteredResult = await service.requestPasswordReset(email);
        expect(unregisteredResult.ok).toBe(true);

        // Register the email
        await service.register({ email, password });

        // Request reset for registered email
        const registeredResult = await service.requestPasswordReset(email);
        expect(registeredResult.ok).toBe(true);

        // Both should return the same confirmation message
        if (unregisteredResult.ok && registeredResult.ok) {
          expect(unregisteredResult.value.message).toBe(registeredResult.value.message);
        }
      }),
    );
  });

  it("does not produce a usable reset token for unregistered emails", async () => {
    await fc.assert(
      fc.asyncProperty(validEmailArb, async (email) => {
        userRepo.clear();
        tokenStore.clear();

        // Request reset for unregistered email
        await service.requestPasswordReset(email);

        // No token should have been created in the store for unregistered email
        // (tokenStore counter stays at 0 since no user was found)
        const tok = await tokenStore.find("tok_1");
        expect(tok).toBeNull();
      }),
    );
  });
});
