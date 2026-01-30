import { describe, expect, it } from "vitest";
import { classifyRoot } from "../src/classify";

describe("buildability local gate", () => {
  it("does not allow GEN2/CORE without local build markers", () => {
    const result = classifyRoot({
      root: "backend",
      markers: [],
      markerOrigins: [],
      inheritedMarkers: ["workflow-ref", "renovate-ref", "pnpm-lock.yaml"],
      wiring: ["service-registry-ref", "compose-ref"],
      touchedRelease: true,
      touchedDev: true,
      pathFlags: [],
    });

    expect(result.bucket).toBe("QUARANTINE");
    expect(result.evidence.buildableLocal).toBe(false);
  });
});
