import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

const STYLE_DIR = "frontend/apps/os-shell/src/styles";

const FILES = [
  "terrafusion-brand-compliant.css",
  "terrafusion-advanced-architecture.css",
  "terrafusion-ultimate-architecture.css",
  "terrafusion-celebration.css",
];

describe("Micro-batch CSS leak guard", () => {
  for (const filename of FILES) {
    it(`${filename} contains no raw color values`, () => {
      const file = path.join(REPO_ROOT, STYLE_DIR, filename);
      const content = fs.readFileSync(file, "utf8");
      assertNoRawColorLeaks(content, { label: filename });
    });
  }
});
