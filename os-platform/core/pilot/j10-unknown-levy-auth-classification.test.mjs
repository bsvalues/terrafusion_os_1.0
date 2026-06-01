import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const cases = [
  {
    controller: "LevyCalculatorController.cs",
    classPattern: /\[Authorize\]\s*public sealed class LevyCalculatorController/,
    routes: [
      '[HttpPost("calculate-rate")]',
      '[HttpPost("bill-impact")]',
      '[HttpGet("rate-comparison/{districtId}")]',
    ],
  },
  {
    controller: "LevyCalculationController.cs",
    classPattern: /\[Authorize\(Roles = "LevyClerk,Assessor,Admin,Administrator"\)\]\s*public class LevyCalculationController/,
    routes: [
      '[HttpPost("highest-lawful-levy")]',
      '[HttpPost("aggregate-check")]',
    ],
  },
  {
    controller: "LevyForecastController.cs",
    classPattern: /\[Authorize\]\s*public sealed class LevyForecastController/,
    routes: ['[HttpGet("district/{id}")]'],
  },
  {
    controller: "LevyReportController.cs",
    classPattern: /\[Authorize\]\s*public sealed class LevyReportController/,
    routes: ['[HttpPost("generate")]'],
  },
];

test("Levy operational calculation, forecast, and report surfaces inherit authenticated access", () => {
  for (const item of cases) {
    const source = fs.readFileSync(
      path.join(repoRoot, "backend/src/TerraFusion.API/Controllers", item.controller),
      "utf8",
    );

    assert.match(source, item.classPattern, `${item.controller} must be controller-protected`);

    for (const route of item.routes) {
      const index = source.indexOf(route);
      assert.notEqual(index, -1, `missing route ${item.controller} ${route}`);
      const publicIndex = source.indexOf("public ", index);
      assert.notEqual(publicIndex, -1, `missing method body after ${item.controller} ${route}`);
      const methodWindow = source.slice(Math.max(0, index - 80), publicIndex);
      assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${item.controller} ${route} must not override controller auth`);
    }
  }
});
