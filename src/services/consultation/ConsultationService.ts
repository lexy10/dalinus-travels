/**
 * ConsultationService — booking with slot concurrency, validation, confirmation.
 *
 * Covers:
 * - Booking with validated name/contact/slot (Req 8.1)
 * - Field validation with per-field feedback (Req 8.2, 8.3)
 * - Unavailable-slot rejection with available-slots list (Req 8.4)
 * - First-writer-wins concurrent slot claim (Req 8.5)
 */
import type { Consultation, ConsultationSlot } from "@/domain";
import { missingFieldsError, validationError, availabilityError } from "@/domain";
import { validateContactMethod } from "@/domain/validation/contact";
import type { Result, DomainError } from "@/domain/kernel";
import { err } from "@/domain/kernel";
import type { ConsultationRepository } from "@/ports/repositories/ConsultationRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";

const NAME_MAX_LENGTH = 100;

export interface BookConsultationInput {
  readonly userId: string | null;
  readonly name: unknown;
  readonly contactMethod: unknown;
  readonly slotId: unknown;
}

export interface ConsultationServiceDeps {
  readonly consultationRepo: ConsultationRepository;
  readonly notificationRepo: NotificationRepository;
}

export interface BookedConsultation {
  readonly consultation: Consultation;
  readonly slot: ConsultationSlot;
}

export class ConsultationService {
  private readonly consultationRepo: ConsultationRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor(deps: ConsultationServiceDeps) {
    this.consultationRepo = deps.consultationRepo;
    this.notificationRepo = deps.notificationRepo;
  }

  /**
   * Book a consultation in a single attempt.
   *
   * Concurrency: the repository's `book` performs an atomic conditional update
   * that succeeds only while the slot is `available`. Lost bids surface as
   * `AvailabilityError` (Req 8.5).
   */
  async book(
    input: BookConsultationInput,
  ): Promise<Result<BookedConsultation, DomainError>> {
    // ----- Required-field check (Req 8.2) -----
    const missing: string[] = [];
    if (typeof input.name !== "string" || input.name.trim() === "") {
      missing.push("name");
    }
    if (typeof input.contactMethod !== "string" || input.contactMethod.trim() === "") {
      missing.push("contactMethod");
    }
    if (typeof input.slotId !== "string" || input.slotId.trim() === "") {
      missing.push("preferredTime");
    }
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    const nameRaw = (input.name as string).trim();
    if (nameRaw.length > NAME_MAX_LENGTH) {
      return err(
        validationError({
          field: "name",
          message: `Name must be ${NAME_MAX_LENGTH} characters or fewer.`,
        }),
      );
    }

    // ----- Contact-method validation (Req 8.3) -----
    const contactResult = validateContactMethod(input.contactMethod, "contactMethod");
    if (!contactResult.ok) {
      return contactResult;
    }

    // ----- Slot availability (Req 8.4) -----
    const slotId = input.slotId as string;
    const slot = await this.consultationRepo.findSlotById(slotId);
    if (!slot || slot.status !== "available") {
      const available = await this.consultationRepo.listAvailableSlots();
      return err(
        availabilityError(
          `That time slot is not available. ${available.length} other slot(s) available.`,
        ),
      );
    }

    // ----- Atomic book (Req 8.1, 8.5) -----
    const bookResult = await this.consultationRepo.book({
      userId: input.userId,
      name: nameRaw,
      contactMethod: contactResult.value.contactMethod,
      contactKind: contactResult.value.contactKind,
      slotId,
    });

    if (!bookResult.ok) {
      return bookResult;
    }

    const consultation = bookResult.value;
    const updatedSlot = await this.consultationRepo.findSlotById(slotId);

    // ----- Confirmation notification (Req 8.1) -----
    const recipientEmail =
      contactResult.value.contactKind === "email" ? contactResult.value.contactMethod : "";

    await this.notificationRepo.create({
      userId: input.userId,
      channel: "email",
      type: "consultation_booked",
      payload: {
        consultationId: consultation.id,
        slotId,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        name: nameRaw,
      },
      recipientEmail,
    });

    return {
      ok: true,
      value: { consultation, slot: updatedSlot ?? slot },
    };
  }

  /** Public read of currently available slots. */
  async listAvailableSlots(): Promise<readonly ConsultationSlot[]> {
    return this.consultationRepo.listAvailableSlots();
  }
}
