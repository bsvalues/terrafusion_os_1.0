import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for TerraFusionExcellenceProvider.tsx (Phase 179).
 * Typical regressions: boxShadow rgba cyan glow on provider wrapper.
 */
describe("TerraFusionExcellenceProvider.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(
      __dirname, "..", "..", "..",
      "frontend/apps/os-shell/src/providers/TerraFusionExcellenceProvider.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "TerraFusionExcellenceProvider.tsx" });
  });
});
