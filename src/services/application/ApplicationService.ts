/**
 * Application service: submission, uniqueness, status tracking,
 * status-change notifications, and deadline reminders.
 *
 * Covers:
 * - Application submission with validation and uniqueness (Req 4.1–4.5)
 * - Student application listing with status and deadline (Req 6.1, 6.3, 6.5)
 * - Status update with exactly-one notification on change (Req 6.2, 10.4, 10.6)
 * - Deadline reminder selection (Req 6.4)
 */
import type { Application, ApplicationStatus, Program, Timestamp } from "@/domain";
import { isApplicationStatus, notFoundError, conflictError, missingFieldsError } from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type { ApplicationRepository } from "@/ports/repositories/ApplicationRepository";
import type { ProgramRepository } from "@/ports/repositories/ProgramRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";

// ---------------------------------------------------------------------------
// Input / Output DTOs
// ---------------------------------------------------------------------------

export interface SubmitApplicationInput {
  readonly studentId: string;
  readonly programId: string;
  readonly fields: Readonly<Record<string, unknown>>;
}

/** Required fields that must be present (non-null, non-undefined) in submission. */
const REQUIRED_APPLICATION_FIELDS = ["fullName", "email", "phoneNumber"] as const;

export interface ApplicationWithDeadline {
  readonly application: Application;
  readonly programDeadline: Timestamp | null;
}

export interface DeadlineReminderCandidate {
  readonly application: Application;
  readonly program: Program;
}

// ---------------------------------------------------------------------------
// Service Dependencies
// ---------------------------------------------------------------------------

export interface ApplicationServiceDeps {
  readonly applicationRepo: ApplicationRepository;
  readonly programRepo: ProgramRepository;
  readonly notificationRepo: NotificationRepository;
}

// ---------------------------------------------------------------------------
// Service Implementation
// ---------------------------------------------------------------------------

export class ApplicationService {
  private readonly applicationRepo: ApplicationRepository;
  private readonly programRepo: ProgramRepository;
  private readonly notificationRepo: NotificationRepository;

  /** Tracks (applicationId, deadline) pairs for which a reminder has been sent. */
  private readonly remindersSent = new Set<string>();

  constructor(deps: ApplicationServiceDeps) {
    this.applicationRepo = deps.applicationRepo;
    this.programRepo = deps.programRepo;
    this.notificationRepo = deps.notificationRepo;
  }

  // -------------------------------------------------------------------------
  // submit (Req 4.1–4.5)
  // -------------------------------------------------------------------------

