/** Notification entity and delivery lifecycle. */
import type { UUID, Timestamp } from "./common";

export const NotificationChannel = {
  EMAIL: "email",
  IN_APP: "in_app",
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const ALL_NOTIFICATION_CHANNELS: readonly NotificationChannel[] =
  Object.values(NotificationChannel);

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return (
    typeof value === "string" && (ALL_NOTIFICATION_CHANNELS as readonly string[]).includes(value)
  );
}

/**
 * Notification delivery lifecycle.
 * - `pending` — created, awaiting first attempt.
 * - `sent` — delivered successfully.
 * - `failed` — attempt failed; eligible for retry while attempts remain.
 * - `undelivered` — all attempts exhausted.
 */
export const NotificationStatus = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  UNDELIVERED: "undelivered",
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const ALL_NOTIFICATION_STATUSES: readonly NotificationStatus[] =
  Object.values(NotificationStatus);

export function isNotificationStatus(value: unknown): value is NotificationStatus {
  return (
    typeof value === "string" && (ALL_NOTIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

/** Max additional retry attempts (4 total including the first). */
export const MAX_NOTIFICATION_RETRIES = 3;

/** Minimum seconds between delivery attempts. */
export const MIN_NOTIFICATION_RETRY_INTERVAL_SECONDS = 60;

export interface Notification {
  readonly id: UUID;
  /** `null` for guest, email-only recipients. */
  readonly userId: UUID | null;
  readonly channel: NotificationChannel;
  /** Event type discriminator, e.g. `"application_status_change"`. */
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly recipientEmail: string;
  readonly status: NotificationStatus;
  readonly attemptCount: number;
  readonly lastAttemptAt: Timestamp | null;
  readonly deliveredAt: Timestamp | null;
  readonly createdAt: Timestamp;
}
