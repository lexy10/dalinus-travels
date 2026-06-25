import type {
  Consultation,
  ConsultationSlot,
  ContactKind,
  ConsultationStatus,
  ConsultationSlotStatus,
} from "@/domain";
import { isContactKind, isConsultationSlotStatus, isConsultationStatus } from "@/domain";
import type {
  ConsultationRepository,
  BookConsultationInput,
} from "@/ports/repositories/ConsultationRepository";
import type { RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { availabilityError, persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomainSlot(row: {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  bookedConsultationId: string | null;
}): ConsultationSlot {
  return {
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: (isConsultationSlotStatus(row.status) ? row.status : "available") as ConsultationSlotStatus,
    bookedConsultationId: row.bookedConsultationId,
  };
}

function toDomain(row: {
  id: string;
  userId: string | null;
  name: string;
  contactMethod: string;
  contactKind: string;
  slotId: string;
  status: string;
  createdAt: Date;
}): Consultation {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    contactMethod: row.contactMethod,
    contactKind: (isContactKind(row.contactKind) ? row.contactKind : "email") as ContactKind,
    slotId: row.slotId,
    status: (isConsultationStatus(row.status) ? row.status : "booked") as ConsultationStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaConsultationRepository implements ConsultationRepository {
  async findById(id: string) {
    const row = await prisma.consultation.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async findSlotById(slotId: string) {
    const row = await prisma.consultationSlot.findUnique({ where: { id: slotId } });
    return row ? toDomainSlot(row) : null;
  }
  async listAvailableSlots() {
    const rows = await prisma.consultationSlot.findMany({
      where: { status: "available" },
      orderBy: { startsAt: "asc" },
    });
    return rows.map(toDomainSlot);
  }
  /**
   * First-writer-wins claim. The conditional `updateMany` only updates rows
   * where `status='available'`; concurrent losers see `count: 0` and receive
   * an AvailabilityError.
   */
  async book(input: BookConsultationInput): RepositoryResult<Consultation> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.consultation.create({
          data: {
            userId: input.userId,
            name: input.name,
            contactMethod: input.contactMethod,
            contactKind: input.contactKind,
            slotId: input.slotId,
          },
        });
        const updated = await tx.consultationSlot.updateMany({
          where: { id: input.slotId, status: "available" },
          data: { status: "booked", bookedConsultationId: created.id },
        });
        if (updated.count === 0) {
          // Roll back by throwing — Prisma wraps & rethrows for us
          throw new Error("SLOT_TAKEN");
        }
        return created;
      });
      return ok(toDomain(result));
    } catch (error) {
      if (error instanceof Error && error.message === "SLOT_TAKEN") {
        return err(availabilityError("That time slot was just booked."));
      }
      return err(persistenceError());
    }
  }
}
