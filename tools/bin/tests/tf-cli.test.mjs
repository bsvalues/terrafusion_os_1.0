#!/usr/bin/env node
/**
 * TF CLI – Phase 1 tests
 * Uses Node built-in test runner (node --test)
 *
 * Success criteria:
 * 1. tf --help exits 0, lists "doctor", "status", "version"
 * 2. tf version exits 0, prints semver-like string
 * 3. tf doctor --dry --json exits 0, valid JSON with overallOk
 * 4. tf status --json exits 0, valid JSON envelope
 * 5. tf nonexistent exits non-zero
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TF = path.resolve(__dirname, "..", "tf.mjs");

function tf(args, opts = {}) {
  try {
    const stdout = execFileSync("node", [TF, ...args], {
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, NO_COLOR: "1" },
      ...opts,
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

describe("tf CLI – Phase 1", () => {
  it("--help exits 0 and lists all commands", () => {
    const res = tf(["--help"]);
    assert.equal(res.code, 0, `exit code should be 0, got ${res.code}`);
    for (const cmd of ["doctor", "status", "version"]) {
      assert.ok(
        res.stdout.includes(cmd),
        `help output should mention "${cmd}"`
      );
    }
  });

  it("version exits 0 and prints a version string", () => {
    const res = tf(["version"]);
    assert.equal(res.code, 0);
    assert.match(res.stdout.trim(), /\d+\.\d+\.\d+/, "should contain semver");
  });

  it("doctor --dry --json exits 0 with valid JSON envelope", () => {
    const res = tf(["doctor", "--dry", "--json"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(typeof data.overallOk, "boolean");
    assert.ok(data.tool, "envelope should have a tool name");
    assert.ok(data.startedAt, "envelope should have startedAt");
  });

  it("status --json exits 0 with valid JSON envelope", () => {
    const res = tf(["status", "--json"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    const data = JSON.parse(res.stdout);
    assert.equal(data.tool, "tf-status");
    assert.equal(typeof data.ok, "boolean");
    assert.ok(data.data, "envelope should have data field");
    assert.ok(data.data.node, "data should include node version");
  });

  it("nonexistent command exits non-zero", () => {
    const res = tf(["this-does-not-exist-xyz"]);
    assert.notEqual(res.code, 0, "unknown command should fail");
  });
});

describe("tf CLI – Phase 2", () => {
  it("--help lists all Phase 2 commands", () => {
    const res = tf(["--help"]);
    assert.equal(res.code, 0);
    for (const cmd of ["dev", "test", "build", "ship", "canon"]) {
      assert.ok(
        res.stdout.includes(cmd),
        `help output should mention "${cmd}"`
      );
    }
  });

  it("dev --help exits 0 and shows subcommands", () => {
    const res = tf(["dev", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("frontend"), "should mention frontend subcommand");
    assert.ok(res.stdout.includes("backend"), "should mention backend subcommand");
  });

  it("test --help exits 0 and shows subcommands", () => {
    const res = tf(["test", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("unit"), "should mention unit subcommand");
    assert.ok(res.stdout.includes("all"), "should mention all subcommand");
  });

  it("build --help exits 0 and shows subcommands", () => {
    const res = tf(["build", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("frontend"), "should mention frontend subcommand");
    assert.ok(res.stdout.includes("backend"), "should mention backend subcommand");
  });

  it("ship --help exits 0 and shows flags", () => {
    const res = tf(["ship", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("dry-run"), "should mention --dry-run flag");
  });

  it("canon --help exits 0 and shows subcommands", () => {
    const res = tf(["canon", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("doctor"), "should mention doctor subcommand");
  });

  it("inspect --help exits 0 and shows subcommands", () => {
    const res = tf(["inspect", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes("scripts"), "should mention scripts subcommand");
    assert.ok(res.stdout.includes("ports"), "should mention ports subcommand");
  });

  it("repl --help exits 0 and shows usage", () => {
    const res = tf(["repl", "--help"]);
    assert.equal(res.code, 0, `exit code should be 0, stderr: ${res.stderr}`);
    assert.ok(res.stdout.includes(".exit"), "should mention .exit command");
    assert.ok(res.stdout.includes(".json"), "should mention .json toggle");
  });
});

describe("tf CLI – Phase 3+4 registration", () => {
  it("--help lists inspect and repl commands", () => {
    const res = tf(["--help"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("inspect"), "should list inspect");
    assert.ok(res.stdout.includes("repl"), "should list repl");
  });
});
