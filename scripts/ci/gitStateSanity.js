// scripts/ci/gitStateSanity.js
// @ts-check
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "url";

// Get repo root properly
const __filename = fileURLToPath(import.meta.url);
const startCwd = process.cwd();
// We assume we are running from repo root usually, but let's be safe relative to script location
// script is in scripts/ci/, so repo root is ../../
// BUT usually process.cwd() is repo root. Let's stick to process.cwd() for consistency with other scripts.
const gitDir = path.join(startCwd, ".git");

// List of dangerous state files/dirs that indicate an in-progress operation
const DANGEROUS_PATHS = [
  "MERGE_HEAD",
  "REBASE_HEAD",
  "rebase-apply",
  "rebase-merge",
  "CHERRY_PICK_HEAD",
  "BISECT_LOG",
  "REVERT_HEAD"
];

export function checkGitState(mockGitDir = gitDir) {
  if (!fs.existsSync(mockGitDir)) {
    // If we are in a disconnected checkout or something odd, we might warn but not fail?
    // But for governance proof, we expect a real git repo.
    // However, if we just cloned and there is no .git folder (unlikely in CI), we just warn.
    // Actually, .git might be a file (worktree).
    try {
        const stats = fs.statSync(mockGitDir);
        if (stats.isFile()) {
            // It's a worktree or submodule link, skip complex checks for now
             console.warn(`WARN: .git is a file at ${mockGitDir}. Skipping simple State check.`);
             return [];
        }
    } catch(e) {
         console.warn(`WARN: .git not found at ${mockGitDir}. Skipping git state check.`);
         return [];
    }
  }

  // Map files to specific remediation commands
  const REMEDIATION = {
    MERGE_HEAD: "git merge --abort",
    REBASE_HEAD: "git rebase --abort",
    "rebase-apply": "git rebase --abort",
    "rebase-merge": "git rebase --abort",
    CHERRY_PICK_HEAD: "git cherry-pick --abort",
    BISECT_LOG: "git bisect reset",
    REVERT_HEAD: "git revert --abort",
  };

  const foundDangerous = [];

  for (const p of DANGEROUS_PATHS) {
    if (fs.existsSync(path.join(mockGitDir, p))) {
      foundDangerous.push(p);
    }
  }

  if (foundDangerous.length > 0) {
    console.error("\n❌ GIT_STATE_FAIL: In-progress git operation detected!");
    console.error(`   Found: ${foundDangerous.join(", ")}`);
    
    console.error("\n   Recovery Hints:");
    // Deduplicate hints
    const hints = new Set();
    for (const p of foundDangerous) {
        if (REMEDIATION[p]) {
            hints.add(REMEDIATION[p]);
        }
    }
    
    for (const hint of hints) {
        console.error(`   - ${hint}`);
    }
    console.error(""); // Newline

    return foundDangerous; 
  }

  console.log("GIT_STATE_OK: No in-progress operations detected.");
  return [];
}

// Run if called directly
if (process.argv[1] === __filename) {
  const issues = checkGitState();
  if (issues && issues.length > 0) {
      console.error("   The repository must be in a clean state to run governance proof.");
      // Hints are printed by the function above
      process.exit(3); // Distinct exit code as requested (3)
  }
  process.exit(0);
}
