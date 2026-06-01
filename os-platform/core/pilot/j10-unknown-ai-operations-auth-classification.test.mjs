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
    controller: "SwarmController.cs",
    classPattern: /\[Authorize\]\s*public class SwarmController/,
    routes: [
      '[HttpPost("execute")]',
      '[HttpPost("modules/{moduleName}/start")]',
      '[HttpPost("modules/{moduleName}/stop")]',
    ],
  },
  {
    controller: "ConsciousnessController.cs",
    classPattern: /\[Authorize\]\s*public class ConsciousnessController/,
    routes: [
      '[HttpPost("mode")]',
      '[HttpPost("initialize")]',
    ],
    anonymousHealth: /\[HttpGet\("health"\)\]\s*\[AllowAnonymous\]/,
  },
  {
    controller: "EliteOperationsController.cs",
    classPattern: /\[Authorize\]\s*public class EliteOperationsController/,
    routes: [
      '[HttpPost("execute-cycle")]',
      '[HttpPost("initialize")]',
    ],
  },
];

test("AI and elite operational command surfaces require authenticated access", () => {
  for (const item of cases) {
    const source = fs.readFileSync(
      path.join(repoRoot, "backend/src/TerraFusion.API/Controllers", item.controller),
      "utf8",
    );

    assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/, `${item.controller} must import authorization`);
    assert.match(source, item.classPattern, `${item.controller} must be controller-protected`);

    for (const route of item.routes) {
      const index = source.indexOf(route);
      assert.notEqual(index, -1, `missing route ${item.controller} ${route}`);
      const publicIndex = source.indexOf("public ", index);
      assert.notEqual(publicIndex, -1, `missing method body after ${item.controller} ${route}`);
      const methodWindow = source.slice(index, publicIndex);
      assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${item.controller} ${route} must not override controller auth`);
    }

    if (item.anonymousHealth) {
      assert.match(source, item.anonymousHealth, `${item.controller} health endpoint should remain anonymously inspectable`);
    }
  }
});
