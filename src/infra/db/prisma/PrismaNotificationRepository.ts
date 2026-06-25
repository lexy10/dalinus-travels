/**
 * Prisma adapter for the NotificationRepository port.
 */
import type { Notification as PrismaNotification } from "@prisma/client";
import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "@/domain";
import { isNotificationChannel, isNotificationStatus } from "@/domain";
import type {
  NotificationRepository,
  CreateNotificationInput,
  UpdateNotificationDeliveryInput,
} from "@/ports/repositories/NotificationRepository";
import type { RepositoryResult } from "@/ports/repositories/common";
import { ok, err, type Result, type DomainError } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: PrismaNotification): Notification {
  return {
    id: row.id,
    userId: row.userId,
    channel: (isNotificationChannel(row.channel) ? row.channel : "email") as NotificationChannel,
    type: row.type,
    payload: row.payload as Readonly<Record<string, unknown>>,
    recipientEmail: row.recipientEmail,
    status: (isNotificationStatus(row.status) ? row.status : "pending") as NotificationStatus,
    attemptCount: row.attemptCount,
    lastAttemptAt: row.lastAttemptAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    const row = await prisma.notification.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async listByUser(userId: string): Promise<readonly Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }

  async listPendingDelivery(): Promise<readonly Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { status: { in: ["pending", "failed"] } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomain);
  }

  async create(input: CreateNotificationInput): RepositoryResult<Notification> {
    try {
      const row = await prisma.notification.create({
        data: {
          userId: input.userId,
          channel: input.channel,
          type: input.type,
          payload: input.payload as object,
          recipientEmail: input.recipientEmail,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError()) as Result<Notification, DomainError>;
    }
  }

  async recordDelivery(
    id: string,
    input: UpdateNotificationDeliveryInput,
  ): RepositoryResult<Notification> {
    try {
      const row = await prisma.notification.update({
        where: { id },
        data: {
          ...(input.status !== undefined && { status: input.status }),
          ...(input.attemptCount !== undefined && { attemptCount: input.attemptCount }),
          ...(input.lastAttemptAt !== undefined && { lastAttemptAt: input.lastAttemptAt }),
          ...(input.deliveredAt !== undefined && { deliveredAt: input.deliveredAt }),
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError()) as Result<Notification, DomainError>;
    }
  }
}
