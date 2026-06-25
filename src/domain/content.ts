/** CMS content entities: BlogArticle, MarketingPage, Statistic. */
import type { UUID, Timestamp, PublicationStatus } from "./common";

export interface BlogArticle {
  readonly id: UUID;
  readonly authorId: UUID;
  readonly title: string;
  readonly slug: string;
  readonly body: string;
  readonly status: PublicationStatus;
  /** When first published, else `null`. */
  readonly publishedAt: Timestamp | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export const MarketingPageKey = {
  ABOUT: "about",
  SERVICES_STUDENTS: "services_students",
  SERVICES_INSTITUTIONS: "services_institutions",
  SERVICES_TRAVEL: "services_travel",
  FAQ: "faq",
  CONTACT: "contact",
  GUIDANCE_SCHOLARSHIP: "guidance_scholarship",
  GUIDANCE_COURSE: "guidance_course",
  GUIDANCE_VISA: "guidance_visa",
  GUIDANCE_PREDEPARTURE: "guidance_predeparture",
  TERMS: "terms",
  PRIVACY: "privacy",
} as const;

export type MarketingPageKey = (typeof MarketingPageKey)[keyof typeof MarketingPageKey];

export const ALL_MARKETING_PAGE_KEYS: readonly MarketingPageKey[] = Object.values(MarketingPageKey);

export function isMarketingPageKey(value: unknown): value is MarketingPageKey {
  return (
    typeof value === "string" && (ALL_MARKETING_PAGE_KEYS as readonly string[]).includes(value)
  );
}

/**
 * A CMS-managed page. `localizedContent` maps locale code to body,
 * enabling i18n fallback to the default language.
 */
export interface MarketingPage {
  readonly id: UUID;
  readonly key: MarketingPageKey;
  /** Per-locale body keyed by locale code. */
  readonly localizedContent: Readonly<Record<string, string>>;
  readonly status: PublicationStatus;
  readonly updatedAt: Timestamp;
}

export const StatisticKey = {
  PROGRAM_COUNT: "program_count",
  VISA_SUCCESS_RATE: "visa_success_rate",
  STUDENT_SATISFACTION_RATE: "student_satisfaction_rate",
} as const;

export type StatisticKey = (typeof StatisticKey)[keyof typeof StatisticKey];

export const ALL_STATISTIC_KEYS: readonly StatisticKey[] = Object.values(StatisticKey);

export function isStatisticKey(value: unknown): value is StatisticKey {
  return typeof value === "string" && (ALL_STATISTIC_KEYS as readonly string[]).includes(value);
}

/**
 * Whether a statistic is a count or a rate.
 * `count` must be a non-negative integer; `rate` must be 0–100.
 */
export const StatisticValueType = {
  COUNT: "count",
  RATE: "rate",
} as const;

export type StatisticValueType = (typeof StatisticValueType)[keyof typeof StatisticValueType];

export const ALL_STATISTIC_VALUE_TYPES: readonly StatisticValueType[] =
  Object.values(StatisticValueType);

export function isStatisticValueType(value: unknown): value is StatisticValueType {
  return (
    typeof value === "string" && (ALL_STATISTIC_VALUE_TYPES as readonly string[]).includes(value)
  );
}

export interface Statistic {
  readonly id: UUID;
  readonly key: StatisticKey;
  readonly valueType: StatisticValueType;
  readonly value: number;
  readonly updatedAt: Timestamp;
}
