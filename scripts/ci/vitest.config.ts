/// <reference types="vitest" />
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for CI governance tests.
 * Isolated from root config - no jsdom, no setupFiles, Node environment only.
 */
export default defineConfig({
  test: {
    root: __dirname,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**"],
    environment: "node",
    globals: true,
    isolate: true,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@ci": path.resolve(__dirname, "."),
    },
  },
});
