import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

describe("Typography.stories.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      REPO_ROOT,
      "frontend/apps/os-shell/src/design-system/tokens/Typography.stories.tsx"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, { label: "Typography.stories.tsx" });
  });
});
