// scripts/ci/tests/gitSanity.test.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkGitState } from "../checkGitState.js";

describe("checkGitState", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-sanity-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns clean when directory is empty", () => {
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

  it("returns multiple issues if multiple files exist", () => {
    fs.writeFileSync(path.join(tmpDir, "MERGE_HEAD"), "hash");
    fs.writeFileSync(path.join(tmpDir, "CHERRY_PICK_HEAD"), "hash");
    const issues = checkGitState(tmpDir);
    expect(issues).toHaveLength(2);
    expect(issues).toContain("MERGE_HEAD");
    expect(issues).toContain("CHERRY_PICK_HEAD");
  });
});
