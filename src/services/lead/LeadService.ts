/**
 * LeadService — public contact-form submissions.
 *
 * Covers contact-form Lead creation, validation, and confirmation
 * (Req 14.6–14.10).
 */
import type { Lead } from "@/domain";
import {
  LeadSource,
  MAX_LEAD_MESSAGE_LENGTH,
  missingFieldsError,
  validationError,
} from "@/domain";
import { isValidEmail } from "@/domain/validation/email";
import { validateContactMessage } from "@/domain/validation/message";
import type { Result, DomainError } from "@/domain/kernel";
import { err } from "@/domain/kernel";
import type { LeadRepository } from "@/ports/repositories/LeadRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";

export interface SubmitContactInput {
  readonly name: unknown;
  readonly email: unknown;
  readonly message: unknown;
}

export interface LeadServiceDeps {
  readonly leadRepo: LeadRepository;
  readonly notificationRepo: NotificationRepository;
}

export class LeadService {
  private readonly leadRepo: LeadRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor(deps: LeadServiceDeps) {
    this.leadRepo = deps.leadRepo;
    this.notificationRepo = deps.notificationRepo;
  }

  /**
   * Submit a contact form.
   * - Empty required fields → ValidationError listing them (Req 14.8)
   * - Malformed email → ValidationError (Req 14.9)
   * - Message > MAX_LEAD_MESSAGE_LENGTH → ValidationError (Req 14.10)
   * - Otherwise: create Lead, enqueue confirmation (Req 14.7)
   */
  async submitContact(input: SubmitContactInput): Promise<Result<Lead, DomainError>> {
    // ----- Empty-field check (Req 14.8) -----
    const missing: string[] = [];
    const nameIsString = typeof input.name === "string";
    const emailIsString = typeof input.email === "string";
    const messageIsString = typeof input.message === "string";

    if (!nameIsString || (input.name as string).trim() === "") missing.push("name");
    if (!emailIsString || (input.email as string).trim() === "") missing.push("email");
    if (!messageIsString || (input.message as string).trim() === "") missing.push("message");

    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    // ----- Length cap on message (Req 14.10) — checked BEFORE email format
    // so the user is told about the largest constraint first.
    const messageValidation = validateContactMessage(input.message, "message");
    if (!messageValidation.ok) {
      return messageValidation;
    }

    // ----- Email format (Req 14.9) -----
    if (!isValidEmail(input.email)) {
      return err(
        validationError({
          field: "email",
          message: "Enter a valid email address.",
        }),
      );
    }

    const email = (input.email as string).toLowerCase();
    const name = (input.name as string).trim();
    const message = messageValidation.value;

    const createResult = await this.leadRepo.create({
      source: LeadSource.CONTACT_FORM,
      name,
      email,
      message,
      attributedRecruiterId: null,
      attributedPartnerId: null,
    });
    if (!createResult.ok) return createResult;

    // ----- Confirmation (Req 14.7) -----
    await this.notificationRepo.create({
      userId: null,
      channel: "email",
      type: "contact_confirmation",
      payload: { leadId: createResult.value.id, name },
      recipientEmail: email,
    });

    return createResult;
  }
}

export { MAX_LEAD_MESSAGE_LENGTH };
