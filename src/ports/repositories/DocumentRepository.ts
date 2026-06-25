/** Repository port for Document entities. */
import type { Document, DocumentContentType } from "@/domain";
import type { RepositoryResult } from "./common";

export interface CreateDocumentInput {
  readonly ownerId: string;
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly contentType: DocumentContentType;
  readonly sizeBytes: number;
}

export interface DocumentRepository {
  findById(id: string): Promise<Document | null>;
  listByOwner(ownerId: string): Promise<readonly Document[]>;
  listByApplication(applicationId: string): Promise<readonly Document[]>;
  create(input: CreateDocumentInput): RepositoryResult<Document>;
  attachToApplication(documentId: string, applicationId: string): RepositoryResult<Document>;
  delete(id: string): RepositoryResult<Document>;
}
