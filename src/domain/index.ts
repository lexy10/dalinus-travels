/**
 * Domain layer.
 *
 * Pure types, validation, and invariants with no I/O and no framework
 * dependencies. This layer MUST NOT import from `next/*`, React, or any outer
 * layer (services may depend on domain, never the reverse for framework code).
 * The dependency rule is enforced by ESLint (`no-restricted-imports`).
 *
 * Populated by tasks 2.1 and 2.2.
 */

// Shared kernel: Result, DomainError, identity value types, and ActorContext
// (task 1.3).
export * from "./kernel";

// Shared domain value types: UUID, Timestamp, Money, PublicationStatus
// (task 2.1).
export * from "./common";

// Entity types and enums (task 2.1), grouped into cohesive modules per the
// design's `src/domain/` layout.
export * from "./user"; // User, Recruiter, Partner
export * from "./catalog"; // Destination, Program, TourPackage
export * from "./application"; // Application, Document
export * from "./booking"; // Booking, Payment
export * from "./consultation"; // Consultation, ConsultationSlot
export * from "./lead"; // Lead
export * from "./content"; // BlogArticle, MarketingPage, Statistic
export * from "./notification"; // Notification
export * from "./consent"; // CookieConsent

// Pure validation functions (task 2.2): email, password, search term, tuition
// range, consultation contact, document size/format, contact message length,
// and statistic value rules.
export * from "./validation";
