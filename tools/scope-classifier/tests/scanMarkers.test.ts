import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { scanRootMarkers } from "../src/scanMarkers";

describe("scanRootMarkers", () => {
  it("detects build/test, Next.js app routes, and Dockerfile", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-classifier-"));
    const root = path.join(tmp, "app");
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(path.join(root, "app", "api"), { recursive: true });

    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { build: "next build" } }),
      "utf8"
    );
    fs.writeFileSync(path.join(root, "Dockerfile"), "FROM node:20", "utf8");
    fs.writeFileSync(path.join(root, "next.config.js"), "module.exports = {};", "utf8");

    const result = scanRootMarkers(tmp, "app");

    expect(result.markers).toContain("package.json:buildOrTest");
    expect(result.markers).toContain("next:appApiRoutes");
    expect(result.markers).toContain("docker");
    expect(result.markerOrigins.some((o) => o.marker === "package.json:buildOrTest")).toBe(
      true
    );
  });
});
