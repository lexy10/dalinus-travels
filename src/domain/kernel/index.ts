/**
 * Shared kernel for the domain layer.
 *
 * Cross-cutting value types used by every domain entity and service:
 * - `Result<T, E>` and its constructors/guards (`result.ts`)
 * - the `DomainError` discriminated union and constructors (`errors.ts`)
 * - shared identity value types: `Role`, `AccountStatus` (`identity.ts`)
 * - `ActorContext`, the authenticated principal (`actor.ts`)
 *
 * Everything here is pure (no I/O, no framework imports) and framework-agnostic
 * so it can later be lifted into a standalone backend unchanged.
 */
export * from "./result";
export * from "./errors";
export * from "./identity";
export * from "./actor";
