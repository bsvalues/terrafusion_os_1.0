import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { scanRootMarkers } from "../src/scanMarkers";
import { classifyRoot } from "../src/classify";
import { writeScopeOutputs } from "../src/writeOutputs";

describe("generate scope outputs", () => {
  it("writes JSON and report outputs deterministically", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-classifier-"));
    const root = path.join(tmp, "app");
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { build: "vite build" } }),
      "utf8"
    );
    fs.writeFileSync(path.join(root, "Dockerfile"), "FROM node:20", "utf8");

    const markers = scanRootMarkers(tmp, "app");
    const classified = classifyRoot({
      root: "app",
      markers: markers.markers,
      markerOrigins: markers.markerOrigins,
      inheritedMarkers: [],
      wiring: [],
      touchedRelease: true,
      touchedDev: false,
      pathFlags: markers.pathFlags,
    });

    writeScopeOutputs(
      tmp,
      [
        {
          root: "app",
          bucket: classified.bucket,
          evidence: classified.evidence,
        },
      ],
      { release: "test-release", dev: "test-dev" }
    );

    const out = JSON.parse(
      fs.readFileSync(path.join(tmp, "DEPENDENCY_SCOPE_GEN2_APPS.json"), "utf8")
    );
    expect(out.length).toBe(1);
    expect(out[0].root).toBe("app");
    expect(out[0].evidence.buildableLocal).toBe(true);

    const solidified = JSON.parse(
      fs.readFileSync(path.join(tmp, "DEPENDENCY_SCOPE_SOLIDIFIED_OS.json"), "utf8")
    );
    expect(solidified.length).toBe(0);

    const report = fs.readFileSync(
      path.join(tmp, "DEPENDENCY_SCOPE_REPORT.md"),
      "utf8"
    );
    expect(report).toContain("TerraFusion Scope Report");
  });
});
