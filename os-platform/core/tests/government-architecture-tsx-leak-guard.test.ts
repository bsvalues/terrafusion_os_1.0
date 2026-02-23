import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../tools/ui-tokens/leak-guard";

/**
 * Phase 126 leak guard — GovernmentArchitecture.tsx
 * Architecture views often embed diagram/status colors and neutral overlays.
 */
describe("GovernmentArchitecture.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const repoRoot = process.cwd();

    const rel = "frontend/apps/os-shell/src/components/GovernmentArchitecture.tsx";

    const filePath = path.join(repoRoot, rel);
    expect(fs.existsSync(filePath), `Expected file to exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: "GovernmentArchitecture.tsx" });
  });
});
