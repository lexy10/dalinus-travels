/**
 * PartnerService — partner program publishing, ownership-scoped application
 * access, application status updates, and performance reporting.
 *
 * Covers Req 10.1–10.7.
 */
import type { Application, Program } from "@/domain";
import {
  ApplicationStatus,
  PublicationStatus,
  isApplicationStatus,
  missingFieldsError,
  notFoundError,
  validationError,
} from "@/domain";
import type { Result, DomainError, AuthorizationError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type { PartnerRepository } from "@/ports/repositories/PartnerRepository";
import type {
  ProgramRepository,
  CreateProgramInput,
} from "@/ports/repositories/ProgramRepository";
import type { ApplicationRepository } from "@/ports/repositories/ApplicationRepository";
import type { LeadRepository } from "@/ports/repositories/LeadRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";

const REQUIRED_PROGRAM_FIELDS: readonly (keyof CreateProgramInput)[] = [
  "title",
  "studyLevel",
  "fieldOfStudy",
  "durationMonths",
  "tuitionMinor",
  "intakeDates",
];

export interface PublishProgramInput {
  readonly partnerId: string;
  readonly listing: Partial<CreateProgramInput>;
}

export interface PartnerServiceDeps {
  readonly partnerRepo: PartnerRepository;
  readonly programRepo: ProgramRepository;
  readonly applicationRepo: ApplicationRepository;
  readonly leadRepo: LeadRepository;
  readonly notificationRepo: NotificationRepository;
}

export interface PartnerPerformanceReport {
  readonly partnerId: string;
  readonly leadCount: number;
  readonly applicationCount: number;
  /** Applications whose status is `ACCEPTED`. */
  readonly conversionCount: number;
}

/** Application statuses considered terminal "accepted" outcomes for reporting. */
const ACCEPTED_STATUSES: readonly ApplicationStatus[] = [ApplicationStatus.ACCEPTED];

export class PartnerService {
  private readonly partnerRepo: PartnerRepository;
  private readonly programRepo: ProgramRepository;
  private readonly applicationRepo: ApplicationRepository;
  private readonly leadRepo: LeadRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor(deps: PartnerServiceDeps) {
    this.partnerRepo = deps.partnerRepo;
    this.programRepo = deps.programRepo;
    this.applicationRepo = deps.applicationRepo;
    this.leadRepo = deps.leadRepo;
    this.notificationRepo = deps.notificationRepo;
  }

  // -------------------------------------------------------------------------
  // publishProgram (Req 10.1, 10.2)
  // -------------------------------------------------------------------------

  async publishProgram(
    input: PublishProgramInput,
    actor: ActorContext,
  ): Promise<Result<Program, DomainError>> {
    const partner = await this.partnerRepo.findById(input.partnerId);
    if (!partner) return err(notFoundError("Partner not found.", "Partner"));
    const ownership = this.assertOwnsPartner(actor, partner.userId);
    if (!ownership.ok) return ownership;

    const listing = input.listing ?? {};
    const missing: string[] = [];
    for (const field of REQUIRED_PROGRAM_FIELDS) {
      const value = listing[field];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) missing.push(String(field));
    }
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    return this.programRepo.create({
      partnerId: input.partnerId,
      destinationId: listing.destinationId ?? "",
      title: listing.title!,
      institutionName: listing.institutionName ?? partner.institutionName,
      studyLevel: listing.studyLevel!,
      fieldOfStudy: listing.fieldOfStudy!,
      durationMonths: listing.durationMonths!,
      tuitionMinor: listing.tuitionMinor!,
      tuitionCurrency: listing.tuitionCurrency ?? "USD",
      intakeDates: listing.intakeDates!,
      entryRequirements: listing.entryRequirements ?? "",
      applicationDeadline: listing.applicationDeadline ?? null,
      deliveryMode: listing.deliveryMode ?? "on_campus",
      status: PublicationStatus.PUBLISHED,
    });
  }

  // -------------------------------------------------------------------------
  // listOwnApplications (Req 10.3)
  // -------------------------------------------------------------------------

  async listOwnApplications(
    partnerId: string,
    actor: ActorContext,
  ): Promise<Result<readonly Application[], DomainError>> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) return err(notFoundError("Partner not found.", "Partner"));
    const ownership = this.assertOwnsPartner(actor, partner.userId);
    if (!ownership.ok) return ownership;

    const apps = await this.collectApplicationsForPartner(partnerId);
    return ok(apps);
  }

  /** Join programs→applications for a partner. Used in lieu of any
   *  partner-keyed application index so the service does not rely on a
   *  join the repository may not maintain. */
  private async collectApplicationsForPartner(
    partnerId: string,
  ): Promise<readonly Application[]> {
    const programs = await this.programRepo.listByPartner(partnerId);
    const out: Application[] = [];
    for (const p of programs) {
      const apps = await this.applicationRepo.listByProgram(p.id);
      for (const a of apps) out.push(a);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // setApplicationStatus (Req 10.4, 10.5, 10.6)
  // -------------------------------------------------------------------------

  async setApplicationStatus(
    partnerId: string,
    applicationId: string,
    newStatus: unknown,
    actor: ActorContext,
  ): Promise<Result<Application, DomainError>> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) return err(notFoundError("Partner not found.", "Partner"));
    const ownership = this.assertOwnsPartner(actor, partner.userId);
    if (!ownership.ok) return ownership;

    const application = await this.applicationRepo.findById(applicationId);
    if (!application) {
      return err(notFoundError("Application not found.", "Application"));
    }

    // Verify the application's program is owned by this partner BEFORE
    // validating the status value (Req 10.5 — ownership takes precedence
    // so the same "not permitted" outcome surfaces for both cases).
    const program = await this.programRepo.findById(application.programId);
    if (!program || program.partnerId !== partnerId) {
      return err({
        kind: "AuthorizationError",
        message: "You do not own the program for this application.",
        reason: "not_owner",
      } satisfies AuthorizationError);
    }

    if (!isApplicationStatus(newStatus)) {
      return err(
        validationError({
          field: "status",
          message: "The provided status is not a permitted application status.",
        }),
      );
    }

    const previousStatus = application.status;
    if (previousStatus === newStatus) {
      // Req 10.6 — no-op, no notification
      return ok(application);
    }

    const updated = await this.applicationRepo.updateStatus(applicationId, newStatus);
    if (!updated.ok) return updated;

    // Req 10.4 — single notification on change
    await this.notificationRepo.create({
      userId: application.studentId,
      channel: "email",
      type: "application_status_change",
      payload: {
        applicationId,
        previousStatus,
        newStatus,
      },
      recipientEmail: "",
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // performanceReport (Req 10.7)
  // -------------------------------------------------------------------------

  async performanceReport(
    partnerId: string,
    actor: ActorContext,
  ): Promise<Result<PartnerPerformanceReport, DomainError>> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) return err(notFoundError("Partner not found.", "Partner"));
    const ownership = this.assertOwnsPartner(actor, partner.userId);
    if (!ownership.ok) return ownership;

    const leadCount = await this.leadRepo.countByPartner(partnerId);
    const applications = await this.collectApplicationsForPartner(partnerId);
    const conversionCount = applications.filter((a) =>
      ACCEPTED_STATUSES.includes(a.status),
    ).length;

    return ok({
      partnerId,
      leadCount,
      applicationCount: applications.length,
      conversionCount,
    });
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  private assertOwnsPartner(
    actor: ActorContext,
    ownerUserId: string,
  ): Result<void, DomainError> {
    if (actor.userId === ownerUserId) return ok(undefined);
    return err({
      kind: "AuthorizationError",
      message: "You do not own this partner account.",
      reason: "not_owner",
    } satisfies AuthorizationError);
  }
}
