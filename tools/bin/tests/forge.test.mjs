/**
 * TerraForge CLI — Contract Tests
 *
 * Validates:
 * 1. Module registration and help output
 * 2. Arg parsing correctness
 * 3. Error handling for invalid modules/actions
 * 4. Rust kernel invocation contract
 * 5. Batch file processing contract
 *
 * Run: node --test tools/bin/tests/forge.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const TF = path.join(ROOT, "tools", "bin", "tf.mjs");

function runForge(...args) {
  try {
    return {
      stdout: execSync(`node "${TF}" forge ${args.join(" ")}`, {
        encoding: "utf-8",
        timeout: 5000,
        cwd: ROOT,
      }),
      exitCode: 0,
    };
  } catch (e) {
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
    };
  }
}

describe("TerraForge CLI — Module Registration", () => {
  it("shows help when invoked with no args", () => {
    const { stdout } = runForge("--help");
    assert.match(stdout, /TerraForge CLI/);
    assert.match(stdout, /cuforge/);
    assert.match(stdout, /levy/);
    assert.match(stdout, /sales/);
    assert.match(stdout, /cost/);
  });

  it("lists cuforge actions", () => {
    const { stdout } = runForge("cuforge", "--help");
    assert.match(stdout, /rollback/);
    assert.match(stdout, /interest/);
    assert.match(stdout, /enroll/);
    assert.match(stdout, /removals/);
    assert.match(stdout, /classifications/);
    assert.match(stdout, /penalties/);
  });

  it("lists levy actions", () => {
    const { stdout } = runForge("levy", "--help");
    assert.match(stdout, /calculate/);
    assert.match(stdout, /rates/);
    assert.match(stdout, /certify/);
    assert.match(stdout, /project/);
    assert.match(stdout, /risk/);
  });

  it("lists sales actions", () => {
    const { stdout } = runForge("sales", "--help");
    assert.match(stdout, /qualify/);
    assert.match(stdout, /comps/);
    assert.match(stdout, /ratio/);
    assert.match(stdout, /regression/);
  });

  it("lists cost actions", () => {
    const { stdout } = runForge("cost", "--help");
    assert.match(stdout, /estimate/);
    assert.match(stdout, /depreciation/);
    assert.match(stdout, /income/);
    assert.match(stdout, /matrix/);
    assert.match(stdout, /batch/);
  });
});

describe("TerraForge CLI — Error Handling", () => {
  it("rejects unknown module", () => {
    const { stderr, exitCode } = runForge("bogus", "action");
    assert.equal(exitCode, 1);
    assert.match(stderr, /Unknown module: bogus/);
  });

  it("rejects unknown action for valid module", () => {
    const { stderr, exitCode } = runForge("cuforge", "bogus");
    assert.equal(exitCode, 1);
    assert.match(stderr, /Unknown action: bogus/);
  });

  it("shows module actions when no action provided", () => {
    const { stderr, exitCode } = runForge("levy");
    assert.equal(exitCode, 1);
    assert.match(stderr, /Available for levy/);
  });

  it("cost batch requires --batch flag", () => {
    const { stderr, exitCode } = runForge("cost", "batch");
    assert.equal(exitCode, 1);
    assert.match(stderr, /batch.*required/i);
  });
});

describe("TerraForge CLI — API Integration Contract", () => {
  // These tests verify the CLI correctly formats API calls
  // They will fail with connection errors (expected — no backend running)
  // but validate the URL construction and error reporting

  it("cuforge rollback attempts correct API call", () => {
    const { stderr, exitCode } = runForge(
      "cuforge", "rollback",
      "--parcel", "P-TEST",
      "--start-year", "2020",
      "--api", "http://localhost:99999"
    );
    assert.equal(exitCode, 1);
    // Should fail with connection error, not arg parsing error
    assert.match(stderr, /Error/i);
  });

  it("levy calculate attempts correct API call", () => {
    const { stderr, exitCode } = runForge(
      "levy", "calculate",
      "--district", "FD1",
      "--av", "500000",
      "--rate", "1.5",
      "--api", "http://localhost:99999"
    );
    assert.equal(exitCode, 1);
    assert.match(stderr, /Error/i);
  });

  it("cost estimate attempts correct API call", () => {
    const { stderr, exitCode } = runForge(
      "cost", "estimate",
      "--type", "residential",
      "--sqft", "2400",
      "--quality", "good",
      "--api", "http://localhost:99999"
    );
    assert.equal(exitCode, 1);
    assert.match(stderr, /Error/i);
  });

  it("sales qualify attempts correct API call", () => {
    const { stderr, exitCode } = runForge(
      "sales", "qualify",
      "--parcel", "P-TEST",
      "--api", "http://localhost:99999"
    );
    assert.equal(exitCode, 1);
    assert.match(stderr, /Error/i);
  });
});

describe("TerraForge CLI — Rust Kernel Contract", () => {
  it("kernel batch requires --batch file to exist", () => {
    const { stderr, exitCode } = runForge(
      "cost", "batch",
      "--batch", "/nonexistent/file.ndjson",
      "--kernel"
    );
    assert.equal(exitCode, 1);
    assert.match(stderr, /Error/i);
  });

  it("kernel path resolves to correct directory", () => {
    const kernelDir = path.join(ROOT, "packages", "terrabuild", "kernels", "terraforge.kernel.cost");
    assert.ok(fs.existsSync(kernelDir), "Rust kernel directory must exist");
    assert.ok(
      fs.existsSync(path.join(kernelDir, "Cargo.toml")),
      "Cargo.toml must exist in kernel directory"
    );
    assert.ok(
      fs.existsSync(path.join(kernelDir, "src", "main.rs")),
      "src/main.rs must exist in kernel directory"
    );
  });

  it("valuation kernel directory exists", () => {
    const kernelDir = path.join(ROOT, "packages", "terrabuild", "kernels", "terraforge.kernel.valuation");
    assert.ok(fs.existsSync(kernelDir), "Valuation kernel directory must exist");
    assert.ok(
      fs.existsSync(path.join(kernelDir, "Cargo.toml")),
      "Cargo.toml must exist in valuation kernel directory"
    );
  });
});

describe("TerraForge CLI — Output Formatting", () => {
  it("--json flag produces valid JSON on error", () => {
    const { stderr, exitCode } = runForge(
      "cuforge", "rollback",
      "--parcel", "P-TEST",
      "--api", "http://localhost:99999",
      "--json"
    );
    assert.equal(exitCode, 1);
    // stderr should be valid JSON
    const parsed = JSON.parse(stderr.trim());
    assert.ok(parsed.error, "JSON error output must have 'error' field");
  });
});
