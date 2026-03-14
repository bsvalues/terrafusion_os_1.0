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

describe("tf lint", () => {
  it("--help exits 0 and mentions lint", () => {
    const r = tf(["lint", "--help"]);
    assert.equal(r.code, 0, "exit code should be 0");
    assert.ok(r.stdout.includes("lint"), "stdout should contain 'lint'");
  });

  it("unknown subcommand exits 1 with error message", () => {
    const r = tf(["lint", "unknown-sub"]);
    assert.equal(r.code, 1, "exit code should be 1");
    const combined = r.stderr + r.stdout;
    assert.ok(
      combined.includes("Unknown lint subcommand"),
      "output should contain 'Unknown lint subcommand'"
    );
  });
});
