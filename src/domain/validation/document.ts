/** Document upload validation: size ≤ 10 MB and format by extension + magic bytes. */
import {
  type DocumentContentType,
  ALL_DOCUMENT_CONTENT_TYPES,
  DocumentContentType as ContentType,
  MAX_DOCUMENT_SIZE_BYTES,
} from "../application";
import { type DomainError, type Result, err, ok, validationError } from "../kernel";

const SUPPORTED_FORMATS_LABEL = "PDF, JPEG, PNG";

const EXTENSION_TO_CONTENT_TYPE: Readonly<Record<string, DocumentContentType>> = {
  pdf: ContentType.PDF,
  jpg: ContentType.JPEG,
  jpeg: ContentType.JPEG,
  png: ContentType.PNG,
};

const MAGIC_SIGNATURES: ReadonlyArray<{
  readonly contentType: DocumentContentType;
  readonly bytes: readonly number[];
}> = [
  { contentType: ContentType.PDF, bytes: [0x25, 0x50, 0x44, 0x46] },
  { contentType: ContentType.JPEG, bytes: [0xff, 0xd8, 0xff] },
  {
    contentType: ContentType.PNG,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
];

/** Extract lower-cased extension from a filename, or `null` if absent. */
export function extensionOf(filename: string): string | null {
  const trimmed = filename.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  const dot = trimmed.lastIndexOf(".");
  const ext = dot === -1 ? trimmed : trimmed.slice(dot + 1);
  return ext.length > 0 ? ext : null;
}

/** Resolve content type from filename extension, or `null` if unsupported. */
export function contentTypeFromExtension(filename: string): DocumentContentType | null {
  const ext = extensionOf(filename);
  if (ext === null) {
    return null;
  }
  return EXTENSION_TO_CONTENT_TYPE[ext] ?? null;
}

function bytesAt(buffer: Uint8Array, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i += 1) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/** Resolve content type from leading magic bytes, or `null` if unrecognized. */
export function contentTypeFromMagicBytes(leadingBytes: Uint8Array): DocumentContentType | null {
  for (const { contentType, bytes } of MAGIC_SIGNATURES) {
    if (bytesAt(leadingBytes, bytes)) {
      return contentType;
    }
  }
  return null;
}

export interface DocumentValidationInput {
  readonly filename: string;
  readonly leadingBytes: Uint8Array;
  readonly sizeBytes: number;
}

/** Validate a document upload's size and format. Returns the agreed content type on success. */
export function validateDocument(
  input: DocumentValidationInput,
): Result<DocumentContentType, DomainError> {
  const { filename, leadingBytes, sizeBytes } = input;

  if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    const maxMb = MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024);
    return err(
      validationError(
        {
          field: "file",
          message: `File exceeds the maximum size of ${maxMb} MB.`,
        },
        `The maximum allowed file size is ${maxMb} MB.`,
      ),
    );
  }

  const byExtension = contentTypeFromExtension(filename);
  const byContent = contentTypeFromMagicBytes(leadingBytes);
  const supportedFormatsIssue = {
    field: "file",
    message: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS_LABEL}.`,
  };

  if (
    byExtension === null ||
    byContent === null ||
    byExtension !== byContent ||
    !(ALL_DOCUMENT_CONTENT_TYPES as readonly string[]).includes(byExtension)
  ) {
    return err(
      validationError(supportedFormatsIssue, `Supported formats are ${SUPPORTED_FORMATS_LABEL}.`),
    );
  }

  return ok(byExtension);
}
