/**
 * NotificationService — delivery, bounded retry, in-app creation.
 *
 * Covers Req 19.1–19.4.
 *
 * The service treats one *attempt* as one call to `attemptDelivery(notification)`.
 * Retries are bounded to MAX_NOTIFICATION_RETRIES (3 additional, 4 total) and
 * must be spaced at least MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS apart. The
 * scheduling itself (when to retry) is the caller's responsibility — the
 * service enforces the bound and the spacing, and surfaces an
 * "undelivered" terminal state once the bound is reached.
 */
import type { Notification, User } from "@/domain";
import {
  MAX_NOTIFICATION_RETRIES,
  MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS,
  NotificationChannel,
  NotificationStatus,
} from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import { notFoundError } from "@/domain/kernel/errors";
import type {
  NotificationRepository,
  CreateNotificationInput,
} from "@/ports/repositories/NotificationRepository";
import type { Mailer } from "@/ports/Mailer";

export interface NotificationServiceDeps {
  readonly notificationRepo: NotificationRepository;
  readonly mailer: Mailer;
  readonly clock?: { now(): Date };
  /** Resolves the User for in-app creation toggling. */
  readonly resolveUser?: (userId: string) => Promise<User | null>;
}

export interface DeliveryAttemptResult {
  readonly notification: Notification;
  readonly delivered: boolean;
  readonly retriable: boolean;
  readonly undelivered: boolean;
  readonly throttled: boolean;
}

export class NotificationService {
  private readonly notificationRepo: NotificationRepository;
  private readonly mailer: Mailer;
  private readonly clock: { now(): Date };
  private readonly resolveUser?: (userId: string) => Promise<User | null>;

  constructor(deps: NotificationServiceDeps) {
    this.notificationRepo = deps.notificationRepo;
    this.mailer = deps.mailer;
    this.clock = deps.clock ?? { now: () => new Date() };
    this.resolveUser = deps.resolveUser;
  }

  /**
   * Enqueue a notification. In-app notifications are only created when the
   * resolved User has `inAppNotificationsEnabled` (Req 19.4); email
   * notifications are always created and rely on retry semantics below.
   */
  async enqueue(input: CreateNotificationInput): Promise<Result<Notification, DomainError>> {
    if (input.channel === NotificationChannel.IN_APP) {
      if (!input.userId || !this.resolveUser) {
        return err(notFoundError("In-app notifications require a known user.", "User"));
      }
      const user = await this.resolveUser(input.userId);
      if (!user || !user.inAppNotificationsEnabled) {
        // Silently drop — the requirement is iff-enabled, no error needed.
        // Return a fake "skipped" notification value so callers don't need
        // to distinguish; we use a sentinel by NOT creating the record.
        // Surface this as an Ok with a synthetic pending record so the
        // caller can no-op cleanly.
        return ok({
          id: "skipped",
          userId: input.userId,
          channel: input.channel,
          type: input.type,
          payload: input.payload,
          recipientEmail: input.recipientEmail,
          status: NotificationStatus.UNDELIVERED,
          attemptCount: 0,
          lastAttemptAt: null,
          deliveredAt: null,
          createdAt: this.clock.now(),
        });
      }
    }
    return this.notificationRepo.create(input);
  }

  /**
   * Attempt to deliver a single email notification. Enforces the bound and
   * the minimum spacing. Returns metadata about the attempt for callers
   * that drive the schedule.
   */
  async attemptDelivery(
    notificationId: string,
  ): Promise<Result<DeliveryAttemptResult, DomainError>> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) return err(notFoundError("Notification not found.", "Notification"));

    if (
      notification.status === NotificationStatus.SENT ||
      notification.status === NotificationStatus.UNDELIVERED
    ) {
      return ok({
        notification,
        delivered: notification.status === NotificationStatus.SENT,
        retriable: false,
        undelivered: notification.status === NotificationStatus.UNDELIVERED,
        throttled: false,
      });
    }

    const now = this.clock.now();

    // ----- Spacing enforcement (Req 19.2 — ≥60s between attempts) -----
    if (notification.lastAttemptAt) {
      const elapsedSec = (now.getTime() - notification.lastAttemptAt.getTime()) / 1000;
      if (elapsedSec < MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS) {
        return ok({
          notification,
          delivered: false,
          retriable: true,
          undelivered: false,
          throttled: true,
        });
      }
    }

    // ----- Send -----
    const result = await this.mailer.send({
      to: notification.recipientEmail,
      subject: notification.type,
      text: JSON.stringify(notification.payload),
    });

    const nextAttemptCount = notification.attemptCount + 1;

    if (result.ok) {
      const updated = await this.notificationRepo.recordDelivery(notificationId, {
        status: NotificationStatus.SENT,
        attemptCount: nextAttemptCount,
        lastAttemptAt: now,
        deliveredAt: now,
      });
      if (!updated.ok) return updated;
      return ok({
        notification: updated.value,
        delivered: true,
        retriable: false,
        undelivered: false,
        throttled: false,
      });
    }

    // Failure path — bound retries
    const exhausted = nextAttemptCount >= 1 + MAX_NOTIFICATION_RETRIES;
    const updated = await this.notificationRepo.recordDelivery(notificationId, {
      status: exhausted ? NotificationStatus.UNDELIVERED : NotificationStatus.FAILED,
      attemptCount: nextAttemptCount,
      lastAttemptAt: now,
    });
    if (!updated.ok) return updated;
    return ok({
      notification: updated.value,
      delivered: false,
      retriable: !exhausted,
      undelivered: exhausted,
      throttled: false,
    });
  }
}
