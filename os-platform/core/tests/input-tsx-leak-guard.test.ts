import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for input.tsx (Phase 174).
 * Typical regressions: focus shadow rgba cyan glow on input.
 */
describe("input.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(
      __dirname, "..", "..", "..",
      "frontend/apps/os-shell/src/components/ui/input.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "input.tsx" });
  });
});
