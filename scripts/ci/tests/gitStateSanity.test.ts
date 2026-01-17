// scripts/ci/tests/gitStateSanity.test.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkGitState } from "../gitStateSanity.js";

describe("checkGitState in gitStateSanity.js", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-sanity-test-"));
    // mkdtempSync creates the directory, no need to mkdirSync it again.
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns clean when git directory is empty", () => {
    const issues = checkGitState(tmpDir);
    expect(issues).toEqual([]);
  });

  it("detects MERGE_HEAD", () => {
    fs.writeFileSync(path.join(tmpDir, "MERGE_HEAD"), "hash");
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("MERGE_HEAD");
  });

  it("detects REBASE_HEAD", () => {
    fs.writeFileSync(path.join(tmpDir, "REBASE_HEAD"), "hash");
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("REBASE_HEAD");
  });

  it("detects rebase-apply directory", () => {
    fs.mkdirSync(path.join(tmpDir, "rebase-apply"));
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("rebase-apply");
  });

  it("detects rebase-merge directory", () => {
    fs.mkdirSync(path.join(tmpDir, "rebase-merge"));
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("rebase-merge");
  });

  it("detects BISECT_LOG", () => {
    fs.writeFileSync(path.join(tmpDir, "BISECT_LOG"), "log");
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("BISECT_LOG");
  });

  it("detects REVERT_HEAD", () => {
    fs.writeFileSync(path.join(tmpDir, "REVERT_HEAD"), "hash");
    const issues = checkGitState(tmpDir);
    expect(issues).toContain("REVERT_HEAD");
  });

  it("returns multiple issues if multiple files exist", () => {
    fs.writeFileSync(path.join(tmpDir, "MERGE_HEAD"), "hash");
    fs.writeFileSync(path.join(tmpDir, "CHERRY_PICK_HEAD"), "hash");
    const issues = checkGitState(tmpDir);
    expect(issues).toHaveLength(2);
    expect(issues).toContain("MERGE_HEAD");
    expect(issues).toContain("CHERRY_PICK_HEAD");
  });

  it("handles non-existent directory gracefully (warns)", () => {
     // Passing a non-existent path
     const issues = checkGitState(path.join(tmpDir, "non-existent"));
     expect(issues).toEqual([]);
  });
});
