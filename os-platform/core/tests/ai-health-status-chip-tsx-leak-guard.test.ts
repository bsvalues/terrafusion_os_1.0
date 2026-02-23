import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

/**
 * Leak guard for AIHealthStatusChip.tsx (Phase 118).
 * Typical regressions: status colors (green/amber/red), neutral alpha overlays, token fallbacks.
 */
describe("AIHealthStatusChip.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/components/status/AIHealthStatusChip.tsx",
    );
    expect(
      fs.existsSync(filePath),
      `Expected file to exist: ${filePath}`,
    ).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "AIHealthStatusChip.tsx" });
  });
});
