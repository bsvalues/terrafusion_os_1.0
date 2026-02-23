import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

describe("DataScienceLaboratory.css leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/applications/terra-levy/components/analytics/DataScienceLaboratory.css"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, { label: "DataScienceLaboratory.css" });
  });
});
