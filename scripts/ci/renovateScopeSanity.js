import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../");

// Configuration
const CONFIG = {
  renovatePath: "renovate.json", // Relative to repoRoot
  snapshotPath: "governance-renovate-scope-snapshot.json",
  maxScope: process.env.RENOVATE_SCOPE_MAX ? parseInt(process.env.RENOVATE_SCOPE_MAX) : 60,
  safePatternRegex: /^([\w\-\./]+\/\*\*|[\w\-\./]+)$/, // Allows "dir/**" or "file.json"
  targetFiles: ["package.json"] // Only count package.json files for "scope explosion" check
};

// IO Interfaces (Injected for testing)
const defaultIO = {
  readJson: (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), "utf-8")),
  writeJson: (p, data) => fs.writeFileSync(path.join(repoRoot, p), JSON.stringify(data, null, 2)),
  listFiles: () => {
    try {
      // Get all tracked files, filtered to targets (package.json) to measure scope impact
      const allFiles = execSync("git ls-files", { cwd: repoRoot, encoding: "utf-8" }).split(/\r?\n/).filter(Boolean);
      return allFiles.filter(f => f.endsWith("package.json"));
    } catch (e) {
      console.error("Warning: git ls-files failed, returning empty list.");
      return [];
    }
  },
  log: console.log,
  error: console.error,
  exit: process.exit
};

export function validateRenovateScope(io = defaultIO) {
  io.log("🔍 Verifying Renovate Scope Safety...");

  let config;
  try {
    config = io.readJson(CONFIG.renovatePath);
  } catch (e) {
    io.error(`❌ RENOVATE_SCOPE_FAIL: Could not read ${CONFIG.renovatePath}`);
    return io.exit(1);
  }

  // 1. Check includePaths existence
  if (!config.includePaths || !Array.isArray(config.includePaths)) {
    io.error("❌ RENOVATE_SCOPE_FAIL: 'includePaths' is missing or not an array.");
    io.error("   Renovate is unsafe! It will scan all 700+ manifests.");
    return io.exit(1);
  }

  // 2. Validate Pattern Safety
  const unsafePatterns = config.includePaths.filter(p => {
    // We only allow: absolute paths (no start glob), exact files, or directory prefixes ending in /**
    // Disallow: ** at start, * in middle
    if (p.startsWith("**")) return true;
    if (p.includes("*") && !p.endsWith("/**")) return true;
    return false;
  });

  if (unsafePatterns.length > 0) {
    io.error("❌ RENOVATE_SCOPE_FAIL: Unsafe glob patterns detected in 'includePaths'.");
    io.error("   Allowed: 'dir/**', 'file.json'");
    io.error("   Disallowed: '**/*', '**/file', 'dir/*/file'");
    io.error("   Unsafe Patterns:", unsafePatterns);
    return io.exit(1);
  }

  // 3. Calculate Effective Scope
  // We simulate Renovate's matching:
  // - Valid includePaths are either Exact Matches or Directory Prefixes (ending in /**)
  const allManifests = io.listFiles(); // All tracked package.json files
  
  const matches = allManifests.filter(file => {
    return config.includePaths.some(pattern => {
      if (pattern.endsWith("/**")) {
        const dirPrefix = pattern.slice(0, -3); // remove /**
        return file.startsWith(dirPrefix);
      }
      return file === pattern;
    });
  });

  const count = matches.length;
  io.log(`   Effective Scope: ${count} manifests matched.`);

  // 4. Generate Snapshot
  const snapshot = {
      timestamp: new Date().toISOString(),
      config: {
          maxScope: CONFIG.maxScope,
          includePaths: config.includePaths
      },
      metrics: {
          matchedCount: count,
          totalManifests: allManifests.length
      },
      status: count > CONFIG.maxScope ? "FAIL" : "OK",
      matches: matches.sort()
  };

  try {
      io.writeJson(CONFIG.snapshotPath, snapshot);
      io.log(`   📸 Snapshot written to ${CONFIG.snapshotPath}`);
  } catch (e) {
      io.error(`   ⚠️ Failed to verify/write snapshot: ${e.message}`);
  }

  if (count > CONFIG.maxScope) {
    io.error(`❌ RENOVATE_SCOPE_FAIL: Scope too large (${count} > ${CONFIG.maxScope}).`);
    io.error("   Tighten 'includePaths' to reduce scan surface.");
    return io.exit(1);
  }

  io.log(`✅ RENOVATE_SCOPE_OK: ${count} tracked manifests (Safety Limit: ${CONFIG.maxScope})`);
  return io.exit(0);
}

// Execute if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateRenovateScope();
}
