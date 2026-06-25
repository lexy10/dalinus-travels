/**
 * Property-based tests for NotificationService.
 *
 * Covers Properties 53–54 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NotificationService } from "./NotificationService";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import { FakeMailer } from "@/test/fakes/FakeMailer";
import {
  AccountStatus,
  MAX_NOTIFICATION_RETRIES,
  MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS,
  NotificationChannel,
  NotificationStatus,
  Role,
  type User,
} from "@/domain";

class FakeClock {
  constructor(private current = new Date("2026-06-01T10:00:00Z")) {}
  now() {
    return this.current;
  }
  advanceSeconds(s: number) {
    this.current = new Date(this.current.getTime() + s * 1000);
  }
}

let notifRepo: InMemoryNotificationRepository;
let mailer: FakeMailer;
let clock: FakeClock;
let service: NotificationService;
const users = new Map<string, User>();

beforeEach(() => {
  notifRepo = new InMemoryNotificationRepository();
  mailer = new FakeMailer();
  clock = new FakeClock();
  users.clear();
  service = new NotificationService({
    notificationRepo: notifRepo,
    mailer,
    clock,
    resolveUser: async (id: string) => users.get(id) ?? null,
  });
});

function makeUser(id: string, inAppEnabled: boolean): User {
  const user: User = {
    id,
    email: `${id}@x.co`,
    passwordHash: null,
    emailVerifiedAt: null,
    googleId: null,
    roles: [Role.STUDENT_TRAVELER],
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    failedLoginCount: 0,
    lockedUntil: null,
    inAppNotificationsEnabled: inAppEnabled,
    createdAt: new Date(),
  };
  users.set(id, user);
  return user;
}

// ---------------------------------------------------------------------------
// Property 53: Notification retry is bounded, spaced, recorded, and terminates as undelivered
// Feature: edu-travel-platform, Property 53: Notification retry is bounded, spaced, recorded, and terminates as undelivered
// ---------------------------------------------------------------------------

describe("Property 53: Notification retry is bounded, spaced, recorded, and terminates as undelivered", () => {
  it("at most 4 attempts, ≥60s spacing, terminal undelivered when all fail", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (extraAttempts) => {
        notifRepo.clear();
        mailer.reset();
        clock = new FakeClock();
        service = new NotificationService({
          notificationRepo: notifRepo,
          mailer,
          clock,
        });

        // Fail every call
        mailer.setFailSequence(Array.from({ length: 20 }, (_, i) => i + 1));

        const created = await service.enqueue({
          userId: "u-1",
          channel: NotificationChannel.EMAIL,
          type: "test",
          payload: {},
          recipientEmail: "u@x.co",
        });
        expect(created.ok).toBe(true);
        if (!created.ok) return;
        const id = created.value.id;

        // Attempt many times — the service must cap at 4 total attempts
        // and only count an attempt when ≥60s have elapsed.
        const totalAttempts = 1 + MAX_NOTIFICATION_RETRIES + extraAttempts;
        let realAttempts = 0;
        for (let i = 0; i < totalAttempts; i++) {
          const r = await service.attemptDelivery(id);
          expect(r.ok).toBe(true);
          if (!r.ok) return;
          if (!r.value.throttled && r.value.notification.attemptCount > realAttempts) {
            realAttempts = r.value.notification.attemptCount;
          }
          // Always advance the clock so subsequent calls are not throttled
          clock.advanceSeconds(MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS);
        }

        const final = await notifRepo.findById(id);
        expect(final).not.toBeNull();
        if (!final) return;

        // At most 4 attempts in total
        expect(final.attemptCount).toBeLessThanOrEqual(1 + MAX_NOTIFICATION_RETRIES);
        // Terminal state when all fail
        expect(final.status).toBe(NotificationStatus.UNDELIVERED);
      }),
      { numRuns: 20 },
    );
  });

  it("a successful attempt before the bound stops further attempts", async () => {
    notifRepo.clear();
    mailer.reset();
    clock = new FakeClock();
    service = new NotificationService({
      notificationRepo: notifRepo,
      mailer,
      clock,
    });
    // Fail the first 2 attempts, then succeed
    mailer.setFailSequence([1, 2]);

    const created = await service.enqueue({
      userId: "u-1",
      channel: NotificationChannel.EMAIL,
      type: "test",
      payload: {},
      recipientEmail: "u@x.co",
    });
    if (!created.ok) return;

    for (let i = 0; i < 5; i++) {
      await service.attemptDelivery(created.value.id);
      clock.advanceSeconds(MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS);
    }

    const final = await notifRepo.findById(created.value.id);
    expect(final?.status).toBe(NotificationStatus.SENT);
    expect(final?.attemptCount).toBe(3); // failed, failed, sent
  });

  it("throttles re-attempts within the 60s window", async () => {
    notifRepo.clear();
    mailer.reset();
    clock = new FakeClock();
    service = new NotificationService({
      notificationRepo: notifRepo,
      mailer,
      clock,
    });
    mailer.setFailSequence([1, 2, 3, 4]);

    const created = await service.enqueue({
      userId: "u-1",
      channel: NotificationChannel.EMAIL,
      type: "test",
      payload: {},
      recipientEmail: "u@x.co",
    });
    if (!created.ok) return;

    await service.attemptDelivery(created.value.id);
    // Without advancing time, the next call must be throttled
    const throttled = await service.attemptDelivery(created.value.id);
    expect(throttled.ok).toBe(true);
    if (!throttled.ok) return;
    expect(throttled.value.throttled).toBe(true);
    // Repository attempt count unchanged
    const mid = await notifRepo.findById(created.value.id);
    expect(mid?.attemptCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Property 54: In-app notifications are created exactly when enabled
// Feature: edu-travel-platform, Property 54: In-app notifications are created exactly when enabled
// ---------------------------------------------------------------------------

describe("Property 54: In-app notifications are created exactly when enabled", () => {
  it("creates iff the user has in-app notifications enabled", async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), fc.uuid(), async (enabled, userId) => {
        notifRepo.clear();
        users.clear();
        makeUser(userId, enabled);

        const r = await service.enqueue({
          userId,
          channel: NotificationChannel.IN_APP,
          type: "test",
          payload: {},
          recipientEmail: "",
        });
        expect(r.ok).toBe(true);

        const stored = await notifRepo.listByUser(userId);
        expect(stored.length).toBe(enabled ? 1 : 0);
      }),
    );
  });
});
