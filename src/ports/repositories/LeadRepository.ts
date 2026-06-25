/** Repository port for Lead entities. */
import type { Lead, LeadSource, LeadStatus } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateLeadInput {
  readonly source: LeadSource;
  readonly name: string;
  readonly email: string;
  readonly message: string | null;
  readonly attributedRecruiterId: string | null;
  readonly attributedPartnerId: string | null;
}

export interface LeadRepository {
  findById(id: string): Promise<Lead | null>;
  listByRecruiter(recruiterId: string): Promise<readonly Lead[]>;
  listByPartner(partnerId: string): Promise<readonly Lead[]>;
  list(pagination?: Pagination): Promise<readonly Lead[]>;
  countByPartner(partnerId: string): Promise<number>;
  create(input: CreateLeadInput): RepositoryResult<Lead>;
  updateStatus(id: string, status: LeadStatus): RepositoryResult<Lead>;
}
