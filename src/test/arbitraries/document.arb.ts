import * as fc from "fast-check";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/domain/application";
import type { DocumentValidationInput } from "@/domain/validation/document";

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function buildBytes(magic: Uint8Array, extraLength: number): Uint8Array {
  const extra = new Uint8Array(extraLength);
  const result = new Uint8Array(magic.length + extra.length);
  result.set(magic);
  result.set(extra, magic.length);
  return result;
}

export const validDocumentArb: fc.Arbitrary<DocumentValidationInput> = fc.oneof(
  fc.nat({ max: MAX_DOCUMENT_SIZE_BYTES - PDF_MAGIC.length }).map(extra => ({
    filename: "document.pdf",
    leadingBytes: buildBytes(PDF_MAGIC, Math.min(extra, 100)),
    sizeBytes: PDF_MAGIC.length + extra,
  })),
  fc.nat({ max: MAX_DOCUMENT_SIZE_BYTES - JPEG_MAGIC.length }).map(extra => ({
    filename: "photo.jpeg",
    leadingBytes: buildBytes(JPEG_MAGIC, Math.min(extra, 100)),
    sizeBytes: JPEG_MAGIC.length + extra,
  })),
  fc.nat({ max: MAX_DOCUMENT_SIZE_BYTES - PNG_MAGIC.length }).map(extra => ({
    filename: "image.png",
    leadingBytes: buildBytes(PNG_MAGIC, Math.min(extra, 100)),
    sizeBytes: PNG_MAGIC.length + extra,
  })),
);

export const oversizedDocumentArb: fc.Arbitrary<DocumentValidationInput> = fc
  .integer({ min: MAX_DOCUMENT_SIZE_BYTES + 1, max: MAX_DOCUMENT_SIZE_BYTES + 10_000 })
  .map(size => ({
    filename: "large.pdf",
    leadingBytes: buildBytes(PDF_MAGIC, 100),
    sizeBytes: size,
  }));

export const wrongMagicBytesArb: fc.Arbitrary<DocumentValidationInput> = fc
  .nat({ max: MAX_DOCUMENT_SIZE_BYTES })
  .map(size => ({
    filename: "document.pdf",
    leadingBytes: new Uint8Array([0x00, 0x00, 0x00, 0x00]),
    sizeBytes: size,
  }));

export const mismatchedExtensionArb: fc.Arbitrary<DocumentValidationInput> = fc.oneof(
  fc.constant<DocumentValidationInput>({
    filename: "photo.png",
    leadingBytes: buildBytes(PDF_MAGIC, 10),
    sizeBytes: 1000,
  }),
  fc.constant<DocumentValidationInput>({
    filename: "document.pdf",
    leadingBytes: buildBytes(JPEG_MAGIC, 10),
    sizeBytes: 1000,
  }),
);
