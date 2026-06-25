/**
 * Service layer (framework-agnostic application services).
 *
 * Each service takes a typed input DTO plus an `ActorContext` and returns a
 * `Result<T, DomainError>`. This layer accesses external systems only through
 * ports (see `src/ports`) and MUST NOT import from `next/*`, React, the adapter
 * layer (`src/app`), the infrastructure layer (`src/infra`), or the
 * presentation layer (`src/ui`). The dependency rule is enforced by ESLint.
 *
 * Populated starting at task 5 (AuthService) onward.
 */
export {};
