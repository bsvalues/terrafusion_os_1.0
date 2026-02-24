import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for index.tsx (Phase 180).
 * Typical regressions: hex color in console.log dev-mode style.
 */
describe("index.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(
      __dirname, "..", "..", "..",
      "frontend/apps/os-shell/src/index.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "index.tsx" });
  });
});
