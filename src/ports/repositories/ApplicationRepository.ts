/** Repository port for Application entities. */
import type { Application, ApplicationStatus } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateApplicationInput {
  readonly studentId: string;
  readonly programId: string;
  readonly recruiterId: string | null;
  readonly submittedFields: Readonly<Record<string, unknown>>;
}

export interface ApplicationRepository {
  findById(id: string): Promise<Application | null>;
  findByStudentAndProgram(studentId: string, programId: string): Promise<Application | null>;
  listByStudent(studentId: string): Promise<readonly Application[]>;
  listByProgram(programId: string): Promise<readonly Application[]>;
  listByPartner(partnerId: string): Promise<readonly Application[]>;
  listByRecruiter(recruiterId: string): Promise<readonly Application[]>;
  list(pagination?: Pagination): Promise<readonly Application[]>;
  countByPartner(partnerId: string, status?: ApplicationStatus): Promise<number>;
  create(input: CreateApplicationInput): RepositoryResult<Application>;
  updateStatus(id: string, status: ApplicationStatus): RepositoryResult<Application>;
}
