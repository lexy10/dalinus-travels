/** Repository port for Recruiter entities. */
import type { Recruiter, RecruiterStatus } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateRecruiterInput {
  readonly userId: string;
  readonly status: RecruiterStatus;
  readonly managerRecruiterId: string | null;
  readonly companyName: string;
}

export interface UpdateRecruiterInput {
  readonly status?: RecruiterStatus;
  readonly managerRecruiterId?: string | null;
  readonly companyName?: string;
  readonly decisionAt?: Recruiter["decisionAt"];
}

export interface RecruiterRepository {
  findById(id: string): Promise<Recruiter | null>;
  findByUserId(userId: string): Promise<Recruiter | null>;
  listSubAgents(managerRecruiterId: string): Promise<readonly Recruiter[]>;
  list(filter?: { readonly status?: RecruiterStatus }, pagination?: Pagination): Promise<readonly Recruiter[]>;
  create(input: CreateRecruiterInput): RepositoryResult<Recruiter>;
  update(id: string, input: UpdateRecruiterInput): RepositoryResult<Recruiter>;
}
