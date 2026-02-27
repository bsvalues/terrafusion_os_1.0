import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

describe("terrafusion-intelligent-architecture.css leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      REPO_ROOT,
      "frontend/apps/os-shell/src/styles/terrafusion-intelligent-architecture.css"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, {
      label: "terrafusion-intelligent-architecture.css",
    });
  });
});
