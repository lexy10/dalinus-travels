/** Repository port for Partner entities. */
import type { AccountStatus, Partner } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreatePartnerInput {
  readonly userId: string;
  readonly institutionName: string;
  readonly status: AccountStatus;
}

export interface UpdatePartnerInput {
  readonly institutionName?: string;
  readonly status?: AccountStatus;
}

export interface PartnerRepository {
  findById(id: string): Promise<Partner | null>;
  findByUserId(userId: string): Promise<Partner | null>;
  list(pagination?: Pagination): Promise<readonly Partner[]>;
  create(input: CreatePartnerInput): RepositoryResult<Partner>;
  update(id: string, input: UpdatePartnerInput): RepositoryResult<Partner>;
}
