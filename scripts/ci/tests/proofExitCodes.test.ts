// scripts/ci/tests/proofExitCodes.test.ts
import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

describe("Governance Script Exit Codes", () => {
  let tmpRepoRoot;
  let gitDir;

  beforeEach(() => {
    tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exit-code-test-"));
    gitDir = path.join(tmpRepoRoot, ".git");
    fs.mkdirSync(gitDir);
  });

  afterEach(() => {
    fs.rmSync(tmpRepoRoot, { recursive: true, force: true });
  });

  it("gitStateSanity exits with code 3 and matches prefix on failure", async () => {
    // Poison the git state
    fs.writeFileSync(path.join(gitDir, "MERGE_HEAD"), "bad_hash");

    // Run the script pointing to the temp repo
    // We need to run it in a way that it finds the .git dir.
    // The script looks at process.cwd()/.git
    
    const scriptPath = path.resolve("scripts/ci/gitStateSanity.js");
    
    try {
      await execAsync(`node "${scriptPath}"`, { cwd: tmpRepoRoot });
      throw new Error("Script should have failed");
    } catch (error) {
      expect(error.code).toBe(3);
      expect(error.stderr).toContain("GIT_STATE_FAIL");
      expect(error.stderr).toContain("MERGE_HEAD");
      expect(error.stderr).toContain("git merge --abort");
    }
  });

  it("gitStateSanity exits with code 0 on clean state", async () => {
    const scriptPath = path.resolve("scripts/ci/gitStateSanity.js");
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, { cwd: tmpRepoRoot });
    
    expect(stdout).toContain("GIT_STATE_OK");
    expect(stderr).toBe("");
  });
});
