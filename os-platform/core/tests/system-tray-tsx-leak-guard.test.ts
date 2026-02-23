import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for SystemTray.tsx (Phase 144).
 * Typical regressions: tray background rgba, border rgba, text rgba overlays.
 */
describe("SystemTray.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(
      __dirname, "..", "..", "..",
      "frontend/apps/os-shell/src/shell/SystemTray.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "SystemTray.tsx" });
  });
});
