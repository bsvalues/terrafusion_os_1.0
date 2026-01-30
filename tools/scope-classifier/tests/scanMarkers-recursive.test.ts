import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { scanRootMarkers } from "../src/scanMarkers";

describe("scanRootMarkers recursive", () => {
  it("detects nested package.json build markers", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-classifier-"));
    const root = path.join(tmp, "app");
    const nested = path.join(root, "packages", "web");
    fs.mkdirSync(nested, { recursive: true });

    fs.writeFileSync(
      path.join(nested, "package.json"),
      JSON.stringify({ scripts: { build: "vite build" } }),
      "utf8"
    );

    const result = scanRootMarkers(tmp, "app", { recursive: true, maxDepth: 3 });

    expect(result.markers).toContain("package.json:buildOrTest");
    expect(result.markerOrigins.some((o) => o.foundAt.endsWith("packages/web/package.json"))).toBe(
      true
    );
  });
});
