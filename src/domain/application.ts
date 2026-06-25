/** Application and document entities. */
import type { UUID, Timestamp } from "./common";

/**
 * Application lifecycle status.
 * Status change to a *different* value triggers exactly one notification;
 * a no-op set to the same value triggers none.
 */
export const ApplicationStatus = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "UnderReview",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const ALL_APPLICATION_STATUSES: readonly ApplicationStatus[] =
  Object.values(ApplicationStatus);

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    typeof value === "string" && (ALL_APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * A student's submission to a Program.
 * Unique on (studentId, programId) — one application per program per student.
 */
export interface Application {
  readonly id: UUID;
  readonly studentId: UUID;
  readonly programId: UUID;
  /** Attributed recruiter, or `null` when none. */
  readonly recruiterId: UUID | null;
  readonly status: ApplicationStatus;
  readonly submittedFields: Readonly<Record<string, unknown>>;
  readonly createdAt: Timestamp;
  readonly statusUpdatedAt: Timestamp;
}

export const DocumentContentType = {
  PDF: "application/pdf",
  JPEG: "image/jpeg",
  PNG: "image/png",
} as const;

export type DocumentContentType = (typeof DocumentContentType)[keyof typeof DocumentContentType];

export const ALL_DOCUMENT_CONTENT_TYPES: readonly DocumentContentType[] =
  Object.values(DocumentContentType);

export function isDocumentContentType(value: unknown): value is DocumentContentType {
  return (
    typeof value === "string" && (ALL_DOCUMENT_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

/** 10 MB limit. */
export const MAX_DOCUMENT_SIZE_BYTES = 10_485_760;

export const DocumentStatus = {
  STORED: "stored",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export interface Document {
  readonly id: UUID;
  readonly ownerId: UUID;
  /** `null` until attached to an application. */
  readonly applicationId: UUID | null;
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly contentType: DocumentContentType;
  readonly sizeBytes: number;
  readonly status: DocumentStatus;
  readonly createdAt: Timestamp;
}
