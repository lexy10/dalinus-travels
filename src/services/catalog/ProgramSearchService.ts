/**
 * Program discovery and search service.
 *
 * Provides case-insensitive substring search over program title, field of study,
 * and institution name; conjunctive (AND) filtering by study level, field of study,
 * tuition range, and intake date; and detail retrieval regardless of search context.
 *
 * Only published programs are surfaced through search/filter.
 * Invalid search terms and inverted tuition ranges are rejected, leaving results unchanged.
 */
import type { Program, DomainError, Result, Timestamp } from "@/domain";
import { ok, err } from "@/domain/kernel";
import { validateSearchTerm } from "@/domain/validation/search";
import { validateTuitionRange, type TuitionRange } from "@/domain/validation/tuition";
import type { ProgramRepository } from "@/ports";

export interface ProgramFilters {
  readonly level?: string;
  readonly field?: string;
  readonly tuitionRange?: TuitionRange;
  readonly intakeDate?: Timestamp;
}

export interface ProgramSearchService {
  /** Case-insensitive substring search over title, fieldOfStudy, institutionName. */
  search(term: string): Promise<Result<readonly Program[], DomainError>>;
  /** Conjunctive filtering; all applied filters must be satisfied. */
  filter(filters: ProgramFilters): Promise<Result<readonly Program[], DomainError>>;
  /** Retrieve program detail by ID, regardless of search context. */
  getDetail(programId: string): Promise<Result<Program, DomainError>>;
}

export function createProgramSearchService(
  programRepository: ProgramRepository,
): ProgramSearchService {
  return {
    async search(term: string): Promise<Result<readonly Program[], DomainError>> {
      const validated = validateSearchTerm(term);
      if (!validated.ok) {
        return err(validated.error);
      }

      const published = await programRepository.listPublished();
      const lowerTerm = validated.value.toLowerCase();

      const results = published.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerTerm) ||
          p.fieldOfStudy.toLowerCase().includes(lowerTerm) ||
          p.institutionName.toLowerCase().includes(lowerTerm),
      );

      return ok(results);
    },

    async filter(filters: ProgramFilters): Promise<Result<readonly Program[], DomainError>> {
      // Validate tuition range if provided
      if (filters.tuitionRange) {
        const rangeResult = validateTuitionRange(filters.tuitionRange);
        if (!rangeResult.ok) {
          return err(rangeResult.error);
        }
      }

      const published = await programRepository.listPublished();

      const results = published.filter((p) => {
        if (filters.level && p.studyLevel !== filters.level) {
          return false;
        }
        if (filters.field && p.fieldOfStudy !== filters.field) {
          return false;
        }
        if (filters.tuitionRange) {
          const { min, max } = filters.tuitionRange;
          if (min != null && p.tuitionMinor < min) {
            return false;
          }
          if (max != null && p.tuitionMinor > max) {
            return false;
          }
        }
        if (filters.intakeDate) {
          const hasMatchingIntake = p.intakeDates.some(
            (d) => d.getTime() === filters.intakeDate!.getTime(),
          );
          if (!hasMatchingIntake) {
            return false;
          }
        }
        return true;
      });

      return ok(results);
    },

    async getDetail(programId: string): Promise<Result<Program, DomainError>> {
      const program = await programRepository.findById(programId);
      if (!program) {
        return err({
          kind: "NotFoundError" as const,
          message: "Program not found.",
          resource: "Program",
        });
      }
      return ok(program);
    },
  };
}
