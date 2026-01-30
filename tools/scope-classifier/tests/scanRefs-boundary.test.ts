import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { scanRefs } from "../src/scanRefs";

describe("scanRefs boundary matching", () => {
  it("avoids substring matches and honors path-like matches", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-classifier-"));
    const workflows = path.join(tmp, ".github", "workflows");
    fs.mkdirSync(workflows, { recursive: true });

    const workflowPath = path.join(workflows, "test.yml");
    fs.writeFileSync(workflowPath, "note: backendish\n", "utf8");

    let result = scanRefs(tmp, ["backend"]);
    expect(result.backend.inheritedMarkers).not.toContain("workflow-ref");

    fs.writeFileSync(workflowPath, "path: backend/service.yml\n", "utf8");
    result = scanRefs(tmp, ["backend"]);
    expect(result.backend.inheritedMarkers).toContain("workflow-ref");
  });
});
