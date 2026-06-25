import * as fc from "fast-check";
import type { ConsultationSlot } from "@/domain";
import { ConsultationSlotStatus } from "@/domain";

const uuidArb = fc.uuid();

export const availableSlotArb: fc.Arbitrary<ConsultationSlot> = fc
  .tuple(
    uuidArb,
    fc.date({ min: new Date("2024-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
    fc.integer({ min: 30, max: 120 }),
  )
  .map(([id, start, durationMin]) => ({
    id,
    startsAt: start,
    endsAt: new Date(start.getTime() + durationMin * 60_000),
    status: ConsultationSlotStatus.AVAILABLE,
    bookedConsultationId: null,
  }));

export const bookedSlotArb: fc.Arbitrary<ConsultationSlot> = fc
  .tuple(
    uuidArb,
    fc.date({ min: new Date("2024-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
    fc.integer({ min: 30, max: 120 }),
    uuidArb,
  )
  .map(([id, start, durationMin, consultationId]) => ({
    id,
    startsAt: start,
    endsAt: new Date(start.getTime() + durationMin * 60_000),
    status: ConsultationSlotStatus.BOOKED,
    bookedConsultationId: consultationId,
  }));

export const contactMethodArb = fc.oneof(
  fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,6}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.stringMatching(/^[a-z]{2,4}$/),
  ).map(([l, d, t]) => `${l}@${d}.${t}`),
  fc.stringMatching(/^\+\d{7,15}$/),
);
