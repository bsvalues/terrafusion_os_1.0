import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

describe("terrafusion-tokens.css leak guard", () => {
  it("contains no raw rgba/rgb color values (hex foundation definitions excluded)", () => {
    const file = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/styles/terrafusion-tokens.css"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, {
      label: "terrafusion-tokens.css",
      ignoreLinePatterns: [
        // Foundation hex definitions — these ARE the source-of-truth token
        // values and cannot self-reference. Skip any CSS custom property
        // definition line that contains a hex literal (includes LUMIN
        // BRIDGE comment annotations like /* #0a0e1a (void-black) */).
        /^\s*--[\w-]+:\s*.*#[0-9a-fA-F]{3,8}/,
        // Multi-line gradient continuation lines (bare hex color stops)
        /^\s*#[0-9a-fA-F]{3,8}\s+\d+%/,
      ],
    });
  });
});
