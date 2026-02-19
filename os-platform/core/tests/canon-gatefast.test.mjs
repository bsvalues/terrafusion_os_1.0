import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("canon gatefast --dry exits 0 and prints summary", () => {
  const res = spawnSync("node", ["tools/canon/canon.mjs", "gatefast", "--dry"], {
    encoding: "utf8",
  });

  assert.equal(res.status, 0);
  assert.match(res.stdout, /Canon GateFast/i);
  assert.match(res.stdout, /Overall:\s*PASS/i);
  assert.match(res.stdout, /canon:doctor/i);
});

test("canon gatefast --json emits stable shape", () => {
  const res = spawnSync("node", ["tools/canon/canon.mjs", "gatefast", "--dry", "--json"], {
    encoding: "utf8",
  });

  assert.equal(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.tool, "terracanon-gatefast");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.overallOk, true);
  assert.ok(Array.isArray(parsed.steps));
  assert.ok(parsed.steps.find((s) => s.id === "doctor"));
});
