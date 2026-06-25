/** Contact-message length validation. */
import { MAX_LEAD_MESSAGE_LENGTH } from "../lead";
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

export function isValidContactMessage(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_LEAD_MESSAGE_LENGTH;
}

/** Validate contact-form message length. Returns the message on success. */
export function validateContactMessage(
  value: unknown,
  field = "message",
): Result<string, DomainError> {
  if (typeof value !== "string" || value.length > MAX_LEAD_MESSAGE_LENGTH) {
    return err(
      validationError(
        {
          field,
          message: `Message must be at most ${MAX_LEAD_MESSAGE_LENGTH} characters.`,
        },
        `The maximum allowed message length is ${MAX_LEAD_MESSAGE_LENGTH} characters.`,
      ),
    );
  }
  return ok(value);
}
