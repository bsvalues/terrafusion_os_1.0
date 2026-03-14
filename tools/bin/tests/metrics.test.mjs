/**
 * tf metrics – workspace metrics command tests
 *
 * Validates help output, JSON envelope contract, and human-readable mode.
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

// ── tf metrics --help ───────────────────────────────────────

describe("tf metrics --help", () => {
  it("exits 0 and stdout contains 'metrics'", () => {
    const res = tf(["metrics", "--help"]);
    assert.equal(res.code, 0, `expected exit 0, got ${res.code}`);
    assert.ok(
      res.stdout.toLowerCase().includes("metrics"),
      "stdout should mention 'metrics'",
    );
  });
});

// ── tf metrics --json ───────────────────────────────────────

describe("tf metrics --json", () => {
  it("exits 0 and returns valid JSON envelope", () => {
    const res = tf(["metrics", "--json"]);
    assert.equal(res.code, 0, `expected exit 0, got ${res.code}`);

    const envelope = JSON.parse(res.stdout);

    // Envelope structure
    assert.ok("tool" in envelope, "envelope must have 'tool'");
    assert.ok("version" in envelope, "envelope must have 'version'");
    assert.ok("ts" in envelope, "envelope must have 'ts'");
    assert.ok("ok" in envelope, "envelope must have 'ok'");
    assert.ok("data" in envelope, "envelope must have 'data'");
    assert.ok("error" in envelope, "envelope must have 'error'");
    assert.ok("meta" in envelope, "envelope must have 'meta'");

    assert.equal(envelope.ok, true);
    assert.equal(envelope.tool, "tf-metrics");

    // Data shape
    const { data } = envelope;
    assert.equal(typeof data.totalFiles, "number", "totalFiles must be a number");
    assert.equal(typeof data.testFiles, "number", "testFiles must be a number");
    assert.equal(typeof data.gitCommits, "number", "gitCommits must be a number");
    assert.ok(Array.isArray(data.topExtensions), "topExtensions must be an array");

    // Sanity: a real workspace should have at least some files
    assert.ok(data.totalFiles > 0, "totalFiles should be > 0 in a real workspace");
  });
});

// ── tf metrics (human-readable) ─────────────────────────────

describe("tf metrics (human-readable)", () => {
  it("exits 0 and stdout contains 'Workspace Metrics'", () => {
    const res = tf(["metrics"]);
    assert.equal(res.code, 0, `expected exit 0, got ${res.code}`);
    assert.ok(
      res.stdout.includes("Workspace Metrics"),
      "stdout should contain 'Workspace Metrics'",
    );
  });
});
