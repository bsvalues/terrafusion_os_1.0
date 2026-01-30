import { describe, expect, it } from "vitest";
import { classifyRoot } from "../src/classify";

describe("classifyRoot quarantine rules", () => {
  it("returns QUARANTINE for archive roots", () => {
    const result = classifyRoot({
      root: "_archive/legacy-app",
      markers: ["package.json:buildOrTest", "docker"],
      markerOrigins: [],
      inheritedMarkers: ["workflow-ref"],
      wiring: ["service-registry-ref"],
      touchedRelease: true,
      touchedDev: true,
      pathFlags: [],
    });

    expect(result.bucket).toBe("QUARANTINE");
    expect(result.evidence.score).toBe(0);
  });

  it("returns QUARANTINE for Dev - Copy roots", () => {
    const result = classifyRoot({
      root: "Dev - Copy/Archive/App",
      markers: ["package.json:buildOrTest"],
      markerOrigins: [],
      inheritedMarkers: [],
      wiring: [],
      touchedRelease: false,
      touchedDev: false,
      pathFlags: [],
    });

    expect(result.bucket).toBe("QUARANTINE");
    expect(result.evidence.score).toBe(0);
  });
});
