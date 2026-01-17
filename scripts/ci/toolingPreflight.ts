// scripts/ci/toolingPreflight.ts
import fs from "node:fs";
import path from "node:path";

function read(p: string) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      fail(`File not found: ${p}`);
    }
    throw e;
  }
}

function fail(msg: string): never {
  console.error(`CI_PREFLIGHT_FAIL: ${msg}`);
  process.exit(1);
}

export function runPreflight(repoRoot = process.cwd()) {
  const workflowPath = path.join(repoRoot, ".github/workflows/scope-drift-guard.yml");
  const workflow = read(workflowPath);
  if (/pnpm\/action-setup@v4[\s\S]*version:\s*/m.test(workflow)) {
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

  console.log("CI_PREFLIGHT_PASS: Tooling configuration is valid.");
}

// Allow running directly
if (typeof require !== 'undefined' && require.main === module) {
    runPreflight();
} else if (import.meta.url === `file://${process.argv[1]}`) {
   // ESM check if we switch to module execution
   runPreflight();
}
