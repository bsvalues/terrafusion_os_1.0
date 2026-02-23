import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runTierPreflight } from "../../../tools/ui-tokens/tier-preflight";

function mkTempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-tier-preflight-"));
}

describe("tier-preflight", () => {
  it("returns 0 when all targets exist, 3 when any target is missing", () => {
    const repo = mkTempRepo();

    const a = "frontend/apps/os-shell/src/components/A.tsx";
    const b = "frontend/apps/os-shell/src/components/B.tsx";
    fs.mkdirSync(path.join(repo, path.dirname(a)), { recursive: true });
    fs.writeFileSync(path.join(repo, a), "export const A = 1;\n", "utf8");
    fs.writeFileSync(path.join(repo, b), "export const B = 2;\n", "utf8");

    expect(runTierPreflight(repo, 7, [a, b])).toBe(0);
    expect(
      runTierPreflight(repo, 7, [a, "frontend/apps/os-shell/src/components/MISSING.tsx"])
    ).toBe(3);
  });

  it("normalizes leading ./ and backslashes", () => {
    const repo = mkTempRepo();
    const rel = "frontend/apps/os-shell/src/components/C.tsx";

    fs.mkdirSync(path.join(repo, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(repo, rel), "export const C = 3;\n", "utf8");

    expect(
      runTierPreflight(repo, 7, ["./" + rel, "frontend\\apps\\os-shell\\src\\components\\C.tsx"])
    ).toBe(0);
  });
});
