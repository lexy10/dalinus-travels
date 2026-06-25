/**
 * Vercel Blob-backed ObjectStore.
 *
 * Requires `BLOB_READ_WRITE_TOKEN` (set automatically by Vercel when a Blob
 * store is provisioned). Falls back to an in-memory map when the token is
 * absent so dev works without provisioning storage immediately.
 */
import type {
  ObjectStore,
  PutObjectInput,
  PutObjectResult,
  GetObjectResult,
} from "@/ports/ObjectStore";
import type { Result, StorageError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import { storageError } from "@/domain/kernel/errors";

class InMemoryBlobFallback implements ObjectStore {
  private readonly store = new Map<string, { bytes: Uint8Array; contentType: string }>();
  async put(input: PutObjectInput): Promise<Result<PutObjectResult, StorageError>> {
    this.store.set(input.key, { bytes: input.bytes, contentType: input.contentType });
    return ok({ key: input.key });
  }
  async get(key: string): Promise<Result<GetObjectResult, StorageError>> {
    const entry = this.store.get(key);
    if (!entry) return err(storageError("Object not found."));
    return ok({ bytes: entry.bytes, contentType: entry.contentType });
  }
  async delete(key: string): Promise<Result<void, StorageError>> {
    this.store.delete(key);
    return ok(undefined);
  }
}

export class VercelBlobObjectStore implements ObjectStore {
  private readonly fallback?: InMemoryBlobFallback;

  constructor() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // eslint-disable-next-line no-console
      console.warn("BLOB_READ_WRITE_TOKEN not set — using in-memory document storage (dev only).");
      this.fallback = new InMemoryBlobFallback();
    }
  }

  async put(input: PutObjectInput): Promise<Result<PutObjectResult, StorageError>> {
    if (this.fallback) return this.fallback.put(input);
    try {
      const { put } = await import("@vercel/blob");
      const result = await put(input.key, Buffer.from(input.bytes), {
        access: "public",
        contentType: input.contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return ok({ key: result.pathname });
    } catch (error) {
      return err(
        storageError(error instanceof Error ? error.message : "Object upload failed."),
      );
    }
  }

  async get(key: string): Promise<Result<GetObjectResult, StorageError>> {
    if (this.fallback) return this.fallback.get(key);
    try {
      const { head } = await import("@vercel/blob");
      const meta = await head(key);
      const response = await fetch(meta.url);
      if (!response.ok) return err(storageError("Object download failed."));
      const buffer = await response.arrayBuffer();
      return ok({
        bytes: new Uint8Array(buffer),
        contentType: meta.contentType ?? "application/octet-stream",
      });
    } catch (error) {
      return err(
        storageError(error instanceof Error ? error.message : "Object download failed."),
      );
    }
  }

  async delete(key: string): Promise<Result<void, StorageError>> {
    if (this.fallback) return this.fallback.delete(key);
    try {
      const { del } = await import("@vercel/blob");
      await del(key);
      return ok(undefined);
    } catch {
      return err(storageError("Object delete failed."));
    }
  }
}
