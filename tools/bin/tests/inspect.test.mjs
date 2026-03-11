/**
 * tf inspect – Phase 3 tests
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TF = path.resolve(__dirname, "..", "tf.mjs");

function tf(args) {
  try {
    const stdout = execFileSync("node", [TF, ...args], {
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return { ok: true, code: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      ok: false,
      code: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

describe("tf inspect", () => {
  it("--help exits 0 and lists subcommands", () => {
    const res = tf(["inspect", "--help"]);
    assert.equal(res.code, 0);
    for (const sub of ["scripts", "ports", "modules", "tools"]) {
      assert.ok(res.stdout.includes(sub), `should mention "${sub}"`);
    }
  });

  it("scripts --json returns valid envelope with script count", () => {
    const res = tf(["inspect", "scripts", "--json"]);
    assert.equal(res.code, 0, `stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(data.tool, "tf-inspect-scripts");
    assert.equal(data.ok, true);
    assert.equal(typeof data.data.count, "number");
    assert.ok(data.data.count > 100, `should have >100 scripts, got ${data.data.count}`);
    assert.ok(Array.isArray(data.data.scripts));
    assert.ok(data.data.scripts[0].name, "scripts should have name field");
    assert.ok(data.data.scripts[0].cmd, "scripts should have cmd field");
  });

  it("ports --json returns valid envelope with port list", () => {
    const res = tf(["inspect", "ports", "--json"]);
    assert.equal(res.code, 0, `stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(data.tool, "tf-inspect-ports");
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data.ports));
    assert.ok(data.data.ports.length >= 5, "should list at least 5 ports");
    const first = data.data.ports[0];
    assert.equal(typeof first.port, "number");
    assert.equal(typeof first.service, "string");
    assert.equal(typeof first.available, "boolean");
  });

  it("modules --json returns valid envelope", () => {
    const res = tf(["inspect", "modules", "--json"]);
    assert.equal(res.code, 0, `stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(data.tool, "tf-inspect-modules");
    assert.equal(data.ok, true);
    assert.equal(typeof data.data.count, "number");
    assert.ok(Array.isArray(data.data.modules));
  });

  it("tools --json returns valid envelope with tool entries", () => {
    const res = tf(["inspect", "tools", "--json"]);
    assert.equal(res.code, 0, `stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(data.tool, "tf-inspect-tools");
    assert.equal(data.ok, true);
    assert.equal(typeof data.data.count, "number");
    assert.ok(data.data.count > 5, `should find >5 tool files, got ${data.data.count}`);
    assert.ok(Array.isArray(data.data.tools));
    assert.ok(data.data.tools[0].path, "tools should have path field");
  });

  it("all envelopes share the same schema", () => {
    const subs = ["scripts", "ports", "modules", "tools"];
    for (const sub of subs) {
      const res = tf(["inspect", sub, "--json"]);
      assert.equal(res.code, 0, `${sub} should exit 0`);
      const data = JSON.parse(res.stdout);
      // All envelopes must have these fields
      assert.equal(typeof data.tool, "string", `${sub}: tool should be string`);
      assert.equal(typeof data.version, "number", `${sub}: version should be number`);
      assert.equal(typeof data.ts, "string", `${sub}: ts should be string`);
      assert.equal(typeof data.ok, "boolean", `${sub}: ok should be boolean`);
      assert.ok("data" in data, `${sub}: should have data field`);
      assert.ok("error" in data, `${sub}: should have error field`);
      assert.ok("meta" in data, `${sub}: should have meta field`);
      assert.equal(typeof data.meta.durationMs, "number", `${sub}: durationMs should be number`);
    }
  });
});
