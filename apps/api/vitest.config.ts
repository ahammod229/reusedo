import { defineConfig } from "vitest/config";

// Integration tests: they run against the local Supabase stack (`supabase start` at the
// repo root) and stub Firebase token checks. Files run one after another because they
// share one database.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
