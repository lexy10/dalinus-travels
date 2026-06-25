import * as fc from "fast-check";

export const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._]{0,20}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

export const malformedEmailArb = fc.oneof(
  fc.constant(""),
  fc.constant("no-at-sign"),
  fc.constant("@no-local.com"),
  fc.constant("spaces in@email.com"),
  fc.constant("user@"),
  fc.constant("user@.com"),
  fc.stringMatching(/^[a-z]{1,10}$/).map(s => `${s}@`),
);
