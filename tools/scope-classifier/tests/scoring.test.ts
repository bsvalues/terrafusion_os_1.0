import { describe, expect, it } from "vitest";
import { classifyRoot } from "../src/classify";

describe("classifyRoot", () => {
  it("returns CORE_OS_RUNTIME when wiring + build markers are present", () => {
    const result = classifyRoot({
      root: "backend",
      markers: ["package.json:buildOrTest", "docker"],
      markerOrigins: [],
      inheritedMarkers: [],
      wiring: ["service-registry-ref", "compose-ref"],
      touchedRelease: true,
      touchedDev: false,
      pathFlags: [],
    });

    expect(result.bucket).toBe("CORE_OS_RUNTIME");
    expect(result.evidence.score).toBeGreaterThanOrEqual(6);
  });
});
