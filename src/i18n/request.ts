import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * next-intl request configuration.
 *
 * Loads the message catalog for the active locale (English by default,
 * Requirements 21.1/21.2). Full message-resolution fallback to the default
 * language (Requirements 21.4) is implemented in task 19.1; this scaffold wires
 * the catalog loading so the app renders.
 */
export default getRequestConfig(async () => {
  const locale = routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
