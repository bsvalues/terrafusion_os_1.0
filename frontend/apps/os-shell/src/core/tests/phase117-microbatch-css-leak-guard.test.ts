import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

const FILES = [
  "frontend/apps/os-shell/src/components/emergency/ProgressiveTerraFusionTest.css",
  "frontend/apps/os-shell/src/plugins/cama-core/index.module.css",
  "frontend/apps/os-shell/src/design-system/tokens/colors.stories.css",
  "frontend/apps/os-shell/src/components/ui/EliteProgress.css",
  "frontend/apps/os-shell/src/components/core/OSStatusBadge.module.css",
];

describe("Phase 117 micro-batch CSS leak guard", () => {
  for (const relPath of FILES) {
    const label = relPath.split("/").pop()!;
    it(`${label} contains no raw color values`, () => {
      const file = path.join(REPO_ROOT, relPath);
      const content = fs.readFileSync(file, "utf8");
      assertNoRawColorLeaks(content, { label });
    });
  }
});
