/** Lead entity for prospective student/traveler follow-up. */
import type { UUID, Timestamp } from "./common";

export const LeadSource = {
  CONTACT_FORM: "contact_form",
  RECRUITER: "recruiter",
  PARTNER: "partner",
  ADMIN: "admin",
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const ALL_LEAD_SOURCES: readonly LeadSource[] = Object.values(LeadSource);

export function isLeadSource(value: unknown): value is LeadSource {
  return typeof value === "string" && (ALL_LEAD_SOURCES as readonly string[]).includes(value);
}

/**
 * Lead follow-up lifecycle.
 * `converted` feeds partner conversion reporting.
 */
export const LeadStatus = {
  NEW: "new",
  CONTACTED: "contacted",
  CONVERTED: "converted",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const ALL_LEAD_STATUSES: readonly LeadStatus[] = Object.values(LeadStatus);

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (ALL_LEAD_STATUSES as readonly string[]).includes(value);
}

export const MAX_LEAD_MESSAGE_LENGTH = 5000;

export interface Lead {
  readonly id: UUID;
  readonly source: LeadSource;
  readonly name: string;
  readonly email: string;
  /** `null` when absent; ≤ MAX_LEAD_MESSAGE_LENGTH chars. */
  readonly message: string | null;
  /** Attributed recruiter, or `null`. */
  readonly attributedRecruiterId: UUID | null;
  /** Attributed partner, or `null`. */
  readonly attributedPartnerId: UUID | null;
  readonly status: LeadStatus;
  readonly createdAt: Timestamp;
}
