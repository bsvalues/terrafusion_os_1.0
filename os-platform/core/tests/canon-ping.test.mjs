import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("canon ping --dry exits 0 and prints summary", () => {
  const res = spawnSync("node", ["tools/canon/canon.mjs", "ping", "--dry"], { encoding: "utf8" });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Canon Ping/i);
  assert.match(res.stdout, /Overall:\s*PASS/i);
});

test("canon ping --json --dry emits stable shape", () => {
  const res = spawnSync(
    "node",
    ["tools/canon/canon.mjs", "ping", "--dry", "--json", "--echo", "hi"],
    { encoding: "utf8" }
  );
  assert.equal(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.tool, "terracanon-ping");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.overallOk, true);
  assert.equal(parsed.result.echo, "hi");
});

test("canon ping fails with invalid manifest path", () => {
  const res = spawnSync(
    "node",
    ["tools/canon/canon.mjs", "ping", "--manifest", "does/not/exist.json"],
    { encoding: "utf8" }
  );
  assert.equal(res.status, 1);
  assert.match(res.stdout, /Overall:\s*FAIL/i);
});
