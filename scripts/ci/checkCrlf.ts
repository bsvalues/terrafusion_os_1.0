#!/usr/bin/env node
// @ts-check
/**
 * CRLF Guard for Shell Scripts
 *
 * Scans tracked .sh files for CRLF line endings which break bash execution.
 * Part of TerraFusion governance pipeline.
 *
 * Exit codes:
 *   0 - All shell scripts have LF endings
 *   1 - CRLF detected in one or more scripts
 *   2 - Error during scan
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

interface CrlfIO {
  exec: (cmd: string) => string;
  readFile: (path: string) => Buffer;
  exit: (code: number) => never;
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const defaultIO: CrlfIO = {
  exec: (cmd) => execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8" }),
  readFile: (path) => readFileSync(path),
  exit: (code) => process.exit(code),
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

/**
 * Run CRLF check on tracked shell scripts
 */
export function runCrlfCheck(io: CrlfIO = defaultIO, repoRoot: string = REPO_ROOT): never {
  io.log("[checkCrlf] Scanning tracked *.sh files for CRLF...");

  // Get list of tracked .sh files
  let output: string;
  try {
    output = io.exec('git ls-files "*.sh"').trim();
  } catch (execErr) {
    io.error(`[checkCrlf] Error running git: ${(execErr as Error).message}`);
    return io.exit(2);
  }

  if (!output) {
    io.log("[checkCrlf] No tracked *.sh files found. OK.");
    return io.exit(0);
  }

  const files = output.split("\n").map(f => f.trim()).filter(Boolean);
  io.log(`[checkCrlf] Found ${files.length} shell script(s) to check.`);

  const crlfFiles: string[] = [];

  for (const file of files) {
    const fullPath = resolve(repoRoot, file);
    try {
      const content = io.readFile(fullPath);
      // Check for CR byte (0x0D) which indicates CRLF
      if (content.includes(0x0d)) {
        crlfFiles.push(file);
      }
    } catch (readErr) {
      io.error(`[checkCrlf] Warning: Could not read ${file}: ${(readErr as Error).message}`);
    }
  }

  if (crlfFiles.length > 0) {
    io.error("\n[checkCrlf] ❌ CRLF DETECTED in shell scripts:");
    for (const f of crlfFiles) {
      io.error(`  - ${f}`);
    }
    io.error("\nFix with: git ls-files '*.sh' | xargs dos2unix");
    io.error("Or: git add --renormalize .");
    return io.exit(1);
  }

  io.log(`[checkCrlf] ✅ All ${files.length} shell scripts have LF line endings.`);
  return io.exit(0);
}

// Run if executed directly
if (process.argv[1] === __filename) {
  runCrlfCheck();
}
