/** Repository port for Booking entities. */
import type { Booking, Timestamp } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreatePendingBookingInput {
  readonly travelerId: string;
  readonly tourPackageId: string;
  readonly reservedPlaces: number;
  readonly txRef: string;
  readonly amountMinor: number;
  readonly currency: string;
}

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByTxRef(txRef: string): Promise<Booking | null>;
  listByTraveler(travelerId: string): Promise<readonly Booking[]>;
  list(pagination?: Pagination): Promise<readonly Booking[]>;
  createPendingBooking(input: CreatePendingBookingInput): RepositoryResult<Booking>;
  confirmWithAvailabilityDecrement(
    id: string,
    providerTransactionId: string,
    confirmedAt: Timestamp,
  ): RepositoryResult<Booking>;
}
