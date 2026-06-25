/** Port for S3-compatible document byte storage. */
import type { Result } from "@domain/kernel";
import type { StorageError } from "@domain/kernel";

export interface PutObjectInput {
  readonly key: string;
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

export interface PutObjectResult {
  readonly key: string;
}

export interface GetObjectResult {
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

/** Async object storage with Result-based error reporting. */
export interface ObjectStore {
  /** Persist object bytes under the given key. */
  put(input: PutObjectInput): Promise<Result<PutObjectResult, StorageError>>;

  /** Retrieve previously stored object bytes by key. */
  get(key: string): Promise<Result<GetObjectResult, StorageError>>;

  /** Delete a stored object by key. Idempotent. */
  delete(key: string): Promise<Result<void, StorageError>>;
}
