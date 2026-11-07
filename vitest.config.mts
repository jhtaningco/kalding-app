import path from "node:path";
import { defineConfig } from "vitest/config";

// `src/core/` is pure TypeScript, so tests run in plain Node (no jsdom needed).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
