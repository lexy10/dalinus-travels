import * as fc from "fast-check";
import { MAX_SEARCH_TERM_LENGTH } from "@/domain/validation/search";

export const validSearchTermArb = fc
  .string({ minLength: 1, maxLength: MAX_SEARCH_TERM_LENGTH })
  .filter(s => s.trim().length > 0);

export const whitespaceOnlySearchArb = fc.oneof(
  fc.constant("   "),
  fc.constant("\t\n"),
  fc.constant("  \t  "),
);

export const tooLongSearchTermArb = fc.string({
  minLength: MAX_SEARCH_TERM_LENGTH + 1,
  maxLength: MAX_SEARCH_TERM_LENGTH + 100,
});
