#!/usr/bin/env node
/**
 * Ratchet Guard (Gen2 UI strict mode)
 * ----------------------------------
 * Enforces: if scoped paths are touched, the ratchet metric must improve by >= minDelta.
 *
 * Design:
 * - Reads base ratchet from `git show <mergeBase>:<baselineFile>` (no worktree needed).
 * - Reads head ratchet from the current baseline file on disk.
 * - If scoped paths are untouched, exits 0 (no-op).
 * - If scoped paths are touched but ratchet didn't improve enough, exits 1.
 *
 * Usage (CI):
 *   node tools/registry/ratchet_guard.mjs --minDelta 1 --baseRef origin/main
 *
 * Usage (local):
 *   node tools/registry/ratchet_guard.mjs --minDelta 1 --baseRef HEAD~1
 *
 * Environment:
 *   RATCHET_BASE_REF      - base ref (default: origin/main, or GITHUB_BASE_REF)
 *   RATCHET_MIN_DELTA     - minimum improvement required (default: 1)
 *   RATCHET_SCOPE         - comma-separated scope patterns (default: apps/os-shell/**,packages/ui/**)
 *   RATCHET_BASELINE_FILE - baseline JSON file path (default: ui-token-baseline.json)
 *   DEBUG_RATCHET_GUARD   - set to "1" for verbose output
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// ── Helpers ──────────────────────────────────────────────────────

function sh(cmd, args) {
  return execFileSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function parseArgs(argv) {
  const out = {
    baseRef: process.env.RATCHET_BASE_REF || process.env.GITHUB_BASE_REF || "origin/main",
    minDelta: Number(process.env.RATCHET_MIN_DELTA || "1"),
    scope: (process.env.RATCHET_SCOPE || "apps/os-shell/**,packages/ui/**").split(",").map(s => s.trim()).filter(Boolean),
    baselineFile: process.env.RATCHET_BASELINE_FILE || "ui-token-baseline.json",
    debug: process.env.DEBUG_RATCHET_GUARD === "1",
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--baseRef") out.baseRef = argv[++i] || out.baseRef;
    else if (a === "--minDelta") out.minDelta = Number(argv[++i] || out.minDelta);
    else if (a === "--scope") out.scope = (argv[++i] || "").split(",").map(s => s.trim()).filter(Boolean);
    else if (a === "--baselineFile") out.baselineFile = argv[++i] || out.baselineFile;
    else if (a === "--debug") out.debug = true;
  }
  return out;
}

/**
 * Minimalist glob matcher for scope detection:
 * - "prefix/**" matches any file under prefix/
 * - "prefix/" matches any file starting with prefix/
 * - exact match or prefix + "/" match
 */
export function isInScope(file, scopePatterns) {
  return scopePatterns.some((pat) => {
    const p = pat.replace(/\\/g, "/");
    const f = file.replace(/\\/g, "/");
    if (p.endsWith("/**")) {
      const prefix = p.slice(0, -3);
      return f.startsWith(prefix);
    }
    if (p.endsWith("/")) return f.startsWith(p);
    return f === p || f.startsWith(p + "/");
  });
}

/**
 * Extract violationCount from a JSON string.
 * Expects `{ "violationCount": <number> }`.
 */
export function extractViolationCount(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (typeof parsed.violationCount !== "number") {
    throw new Error("Baseline JSON missing numeric 'violationCount' field.");
  }
  return parsed.violationCount;
}

// ── Git operations ───────────────────────────────────────────────

function getMergeBase(baseRef) {
  try {
    sh("git", ["rev-parse", "--verify", baseRef]);
  } catch {
    sh("git", ["fetch", "--no-tags", "--depth=50", "origin", baseRef.replace(/^origin\//, "")]);
  }
  const mb = sh("git", ["merge-base", baseRef, "HEAD"]).trim();
  if (!mb) throw new Error(`Unable to compute merge-base for ${baseRef}..HEAD`);
  return mb;
}

function listChangedFiles(mergeBaseSha) {
  const raw = sh("git", ["diff", "--name-only", `${mergeBaseSha}...HEAD`]).trim();
  if (!raw) return [];
  return raw.split("\n").map(s => s.trim()).filter(Boolean);
}

function readBaselineFromRef(ref, filePath) {
  const raw = sh("git", ["show", `${ref}:${filePath}`]);
  return extractViolationCount(raw);
}

// ── Main entry ───────────────────────────────────────────────────

async function main() {
  const cfg = parseArgs(process.argv);

  // 1. Compute merge base
  const mergeBase = getMergeBase(cfg.baseRef);

  // 2. Detect scoped changes
  const changed = listChangedFiles(mergeBase);
  const scopedTouched = changed.some(f => isInScope(f, cfg.scope));

  if (cfg.debug) {
    console.log(JSON.stringify({ mergeBase, changedCount: changed.length, scopedTouched, scope: cfg.scope }, null, 2));
  }

  if (!scopedTouched) {
    console.log("Ratchet Guard: scoped paths not touched; skipping strict ratchet enforcement.");
    process.exit(0);
  }

  // 3. Read base ratchet (from merge-base commit)
  let baseVal;
  try {
    baseVal = readBaselineFromRef(mergeBase, cfg.baselineFile);
  } catch (err) {
    // Baseline didn't exist on base — first run, nothing to enforce against.
    console.log(`Ratchet Guard: no baseline found on base commit (${mergeBase.slice(0, 8)}); skipping.`);
    if (cfg.debug) console.log("  Detail:", err?.message);
    process.exit(0);
  }

  // 4. Read head ratchet (current working tree)
  let headVal;
  try {
    const headJson = readFileSync(cfg.baselineFile, "utf8");
    headVal = extractViolationCount(headJson);
  } catch (err) {
    console.error(`Ratchet Guard: cannot read head baseline from '${cfg.baselineFile}'.`);
    console.error("  Run the audit first: pnpm tdc:ui:tokens");
    process.exit(2);
  }

  // 5. Compare
  const delta = baseVal - headVal; // positive = improvement

  console.log(`Ratchet Guard: base=${baseVal} head=${headVal} improvement=${delta} required=${cfg.minDelta}`);

  if (delta < cfg.minDelta) {
    console.error(
      `FAIL: Scoped UI paths changed, but ratchet improvement (${delta}) < required (${cfg.minDelta}).\n` +
      `Requirement: head <= base - ${cfg.minDelta}\n`
    );
    process.exit(1);
  }

  console.log("Ratchet Guard: PASSED ✅");
  process.exit(0);
}

main().catch((err) => {
  console.error("Ratchet Guard error:", err?.stack || err);
  process.exit(1);
});
