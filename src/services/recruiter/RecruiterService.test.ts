/**
 * Property-based tests for RecruiterService.
 *
 * Covers Properties 32–36 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { RecruiterService } from "./RecruiterService";
import { InMemoryRecruiterRepository } from "@/test/fakes/repositories/InMemoryRecruiterRepository";
import { InMemoryApplicationRepository } from "@/test/fakes/repositories/InMemoryApplicationRepository";
import { InMemoryLeadRepository } from "@/test/fakes/repositories/InMemoryLeadRepository";
import { InMemoryNotificationRepository } from "@/test/fakes/repositories/InMemoryNotificationRepository";
import {
  AccountStatus,
  ALL_APPLICATION_STATUSES,
  ApplicationStatus,
  LeadSource,
  LeadStatus,
  RecruiterStatus,
  Role,
} from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";

let recruiterRepo: InMemoryRecruiterRepository;
let applicationRepo: InMemoryApplicationRepository;
let leadRepo: InMemoryLeadRepository;
let notificationRepo: InMemoryNotificationRepository;
let service: RecruiterService;

beforeEach(() => {
  recruiterRepo = new InMemoryRecruiterRepository();
  applicationRepo = new InMemoryApplicationRepository();
  leadRepo = new InMemoryLeadRepository();
  notificationRepo = new InMemoryNotificationRepository();
  service = new RecruiterService({
    recruiterRepo,
    applicationRepo,
    leadRepo,
    notificationRepo,
  });
});

const adminActor: ActorContext = {
  userId: "admin-1",
  roles: new Set([Role.ADMINISTRATOR]),
  accountStatus: AccountStatus.ACTIVE,
  profileComplete: true,
  locale: "en",
};

function recruiterActor(userId: string): ActorContext {
  return {
    userId,
    roles: new Set([Role.RECRUITER]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
}

const companyArb = fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim() !== "");
const idArb = fc.uuid();
const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.stringMatching(/^[a-z]{2,4}$/),
  )
  .map(([l, d, t]) => `${l}@${d}.${t}`);

// ---------------------------------------------------------------------------
// Property 32: Valid recruiter application creates a pending account
// Feature: edu-travel-platform, Property 32: Valid recruiter application creates a pending account with confirmation
// ---------------------------------------------------------------------------

describe("Property 32: Valid recruiter application creates a pending account with confirmation", () => {
  it("creates a pending recruiter and one confirmation", async () => {
    await fc.assert(
      fc.asyncProperty(idArb, companyArb, emailArb, async (userId, company, email) => {
        recruiterRepo.clear();
        notificationRepo.clear();

        const result = await service.applyAsRecruiter({
          userId,
          companyName: company,
          applicantEmail: email,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.status).toBe(RecruiterStatus.PENDING);
        expect(result.value.userId).toBe(userId);

        const notifs = await notificationRepo.listPendingDelivery();
        const matching = notifs.filter((n) => n.type === "recruiter_application_received");
        expect(matching).toHaveLength(1);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 33: Incomplete recruiter and sub-agent registrations are rejected
// Feature: edu-travel-platform, Property 33: Incomplete recruiter and sub-agent registrations are rejected
// ---------------------------------------------------------------------------

describe("Property 33: Incomplete recruiter and sub-agent registrations are rejected", () => {
  it("rejects recruiter application with missing fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dropUser: fc.boolean(),
          dropCompany: fc.boolean(),
          dropEmail: fc.boolean(),
        }),
        async ({ dropUser, dropCompany, dropEmail }) => {
          fc.pre(dropUser || dropCompany || dropEmail);
          recruiterRepo.clear();

          const result = await service.applyAsRecruiter({
            userId: dropUser ? "" : "u-1",
            companyName: dropCompany ? "" : "Acme",
            applicantEmail: dropEmail ? "" : "a@b.co",
          });

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Validation);
        },
      ),
    );
  });

  it("rejects sub-agent registration with missing fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ dropUser: fc.boolean(), dropCompany: fc.boolean() }),
        async ({ dropUser, dropCompany }) => {
          fc.pre(dropUser || dropCompany);
          recruiterRepo.clear();

          const apply = await service.applyAsRecruiter({
            userId: "manager-user",
            companyName: "Manager Co",
            applicantEmail: "m@x.co",
          });
          expect(apply.ok).toBe(true);
          if (!apply.ok) return;

          // Approve so recruiter can register sub-agents
          await service.approveRecruiter(apply.value.id, adminActor);

          const result = await service.registerSubAgent(
            {
              managerRecruiterId: apply.value.id,
              subAgentUserId: dropUser ? "" : "sub-1",
              companyName: dropCompany ? "" : "Sub Co",
            },
            recruiterActor("manager-user"),
          );

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Validation);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 34: Recruiter approval and rejection produce the correct terminal state
// Feature: edu-travel-platform, Property 34: Recruiter approval and rejection produce the correct terminal state
// ---------------------------------------------------------------------------

describe("Property 34: Recruiter approval and rejection produce the correct terminal state", () => {
  it("approval → ACTIVE; rejection → REJECTED with notifications", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb,
        companyArb,
        emailArb,
        fc.boolean(),
        async (userId, company, email, approveIt) => {
          recruiterRepo.clear();
          notificationRepo.clear();

          const apply = await service.applyAsRecruiter({
            userId,
            companyName: company,
            applicantEmail: email,
          });
          expect(apply.ok).toBe(true);
          if (!apply.ok) return;

          const decision = approveIt
            ? await service.approveRecruiter(apply.value.id, adminActor)
            : await service.rejectRecruiter(apply.value.id, adminActor);

          expect(decision.ok).toBe(true);
          if (!decision.ok) return;
          expect(decision.value.status).toBe(
            approveIt ? RecruiterStatus.ACTIVE : RecruiterStatus.REJECTED,
          );

          const notifs = await notificationRepo.listPendingDelivery();
          const decisionType = approveIt
            ? "recruiter_application_approved"
            : "recruiter_application_rejected";
          expect(notifs.some((n) => n.type === decisionType)).toBe(true);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 35: Recruiters see only their attributed Leads and Applications
// Feature: edu-travel-platform, Property 35: Recruiters see only their attributed Leads and Applications
// ---------------------------------------------------------------------------

describe("Property 35: Recruiters see only their attributed Leads and Applications", () => {
  it("scoped view contains exactly own records", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            leadOwner: fc.constantFrom("A", "B"),
            appOwner: fc.constantFrom("A", "B", null),
          }),
          { minLength: 1, maxLength: 12 },
        ),
        async (entries) => {
          recruiterRepo.clear();
          leadRepo.clear();
          applicationRepo.clear();
          notificationRepo.clear();

          const recA = await service.applyAsRecruiter({
            userId: "user-A",
            companyName: "A Co",
            applicantEmail: "a@x.co",
          });
          const recB = await service.applyAsRecruiter({
            userId: "user-B",
            companyName: "B Co",
            applicantEmail: "b@x.co",
          });
          if (!recA.ok || !recB.ok) return;
          await service.approveRecruiter(recA.value.id, adminActor);
          await service.approveRecruiter(recB.value.id, adminActor);

          const recIdFor = (o: "A" | "B") => (o === "A" ? recA.value.id : recB.value.id);

          // Seed leads and applications attributed to A, B, or neither
          for (let i = 0; i < entries.length; i++) {
            const e = entries[i]!;
            await leadRepo.create({
              source: LeadSource.RECRUITER,
              name: `n-${i}`,
              email: `n${i}@x.co`,
              message: null,
              attributedRecruiterId: recIdFor(e.leadOwner),
              attributedPartnerId: null,
            });
            await applicationRepo.create({
              studentId: `s-${i}`,
              programId: `p-${i}`,
              recruiterId: e.appOwner === null ? null : recIdFor(e.appOwner),
              submittedFields: { email: `s${i}@x.co` },
            });
          }

          const scopedA = await service.listScopedData(recA.value.id, recruiterActor("user-A"));
          expect(scopedA.ok).toBe(true);
          if (!scopedA.ok) return;

          const expectedLeadsA = entries.filter((e) => e.leadOwner === "A").length;
          const expectedAppsA = entries.filter((e) => e.appOwner === "A").length;
          expect(scopedA.value.leads).toHaveLength(expectedLeadsA);
          expect(scopedA.value.applications).toHaveLength(expectedAppsA);
          for (const l of scopedA.value.leads) {
            expect(l.attributedRecruiterId).toBe(recA.value.id);
          }
          for (const a of scopedA.value.applications) {
            expect(a.recruiterId).toBe(recA.value.id);
          }
        },
      ),
      { numRuns: 30 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 36: Sub-agent registration links to the registering Recruiter
// Feature: edu-travel-platform, Property 36: Sub-agent registration links to the registering Recruiter
// ---------------------------------------------------------------------------

describe("Property 36: Sub-agent registration links to the registering Recruiter", () => {
  it("created sub-agent's manager reference equals the registering recruiter", async () => {
    await fc.assert(
      fc.asyncProperty(idArb, companyArb, async (subUser, subCompany) => {
        recruiterRepo.clear();

        const apply = await service.applyAsRecruiter({
          userId: "manager-u",
          companyName: "Mgr",
          applicantEmail: "m@x.co",
        });
        if (!apply.ok) return;
        await service.approveRecruiter(apply.value.id, adminActor);

        const sub = await service.registerSubAgent(
          {
            managerRecruiterId: apply.value.id,
            subAgentUserId: subUser,
            companyName: subCompany,
          },
          recruiterActor("manager-u"),
        );

        expect(sub.ok).toBe(true);
        if (!sub.ok) return;
        expect(sub.value.managerRecruiterId).toBe(apply.value.id);

        const subAgents = await recruiterRepo.listSubAgents(apply.value.id);
        expect(subAgents.some((r) => r.id === sub.value.id)).toBe(true);
      }),
    );
  });
});

// Reference imports to keep them used (rare lint trip)
void ALL_APPLICATION_STATUSES;
void ApplicationStatus;
void LeadStatus;
