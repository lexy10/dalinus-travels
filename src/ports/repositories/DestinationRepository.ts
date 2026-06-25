/** Repository port for Destination entities. */
import type { Destination, DestinationKind } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateDestinationInput {
  readonly kind: DestinationKind;
  readonly name: string;
  readonly country: string;
  readonly costOfLiving: string | null;
  readonly visaInfo: string | null;
  readonly destinationGuide: string | null;
  readonly publishedAt: Destination["publishedAt"];
}

export interface UpdateDestinationInput {
  readonly name?: string;
  readonly country?: string;
  readonly costOfLiving?: string | null;
  readonly visaInfo?: string | null;
  readonly destinationGuide?: string | null;
  readonly publishedAt?: Destination["publishedAt"];
}

export interface DestinationRepository {
  findById(id: string): Promise<Destination | null>;
  listByKind(kind: DestinationKind, pagination?: Pagination): Promise<readonly Destination[]>;
  create(input: CreateDestinationInput): RepositoryResult<Destination>;
  update(id: string, input: UpdateDestinationInput): RepositoryResult<Destination>;
  delete(id: string): RepositoryResult<Destination>;
}
