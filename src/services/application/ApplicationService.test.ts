/**
 * Property-based tests for ApplicationService.
 *
 * Feature: edu-travel-platform
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ApplicationService } from "./ApplicationService";
import type { SubmitApplicationInput } from "./ApplicationService";
import {
  InMemoryApplicationRepository,
  InMemoryProgramRepository,
  InMemoryNotificationRepository,
} from "@/test/fakes";
import { programArb, applicationStatusArb } from "@/test/arbitraries";
import { ApplicationStatus } from "@/domain";
import type { Program, Application } from "@/domain";
import { createActorContext } from "@/domain/kernel/actor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uuidArb = fc.uuid();

function makeActor(userId: string) {
  return createActorContext({
    userId,
    roles: ["STUDENT_TRAVELER"],
    accountStatus: "active",
    profileComplete: true,
    locale: "en",
  });
}

/** Generate a valid submission fields object. */
const validFieldsArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  phoneNumber: fc.string({ minLength: 5, maxLength: 20 }),
  additionalInfo: fc.string({ maxLength: 200 }),
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("ApplicationService", () => {
  let applicationRepo: InMemoryApplicationRepository;
  let programRepo: InMemoryProgramRepository;
  let notificationRepo: InMemoryNotificationRepository;
  let service: ApplicationService;

  beforeEach(() => {
    applicationRepo = new InMemoryApplicationRepository();
    programRepo = new InMemoryProgramRepository();
    notificationRepo = new InMemoryNotificationRepository();
    service = new ApplicationService({
      applicationRepo,
      programRepo,
      notificationRepo,
    });
  });

  // Feature: edu-travel-platform, Property 19: Valid application submission creates a Submitted record and one confirmation
  // **Validates: Requirements 4.1, 4.4**
  describe("Property 19: Valid application submission creates a Submitted record and one confirmation", () => {
    it("valid submission creates exactly one Application with status Submitted and enqueues exactly one confirmation notification", async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          programArb,
          validFieldsArb,
          async (studentId, program, fields) => {
            // Setup
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            programRepo.seed(program);

            const actor = makeActor(studentId);
            const input: SubmitApplicationInput = {
              studentId,
              programId: program.id,
              fields,
            };

            // Act
            const result = await service.submit(input, actor);

            // Assert: successful submission
            expect(result.ok).toBe(true);
            if (!result.ok) return;

            // Application has status "Submitted" and correct associations
            expect(result.value.status).toBe(ApplicationStatus.SUBMITTED);
            expect(result.value.studentId).toBe(studentId);
            expect(result.value.programId).toBe(program.id);

            // Exactly one application exists for this student+program
            const apps = await applicationRepo.listByStudent(studentId);
            const matching = apps.filter((a) => a.programId === program.id);
            expect(matching).toHaveLength(1);

            // Exactly one confirmation notification enqueued
            const notifications = await notificationRepo.listByUser(studentId);
            expect(notifications).toHaveLength(1);
            expect(notifications[0]!.type).toBe("application_submitted");
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 20: A Student may apply to many distinct Programs
  // **Validates: Requirements 4.2**
  describe("Property 20: A Student may apply to many distinct Programs", () => {
    it("a student can submit one application per distinct program, resulting in exactly one record per program", async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          fc.array(programArb, { minLength: 1, maxLength: 5 }).chain((programs) => {
            // Ensure unique program IDs
            const seen = new Set<string>();
            const unique: Program[] = programs.filter((p) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            return fc.constant(unique.length > 0 ? unique : [programs[0]!]);
          }),
          validFieldsArb,
          async (studentId, programs, fields) => {
            // Setup
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            for (const p of programs) programRepo.seed(p!);

            const actor = makeActor(studentId);

            // Act: submit to each distinct program
            for (const program of programs) {
              const result = await service.submit(
                { studentId, programId: program!.id, fields },
                actor,
              );
              expect(result.ok).toBe(true);
            }

            // Assert: exactly one application per distinct program
            const apps = await applicationRepo.listByStudent(studentId);
            expect(apps).toHaveLength(programs.length);

            const programIds = new Set(apps.map((a) => a.programId));
            expect(programIds.size).toBe(programs.length);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 21: Application uniqueness per Student-Program pair
  // **Validates: Requirements 4.5**
  describe("Property 21: Application uniqueness per Student-Program pair", () => {
    it("a second submission to the same program is rejected and creates no additional record", async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          programArb,
          validFieldsArb,
          validFieldsArb,
          async (studentId, program, fields1, fields2) => {
            // Setup
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            programRepo.seed(program);

            const actor = makeActor(studentId);

            // First submission succeeds
            const first = await service.submit(
              { studentId, programId: program.id, fields: fields1 },
              actor,
            );
            expect(first.ok).toBe(true);

            // Second submission to same program is rejected
            const second = await service.submit(
              { studentId, programId: program.id, fields: fields2 },
              actor,
            );
            expect(second.ok).toBe(false);
            if (!second.ok) {
              expect(second.error.kind).toBe("ConflictError");
            }

            // Still only one application record
            const apps = await applicationRepo.listByStudent(studentId);
            const matching = apps.filter((a) => a.programId === program.id);
            expect(matching).toHaveLength(1);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 22: Incomplete application submission is rejected without data loss
  // **Validates: Requirements 4.3**
  describe("Property 22: Incomplete application submission is rejected without data loss", () => {
    it("submission with missing required fields is rejected, no Application is created, and missing fields are reported", async () => {
      // Generate fields with at least one required field missing
      const incompleteFieldsArb = fc
        .record({
          fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
          phoneNumber: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
        })
        .filter((f) => {
          // At least one required field must be missing/undefined
          return f.fullName === undefined || f.email === undefined || f.phoneNumber === undefined;
        });

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          programArb,
          incompleteFieldsArb,
          async (studentId, program, fields) => {
            // Setup
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            programRepo.seed(program);

            const actor = makeActor(studentId);
            const input: SubmitApplicationInput = {
              studentId,
              programId: program.id,
              fields: fields as Readonly<Record<string, unknown>>,
            };

            // Act
            const result = await service.submit(input, actor);

            // Assert: rejected
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.error.kind).toBe("ValidationError");
              if (result.error.kind === "ValidationError") {
                // Missing fields are reported
                const reportedFields = result.error.issues.map((i) => i.field);
                if (fields.fullName === undefined) expect(reportedFields).toContain("fullName");
                if (fields.email === undefined) expect(reportedFields).toContain("email");
                if (fields.phoneNumber === undefined)
                  expect(reportedFields).toContain("phoneNumber");
              }
            }

            // No application was created
            const apps = await applicationRepo.listByStudent(studentId);
            expect(apps).toHaveLength(0);

            // No notification was sent
            const notifications = await notificationRepo.listByUser(studentId);
            expect(notifications).toHaveLength(0);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 27: A status change notifies exactly when the value changes
  // **Validates: Requirements 6.2, 10.4, 10.6**
  describe("Property 27: A status change notifies exactly when the value changes", () => {
    it("exactly one notification is enqueued iff new status differs from previous; same status enqueues none", async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          programArb,
          validFieldsArb,
          applicationStatusArb,
          applicationStatusArb,
          async (studentId, program, fields, initialStatus, newStatus) => {
            // Setup
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            programRepo.seed(program);

            const actor = makeActor(studentId);

            // Create application
            const submitResult = await service.submit(
              { studentId, programId: program.id, fields },
              actor,
            );
            expect(submitResult.ok).toBe(true);
            if (!submitResult.ok) return;

            const appId = submitResult.value.id;

            // Set to initialStatus first (if different from Submitted)
            if (initialStatus !== ApplicationStatus.SUBMITTED) {
              await applicationRepo.updateStatus(appId, initialStatus);
            }

            // Clear notifications from submission
            notificationRepo.clear();

            // Act: update to newStatus
            const effectiveOldStatus =
              initialStatus !== ApplicationStatus.SUBMITTED
                ? initialStatus
                : ApplicationStatus.SUBMITTED;

            const result = await service.updateStatus(appId, newStatus, actor);
            expect(result.ok).toBe(true);

            // Assert
            const notifications = await notificationRepo.listByUser(studentId);

            if (effectiveOldStatus === newStatus) {
              // Same status → no notification
              expect(notifications).toHaveLength(0);
            } else {
              // Different status → exactly one notification
              expect(notifications).toHaveLength(1);
              expect(notifications[0]!.type).toBe("application_status_change");
            }
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 28: Deadline reminders fire exactly once within the window
  // **Validates: Requirements 6.4**
  describe("Property 28: Deadline reminders fire exactly once within the window", () => {
    it("exactly one reminder for each application whose deadline is within window, and repeated runs produce no duplicates", async () => {
      // Generate a fixed "now" date and a window, then programs with deadlines relative to now
      const nowArb = fc.date({ min: new Date("2022-01-01"), max: new Date("2028-12-31") });

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 90 }),
          nowArb,
          fc.array(
            fc.record({
              program: programArb,
              studentId: uuidArb,
              /** Offset in days from 'now' for the deadline (0 = same day) */
              deadlineOffsetDays: fc.integer({ min: 0, max: 90 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          validFieldsArb,
          async (windowDays, now, entries, fields) => {
            // Use fresh service instance per property run
            applicationRepo.clear();
            programRepo.clear();
            notificationRepo.clear();
            const freshService = new ApplicationService({
              applicationRepo,
              programRepo,
              notificationRepo,
            });

            // Normalize 'now' to midday
            const normalizedNow = new Date(now.getTime());
            normalizedNow.setHours(12, 0, 0, 0);

            let expectedCount = 0;

            // Deduplicate program IDs to avoid conflicts in the repo
            const seenProgramIds = new Set<string>();

            for (const entry of entries) {
              if (seenProgramIds.has(entry.program.id)) continue;
              seenProgramIds.add(entry.program.id);

              // Set deadline relative to 'now'
              const deadline = new Date(normalizedNow.getTime());
              deadline.setHours(0, 0, 0, 0);
              deadline.setDate(deadline.getDate() + entry.deadlineOffsetDays);

              const programWithDeadline: Program = {
                ...entry.program,
                applicationDeadline: deadline,
                status: "published",
              };

              programRepo.seed(programWithDeadline);

              // Create application for this student+program
              await applicationRepo.create({
                studentId: entry.studentId,
                programId: programWithDeadline.id,
                recruiterId: null,
                submittedFields: fields,
              });

              // Count entries whose deadline is within the window
              if (entry.deadlineOffsetDays <= windowDays) {
                expectedCount++;
              }
            }

            // First run: should return exactly the applications with deadlines in the window
            const firstRun = await freshService.selectDeadlineReminders(
              windowDays,
              normalizedNow,
            );
            expect(firstRun.length).toBe(expectedCount);

            // Second run: should return NO candidates (idempotent)
            const secondRun = await freshService.selectDeadlineReminders(
              windowDays,
              normalizedNow,
            );
            expect(secondRun).toHaveLength(0);

            // Third run: still no duplicates
            const thirdRun = await freshService.selectDeadlineReminders(
              windowDays,
              normalizedNow,
            );
            expect(thirdRun).toHaveLength(0);
          },
        ),
      );
    });
  });
});
