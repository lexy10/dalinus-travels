import * as fc from "fast-check";
import type { Application } from "@/domain";
import { ApplicationStatus } from "@/domain";

const uuidArb = fc.uuid();
const timestampArb = fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") });

export const applicationStatusArb = fc.constantFrom(
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
);

export const applicationArb: fc.Arbitrary<Application> = fc.record({
  id: uuidArb,
  studentId: uuidArb,
  programId: uuidArb,
  recruiterId: fc.option(uuidArb, { nil: null }),
  status: applicationStatusArb,
  submittedFields: fc.constant({}),
  createdAt: timestampArb,
  statusUpdatedAt: timestampArb,
});

export const validStatusTransitionArb = fc
  .tuple(applicationStatusArb, applicationStatusArb)
  .filter(([from, to]) => from !== to);
