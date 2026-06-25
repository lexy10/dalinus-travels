import type { Notification } from "@/domain";
import type { NotificationRepository, CreateNotificationInput, UpdateNotificationDeliveryInput } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryNotificationRepository implements NotificationRepository {
  private store = new Map<string, Notification>();

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null;
  }

  async listByUser(userId: string): Promise<readonly Notification[]> {
    return [...this.store.values()].filter(n => n.userId === userId);
  }

  async listPendingDelivery(): Promise<readonly Notification[]> {
    return [...this.store.values()].filter(n => n.status === "pending" || n.status === "failed");
  }

  async create(input: CreateNotificationInput): Promise<Result<Notification, DomainError>> {
    const notification: Notification = {
      id: randomUUID(),
      userId: input.userId,
      channel: input.channel,
      type: input.type,
      payload: input.payload,
      recipientEmail: input.recipientEmail,
      status: "pending",
      attemptCount: 0,
      lastAttemptAt: null,
      deliveredAt: null,
      createdAt: new Date(),
    };
    this.store.set(notification.id, notification);
    return ok(notification);
  }

  async recordDelivery(id: string, input: UpdateNotificationDeliveryInput): Promise<Result<Notification, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Notification not found.", "Notification"));
    const updated: Notification = { ...existing, ...input };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(notification: Notification) { this.store.set(notification.id, notification); }
}
