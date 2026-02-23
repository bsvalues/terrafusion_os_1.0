import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

describe("advanced-design-system.css leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/styles/advanced-design-system.css"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, {
      label: "advanced-design-system.css",
    });
  });
});
