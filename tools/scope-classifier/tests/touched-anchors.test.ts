import { describe, expect, it } from "vitest";
import { computeTouchedFromNames } from "../src/gitTouched";

describe("computeTouchedFromNames", () => {
  it("maps touched roots using two-segment rules", () => {
    const names = [
      "applications/terra-dossier/package.json",
      "backend/api-unified/TerraFusion.API.csproj",
      "frontend/apps/os-shell/src/main.tsx",
    ];

    const touched = computeTouchedFromNames(names);

    expect(touched["applications/terra-dossier"]).toBe(true);
    expect(touched["backend"]).toBe(true);
    expect(touched["frontend"]).toBe(true);
    expect(touched["."]).toBe(true);
  });
});
