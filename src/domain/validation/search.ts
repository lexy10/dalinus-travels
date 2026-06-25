/** Search-term validation (1–200 chars, non-whitespace-only). */
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

export const MAX_SEARCH_TERM_LENGTH = 200;

export function isValidSearchTerm(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  if (value.length > MAX_SEARCH_TERM_LENGTH) {
    return false;
  }
  return value.trim().length > 0;
}

/** Validate a catalog search term. Returns the term on success. */
export function validateSearchTerm(
  value: unknown,
  field = "searchTerm",
): Result<string, DomainError> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return err(
      validationError(
        { field, message: "Enter a search term." },
        "The search term must not be empty.",
      ),
    );
  }
  if (value.length > MAX_SEARCH_TERM_LENGTH) {
    return err(
      validationError(
        {
          field,
          message: `Search term must be at most ${MAX_SEARCH_TERM_LENGTH} characters.`,
        },
        `The maximum search term length is ${MAX_SEARCH_TERM_LENGTH} characters.`,
      ),
    );
  }
  return ok(value);
}
