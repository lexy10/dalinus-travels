import * as fc from "fast-check";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/domain/validation/password";

export const validPasswordArb = fc.string({
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
});

export const tooShortPasswordArb = fc.string({
  minLength: 1,
  maxLength: MIN_PASSWORD_LENGTH - 1,
});

export const tooLongPasswordArb = fc.string({
  minLength: MAX_PASSWORD_LENGTH + 1,
  maxLength: MAX_PASSWORD_LENGTH + 50,
});
