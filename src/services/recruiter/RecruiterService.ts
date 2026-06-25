/**
 * RecruiterService — recruiter application/approval workflow,
 * sub-agent registration, and scoped views.
 *
 * Covers Req 9.1–9.8.
 */
import type { Application, Lead, Recruiter } from "@/domain";
import {
  RecruiterStatus,
  conflictError,
  missingFieldsError,
  notFoundError,
} from "@/domain";
import type { Result, DomainError, AuthorizationError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type { RecruiterRepository } from "@/ports/repositories/RecruiterRepository";
import type { ApplicationRepository } from "@/ports/repositories/ApplicationRepository";
import type { LeadRepository } from "@/ports/repositories/LeadRepository";
import type { NotificationRepository } from "@/ports/repositories/NotificationRepository";
import {
  assertAdministrator,
  assertRecruiterDashboardAccess,
} from "@/services/auth/authorization";

export interface RecruiterApplicationInput {
  readonly userId: string;
  readonly companyName: unknown;
  readonly applicantEmail: unknown;
}

export interface SubAgentRegistrationInput {
  readonly managerRecruiterId: string;
  readonly subAgentUserId: unknown;
  readonly companyName: unknown;
}

export interface RecruiterServiceDeps {
  readonly recruiterRepo: RecruiterRepository;
  readonly applicationRepo: ApplicationRepository;
  readonly leadRepo: LeadRepository;
  readonly notificationRepo: NotificationRepository;
}

export interface RecruiterScopedData {
  readonly leads: readonly Lead[];
  readonly applications: readonly Application[];
}

export class RecruiterService {
  private readonly recruiterRepo: RecruiterRepository;
  private readonly applicationRepo: ApplicationRepository;
  private readonly leadRepo: LeadRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor(deps: RecruiterServiceDeps) {
    this.recruiterRepo = deps.recruiterRepo;
    this.applicationRepo = deps.applicationRepo;
    this.leadRepo = deps.leadRepo;
    this.notificationRepo = deps.notificationRepo;
  }

  // -------------------------------------------------------------------------
  // applyAsRecruiter (Req 9.1, 9.2)
  // -------------------------------------------------------------------------

  async applyAsRecruiter(
    input: RecruiterApplicationInput,
  ): Promise<Result<Recruiter, DomainError>> {
    const missing: string[] = [];
    if (!input.userId || typeof input.userId !== "string") missing.push("userId");
    if (typeof input.companyName !== "string" || input.companyName.trim() === "") {
      missing.push("companyName");
    }
    if (typeof input.applicantEmail !== "string" || input.applicantEmail.trim() === "") {
      missing.push("applicantEmail");
    }
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    // One pending/active recruiter record per user
    const existing = await this.recruiterRepo.findByUserId(input.userId);
    if (existing) {
      return err(
        conflictError(
          "A recruiter account already exists for this user.",
          "Recruiter",
        ),
      );
    }

    const created = await this.recruiterRepo.create({
      userId: input.userId,
      status: RecruiterStatus.PENDING,
      managerRecruiterId: null,
      companyName: (input.companyName as string).trim(),
    });
    if (!created.ok) return created;

    await this.notificationRepo.create({
      userId: input.userId,
      channel: "email",
      type: "recruiter_application_received",
      payload: { recruiterId: created.value.id, status: created.value.status },
      recipientEmail: (input.applicantEmail as string).toLowerCase(),
    });

    return created;
  }

  // -------------------------------------------------------------------------
  // approve / reject (Req 9.3, 9.4)
  // -------------------------------------------------------------------------

  async approveRecruiter(
    recruiterId: string,
    actor: ActorContext,
  ): Promise<Result<Recruiter, DomainError>> {
    const adminGate = assertAdministrator(actor);
    if (!adminGate.ok) return adminGate;

    const existing = await this.recruiterRepo.findById(recruiterId);
    if (!existing) return err(notFoundError("Recruiter not found.", "Recruiter"));

    const update = await this.recruiterRepo.update(recruiterId, {
      status: RecruiterStatus.ACTIVE,
      decisionAt: new Date(),
    });
    if (!update.ok) return update;

    await this.notificationRepo.create({
      userId: existing.userId,
      channel: "email",
      type: "recruiter_application_approved",
      payload: { recruiterId },
      recipientEmail: "",
    });

    return update;
  }

  async rejectRecruiter(
    recruiterId: string,
    actor: ActorContext,
  ): Promise<Result<Recruiter, DomainError>> {
    const adminGate = assertAdministrator(actor);
    if (!adminGate.ok) return adminGate;

    const existing = await this.recruiterRepo.findById(recruiterId);
    if (!existing) return err(notFoundError("Recruiter not found.", "Recruiter"));

    const update = await this.recruiterRepo.update(recruiterId, {
      status: RecruiterStatus.REJECTED,
      decisionAt: new Date(),
    });
    if (!update.ok) return update;

    await this.notificationRepo.create({
      userId: existing.userId,
      channel: "email",
      type: "recruiter_application_rejected",
      payload: { recruiterId },
      recipientEmail: "",
    });

    return update;
  }

  // -------------------------------------------------------------------------
  // registerSubAgent (Req 9.7, 9.8)
  // -------------------------------------------------------------------------

  async registerSubAgent(
    input: SubAgentRegistrationInput,
    actor: ActorContext,
  ): Promise<Result<Recruiter, DomainError>> {
    const manager = await this.recruiterRepo.findById(input.managerRecruiterId);
    if (!manager) return err(notFoundError("Recruiter not found.", "Recruiter"));

    // Manager must be the actor and pass recruiter-dashboard gate
    if (manager.userId !== actor.userId) {
      return err({
        kind: "AuthorizationError",
        message: "You may only register sub-agents under your own account.",
        reason: "not_owner",
      } satisfies AuthorizationError);
    }
    const gate = assertRecruiterDashboardAccess(actor, manager.status);
    if (!gate.ok) return gate;

    const missing: string[] = [];
    if (typeof input.subAgentUserId !== "string" || input.subAgentUserId.trim() === "") {
      missing.push("subAgentUserId");
    }
    if (typeof input.companyName !== "string" || input.companyName.trim() === "") {
      missing.push("companyName");
    }
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    const subAgentUserId = (input.subAgentUserId as string).trim();
    const duplicate = await this.recruiterRepo.findByUserId(subAgentUserId);
    if (duplicate) {
      return err(
        conflictError(
          "A recruiter account already exists for this sub-agent user.",
          "Recruiter",
        ),
      );
    }

    return this.recruiterRepo.create({
      userId: subAgentUserId,
      status: RecruiterStatus.ACTIVE,
      managerRecruiterId: input.managerRecruiterId,
      companyName: (input.companyName as string).trim(),
    });
  }

  // -------------------------------------------------------------------------
  // listScopedData (Req 9.6)
  // -------------------------------------------------------------------------

  async listScopedData(
    recruiterId: string,
    actor: ActorContext,
  ): Promise<Result<RecruiterScopedData, DomainError>> {
    const recruiter = await this.recruiterRepo.findById(recruiterId);
    if (!recruiter) return err(notFoundError("Recruiter not found.", "Recruiter"));
    if (recruiter.userId !== actor.userId) {
      return err({
        kind: "AuthorizationError",
        message: "You do not own this recruiter account.",
        reason: "not_owner",
      } satisfies AuthorizationError);
    }
    const gate = assertRecruiterDashboardAccess(actor, recruiter.status);
    if (!gate.ok) return gate;

    const leads = await this.leadRepo.listByRecruiter(recruiterId);
    const applications = await this.applicationRepo.listByRecruiter(recruiterId);
    return ok({ leads, applications });
  }
}
