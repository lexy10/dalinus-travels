/** Repository port for Notification entities. */
import type { Notification, NotificationChannel, NotificationStatus, Timestamp } from "@/domain";
import type { RepositoryResult } from "./common";

export interface CreateNotificationInput {
  readonly userId: string | null;
  readonly channel: NotificationChannel;
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly recipientEmail: string;
}

export interface UpdateNotificationDeliveryInput {
  readonly status?: NotificationStatus;
  readonly attemptCount?: number;
  readonly lastAttemptAt?: Timestamp | null;
  readonly deliveredAt?: Timestamp | null;
}

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  listByUser(userId: string): Promise<readonly Notification[]>;
  listPendingDelivery(): Promise<readonly Notification[]>;
  create(input: CreateNotificationInput): RepositoryResult<Notification>;
  recordDelivery(id: string, input: UpdateNotificationDeliveryInput): RepositoryResult<Notification>;
}
