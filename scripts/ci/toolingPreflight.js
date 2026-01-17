// scripts/ci/toolingPreflight.js
// @ts-check
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Object} PreflightIO
 * @property {(p: string) => string} readFile - Reads file content
 * @property {(code: number) => never} exit - Exits process with code
 * @property {(...args: any[]) => void} log - Logs success message
 * @property {(...args: any[]) => void} error - Logs error message
 */

/** @type {PreflightIO} */
const defaultIO = {
  readFile: (p) => fs.readFileSync(p, "utf8"),
  exit: (code) => process.exit(code),
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

/**
 * @param {string} repoRoot
 * @param {PreflightIO} [io]
 */
export function runPreflight(repoRoot = process.cwd(), io = defaultIO) {
  const { readFile, exit, log, error } = io;

  /**
   * @param {string} p
   * @returns {string}
   */
  function read(p) {
    try {
      return readFile(p);
    } catch (e) {
      if (/** @type {any} */(e).code === "ENOENT") {
        fail(`File not found: ${p}`);
      }
      throw e;
    }
  }

  /**
   * @param {string} msg
   * @returns {never}
   */
  function fail(msg) {
    error(`CI_PREFLIGHT_FAIL: ${msg}`);
    return exit(1);
  }

  const workflowPath = path.join(repoRoot, ".github/workflows/scope-drift-guard.yml");
  const workflow = read(workflowPath);
  // Check if pnpm/action-setup has a 'with: version:' block (not node-version)
  // Match pattern: pnpm/action-setup followed by 'with:' block containing 'version:' (not 'node-version')
  if (/pnpm\/action-setup@v\d+\s*\n\s*with:\s*\n\s*version:/m.test(workflow)) {
    fail("scope-drift-guard.yml pins pnpm version ('with: version:'). Remove it and rely on 'packageManager' in package.json for single-source truth.");
  }

  const rootPkgPath = path.join(repoRoot, "package.json");
  const rootPkg = JSON.parse(read(rootPkgPath));
  if (!rootPkg.packageManager || !/^pnpm@/.test(rootPkg.packageManager)) {
    fail("package.json must define packageManager: 'pnpm@x.y.z' for single-source pnpm versioning.");
  }

  const scPkgPath = path.join(repoRoot, "tools/scope-classifier/package.json");
  const scPkg = JSON.parse(read(scPkgPath));
  const testScript = scPkg.scripts?.test ?? "";
  // Check for precise command usage to ensure config is loaded
  if (!/vitest\s+run\s+-c\s+vitest\.config\.ts/.test(testScript)) {
    fail("tools/scope-classifier package.json scripts.test must be: 'vitest run -c vitest.config.ts' to enforce isolation.");
  }

  const scVitestCfgPath = path.join(repoRoot, "tools/scope-classifier/vitest.config.ts");
  const scVitestCfg = read(scVitestCfgPath);
  
  if (!/root:\s*__dirname/.test(scVitestCfg)) {
    fail("scope-classifier vitest.config.ts must set 'root: __dirname' to prevent upward config traversal.");
  }
  if (!/environment:\s*["']node["']/.test(scVitestCfg)) {
    fail("scope-classifier vitest.config.ts must set environment: 'node'");
  }
  if (/setupFiles\s*:/.test(scVitestCfg)) {
    fail("scope-classifier vitest.config.ts must not set 'setupFiles' (prevents root setup file leakage).");
  }

  log("CI_PREFLIGHT_PASS: Tooling configuration is valid.");
}

// Allow running directly via node
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
   runPreflight();
}
