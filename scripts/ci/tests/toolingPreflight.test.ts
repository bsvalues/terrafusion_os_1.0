import { describe, expect, it } from "vitest";
import { runPreflight } from "../toolingPreflight.js";

/**
 * IO injection test harness - zero mocks, pure fixtures
 */
interface TestIO {
  readFile: (p: string) => string;
  exit: (code: number) => never;
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface TestResult {
  exitCode: number | null;
  logs: string[];
  errors: string[];
}

function createTestIO(files: Record<string, string>): { io: TestIO; result: TestResult } {
  const result: TestResult = { exitCode: null, logs: [], errors: [] };
  
  const io: TestIO = {
    readFile: (p: string) => {
      // Normalize path for cross-platform matching
      const normalizedPath = p.replace(/\\/g, "/");
      // CRITICAL: Find the LONGEST matching key (most specific match).
      // This prevents "/mock/repo/tools/scope-classifier/package.json" from
      // incorrectly matching "package.json" instead of "tools/scope-classifier/package.json".
      // See regression test: "harness resolves scoped package.json over root"
      const matchingKeys = Object.keys(files).filter((k) => normalizedPath.endsWith(k));
      const key = matchingKeys.sort((a, b) => b.length - a.length)[0];
      if (key) return files[key];
      const error = new Error(`ENOENT: no such file or directory, open '${p}'`);
      (error as NodeJS.ErrnoException).code = "ENOENT";
      throw error;
    },
    exit: (code: number) => {
      result.exitCode = code;
      throw new Error(`EXIT:${code}`);
    },
    log: (...args: unknown[]) => {
      result.logs.push(args.map(String).join(" "));
    },
    error: (...args: unknown[]) => {
      result.errors.push(args.map(String).join(" "));
    },
  };

  return { io, result };
}

// Default valid fixture files
const VALID_FILES: Record<string, string> = {
  ".github/workflows/scope-drift-guard.yml": `
name: Scope Drift Guard
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
`,
  "package.json": JSON.stringify({ packageManager: "pnpm@9.0.0" }),
  "tools/scope-classifier/package.json": JSON.stringify({
    scripts: { test: "vitest run -c vitest.config.ts" },
  }),
  "tools/scope-classifier/vitest.config.ts": `
export default {
  test: {
    root: __dirname,
    environment: "node",
  }
}
`,
};

describe("toolingPreflight", () => {
  describe("runPreflight", () => {
    it("passes on valid config", () => {
      const { io, result } = createTestIO(VALID_FILES);
      runPreflight("/mock/repo", io);
      expect(result.exitCode).toBeNull();
      expect(result.logs).toContainEqual(expect.stringContaining("CI_PREFLIGHT_PASS"));
    });

    it("fails if workflow pins pnpm version", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        ".github/workflows/scope-drift-guard.yml": `
          - uses: pnpm/action-setup@v4
            with:
               version: 8.0.0
        `,
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("pins pnpm version"));
    });

    it("fails if package.json missing packageManager", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        "package.json": JSON.stringify({}),
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("must define packageManager"));
    });

    it("fails if scope-classifier test script is loose", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        "tools/scope-classifier/package.json": JSON.stringify({
          scripts: { test: "vitest run" },
        }),
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("vitest run -c vitest.config.ts"));
    });

    it("fails if scope-classifier vitest config missing root: __dirname", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        "tools/scope-classifier/vitest.config.ts": `export default { test: { environment: 'node' } }`,
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("must set 'root: __dirname'"));
    });

    it("fails if scope-classifier vitest config missing environment: node", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        "tools/scope-classifier/vitest.config.ts": `export default { test: { root: __dirname } }`,
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("must set environment: 'node'"));
    });

    it("fails if scope-classifier vitest config has setupFiles", () => {
      const { io, result } = createTestIO({
        ...VALID_FILES,
        "tools/scope-classifier/vitest.config.ts": `export default { test: { root: __dirname, environment: 'node', setupFiles: ['./setup.ts'] } }`,
      });
      expect(() => runPreflight("/mock/repo", io)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("must not set 'setupFiles'"));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Harness Regression Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe("createTestIO harness", () => {
    it("resolves scoped package.json over root when both exist (regression)", () => {
      // This test guards against a subtle bug where a naive endsWith() check
      // would return the root "package.json" instead of the more specific
      // "tools/scope-classifier/package.json" when looking up a scoped path.
      const files: Record<string, string> = {
        "package.json": '{"root": true}',
        "tools/scope-classifier/package.json": '{"scoped": true}',
      };
      const { io } = createTestIO(files);

      // Simulate what runPreflight does: reads the scoped package.json
      const scopedPath = "/mock/repo/tools/scope-classifier/package.json";
      const content = io.readFile(scopedPath);

      // MUST return the scoped version, not the root
      expect(JSON.parse(content)).toEqual({ scoped: true });
    });

    it("falls back to shorter suffix when no longer match exists", () => {
      const files: Record<string, string> = {
        "package.json": '{"root": true}',
      };
      const { io } = createTestIO(files);

      // Reading root package.json should still work
      const rootPath = "/mock/repo/package.json";
      const content = io.readFile(rootPath);
      expect(JSON.parse(content)).toEqual({ root: true });
    });
  });
});
