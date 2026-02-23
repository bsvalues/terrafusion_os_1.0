import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

/**
 * performance-optimized.css is a common hotspot for literal "micro-optimizations".
 * This guard ensures performance work never reintroduces raw colors.
 */
describe("performance-optimized.css leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      REPO_ROOT,
      "frontend/apps/os-shell/src/styles/performance-optimized.css"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, {
      label: "performance-optimized.css",
    });
  });
});
