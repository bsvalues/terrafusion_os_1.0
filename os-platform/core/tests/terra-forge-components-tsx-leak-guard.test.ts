import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for TerraForgeComponents.tsx (Phase 176).
 * Typical regressions: SVG stroke rgba slate on circular progress track.
 */
describe("TerraForgeComponents.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(
      __dirname, "..", "..", "..",
      "frontend/apps/os-shell/src/design/TerraForgeComponents.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "TerraForgeComponents.tsx" });
  });
});
