/**
 * TerraFusion Ops Health Report
 * - Produces a deterministic JSON report about repo hygiene and staging state.
 * - Designed to be CI-friendly and to stop "surprise diff entropy".
 *
 * Notes:
 * - This file intentionally lives under os-platform/core/pilot/** (governance surface).
 */

import { execFileSync } from "node:child_process";

export type GitStatusEntry = {
  code: string; // e.g. "??", " M", "A ", "AM"
  path: string;
};

export type OpsHealthReport = {
  ok: boolean;
  headSha?: string;
  branch?: string;
  staged: GitStatusEntry[];
  unstaged: GitStatusEntry[];
  untracked: GitStatusEntry[];
  findings: string[];
};

export type Exec = (cmd: string, args: string[]) => string;

const defaultExec: Exec = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();

/**
 * Parse git status --porcelain=v1 -z (NUL-separated).
 * This format is deterministic and machine-readable.
 *
 * Each record is:
 *   XY<space>path\0
 * where XY are status codes.
 *
 * If we ever see rename/copy records (with "->"), we keep the right-hand path.
 */
export function parseGitPorcelainZ(output: string): GitStatusEntry[] {
  if (!output) return [];

  const records = output.split("\0").filter(Boolean);
  const entries: GitStatusEntry[] = [];

  for (const rec of records) {
    // porcelain v1: first two chars are status, then a space, then path
    // Example: "?? pact/"
    if (rec.length < 4) continue;
    const code = rec.slice(0, 2);
    const rawPath = rec.slice(3);
    const path = rawPath.includes("->")
      ? rawPath.split("->").pop()!.trim()
      : rawPath.trim();
    entries.push({ code, path });
  }

  return entries;
}

/**
 * Classify entries into staged/unstaged/untracked.
 * Staged changes have a non-space in the first status column.
 * Unstaged changes have a non-space in the second status column.
 * Untracked is "??".
 */
export function classify(entries: GitStatusEntry[]): {
  staged: GitStatusEntry[];
  unstaged: GitStatusEntry[];
  untracked: GitStatusEntry[];
} {
  const staged: GitStatusEntry[] = [];
  const unstaged: GitStatusEntry[] = [];
  const untracked: GitStatusEntry[] = [];

  for (const e of entries) {
    if (e.code === "??") {
      untracked.push(e);
      continue;
    }
    const x = e.code[0];
    const y = e.code[1];
    if (x !== " ") staged.push(e);
    if (y !== " ") unstaged.push(e);
  }

  return { staged, unstaged, untracked };
}

/**
 * Compute report and enforce simple hygiene policies:
 * - If pact/ appears untracked, flag it as "expected to be ignored" (Phase 206A).
 * - If staged set contains files outside an allowlist, warn (prevents accidental commits).
 *
 * The allowlist is intentionally tiny; this tool is "safety rails", not a judge.
 */
export function computeOpsHealthReport(opts?: {
  exec?: Exec;
  allowedStagePrefixes?: string[];
}): OpsHealthReport {
  const exec = opts?.exec ?? defaultExec;
  const allowedStagePrefixes = opts?.allowedStagePrefixes ?? [
    "os-platform/core/",
    "tools/",
    ".github/workflows/",
    ".gitignore",
    "package.json",
    "tsconfig.core.json",
  ];

  const findings: string[] = [];

  const headSha = safe(() => exec("git", ["rev-parse", "HEAD"]));
  const branch = safe(() =>
    exec("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
  );

  const porcelainZ =
    safe(() => exec("git", ["status", "--porcelain=v1", "-z"])) ?? "";
  const entries = parseGitPorcelainZ(porcelainZ);
  const { staged, unstaged, untracked } = classify(entries);

  // Policy: pact/ should not appear as untracked noise.
  const pactUntracked = untracked.some(
    (e) => e.path === "pact/" || e.path.startsWith("pact/"),
  );
  if (pactUntracked) {
    findings.push(
      "Untracked pact/ detected (expected to be ignored via .gitignore in Phase 206A).",
    );
  }

  // Policy: staged items should be intentionally scoped.
  const disallowedStaged = staged.filter(
    (e) => !isAllowedPath(e.path, allowedStagePrefixes),
  );
  if (disallowedStaged.length > 0) {
    findings.push(
      `Staged changes include paths outside allowlist: ${disallowedStaged
        .map((x) => x.path)
        .join(", ")}`,
    );
  }

  const ok = findings.length === 0;

  return {
    ok,
    headSha: headSha ?? undefined,
    branch: branch ?? undefined,
    staged,
    unstaged,
    untracked,
    findings,
  };
}

function isAllowedPath(path: string, prefixes: string[]): boolean {
  for (const p of prefixes) {
    if (p.endsWith("/")) {
      if (path.startsWith(p)) return true;
    } else if (path === p || path.startsWith(`${p}/`)) {
      return true;
    }
  }
  return false;
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/**
 * CLI mode:
 *   node ops-health-report.ts
 * Prints JSON to stdout. Exits 0 if ok, 2 if findings exist.
 */
if (require.main === module) {
  const report = computeOpsHealthReport();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.ok ? 0 : 2);
}
