import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../tools/ui-tokens/leak-guard";

describe("RiskPolicyGate.tsx leak guard", () => {
  it("contains no raw color values", () => {
    const file = path.join(
      process.cwd(),
      "frontend/apps/os-shell/src/components/pilot/RiskPolicyGate.tsx"
    );
    const content = fs.readFileSync(file, "utf8");
    assertNoRawColorLeaks(content, { label: "RiskPolicyGate.tsx" });
  });
});
