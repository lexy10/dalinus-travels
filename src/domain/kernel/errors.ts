/** Discriminated union of expected service-layer errors, keyed by `kind`. */

export const DomainErrorKind = {
  Validation: "ValidationError",
  Conflict: "ConflictError",
  Authentication: "AuthenticationError",
  Authorization: "AuthorizationError",
  NotFound: "NotFoundError",
  Availability: "AvailabilityError",
  Payment: "PaymentError",
  Storage: "StorageError",
  Persistence: "PersistenceError",
} as const;

export type DomainErrorKind = (typeof DomainErrorKind)[keyof typeof DomainErrorKind];

export interface FieldIssue {
  readonly field: string;
  readonly message: string;
}

/** Per-field validation failure with one or more issues. */
export interface ValidationError {
  readonly kind: typeof DomainErrorKind.Validation;
  readonly message: string;
  readonly issues: readonly FieldIssue[];
}

/** Uniqueness or duplicate violation. */
export interface ConflictError {
  readonly kind: typeof DomainErrorKind.Conflict;
  readonly message: string;
  readonly resource?: string;
}

/** Generic, non-disclosing authentication failure. */
export interface AuthenticationError {
  readonly kind: typeof DomainErrorKind.Authentication;
  readonly message: string;
}

/** Role/ownership/gating denial with an optional machine-readable reason. */
export interface AuthorizationError {
  readonly kind: typeof DomainErrorKind.Authorization;
  readonly message: string;
  readonly reason?: string;
}

/** Missing or non-visible resource. */
export interface NotFoundError {
  readonly kind: typeof DomainErrorKind.NotFound;
  readonly message: string;
  readonly resource?: string;
}

/** Capacity or slot unavailability. */
export interface AvailabilityError {
  readonly kind: typeof DomainErrorKind.Availability;
  readonly message: string;
}

/** Failed, declined, or unconfirmed payment outcome. */
export interface PaymentError {
  readonly kind: typeof DomainErrorKind.Payment;
  readonly message: string;
  readonly outcome?: "failed" | "declined" | "unconfirmed";
}

/** Object-store persistence failure. */
export interface StorageError {
  readonly kind: typeof DomainErrorKind.Storage;
  readonly message: string;
}

/** Repository write failure. */
export interface PersistenceError {
  readonly kind: typeof DomainErrorKind.Persistence;
  readonly message: string;
}

export type DomainError =
  | ValidationError
  | ConflictError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | AvailabilityError
  | PaymentError
  | StorageError
  | PersistenceError;

// --- Constructor helpers -----------------------------------------------------

/** Construct a ValidationError from per-field issues. */
export function validationError(
  issues: readonly FieldIssue[] | FieldIssue,
  message?: string,
): ValidationError {
  const list = Array.isArray(issues) ? issues : [issues];
  const fields = list.map((i) => i.field);
  const derived =
    fields.length === 0 ? "Validation failed." : `Validation failed for: ${fields.join(", ")}.`;
  return {
    kind: DomainErrorKind.Validation,
    message: message ?? derived,
    issues: list,
  };
}

/** Construct a ValidationError for required fields that were missing or empty. */
export function missingFieldsError(fields: readonly string[], message?: string): ValidationError {
  const issues = fields.map<FieldIssue>((field) => ({
    field,
    message: `${field} is required.`,
  }));
  return validationError(issues, message ?? `Missing required field(s): ${fields.join(", ")}.`);
}

export function conflictError(message: string, resource?: string): ConflictError {
  return { kind: DomainErrorKind.Conflict, message, ...(resource ? { resource } : {}) };
}

export function authenticationError(message = "Invalid email or password."): AuthenticationError {
  return { kind: DomainErrorKind.Authentication, message };
}

export function authorizationError(message: string, reason?: string): AuthorizationError {
  return { kind: DomainErrorKind.Authorization, message, ...(reason ? { reason } : {}) };
}

export function notFoundError(message: string, resource?: string): NotFoundError {
  return { kind: DomainErrorKind.NotFound, message, ...(resource ? { resource } : {}) };
}

export function availabilityError(message: string): AvailabilityError {
  return { kind: DomainErrorKind.Availability, message };
}

export function paymentError(
  message: string,
  outcome?: "failed" | "declined" | "unconfirmed",
): PaymentError {
  return { kind: DomainErrorKind.Payment, message, ...(outcome ? { outcome } : {}) };
}

export function storageError(message = "The upload could not be completed."): StorageError {
  return { kind: DomainErrorKind.Storage, message };
}

export function persistenceError(message = "The changes could not be saved."): PersistenceError {
  return { kind: DomainErrorKind.Persistence, message };
}

// --- Type guards -------------------------------------------------------------

export function isValidationError(error: DomainError): error is ValidationError {
  return error.kind === DomainErrorKind.Validation;
}

export function isDomainErrorOfKind<K extends DomainErrorKind>(
  error: DomainError,
  kind: K,
): error is Extract<DomainError, { kind: K }> {
  return error.kind === kind;
}
