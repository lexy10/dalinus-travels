import type { Application, ApplicationStatus } from "@/domain";
import type { ApplicationRepository, CreateApplicationInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryApplicationRepository implements ApplicationRepository {
  private store = new Map<string, Application>();

  async findById(id: string): Promise<Application | null> {
    return this.store.get(id) ?? null;
  }

  async findByStudentAndProgram(studentId: string, programId: string): Promise<Application | null> {
    for (const a of this.store.values()) {
      if (a.studentId === studentId && a.programId === programId) return a;
    }
    return null;
  }

  async listByStudent(studentId: string): Promise<readonly Application[]> {
    return [...this.store.values()].filter(a => a.studentId === studentId);
  }

  async listByProgram(programId: string): Promise<readonly Application[]> {
    return [...this.store.values()].filter(a => a.programId === programId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listByPartner(_partnerId: string): Promise<readonly Application[]> {
    return [...this.store.values()];
  }

  async listByRecruiter(recruiterId: string): Promise<readonly Application[]> {
    return [...this.store.values()].filter(a => a.recruiterId === recruiterId);
  }

  async list(pagination?: Pagination): Promise<readonly Application[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async countByPartner(_partnerId: string, status?: ApplicationStatus): Promise<number> {
    const all = [...this.store.values()];
    return status ? all.filter(a => a.status === status).length : all.length;
  }

  async create(input: CreateApplicationInput): Promise<Result<Application, DomainError>> {
    const dup = await this.findByStudentAndProgram(input.studentId, input.programId);
    if (dup) return err(conflictError("Application already exists for this program.", "Application"));
    const now = new Date();
    const app: Application = {
      id: randomUUID(),
      studentId: input.studentId,
      programId: input.programId,
      recruiterId: input.recruiterId,
      status: "Submitted",
      submittedFields: input.submittedFields,
      createdAt: now,
      statusUpdatedAt: now,
    };
    this.store.set(app.id, app);
    return ok(app);
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<Result<Application, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Application not found.", "Application"));
    const updated: Application = { ...existing, status, statusUpdatedAt: new Date() };
    this.store.set(id, updated);
    return ok(updated);
  }

  clear() { this.store.clear(); }
  seed(app: Application) { this.store.set(app.id, app); }
}
