/** Password length validation (8–128 characters). */
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function isValidPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH
  );
}

/** Validate password length. Returns the password on success. */
export function validatePassword(value: unknown, field = "password"): Result<string, DomainError> {
  if (!isValidPassword(value)) {
    return err(
      validationError(
        {
          field,
          message: `Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters.`,
        },
        `The password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
      ),
    );
  }
  return ok(value);
}
