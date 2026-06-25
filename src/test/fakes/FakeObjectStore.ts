import type { ObjectStore, PutObjectInput, PutObjectResult, GetObjectResult } from "@/ports";
import type { Result, StorageError } from "@/domain/kernel";
import { ok, err, storageError } from "@/domain/kernel";

export class FakeObjectStore implements ObjectStore {
  private store = new Map<string, { bytes: Uint8Array; contentType: string }>();
  private _failNext = false;

  failNext(shouldFail = true) { this._failNext = shouldFail; }

  async put(input: PutObjectInput): Promise<Result<PutObjectResult, StorageError>> {
    if (this._failNext) {
      this._failNext = false;
      return err(storageError("Simulated storage failure."));
    }
    this.store.set(input.key, { bytes: input.bytes, contentType: input.contentType });
    return ok({ key: input.key });
  }

  async get(key: string): Promise<Result<GetObjectResult, StorageError>> {
    if (this._failNext) {
      this._failNext = false;
      return err(storageError("Simulated storage failure."));
    }
    const entry = this.store.get(key);
    if (!entry) return err(storageError("Object not found."));
    return ok(entry);
  }

  async delete(key: string): Promise<Result<void, StorageError>> {
    if (this._failNext) {
      this._failNext = false;
      return err(storageError("Simulated storage failure."));
    }
    this.store.delete(key);
    return ok(undefined);
  }

  has(key: string): boolean { return this.store.has(key); }
  clear() { this.store.clear(); this._failNext = false; }
}
