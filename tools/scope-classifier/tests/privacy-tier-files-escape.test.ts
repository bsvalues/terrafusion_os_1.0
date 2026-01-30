import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { scanRootMarkers } from "../src/scanMarkers";

describe("privacy-tier-only detection", () => {
  it("does not quarantine when non-tier files exist", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-classifier-"));
    const root = path.join(tmp, "app");
    fs.mkdirSync(path.join(root, "tier_17_privacy"), { recursive: true });
    fs.writeFileSync(path.join(root, "README.md"), "docs", "utf8");

    const result = scanRootMarkers(tmp, "app");

    expect(result.pathFlags).not.toContain("privacy-tier-only");
  });
});
