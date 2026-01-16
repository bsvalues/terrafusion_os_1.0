import { describe, expect, it } from "vitest";
import { classifyRoot } from "../src/classify";

describe("policy overrides", () => {
  const base = {
    markers: [],
    markerOrigins: [],
    inheritedMarkers: [],
    wiring: [],
    touchedRelease: false,
    touchedDev: false,
    pathFlags: [],
  };

  it("forces repo root to CORE_OS_TOOLING", () => {
    const result = classifyRoot({ root: ".", ...base });
    expect(result.bucket).toBe("CORE_OS_TOOLING");
  });

  it("forces clean build zone to CORE_OS_TOOLING", () => {
    const result = classifyRoot({ root: "_CLEAN_BUILD_ZONE", ...base });
    expect(result.bucket).toBe("CORE_OS_TOOLING");
  });

  it("forces dot folders to QUARANTINE", () => {
    const result = classifyRoot({ root: ".ai", ...base });
    expect(result.bucket).toBe("QUARANTINE");
  });

  it("forces SDK and ecosystem intake to CORE_OS_TOOLING", () => {
    const sdk = classifyRoot({ root: "SDK", ...base });
    const intake = classifyRoot({ root: "ecosystem/intake", ...base });
    expect(sdk.bucket).toBe("CORE_OS_TOOLING");
    expect(intake.bucket).toBe("CORE_OS_TOOLING");
  });
});
