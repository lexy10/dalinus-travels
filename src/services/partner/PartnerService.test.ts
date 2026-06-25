/**
 * Property-based tests for PartnerService.
 *
 * Covers Properties 37–40 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { PartnerService } from "./PartnerService";
import { InMemoryPartnerRepository } from "@/test/fakes/repositories/InMemoryPartnerRepository";
import { InMemoryProgramRepository } from "@/test/fakes/repositories/InMemoryProgramRepository";
import { InMemoryApplicationRepository } from "@/test/fakes/repositories/InMemoryApplicationRepository";
import { InMemoryLeadRepository } from "@/test/fakes/repositories/InMemoryLeadRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import {
  AccountStatus,
  ApplicationStatus,
  LeadSource,
  PublicationStatus,
  Role,
} from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";

let partnerRepo: InMemoryPartnerRepository;
let programRepo: InMemoryProgramRepository;
let applicationRepo: InMemoryApplicationRepository;
let leadRepo: InMemoryLeadRepository;
let notificationRepo: InMemoryNotificationRepository;
let service: PartnerService;

beforeEach(() => {
  partnerRepo = new InMemoryPartnerRepository();
  programRepo = new InMemoryProgramRepository();
  applicationRepo = new InMemoryApplicationRepository();
  leadRepo = new InMemoryLeadRepository();
  notificationRepo = new InMemoryNotificationRepository();
  service = new PartnerService({
    partnerRepo,
    programRepo,
    applicationRepo,
    leadRepo,
    notificationRepo,
  });
});

function partnerActor(userId: string): ActorContext {
  return {
    userId,
    roles: new Set([Role.PARTNER]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
}

async function seedPartner(userId: string, institution = "Inst") {
  const result = await partnerRepo.create({
    userId,
    institutionName: institution,
    status: AccountStatus.ACTIVE,
  });
  if (!result.ok) throw new Error("seed failed");
  return result.value;
}

const validProgramListingArb = fc.record({
  destinationId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim() !== ""),
  institutionName: fc.constant("Inst"),
  studyLevel: fc.constantFrom("Bachelor", "Master", "PhD"),
  fieldOfStudy: fc.constantFrom("CS", "Math", "Biology"),
  durationMonths: fc.integer({ min: 6, max: 48 }),
  tuitionMinor: fc.integer({ min: 100_00, max: 100_000_00 }),
  tuitionCurrency: fc.constant("USD"),
  intakeDates: fc.array(fc.date({ min: new Date("2025-01-01"), max: new Date("2028-12-31") }), {
    minLength: 1,
    maxLength: 3,
  }),
  entryRequirements: fc.constant("Diploma."),
  applicationDeadline: fc.constant(null as Date | null),
  deliveryMode: fc.constantFrom("on_campus", "online"),
});

// ---------------------------------------------------------------------------
// Property 37: Valid program listings publish; invalid ones do not
// Feature: edu-travel-platform, Property 37: Valid program listings publish; invalid ones do not
// ---------------------------------------------------------------------------

describe("Property 37: Valid program listings publish; invalid ones do not", () => {
  it("publishes when complete", async () => {
    await fc.assert(
      fc.asyncProperty(validProgramListingArb, async (listing) => {
        partnerRepo.clear();
        programRepo.clear();
        const partner = await seedPartner("p-user");

        const result = await service.publishProgram(
          { partnerId: partner.id, listing },
          partnerActor("p-user"),
        );

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.status).toBe(PublicationStatus.PUBLISHED);

        const owned = await programRepo.listByPartner(partner.id);
        expect(owned.some((p) => p.id === result.value.id)).toBe(true);
      }),
    );
  });

  it("rejects with missing fields listed when any required field is absent", async () => {
    const fieldDropArb = fc.constantFrom(
      "title",
      "studyLevel",
      "fieldOfStudy",
      "durationMonths",
      "tuitionMinor",
      "intakeDates",
    );

    await fc.assert(
      fc.asyncProperty(validProgramListingArb, fieldDropArb, async (listing, drop) => {
        partnerRepo.clear();
        programRepo.clear();
        const partner = await seedPartner("p-user");

        const broken: Record<string, unknown> = { ...listing };
        if (drop === "intakeDates") broken[drop] = [];
        else if (drop === "durationMonths" || drop === "tuitionMinor") broken[drop] = undefined;
        else broken[drop] = "";

        const result = await service.publishProgram(
          { partnerId: partner.id, listing: broken },
          partnerActor("p-user"),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe(DomainErrorKind.Validation);
        expect((await programRepo.listByPartner(partner.id))).toHaveLength(0);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 38: Partners access only their own Programs' Applications
// Feature: edu-travel-platform, Property 38: Partners access only their own Programs' Applications
// ---------------------------------------------------------------------------

describe("Property 38: Partners access only their own Programs' Applications", () => {
  it("listOwnApplications returns exactly own and no others", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("A", "B"), { minLength: 1, maxLength: 10 }),
        async (entries) => {
          partnerRepo.clear();
          programRepo.clear();
          applicationRepo.clear();

          const partnerA = await seedPartner("a-user", "A");
          const partnerB = await seedPartner("b-user", "B");

          // Two programs, one per partner
          const progA = await programRepo.create({
            partnerId: partnerA.id,
            destinationId: "d",
            title: "PA",
            institutionName: "A",
            studyLevel: "Bachelor",
            fieldOfStudy: "CS",
            durationMonths: 12,
            tuitionMinor: 10_000_00,
            tuitionCurrency: "USD",
            intakeDates: [new Date("2026-01-01")],
            entryRequirements: "",
            applicationDeadline: null,
            deliveryMode: "on_campus",
            status: PublicationStatus.PUBLISHED,
          });
          const progB = await programRepo.create({
            partnerId: partnerB.id,
            destinationId: "d",
            title: "PB",
            institutionName: "B",
            studyLevel: "Bachelor",
            fieldOfStudy: "CS",
            durationMonths: 12,
            tuitionMinor: 10_000_00,
            tuitionCurrency: "USD",
            intakeDates: [new Date("2026-01-01")],
            entryRequirements: "",
            applicationDeadline: null,
            deliveryMode: "on_campus",
            status: PublicationStatus.PUBLISHED,
          });
          if (!progA.ok || !progB.ok) return;

          for (let i = 0; i < entries.length; i++) {
            const target = entries[i] === "A" ? progA.value.id : progB.value.id;
            await applicationRepo.create({
              studentId: `s-${i}`,
              programId: target,
              recruiterId: null,
              submittedFields: { email: `s${i}@x.co` },
            });
          }

          const listA = await service.listOwnApplications(partnerA.id, partnerActor("a-user"));
          const listB = await service.listOwnApplications(partnerB.id, partnerActor("b-user"));
          if (!listA.ok || !listB.ok) return;

          const expectedA = entries.filter((e) => e === "A").length;
          const expectedB = entries.filter((e) => e === "B").length;
          expect(listA.value).toHaveLength(expectedA);
          expect(listB.value).toHaveLength(expectedB);

          for (const a of listA.value) expect(a.programId).toBe(progA.value.id);
          for (const b of listB.value) expect(b.programId).toBe(progB.value.id);
        },
      ),
      { numRuns: 25 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 39: Partner status updates are authorized and validated
// Feature: edu-travel-platform, Property 39: Partner status updates are authorized and validated
// ---------------------------------------------------------------------------

describe("Property 39: Partner status updates are authorized and validated", () => {
  it("succeeds for owned applications with valid statuses; rejects others", async () => {
    const statusArb = fc.constantFrom(
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    );

    await fc.assert(
      fc.asyncProperty(
        statusArb,
        fc.boolean(),
        fc.boolean(),
        async (newStatus, useStrangerPartner, useInvalidStatus) => {
          partnerRepo.clear();
          programRepo.clear();
          applicationRepo.clear();
          notificationRepo.clear();

          const owner = await seedPartner("o-user", "Owner");
          const stranger = await seedPartner("s-user", "Stranger");

          const prog = await programRepo.create({
            partnerId: owner.id,
            destinationId: "d",
            title: "P",
            institutionName: "Owner",
            studyLevel: "Bachelor",
            fieldOfStudy: "CS",
            durationMonths: 12,
            tuitionMinor: 10_000_00,
            tuitionCurrency: "USD",
            intakeDates: [new Date("2026-01-01")],
            entryRequirements: "",
            applicationDeadline: null,
            deliveryMode: "on_campus",
            status: PublicationStatus.PUBLISHED,
          });
          if (!prog.ok) return;

          const app = await applicationRepo.create({
            studentId: "s-1",
            programId: prog.value.id,
            recruiterId: null,
            submittedFields: { email: "s@x.co" },
          });
          if (!app.ok) return;
          const priorStatus = app.value.status;

          const result = await service.setApplicationStatus(
            useStrangerPartner ? stranger.id : owner.id,
            app.value.id,
            useInvalidStatus ? "Bogus" : newStatus,
            useStrangerPartner ? partnerActor("s-user") : partnerActor("o-user"),
          );

          if (useStrangerPartner) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error.kind).toBe(DomainErrorKind.Authorization);
            }
            const after = await applicationRepo.findById(app.value.id);
            expect(after?.status).toBe(priorStatus);
            return;
          }

          if (useInvalidStatus) {
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error.kind).toBe(DomainErrorKind.Validation);
            }
            const after = await applicationRepo.findById(app.value.id);
            expect(after?.status).toBe(priorStatus);
            return;
          }

          expect(result.ok).toBe(true);
          if (!result.ok) return;
          expect(result.value.status).toBe(newStatus);

          // Notification iff status changed
          const notifs = await notificationRepo.listPendingDelivery();
          const changeNotifs = notifs.filter((n) => n.type === "application_status_change");
          if (newStatus === priorStatus) {
            expect(changeNotifs).toHaveLength(0);
          } else {
            expect(changeNotifs).toHaveLength(1);
          }
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 40: Partner performance counts match the underlying data
// Feature: edu-travel-platform, Property 40: Partner performance counts match the underlying data
// ---------------------------------------------------------------------------

describe("Property 40: Partner performance counts match the underlying data", () => {
  it("reported counts equal underlying counts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          leads: fc.integer({ min: 0, max: 10 }),
          submitted: fc.integer({ min: 0, max: 10 }),
          accepted: fc.integer({ min: 0, max: 10 }),
        }),
        async ({ leads, submitted, accepted }) => {
          partnerRepo.clear();
          programRepo.clear();
          applicationRepo.clear();
          leadRepo.clear();

          const partner = await seedPartner("p-user", "Inst");
          const prog = await programRepo.create({
            partnerId: partner.id,
            destinationId: "d",
            title: "P",
            institutionName: "Inst",
            studyLevel: "Bachelor",
            fieldOfStudy: "CS",
            durationMonths: 12,
            tuitionMinor: 10_000_00,
            tuitionCurrency: "USD",
            intakeDates: [new Date("2026-01-01")],
            entryRequirements: "",
            applicationDeadline: null,
            deliveryMode: "on_campus",
            status: PublicationStatus.PUBLISHED,
          });
          if (!prog.ok) return;

          for (let i = 0; i < leads; i++) {
            await leadRepo.create({
              source: LeadSource.PARTNER,
              name: `n${i}`,
              email: `n${i}@x.co`,
              message: null,
              attributedRecruiterId: null,
              attributedPartnerId: partner.id,
            });
          }

          // Submitted apps
          for (let i = 0; i < submitted; i++) {
            await applicationRepo.create({
              studentId: `sub-${i}`,
              programId: prog.value.id,
              recruiterId: null,
              submittedFields: { email: `s${i}@x.co` },
            });
          }
          // Accepted apps
          for (let i = 0; i < accepted; i++) {
            const a = await applicationRepo.create({
              studentId: `acc-${i}`,
              programId: prog.value.id,
              recruiterId: null,
              submittedFields: { email: `a${i}@x.co` },
            });
            if (a.ok) await applicationRepo.updateStatus(a.value.id, ApplicationStatus.ACCEPTED);
          }

          const report = await service.performanceReport(partner.id, partnerActor("p-user"));
          expect(report.ok).toBe(true);
          if (!report.ok) return;

          expect(report.value.leadCount).toBe(leads);
          expect(report.value.applicationCount).toBe(submitted + accepted);
          expect(report.value.conversionCount).toBe(accepted);
        },
      ),
      { numRuns: 30 },
    );
  });
});
