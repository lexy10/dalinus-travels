import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Dependency rule (design.md "Layered Architecture"):
 * The service/domain layer is framework-agnostic. It MUST NOT import from
 * `next/*`, the adapter layer (`src/app`), or the infrastructure/adapter
 * layer (`src/infra`). Outer layers may depend on inner layers, never the
 * reverse. These restrictions are enforced below via `no-restricted-imports`.
 */
const forbiddenForServiceDomain = [
  {
    group: ["next", "next/*"],
    message:
      "Dependency rule: the service/domain layer must not import from `next/*`. Keep business logic framework-agnostic.",
  },
  {
    group: ["react", "react/*", "react-dom", "react-dom/*"],
    message:
      "Dependency rule: the service/domain layer must not import React. Keep business logic framework-agnostic.",
  },
  {
    group: [
      "@app/*",
      "@/app/*",
      "@infra/*",
      "@/infra/*",
      "@ui/*",
      "@/ui/*",
      "**/app/**",
      "**/infra/**",
      "**/ui/**",
    ],
    message:
      "Dependency rule: the service/domain layer must not import from the adapter/infrastructure/presentation layers (app, infra, ui). Depend on ports instead.",
  },
];

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
  }),
  {
    files: ["src/domain/**/*.{ts,tsx}", "src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbiddenForServiceDomain,
        },
      ],
    },
  },
];

export default eslintConfig;
