/**
 * Property-based tests for LeadService.
 *
 * Covers Property 45 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { LeadService, MAX_LEAD_MESSAGE_LENGTH } from "./LeadService";
import { InMemoryLeadRepository } from "@/test/fakes/repositories/InMemoryLeadRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import { validEmailArb, malformedEmailArb } from "@/test/arbitraries/email.arb";
import { DomainErrorKind } from "@/domain/kernel";

let leadRepo: InMemoryLeadRepository;
let notificationRepo: InMemoryNotificationRepository;
let service: LeadService;

beforeEach(() => {
  leadRepo = new InMemoryLeadRepository();
  notificationRepo = new InMemoryNotificationRepository();
  service = new LeadService({ leadRepo, notificationRepo });
});

const nonEmptyArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim() !== "");
const validMessageArb = fc
  .string({ minLength: 1, maxLength: MAX_LEAD_MESSAGE_LENGTH })
  .filter((s) => s.trim() !== "");

// ---------------------------------------------------------------------------
// Property 45: Valid contact submissions create a Lead with confirmation;
//              invalid ones do not.
// Feature: edu-travel-platform, Property 45: Valid contact submissions create a Lead with confirmation; invalid ones do not
// ---------------------------------------------------------------------------

describe("Property 45: Valid contact submissions create a Lead with confirmation; invalid ones do not", () => {
  it("creates exactly one Lead and one confirmation when valid", async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyArb,
        validEmailArb,
        validMessageArb,
        async (name, email, message) => {
          leadRepo.clear();
          notificationRepo.clear();

          const result = await service.submitContact({ name, email, message });

          expect(result.ok).toBe(true);
          if (!result.ok) return;
          expect(result.value.email).toBe(email.toLowerCase());
          expect(result.value.message).toBe(message);

          const all = await leadRepo.list();
          expect(all).toHaveLength(1);

          const notifs = await notificationRepo.listPendingDelivery();
          const confirmations = notifs.filter((n) => n.type === "contact_confirmation");
          expect(confirmations).toHaveLength(1);
          expect(confirmations[0]?.recipientEmail).toBe(email.toLowerCase());
        },
      ),
    );
  });

  it("rejects empty required fields without persistence", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dropName: fc.boolean(),
          dropEmail: fc.boolean(),
          dropMessage: fc.boolean(),
        }),
        async ({ dropName, dropEmail, dropMessage }) => {
          fc.pre(dropName || dropEmail || dropMessage);
          leadRepo.clear();
          notificationRepo.clear();

          const result = await service.submitContact({
            name: dropName ? "" : "Alice",
            email: dropEmail ? "" : "alice@example.com",
            message: dropMessage ? "" : "Hello",
          });

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Validation);

          expect((await leadRepo.list())).toHaveLength(0);
          expect((await notificationRepo.listPendingDelivery())).toHaveLength(0);
        },
      ),
    );
  });

  it("rejects malformed email without persistence", async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyArb, malformedEmailArb, validMessageArb, async (name, email, message) => {
        leadRepo.clear();
        notificationRepo.clear();

        const result = await service.submitContact({ name, email, message });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe(DomainErrorKind.Validation);
        expect((await leadRepo.list())).toHaveLength(0);
      }),
    );
  });

  it("rejects message exceeding MAX_LEAD_MESSAGE_LENGTH without persistence", async () => {
    const overLengthArb = fc
      .integer({ min: 1, max: 200 })
      .map((extra) => "x".repeat(MAX_LEAD_MESSAGE_LENGTH + extra));

    await fc.assert(
      fc.asyncProperty(nonEmptyArb, validEmailArb, overLengthArb, async (name, email, message) => {
        leadRepo.clear();
        notificationRepo.clear();

        const result = await service.submitContact({ name, email, message });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe(DomainErrorKind.Validation);
        expect(result.error.message).toContain(String(MAX_LEAD_MESSAGE_LENGTH));
        expect((await leadRepo.list())).toHaveLength(0);
      }),
      { numRuns: 30 },
    );
  });
});
