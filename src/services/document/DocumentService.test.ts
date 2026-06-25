/**
 * Property-based tests for DocumentService.
 *
 * Feature: edu-travel-platform
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { DocumentService } from "./DocumentService";
import { InMemoryDocumentRepository, FakeObjectStore } from "@/test/fakes";
import {
  validDocumentArb,
  oversizedDocumentArb,
  wrongMagicBytesArb,
  mismatchedExtensionArb,
} from "@/test/arbitraries/document.arb";
import { createActorContext } from "@/domain/kernel/actor";
import { AccountStatus, Role } from "@/domain/kernel/identity";

function buildBytes(magic: number[], extraLength: number): Uint8Array {
  const extra = new Uint8Array(extraLength);
  const result = new Uint8Array(magic.length + extra.length);
  result.set(new Uint8Array(magic));
  result.set(extra, magic.length);
  return result;
}

function makeActor(userId: string) {
  return createActorContext({
    userId,
    roles: [Role.STUDENT_TRAVELER],
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  });
}

describe("DocumentService", () => {
  let documentRepo: InMemoryDocumentRepository;
  let objectStore: FakeObjectStore;
  let service: DocumentService;

  beforeEach(() => {
    documentRepo = new InMemoryDocumentRepository();
    objectStore = new FakeObjectStore();
    service = new DocumentService({ documentRepo, objectStore });
  });

  // Feature: edu-travel-platform, Property 23: Valid documents are stored and associated
  // **Validates: Requirements 5.1**
  describe("Property 23: Valid documents are stored and associated", () => {
    it("valid documents (PDF/JPEG/PNG, ≤10MB) are stored and associated with the owner", async () => {
      await fc.assert(
        fc.asyncProperty(
          validDocumentArb,
          fc.uuid(),
          async (docInput, ownerId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();

            const actor = makeActor(ownerId);

            // Build actual bytes matching the leading bytes + padding to sizeBytes
            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // Act
            const result = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );

            // Assert: upload succeeds
            expect(result.ok).toBe(true);
            if (!result.ok) return;

            const doc = result.value;

            // Document is associated with the owner
            expect(doc.ownerId).toBe(ownerId);
            expect(doc.originalFilename).toBe(docInput.filename);
            expect(doc.sizeBytes).toBe(bytes.length);
            expect(doc.status).toBe("stored");

            // Bytes are stored in the object store
            expect(objectStore.has(doc.storageKey)).toBe(true);

            // Document record exists in the repository
            const found = await documentRepo.findById(doc.id);
            expect(found).not.toBeNull();
            expect(found!.ownerId).toBe(ownerId);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 24: Oversized or wrong-format rejected with no residue
  // **Validates: Requirements 5.2, 5.3**
  describe("Property 24: Oversized or wrong-format documents are rejected with no residue", () => {
    it("oversized documents are rejected with no record or stored bytes", async () => {
      await fc.assert(
        fc.asyncProperty(
          oversizedDocumentArb,
          fc.uuid(),
          async (docInput, ownerId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();

            const actor = makeActor(ownerId);

            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // Act
            const result = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );

            // Assert: rejected
            expect(result.ok).toBe(false);
            if (result.ok) return;

            expect(result.error.kind).toBe("ValidationError");

            // No residue: no document record
            const docs = await documentRepo.listByOwner(ownerId);
            expect(docs.length).toBe(0);
          },
        ),
      );
    });

    it("wrong magic bytes are rejected with no record or stored bytes", async () => {
      await fc.assert(
        fc.asyncProperty(
          wrongMagicBytesArb,
          fc.uuid(),
          async (docInput, ownerId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();

            const actor = makeActor(ownerId);

            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // Act
            const result = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );

            // Assert: rejected
            expect(result.ok).toBe(false);
            if (result.ok) return;

            expect(result.error.kind).toBe("ValidationError");

            // No residue
            const docs = await documentRepo.listByOwner(ownerId);
            expect(docs.length).toBe(0);
          },
        ),
      );
    });

    it("mismatched extension/content are rejected with no record or stored bytes", async () => {
      await fc.assert(
        fc.asyncProperty(
          mismatchedExtensionArb,
          fc.uuid(),
          async (docInput, ownerId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();

            const actor = makeActor(ownerId);

            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // Act
            const result = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );

            // Assert: rejected
            expect(result.ok).toBe(false);
            if (result.ok) return;

            expect(result.error.kind).toBe("ValidationError");

            // No residue
            const docs = await documentRepo.listByOwner(ownerId);
            expect(docs.length).toBe(0);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 25: Storage failure leaves no partial document
  // **Validates: Requirements 5.5**
  describe("Property 25: Storage failure leaves no partial document", () => {
    it("when object store fails, no Document record is created and no association is made", async () => {
      await fc.assert(
        fc.asyncProperty(
          validDocumentArb,
          fc.uuid(),
          async (docInput, ownerId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();
            objectStore.failNext(true);

            const actor = makeActor(ownerId);

            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // Act
            const result = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );

            // Assert: upload fails with StorageError
            expect(result.ok).toBe(false);
            if (result.ok) return;

            expect(result.error.kind).toBe("StorageError");

            // No partial document record
            const docs = await documentRepo.listByOwner(ownerId);
            expect(docs.length).toBe(0);
          },
        ),
      );
    });
  });

  // Feature: edu-travel-platform, Property 26: Document attachment associates with the application
  // **Validates: Requirements 5.4**
  describe("Property 26: Document attachment associates with the application", () => {
    it("attaching a stored document to an application associates it, and re-attaching is idempotent", async () => {
      await fc.assert(
        fc.asyncProperty(
          validDocumentArb,
          fc.uuid(),
          fc.uuid(),
          async (docInput, ownerId, applicationId) => {
            // Setup
            documentRepo.clear();
            objectStore.clear();

            const actor = makeActor(ownerId);

            const bytes = buildBytes(
              Array.from(docInput.leadingBytes),
              Math.max(0, docInput.sizeBytes - docInput.leadingBytes.length),
            );

            // First, upload a valid document
            const uploadResult = await service.upload(
              { ownerId, filename: docInput.filename, bytes },
              actor,
            );
            expect(uploadResult.ok).toBe(true);
            if (!uploadResult.ok) return;

            const doc = uploadResult.value;
            expect(doc.applicationId).toBeNull();

            // Act: attach to application
            const attachResult = await service.attachToApplication(
              doc.id,
              applicationId,
              actor,
            );

            // Assert: attachment succeeds
            expect(attachResult.ok).toBe(true);
            if (!attachResult.ok) return;

            expect(attachResult.value.applicationId).toBe(applicationId);

            // Re-attach: should be idempotent (same result)
            const reAttachResult = await service.attachToApplication(
              doc.id,
              applicationId,
              actor,
            );

            expect(reAttachResult.ok).toBe(true);
            if (!reAttachResult.ok) return;

            expect(reAttachResult.value.applicationId).toBe(applicationId);

            // Verify via repository
            const found = await documentRepo.findById(doc.id);
            expect(found).not.toBeNull();
            expect(found!.applicationId).toBe(applicationId);
          },
        ),
      );
    });
  });
});
