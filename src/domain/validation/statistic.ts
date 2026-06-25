/** Statistic value validation (count: non-negative integer; rate: 0–100). */
import { type StatisticValueType, StatisticValueType as ValueType } from "../content";
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

export const MIN_RATE_VALUE = 0;
export const MAX_RATE_VALUE = 100;

export function isValidCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isValidRate(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_RATE_VALUE &&
    value <= MAX_RATE_VALUE
  );
}

/** Validate a statistic value against its type. Returns the value on success. */
export function validateStatisticValue(
  valueType: StatisticValueType,
  value: unknown,
  field = "value",
): Result<number, DomainError> {
  if (valueType === ValueType.COUNT) {
    if (!isValidCount(value)) {
      return err(
        validationError(
          { field, message: "Count must be a non-negative integer." },
          "A count value must be a non-negative integer.",
        ),
      );
    }
    return ok(value);
  }

  if (!isValidRate(value)) {
    return err(
      validationError(
        {
          field,
          message: `Rate must be between ${MIN_RATE_VALUE} and ${MAX_RATE_VALUE}.`,
        },
        `A rate value must be between ${MIN_RATE_VALUE} and ${MAX_RATE_VALUE} percent.`,
      ),
    );
  }
  return ok(value);
}
