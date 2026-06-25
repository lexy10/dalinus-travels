import type { Document, DocumentContentType, DocumentStatus } from "@/domain";
import { isDocumentContentType } from "@/domain";
import type {
  DocumentRepository,
  CreateDocumentInput,
} from "@/ports/repositories/DocumentRepository";
import type { RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  ownerId: string;
  applicationId: string | null;
  storageKey: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  createdAt: Date;
}): Document {
  return {
    id: row.id,
    ownerId: row.ownerId,
    applicationId: row.applicationId,
    storageKey: row.storageKey,
    originalFilename: row.originalFilename,
    contentType: (isDocumentContentType(row.contentType)
      ? row.contentType
      : "application/pdf") as DocumentContentType,
    sizeBytes: row.sizeBytes,
    status: row.status as DocumentStatus,
    createdAt: row.createdAt,
  };
}

export class PrismaDocumentRepository implements DocumentRepository {
  async findById(id: string) {
    const row = await prisma.document.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
  async listByOwner(ownerId: string) {
    const rows = await prisma.document.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
  async listByApplication(applicationId: string) {
    const rows = await prisma.document.findMany({ where: { applicationId } });
    return rows.map(toDomain);
  }
  async create(input: CreateDocumentInput): RepositoryResult<Document> {
    try {
      const row = await prisma.document.create({
        data: {
          ownerId: input.ownerId,
          storageKey: input.storageKey,
          originalFilename: input.originalFilename,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
        },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async attachToApplication(
    documentId: string,
    applicationId: string,
  ): RepositoryResult<Document> {
    try {
      const row = await prisma.document.update({
        where: { id: documentId },
        data: { applicationId },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
  async delete(id: string): RepositoryResult<Document> {
    try {
      const row = await prisma.document.delete({ where: { id } });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
