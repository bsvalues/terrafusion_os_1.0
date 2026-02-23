/**
 * Tier preflight: verifies that every TDC target file exists in the worktree.
 *
 * Prevents burning phases on phantom/renamed targets (e.g., interaction-states.css).
 * Produces a deterministic, copy-pastable "next targets" list for the next tier wave.
 *
 * Usage (CLI):
 *   npx tsx tools/ui-tokens/tier-preflight.ts --tier 7 --targets <file1> <file2> ...
 *
 * Exit codes: 0 = all present, 2 = usage error, 3 = at least one missing.
 */

import fs from "node:fs";
import path from "node:path";

interface PreflightArgs {
  tier: number;
  targets: string[];
}

function parseArgs(argv: string[]): PreflightArgs {
  const args = argv.slice(2);
  let tier: number | undefined;
  const targets: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "--tier") {
      const v = args[i + 1];
      if (!v) throw new Error("Missing value after --tier");
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid tier: ${v}`);
      tier = n;
      i++;
      continue;
    }

    if (a === "--targets") {
      for (let j = i + 1; j < args.length; j++) targets.push(args[j]);
      break;
    }

    targets.push(a);
  }

  if (!tier) throw new Error("Missing required --tier <number>");
  if (targets.length === 0)
    throw new Error("No targets provided. Use --targets <file...>");

  return { tier, targets };
}

function normalizeRepoRelative(p: string): string {
  return p.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function runTierPreflight(
  repoRoot: string,
  tier: number,
  targets: string[]
): number {
  const normalized = targets.map(normalizeRepoRelative);

  const missing: string[] = [];
  const present: string[] = [];

  for (const t of normalized) {
    if (fs.existsSync(path.join(repoRoot, t))) present.push(t);
    else missing.push(t);
  }

  present.sort();
  missing.sort();

  console.log(`TDC Tier Preflight Report`);
  console.log(`Tier: ${tier}`);
  console.log(`Targets provided: ${targets.length}`);
  console.log(`Present: ${present.length}`);
  console.log(`Missing: ${missing.length}`);
  console.log("");

  if (present.length) {
    console.log("Present targets (sorted):");
    for (const p of present) console.log(`  ✅ ${p}`);
    console.log("");
  }

  if (missing.length) {
    console.log("Missing targets (sorted):");
    for (const m of missing) console.log(`  ❌ ${m}`);
    console.log("");
    return 3;
  }

  console.log("All targets exist. Sweep order:");
  for (const p of present) console.log(`  → ${p}`);

  return 0;
}

/* CLI entry point */
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

if (isMain) {
  try {
    const { tier, targets } = parseArgs(process.argv);
    process.exitCode = runTierPreflight(process.cwd(), tier, targets);
  } catch (err) {
    console.error(`Usage error: ${(err as Error).message}`);
    process.exitCode = 2;
  }
}
