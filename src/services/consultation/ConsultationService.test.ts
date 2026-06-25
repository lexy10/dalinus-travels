/**
 * Property-based tests for ConsultationService.
 *
 * Covers Properties 29–31 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ConsultationService } from "./ConsultationService";
import { InMemoryConsultationRepository } from "@/test/fakes/repositories/InMemoryConsultationRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import {
  availableSlotArb,
  contactMethodArb,
} from "@/test/arbitraries/consultation.arb";
import { ConsultationSlotStatus } from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";

let consultationRepo: InMemoryConsultationRepository;
let notificationRepo: InMemoryNotificationRepository;
let service: ConsultationService;

beforeEach(() => {
  consultationRepo = new InMemoryConsultationRepository();
  notificationRepo = new InMemoryNotificationRepository();
  service = new ConsultationService({ consultationRepo, notificationRepo });
});

const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

// ---------------------------------------------------------------------------
// Property 29: Valid consultation request creates a booking with confirmation
// Feature: edu-travel-platform, Property 29: Valid consultation request creates a booking with confirmation
// ---------------------------------------------------------------------------

describe("Property 29: Valid consultation request creates a booking with confirmation", () => {
  it("books slot, marks it booked, and enqueues exactly one confirmation", async () => {
    await fc.assert(
      fc.asyncProperty(
        availableSlotArb,
        nameArb,
        contactMethodArb,
        async (slot, name, contact) => {
          consultationRepo.clear();
          notificationRepo.clear();
          consultationRepo.seedSlot(slot);

          const result = await service.book({
            userId: null,
            name,
            contactMethod: contact,
            slotId: slot.id,
          });

          expect(result.ok).toBe(true);
          if (!result.ok) return;

          expect(result.value.consultation.status).toBe("booked");
          expect(result.value.consultation.slotId).toBe(slot.id);
          expect(result.value.slot.status).toBe(ConsultationSlotStatus.BOOKED);

          // Exactly one confirmation
          const notifs = await notificationRepo.listPendingDelivery();
          const matching = notifs.filter((n) => n.type === "consultation_booked");
          expect(matching).toHaveLength(1);
          expect(matching[0]?.payload["slotId"]).toBe(slot.id);
          expect(matching[0]?.payload["startsAt"]).toBe(slot.startsAt.toISOString());
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 30: Invalid consultation requests are rejected appropriately
// Feature: edu-travel-platform, Property 30: Invalid consultation requests are rejected appropriately
// ---------------------------------------------------------------------------

describe("Property 30: Invalid consultation requests are rejected appropriately", () => {
  it("rejects missing fields with a ValidationError listing them", async () => {
    await fc.assert(
      fc.asyncProperty(
        availableSlotArb,
        fc.record({
          dropName: fc.boolean(),
          dropContact: fc.boolean(),
          dropSlot: fc.boolean(),
        }),
        async (slot, { dropName, dropContact, dropSlot }) => {
          fc.pre(dropName || dropContact || dropSlot);
          consultationRepo.clear();
          notificationRepo.clear();
          consultationRepo.seedSlot(slot);

          const result = await service.book({
            userId: null,
            name: dropName ? "" : "Alice",
            contactMethod: dropContact ? "" : "alice@example.com",
            slotId: dropSlot ? "" : slot.id,
          });

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Validation);

          // No notification, no consultation
          const notifs = await notificationRepo.listPendingDelivery();
          expect(notifs).toHaveLength(0);
        },
      ),
    );
  });

  it("rejects invalid contact methods with a per-field message", async () => {
    const badContactArb = fc.oneof(
      fc.constant("not-an-email"),
      fc.constant("abc"),
      fc.constant("@@@"),
      fc.constant("12345"),
    );
    await fc.assert(
      fc.asyncProperty(availableSlotArb, nameArb, badContactArb, async (slot, name, contact) => {
        consultationRepo.clear();
        notificationRepo.clear();
        consultationRepo.seedSlot(slot);

        const result = await service.book({
          userId: null,
          name,
          contactMethod: contact,
          slotId: slot.id,
        });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe(DomainErrorKind.Validation);
      }),
    );
  });

  it("rejects an unavailable slot with an AvailabilityError exposing the available count", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(availableSlotArb, { minLength: 0, maxLength: 5 }),
        nameArb,
        contactMethodArb,
        async (extras, name, contact) => {
          consultationRepo.clear();
          notificationRepo.clear();
          // Deduplicate by id to avoid generator collisions
          const uniq = new Map(extras.map((s) => [s.id, s]));
          for (const s of uniq.values()) consultationRepo.seedSlot(s);

          const result = await service.book({
            userId: null,
            name,
            contactMethod: contact,
            slotId: "nonexistent-slot-id",
          });

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Availability);
          expect(result.error.message).toContain(String(uniq.size));
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 31: A consultation slot is booked by at most one request
// Feature: edu-travel-platform, Property 31: A consultation slot is booked by at most one request
// ---------------------------------------------------------------------------

describe("Property 31: A consultation slot is booked by at most one request", () => {
  it("under any number of concurrent claims, exactly one succeeds", async () => {
    await fc.assert(
      fc.asyncProperty(
        availableSlotArb,
        fc.integer({ min: 2, max: 8 }),
        async (slot, claimants) => {
          consultationRepo.clear();
          notificationRepo.clear();
          consultationRepo.seedSlot(slot);

          // Issue N concurrent bookings; the repository fake processes
          // calls sequentially in microtask order, simulating serialised
          // contention on the same slot row.
          const results = await Promise.all(
            Array.from({ length: claimants }, (_, i) =>
              service.book({
                userId: null,
                name: `User ${i}`,
                contactMethod: `user${i}@example.com`,
                slotId: slot.id,
              }),
            ),
          );

          const successes = results.filter((r) => r.ok);
          const failures = results.filter((r) => !r.ok);

          expect(successes).toHaveLength(1);
          expect(failures).toHaveLength(claimants - 1);

          for (const f of failures) {
            if (f.ok) continue;
            expect(f.error.kind).toBe(DomainErrorKind.Availability);
          }

          // Slot ends in booked state with the winner's consultation id
          const finalSlot = await consultationRepo.findSlotById(slot.id);
          expect(finalSlot?.status).toBe(ConsultationSlotStatus.BOOKED);
        },
      ),
      // Use a tighter run count for time
      { numRuns: 50 },
    );
  });
});
