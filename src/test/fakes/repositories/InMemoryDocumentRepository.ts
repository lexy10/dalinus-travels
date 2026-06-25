import type { Document } from "@/domain";
import type { DocumentRepository, CreateDocumentInput } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryDocumentRepository implements DocumentRepository {
  private store = new Map<string, Document>();

  async findById(id: string): Promise<Document | null> {
    return this.store.get(id) ?? null;
  }

  async listByOwner(ownerId: string): Promise<readonly Document[]> {
    return [...this.store.values()].filter(d => d.ownerId === ownerId);
  }

  async listByApplication(applicationId: string): Promise<readonly Document[]> {
    return [...this.store.values()].filter(d => d.applicationId === applicationId);
  }

  async create(input: CreateDocumentInput): Promise<Result<Document, DomainError>> {
    const doc: Document = {
      id: randomUUID(),
      ownerId: input.ownerId,
      applicationId: null,
      storageKey: input.storageKey,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      status: "stored",
      createdAt: new Date(),
    };
    this.store.set(doc.id, doc);
    return ok(doc);
  }

  async attachToApplication(documentId: string, applicationId: string): Promise<Result<Document, DomainError>> {
    const existing = this.store.get(documentId);
    if (!existing) return err(conflictError("Document not found.", "Document"));
    const updated: Document = { ...existing, applicationId };
    this.store.set(documentId, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<Document, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Document not found.", "Document"));
    this.store.delete(id);
    return ok(existing);
  }

  clear() { this.store.clear(); }
  seed(doc: Document) { this.store.set(doc.id, doc); }
}
