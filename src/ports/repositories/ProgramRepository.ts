/** Repository port for Program entities. */
import type { DeliveryMode, Program, PublicationStatus, Timestamp } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateProgramInput {
  readonly partnerId: string;
  readonly destinationId: string;
  readonly title: string;
  readonly institutionName: string;
  readonly studyLevel: string;
  readonly fieldOfStudy: string;
  readonly durationMonths: number;
  readonly tuitionMinor: number;
  readonly tuitionCurrency: string;
  readonly intakeDates: readonly Timestamp[];
  readonly entryRequirements: string;
  readonly applicationDeadline: Timestamp | null;
  readonly deliveryMode: DeliveryMode;
  readonly status: PublicationStatus;
}

export interface UpdateProgramInput {
  readonly destinationId?: string;
  readonly title?: string;
  readonly institutionName?: string;
  readonly studyLevel?: string;
  readonly fieldOfStudy?: string;
  readonly durationMonths?: number;
  readonly tuitionMinor?: number;
  readonly tuitionCurrency?: string;
  readonly intakeDates?: readonly Timestamp[];
  readonly entryRequirements?: string;
  readonly applicationDeadline?: Timestamp | null;
  readonly deliveryMode?: DeliveryMode;
  readonly status?: PublicationStatus;
}

export interface ProgramRepository {
  findById(id: string): Promise<Program | null>;
  listPublished(pagination?: Pagination): Promise<readonly Program[]>;
  listByDestination(destinationId: string): Promise<readonly Program[]>;
  listByPartner(partnerId: string): Promise<readonly Program[]>;
  listWithDeadlineBetween(from: Timestamp, to: Timestamp): Promise<readonly Program[]>;
  create(input: CreateProgramInput): RepositoryResult<Program>;
  update(id: string, input: UpdateProgramInput): RepositoryResult<Program>;
  delete(id: string): RepositoryResult<Program>;
}
