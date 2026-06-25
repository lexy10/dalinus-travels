/** Email format validation. */
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(value);
}

/** Validate email format. Returns the email on success. */
export function validateEmail(value: unknown, field = "email"): Result<string, DomainError> {
  if (!isValidEmail(value)) {
    return err(
      validationError(
        { field, message: "Enter a valid email address." },
        "The email address format is invalid.",
      ),
    );
  }
  return ok(value);
}
