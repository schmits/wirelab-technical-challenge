import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",

    include: [
      "packages/**/*.test.ts",
      "apps/**/*.test.{ts,tsx}",
    ],

    setupFiles: ["apps/frontend/test/setup.ts"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: [
        "packages/shared/src/**/*.ts",
        "apps/backend/src/**/*.ts",
        "apps/frontend/app/**/*.tsx",
        "apps/dashboard/app/**/*.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "apps/frontend/.next/**",
        "apps/frontend/app/layout.tsx",
        "apps/dashboard/.next/**",
        "apps/dashboard/app/layout.tsx",
        "infra/**",
        "dist/**",
      ],
    },
  },
});
