import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

describe("WindowManager.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/shell/WindowManager.tsx"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, { label: "WindowManager.tsx" });
  });
});
