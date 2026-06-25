/** Consultation contact-method validation (email or phone). */
import { ContactKind } from "../consultation";
import { type DomainError, type Result, err, ok, validationError } from "../kernel";
import { isValidEmail } from "./email";

const PHONE_DIGITS_PATTERN = /^\+?\d{7,15}$/;
const PHONE_SEPARATORS_PATTERN = /[\s().-]/g;

export function isValidPhone(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const compact = value.replace(PHONE_SEPARATORS_PATTERN, "");
  return PHONE_DIGITS_PATTERN.test(compact);
}

export function classifyContact(value: unknown): ContactKind | null {
  if (isValidEmail(value)) {
    return ContactKind.EMAIL;
  }
  if (isValidPhone(value)) {
    return ContactKind.PHONE;
  }
  return null;
}

export interface ValidatedContact {
  readonly contactMethod: string;
  readonly contactKind: ContactKind;
}

/** Validate a consultation contact method. Returns the contact and its kind on success. */
export function validateContactMethod(
  value: unknown,
  field = "contactMethod",
): Result<ValidatedContact, DomainError> {
  const kind = classifyContact(value);
  if (kind === null || typeof value !== "string") {
    return err(
      validationError(
        { field, message: "Enter a valid email address or phone number." },
        "The contact method format is invalid.",
      ),
    );
  }
  return ok({ contactMethod: value, contactKind: kind });
}