  /**
   * Submit an application.
   * - Validates required fields present (Req 4.3)
   * - Rejects duplicate student+program (Req 4.5)
   * - Creates Application with status "Submitted" (Req 4.1)
   * - Enqueues one confirmation notification (Req 4.4)
   */
  async submit(
    input: SubmitApplicationInput,
    _actor: ActorContext,
  ): Promise<Result<Application, DomainError>> {
    // Validate required fields
    const missingFields: string[] = [];
    for (const field of REQUIRED_APPLICATION_FIELDS) {
      const value = input.fields[field];
      if (value === undefined || value === null || value === "") {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      return err(missingFieldsError(missingFields));
    }

    // Check program exists
    const program = await this.programRepo.findById(input.programId);
    if (!program) {
      return err(notFoundError("Program not found.", "Program"));
    }

    // Attempt to create (uniqueness enforced by repository)
    const createResult = await this.applicationRepo.create({
      studentId: input.studentId,
      programId: input.programId,
      recruiterId: null,
      submittedFields: input.fields,
    });

    if (!createResult.ok) {
      return createResult;
    }

    // Enqueue confirmation notification (Req 4.4)
    const email =
      typeof input.fields["email"] === "string" ? input.fields["email"] : "unknown@example.com";

    await this.notificationRepo.create({
      userId: input.studentId,
      channel: "email",
      type: "application_submitted",
      payload: {
        applicationId: createResult.value.id,
        programId: input.programId,
        programTitle: program.title,
      },
      recipientEmail: email,
    });

    return createResult;
  }

  // -------------------------------------------------------------------------
  // listByStudent (Req 6.1, 6.3, 6.5)
  // -------------------------------------------------------------------------

  /**
   * List applications for a student with current status + program deadline.
   */
  async listByStudent(studentId: string): Promise<readonly ApplicationWithDeadline[]> {
    const applications = await this.applicationRepo.listByStudent(studentId);
    const results: ApplicationWithDeadline[] = [];

    for (const application of applications) {
      const program = await this.programRepo.findById(application.programId);
      results.push({
        application,
        programDeadline: program?.applicationDeadline ?? null,
      });
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // updateStatus (Req 6.2, 10.4, 10.6)
  // -------------------------------------------------------------------------

  /**
   * Update application status.
   * - If status changed, enqueue exactly ONE notification (Req 6.2, 10.4)
   * - Same status = no notification (Req 10.6)
   */
  async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    _actor: ActorContext,
  ): Promise<Result<Application, DomainError>> {
    // Validate status value
    if (!isApplicationStatus(newStatus)) {
      return err(
        missingFieldsError(["status"], `"${String(newStatus)}" is not a valid application status.`),
      );
    }

    const existing = await this.applicationRepo.findById(applicationId);
    if (!existing) {
      return err(notFoundError("Application not found.", "Application"));
    }

    const previousStatus = existing.status;

    // Same status → no-op, no notification (Req 10.6)
    if (previousStatus === newStatus) {
      return ok(existing);
    }

    // Update status
    const updateResult = await this.applicationRepo.updateStatus(applicationId, newStatus);
    if (!updateResult.ok) {
      return updateResult;
    }

    // Enqueue exactly one status-change notification (Req 6.2, 10.4)
    await this.notificationRepo.create({
      userId: existing.studentId,
      channel: "email",
      type: "application_status_change",
      payload: {
        applicationId,
        previousStatus,
        newStatus,
      },
      recipientEmail: "", // Will be resolved by NotificationService
    });

    return updateResult;
  }

  // -------------------------------------------------------------------------
  // selectDeadlineReminders (Req 6.4)
  // -------------------------------------------------------------------------

  /**
   * Pure logic selecting applications due for a deadline reminder.
   * Records idempotent marker so re-runs don't duplicate.
   *
   * @param windowDays 0–90 whole days. 0 = deadline day.
   * @param now Current timestamp.
   * @returns Applications whose deadline is within the window that haven't
   *          already been reminded.
   */
  async selectDeadlineReminders(
    windowDays: number,
    now: Date,
  ): Promise<readonly DeadlineReminderCandidate[]> {
    // Calculate the deadline range: from `now` to `now + windowDays`
    const from = new Date(now.getTime());
    from.setHours(0, 0, 0, 0);

    const to = new Date(from.getTime());
    to.setDate(to.getDate() + windowDays);
    to.setHours(23, 59, 59, 999);

    // Find programs with deadlines within the window
    const programs = await this.programRepo.listWithDeadlineBetween(from, to);

    const candidates: DeadlineReminderCandidate[] = [];

    for (const program of programs) {
      if (!program.applicationDeadline) continue;

      const applications = await this.applicationRepo.listByProgram(program.id);

      for (const application of applications) {
        const reminderKey = `${application.id}:${program.applicationDeadline.toISOString()}`;

        // Idempotent: skip if already reminded
        if (this.remindersSent.has(reminderKey)) {
          continue;
        }

        // Mark as reminded
        this.remindersSent.add(reminderKey);
        candidates.push({ application, program });
      }
    }

    return candidates;
  }

  /** Check if a reminder has already been sent for this application+deadline pair. */
  hasReminderBeenSent(applicationId: string, deadline: Timestamp): boolean {
    const key = `${applicationId}:${deadline.toISOString()}`;
    return this.remindersSent.has(key);
  }
}
