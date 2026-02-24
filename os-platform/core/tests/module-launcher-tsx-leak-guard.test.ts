import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../tools/ui-tokens/leak-guard";

/**
 * Leak guard for ModuleLauncher.tsx (Phase 111).
 * Pure white/black alpha overlays in MUI sx props — all neutral-hs.
 */
describe("ModuleLauncher.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/shell/ModuleLauncher.tsx"
    );
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "ModuleLauncher.tsx" });
  });
});
