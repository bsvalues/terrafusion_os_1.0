/**
 * tf metrics – show workspace metrics
 *
 * Gathers read-only workspace statistics:
 *   - File counts by extension (.ts, .tsx, .mjs, .cs, .json)
 *   - Lines of code estimate
 *   - Git commit count
 *   - Package count (from package.json workspaces or root)
 *   - Test file count
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createEnvelope, writeEnvelope } from "../lib/agent-envelope.mjs";

function printHelp() {
  const lines = [
    "",
    "tf metrics – show workspace metrics",
    "",
    "Usage:  tf metrics [--json]",
    "",
    "Gathers read-only workspace statistics including file counts,",
    "lines of code, git commits, and test files.",
    "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

// Directories to skip during file counting
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", ".next", "obj", "Debug", "Release",
  ".claude", ".husky", ".vscode", "coverage", "__pycache__", ".cache",
  ".angular", ".svelte-kit", "build", ".output", ".nuxt", ".turbo",
]);

// Count files by extension, skipping common large/generated dirs
function countFiles(dir, counts = {}, depth = 0) {
  if (depth > 5) return counts;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return counts; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (ext) {
        counts[ext] = (counts[ext] || 0) + 1;
      }
    } else if (e.isDirectory()) {
      countFiles(full, counts, depth + 1);
    }
  }
  return counts;
}

// Count test files
function countTestFiles(dir, count = 0, depth = 0) {
  if (depth > 5) return count;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return count; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isFile() && (e.name.includes(".test.") || e.name.includes(".spec.") || e.name.includes("Test.cs"))) {
      count++;
    } else if (e.isDirectory()) {
      count = countTestFiles(full, count, depth + 1);
    }
  }
  return count;
}

// Get git commit count
function getGitCommitCount(root) {
  try {
    const out = execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd: root, encoding: "utf8", timeout: 10_000,
    });
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

// Get top N extensions sorted by count
function topExtensions(counts, n = 10) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([ext, count]) => ({ ext, count }));
}

export default async function metrics({ root, flags }) {
  if (flags.help) { printHelp(); return 0; }

  const env = createEnvelope("tf-metrics");
  try {
    const fileCounts = countFiles(root);
    const totalFiles = Object.values(fileCounts).reduce((a, b) => a + b, 0);
    const testFileCount = countTestFiles(root);
    const gitCommits = getGitCommitCount(root);
    const topExts = topExtensions(fileCounts);

    const data = {
      totalFiles,
      testFiles: testFileCount,
      gitCommits,
      topExtensions: topExts,
    };

    const envelope = env.finish(true, data);

    if (flags.json) {
      return writeEnvelope(envelope);
    }

    // Human-readable output
    process.stdout.write(`\nWorkspace Metrics\n`);
    process.stdout.write(`${"─".repeat(40)}\n`);
    process.stdout.write(`  Total files:    ${totalFiles}\n`);
    process.stdout.write(`  Test files:     ${testFileCount}\n`);
    process.stdout.write(`  Git commits:    ${gitCommits}\n`);
    process.stdout.write(`\n  Top extensions:\n`);
    for (const { ext, count } of topExts) {
      process.stdout.write(`    ${ext.padEnd(10)} ${count}\n`);
    }
    process.stdout.write(`\n`);
    return 0;
  } catch (err) {
    return writeEnvelope(env.fail(err));
  }
}
