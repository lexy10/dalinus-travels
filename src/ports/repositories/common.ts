/** Shared repository-port helper types. */
import type { DomainError, Result } from "@/domain";

export interface Pagination {
  readonly offset?: number;
  readonly limit?: number;
}

export type RepositoryResult<T> = Promise<Result<T, DomainError>>;
