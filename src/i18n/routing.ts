import { defineRouting } from "next-intl/routing";

/**
 * i18n routing configuration.
 *
 * English is the default locale (Requirements 21.1). The catalog list is
 * externalized so additional languages can be added later without structural
 * rework (Requirements 21.2). Message resolution falls back to the default
 * locale when a key is missing (Requirements 21.4) - see `request.ts`.
 */
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
