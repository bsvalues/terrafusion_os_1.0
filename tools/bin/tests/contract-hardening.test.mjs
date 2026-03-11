/**
 * Contract hardening tests – error paths, exit codes, edge cases.
 *
 * These verify that the CLI behaves safely and predictably
 * when given invalid input, not just on the happy path.
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

// ── Exit code contract ──────────────────────────────────────

describe("exit code contract", () => {
  it("unknown top-level command exits 1", () => {
    const res = tf(["zzz-no-such-command"]);
    assert.equal(res.code, 1);
    assert.ok(res.stderr.includes("Unknown command"));
  });

  it("no arguments exits 0 (prints help)", () => {
    const res = tf([]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("Usage"));
  });

  it("--help exits 0", () => {
    const res = tf(["--help"]);
    assert.equal(res.code, 0);
  });

  it("version exits 0", () => {
    assert.equal(tf(["version"]).code, 0);
  });

  it("version --json exits 0", () => {
    assert.equal(tf(["version", "--json"]).code, 0);
  });

  it("status --json exits 0", () => {
    assert.equal(tf(["status", "--json"]).code, 0);
  });

  it("doctor --dry --json exits 0", () => {
    assert.equal(tf(["doctor", "--dry", "--json"]).code, 0);
  });
});

// ── Invalid subcommand error paths ──────────────────────────

describe("invalid subcommand error paths", () => {
  it("inspect with no subcommand exits 0 (prints help)", () => {
    const res = tf(["inspect"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("scripts"));
  });

  it("inspect invalid-sub exits 1 with error message", () => {
    const res = tf(["inspect", "nope"]);
    assert.equal(res.code, 1);
    assert.ok(res.stderr.includes("Unknown inspect subcommand"));
  });

  it("test invalid-sub exits 1 with error message", () => {
    const res = tf(["test", "nope"]);
    assert.equal(res.code, 1);
    assert.ok(res.stderr.includes("Unknown test subcommand"));
  });

  it("build invalid-sub exits 1 with error message", () => {
    const res = tf(["build", "nope"]);
    assert.equal(res.code, 1);
    assert.ok(res.stderr.includes("Unknown build subcommand"));
  });
});

// ── Envelope contract consistency ───────────────────────────

describe("envelope contract consistency", () => {
  const ENVELOPE_FIELDS = ["tool", "version", "ts", "ok", "data", "error", "meta"];

  it("version --json has all envelope fields", () => {
    const res = tf(["version", "--json"]);
    const data = JSON.parse(res.stdout);
    for (const field of ENVELOPE_FIELDS) {
      assert.ok(field in data, `version envelope missing "${field}"`);
    }
    assert.equal(typeof data.meta.durationMs, "number");
  });

  it("status --json has all envelope fields", () => {
    const res = tf(["status", "--json"]);
    const data = JSON.parse(res.stdout);
    for (const field of ENVELOPE_FIELDS) {
      assert.ok(field in data, `status envelope missing "${field}"`);
    }
    assert.equal(typeof data.meta.durationMs, "number");
  });

  it("all inspect --json envelopes have all fields", () => {
    for (const sub of ["scripts", "ports", "modules", "tools"]) {
      const res = tf(["inspect", sub, "--json"]);
      assert.equal(res.code, 0, `inspect ${sub} should exit 0`);
      const data = JSON.parse(res.stdout);
      for (const field of ENVELOPE_FIELDS) {
        assert.ok(field in data, `inspect ${sub} envelope missing "${field}"`);
      }
      assert.equal(typeof data.meta.durationMs, "number", `inspect ${sub}: durationMs should be number`);
    }
  });

  it("timestamps are parseable ISO strings", () => {
    for (const args of [["version", "--json"], ["status", "--json"], ["inspect", "scripts", "--json"]]) {
      const res = tf(args);
      const data = JSON.parse(res.stdout);
      const ts = new Date(data.ts);
      assert.ok(!isNaN(ts.getTime()), `${args.join(" ")}: ts should be valid ISO date, got "${data.ts}"`);
    }
  });

  it("ok is always boolean", () => {
    for (const args of [["version", "--json"], ["status", "--json"], ["inspect", "ports", "--json"]]) {
      const res = tf(args);
      const data = JSON.parse(res.stdout);
      assert.equal(typeof data.ok, "boolean", `${args.join(" ")}: ok should be boolean`);
    }
  });

  it("error is null on success", () => {
    for (const args of [["version", "--json"], ["status", "--json"], ["inspect", "tools", "--json"]]) {
      const res = tf(args);
      const data = JSON.parse(res.stdout);
      assert.equal(data.error, null, `${args.join(" ")}: error should be null on success`);
    }
  });
});

// ── Non-JSON mode readability ───────────────────────────────

describe("non-JSON mode readability", () => {
  it("version without --json prints human-readable output", () => {
    const res = tf(["version"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.trim().length > 0, "should print something");
    // Should NOT be JSON
    assert.throws(() => JSON.parse(res.stdout), "non-JSON mode should not output JSON");
  });

  it("inspect scripts without --json prints human-readable list", () => {
    const res = tf(["inspect", "scripts"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("npm scripts found"), "should mention scripts found");
  });

  it("inspect ports without --json prints human-readable table", () => {
    const res = tf(["inspect", "ports"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("Port allocation"), "should print port table header");
  });

  it("inspect tools without --json prints human-readable list", () => {
    const res = tf(["inspect", "tools"]);
    assert.equal(res.code, 0);
    assert.ok(res.stdout.includes("tool entry points found"), "should mention tools found");
  });
});

// ── Discovery accuracy ──────────────────────────────────────

describe("discovery accuracy", () => {
  it("inspect scripts count matches actual package.json", () => {
    const res = tf(["inspect", "scripts", "--json"]);
    const data = JSON.parse(res.stdout);
    // Verify count matches array length
    assert.equal(data.data.count, data.data.scripts.length, "count should match array length");
  });

  it("inspect scripts entries have both name and cmd", () => {
    const res = tf(["inspect", "scripts", "--json"]);
    const data = JSON.parse(res.stdout);
    for (const s of data.data.scripts.slice(0, 5)) {
      assert.equal(typeof s.name, "string", "script should have name");
      assert.equal(typeof s.cmd, "string", "script should have cmd");
      assert.ok(s.name.length > 0, "script name should be non-empty");
      assert.ok(s.cmd.length > 0, "script cmd should be non-empty");
    }
  });

  it("inspect ports entries have port, service, available, status", () => {
    const res = tf(["inspect", "ports", "--json"]);
    const data = JSON.parse(res.stdout);
    for (const p of data.data.ports) {
      assert.equal(typeof p.port, "number", "port should be number");
      assert.equal(typeof p.service, "string", "service should be string");
      assert.equal(typeof p.available, "boolean", "available should be boolean");
      assert.ok(["free", "in-use"].includes(p.status), `status should be free or in-use, got "${p.status}"`);
    }
  });

  it("inspect modules count matches array length", () => {
    const res = tf(["inspect", "modules", "--json"]);
    const data = JSON.parse(res.stdout);
    assert.equal(data.data.count, data.data.modules.length, "count should match array length");
  });

  it("inspect tools count matches array length", () => {
    const res = tf(["inspect", "tools", "--json"]);
    const data = JSON.parse(res.stdout);
    assert.equal(data.data.count, data.data.tools.length, "count should match array length");
  });

  it("inspect tools finds tf.mjs itself", () => {
    const res = tf(["inspect", "tools", "--json"]);
    const data = JSON.parse(res.stdout);
    const paths = data.data.tools.map(t => t.path);
    assert.ok(paths.some(p => p.includes("tf.mjs")), "should find tf.mjs in tools list");
  });
});
