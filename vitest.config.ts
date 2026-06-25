import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the Edu-Travel Platform.
 *
 * - `resolve.tsconfigPaths` makes Vitest resolve the project path aliases
 *   declared in `tsconfig.json` (`@/*`, `@domain/*`, `@services/*`, `@ports/*`,
 *   `@infra/*`, `@app/*`, `@i18n/*`, `@ui/*`) so tests import
 *   modules the same way application code does.
 * - `setupFiles` loads the fast-check global configuration (minimum 100
 *   iterations for every property-based test) before any test runs.
 * - `globals` is disabled; tests import `describe`/`it`/`expect` explicitly to
 *   keep the framework-agnostic service/domain layer honest.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./test/setup/fast-check.setup.ts"],
  },
});
