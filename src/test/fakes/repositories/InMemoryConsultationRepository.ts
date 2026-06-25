import type { Consultation, ConsultationSlot } from "@/domain";
import type { ConsultationRepository, BookConsultationInput } from "@/ports";
import { ok, err, type Result, type DomainError, availabilityError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryConsultationRepository implements ConsultationRepository {
  private consultations = new Map<string, Consultation>();
  private slots = new Map<string, ConsultationSlot>();

  async findById(id: string): Promise<Consultation | null> {
    return this.consultations.get(id) ?? null;
  }

  async findSlotById(slotId: string): Promise<ConsultationSlot | null> {
    return this.slots.get(slotId) ?? null;
  }

  async listAvailableSlots(): Promise<readonly ConsultationSlot[]> {
    return [...this.slots.values()].filter(s => s.status === "available");
  }

  async book(input: BookConsultationInput): Promise<Result<Consultation, DomainError>> {
    const slot = this.slots.get(input.slotId);
    if (!slot || slot.status !== "available") {
      return err(availabilityError("Slot is no longer available."));
    }
    const consultation: Consultation = {
      id: randomUUID(),
      userId: input.userId,
      name: input.name,
      contactMethod: input.contactMethod,
      contactKind: input.contactKind,
      slotId: input.slotId,
      status: "booked",
      createdAt: new Date(),
    };
    const updatedSlot: ConsultationSlot = {
      ...slot,
      status: "booked",
      bookedConsultationId: consultation.id,
    };
    this.slots.set(slot.id, updatedSlot);
    this.consultations.set(consultation.id, consultation);
    return ok(consultation);
  }

  seedSlot(slot: ConsultationSlot) { this.slots.set(slot.id, slot); }
  clear() { this.consultations.clear(); this.slots.clear(); }
}
