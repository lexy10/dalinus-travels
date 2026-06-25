/**
 * DocumentService — handles document upload validation, storage, and attachment.
 *
 * Feature: edu-travel-platform
 */
import type { Document } from "@/domain";
import type { ActorContext } from "@/domain/kernel";
import type { Result, DomainError } from "@/domain/kernel";
import { err, storageError } from "@/domain/kernel";
import { validateDocument } from "@/domain/validation/document";
import type { DocumentRepository } from "@/ports/repositories/DocumentRepository";
import type { ObjectStore } from "@/ports/ObjectStore";
import { randomUUID } from "crypto";

export interface UploadDocumentInput {
  readonly ownerId: string;
  readonly filename: string;
  readonly bytes: Uint8Array;
}

export interface DocumentServiceDeps {
  readonly documentRepo: DocumentRepository;
  readonly objectStore: ObjectStore;
}

export class DocumentService {
  private readonly documentRepo: DocumentRepository;
  private readonly objectStore: ObjectStore;

  constructor(deps: DocumentServiceDeps) {
    this.documentRepo = deps.documentRepo;
    this.objectStore = deps.objectStore;
  }

  /**
   * Upload a document: validate size + format (extension + magic bytes), store bytes,
   * then create a Document record associated with the owner.
   *
   * On storage failure: no record created, no partial association (Req 5.5).
   */
  async upload(
    input: UploadDocumentInput,
    _actor: ActorContext,
  ): Promise<Result<Document, DomainError>> {
    const { ownerId, filename, bytes } = input;

    // Validate size and format (extension + magic bytes)
    const validationResult = validateDocument({
      filename,
      leadingBytes: bytes,
      sizeBytes: bytes.length,
    });

    if (!validationResult.ok) {
      return validationResult;
    }

    const contentType = validationResult.value;

    // Generate a unique storage key
    const storageKey = `documents/${ownerId}/${randomUUID()}/${filename}`;

    // Attempt to store bytes in the object store
    const storeResult = await this.objectStore.put({
      key: storageKey,
      bytes,
      contentType,
    });

    if (!storeResult.ok) {
      // Storage failure — no record created, no association (Req 5.5)
      return err(storageError("The upload could not be completed."));
    }

    // Create the Document record
    const createResult = await this.documentRepo.create({
      ownerId,
      storageKey,
      originalFilename: filename,
      contentType,
      sizeBytes: bytes.length,
    });

    return createResult;
  }

  /**
   * Attach a stored document to an application. Idempotent — re-attaching the
   * same document to the same application is a no-op (Req 5.4).
   */
  async attachToApplication(
    documentId: string,
    applicationId: string,
    _actor: ActorContext,
  ): Promise<Result<Document, DomainError>> {
    return this.documentRepo.attachToApplication(documentId, applicationId);
  }
}
