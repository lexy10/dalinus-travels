/** Repository port for Consultation and ConsultationSlot entities. */
import type { Consultation, ConsultationSlot, ContactKind } from "@/domain";
import type { RepositoryResult } from "./common";

export interface BookConsultationInput {
  readonly userId: string | null;
  readonly name: string;
  readonly contactMethod: string;
  readonly contactKind: ContactKind;
  readonly slotId: string;
}

export interface ConsultationRepository {
  findById(id: string): Promise<Consultation | null>;
  findSlotById(slotId: string): Promise<ConsultationSlot | null>;
  listAvailableSlots(): Promise<readonly ConsultationSlot[]>;
  book(input: BookConsultationInput): RepositoryResult<Consultation>;
}
