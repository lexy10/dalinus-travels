import * as fc from "fast-check";
import type { Destination, Program, TourPackage } from "@/domain";
import { DestinationKind, DeliveryMode, PublicationStatus } from "@/domain";

const uuidArb = fc.uuid();
const timestampArb = fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") });

export const destinationKindArb = fc.constantFrom<[typeof DestinationKind.STUDY, typeof DestinationKind.TRAVEL]>(
  DestinationKind.STUDY,
  DestinationKind.TRAVEL,
);

export const destinationArb: fc.Arbitrary<Destination> = fc.record({
  id: uuidArb,
  kind: destinationKindArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  country: fc.string({ minLength: 1, maxLength: 50 }),
  costOfLiving: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  visaInfo: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  destinationGuide: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  publishedAt: fc.option(timestampArb, { nil: null }),
});

export const programArb: fc.Arbitrary<Program> = fc.record({
  id: uuidArb,
  partnerId: uuidArb,
  destinationId: uuidArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  institutionName: fc.string({ minLength: 1, maxLength: 100 }),
  studyLevel: fc.constantFrom("Undergraduate", "Postgraduate", "PhD", "Diploma"),
  fieldOfStudy: fc.string({ minLength: 1, maxLength: 80 }),
  durationMonths: fc.integer({ min: 1, max: 60 }),
  tuitionMinor: fc.nat({ max: 100_000_000 }),
  tuitionCurrency: fc.constantFrom("USD", "GBP", "EUR", "NGN"),
  intakeDates: fc.array(timestampArb, { minLength: 0, maxLength: 4 }),
  entryRequirements: fc.string({ minLength: 1, maxLength: 500 }),
  applicationDeadline: fc.option(timestampArb, { nil: null }),
  deliveryMode: fc.constantFrom(DeliveryMode.ON_CAMPUS, DeliveryMode.ONLINE),
  status: fc.constantFrom(PublicationStatus.DRAFT, PublicationStatus.PUBLISHED),
  createdAt: timestampArb,
});

export const tourPackageArb: fc.Arbitrary<TourPackage> = fc.record({
  id: uuidArb,
  destinationId: uuidArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  itinerary: fc.string({ minLength: 1, maxLength: 1000 }),
  durationDays: fc.integer({ min: 1, max: 90 }),
  inclusions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  priceMinor: fc.nat({ max: 50_000_000 }),
  priceCurrency: fc.constantFrom("USD", "GBP", "EUR", "NGN"),
  totalCapacity: fc.integer({ min: 1, max: 200 }),
  availabilityCount: fc.integer({ min: 0, max: 200 }),
  status: fc.constantFrom(PublicationStatus.DRAFT, PublicationStatus.PUBLISHED),
  createdAt: timestampArb,
});
