/** Tuition-range filter validation (non-negative bounds, min ≤ max). */
import {
  type DomainError,
  type FieldIssue,
  type Result,
  err,
  ok,
  validationError,
} from "../kernel";

export interface TuitionRange {
  readonly min?: number | null;
  readonly max?: number | null;
}

export interface NormalizedTuitionRange {
  readonly min: number | null;
  readonly max: number | null;
}

function isNonNegativeFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isValidTuitionRange(range: TuitionRange): boolean {
  const { min, max } = range;
  if (min !== null && min !== undefined && !isNonNegativeFiniteNumber(min)) {
    return false;
  }
  if (max !== null && max !== undefined && !isNonNegativeFiniteNumber(max)) {
    return false;
  }
  if (min !== null && min !== undefined && max !== null && max !== undefined && min > max) {
    return false;
  }
  return true;
}

/** Validate a tuition-range filter. Returns normalized bounds on success. */
export function validateTuitionRange(
  range: TuitionRange,
  fields: { min?: string; max?: string } = {},
): Result<NormalizedTuitionRange, DomainError> {
  const minField = fields.min ?? "tuitionMin";
  const maxField = fields.max ?? "tuitionMax";
  const min = range.min ?? null;
  const max = range.max ?? null;
  const issues: FieldIssue[] = [];

  if (min !== null && !isNonNegativeFiniteNumber(min)) {
    issues.push({ field: minField, message: "Minimum tuition must be a non-negative number." });
  }
  if (max !== null && !isNonNegativeFiniteNumber(max)) {
    issues.push({ field: maxField, message: "Maximum tuition must be a non-negative number." });
  }
  if (issues.length === 0 && min !== null && max !== null && min > max) {
    issues.push({
      field: maxField,
      message: "Minimum tuition must not exceed maximum tuition.",
    });
  }

  if (issues.length > 0) {
    return err(validationError(issues, "The tuition range is invalid."));
  }
  return ok({ min, max });
}
