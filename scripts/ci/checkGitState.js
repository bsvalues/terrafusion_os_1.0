// scripts/ci/checkGitState.js
// @ts-check
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, ".git");

// List of dangerous state files that indicate an in-progress operation
const DANGEROUS_FILES = [
  "MERGE_HEAD",
  "REBASE_HEAD",
  "CHERRY_PICK_HEAD",
  "BISECT_LOG",
  "REVERT_HEAD"
];

export function checkGitState(mockGitDir = gitDir) {
  if (!fs.existsSync(mockGitDir)) {
    console.warn(`WARN: .git directory not found at ${mockGitDir}. Skipping git state check.`);
    return;
  }

  const foundDangerous = [];

  for (const file of DANGEROUS_FILES) {
    if (fs.existsSync(path.join(mockGitDir, file))) {
      foundDangerous.push(file);
    }
  }

  if (foundDangerous.length > 0) {
    console.error("\n❌ GIT_STATE_FAIL: In-progress git operation detected!");
    console.error(`   Found: ${foundDangerous.join(", ")}`);
    return foundDangerous; // Return for testing
  }

  console.log("GIT_STATE_OK: No in-progress operations detected.");
  return [];
}

// Run if called directly
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const issues = checkGitState();
  if (issues && issues.length > 0) {
      console.error("GIT_STATE_FAIL: In-progress git operation detected!");
      console.error(`   Found: ${issues.join(", ")}`);
      console.error("   The repository must be in a clean state to run governance proof.");
      console.error("   Please finish or abort the operation (e.g., 'git merge --abort').\n");
      process.exit(3);
  }
}
