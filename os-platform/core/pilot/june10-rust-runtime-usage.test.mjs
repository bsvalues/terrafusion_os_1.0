#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  buildJune10RustRuntimeUsageReport,
  inspectJune10RustRuntimeUsage
} from "./june10-rust-runtime-usage.mjs";

const execFileAsync = promisify(execFile);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRustFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-rust-runtime-"));

  write(
    path.join(root, "packages", "terrabuild", "kernels", "Cargo.toml"),
    `[workspace]\nmembers = ["terraforge.kernel.cost", "terraforge.kernel.valuation"]\n`
  );
  write(
    path.join(root, "packages", "terrabuild", "kernels", "terraforge.kernel.cost", "Cargo.toml"),
    `[package]\nname = "terraforge-kernel-cost"\nversion = "1.0.0"\nedition = "2021"\n`
  );
  write(
    path.join(root, "packages", "terrabuild", "kernels", "terraforge.kernel.cost", "src", "main.rs"),
    `fn main() { println!("cost"); }\n`
  );
  write(
    path.join(root, "packages", "terrabuild", "kernels", "terraforge.kernel.valuation", "Cargo.toml"),
    `[package]\nname = "terraforge-kernel-valuation"\nversion = "1.0.0"\nedition = "2021"\n`
  );
  write(
    path.join(root, "packages", "terrabuild", "kernels", "terraforge.kernel.valuation", "src", "main.rs"),
    `fn main() { println!("valuation"); }\n`
  );
  write(
    path.join(root, "backend", "src", "TerraFusion.API", "Program.cs"),
    `
      builder.Services.AddSingleton<IRustKernelProcessHost, RustKernelProcessHost>();
      builder.Services.AddScoped<IKernelValuationService, KernelValuationService>();
      // builder.Services.AddSingleton<RustFFIService>();
    `
  );
  write(
    path.join(root, "backend", "src", "TerraFusion.API", "Services", "RustFFIService.cs"),
    `public class RustFFIService {}\n`
  );
  write(
    path.join(root, "backend", "src", "TerraFusion.API", "Controllers", "CostForgeController.cs"),
    `
      [HttpPost("batch-calculate")]
      public async Task<IActionResult> Batch() {
        var kernelValuation = HttpContext.RequestServices.GetService<IKernelValuationService>();
        return Ok("engine=terraforge-rust-kernel-v1.2");
      }
    `
  );
  write(
    path.join(root, "backend", "src", "TerraFusion.API", "Controllers", "ValuationController.cs"),
    `
      [HttpPost("kernel-cost-approach")]
      public async Task<IActionResult> KernelCostApproach() => Ok(new { kernel = true });
    `
  );
  write(
    path.join(root, "QUARANTINE", "old", "Cargo.toml"),
    `[package]\nname = "quarantined"\nversion = "0.0.1"\n`
  );

  return root;
}

test("reports Rust crates, runtime integration evidence, and missing live proof", () => {
  const report = buildJune10RustRuntimeUsageReport({
    repoRoot: "C:/repo",
    crates: [
      {
        name: "terraforge-kernel-cost",
        path: "packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml",
        launchRelevant: true,
        quarantined: false
      }
    ],
    runtimeIntegrations: [
      {
        endpoint: "POST /api/costforge/batch-calculate",
        filePath: "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
        integrationEvidence: ["IKernelValuationService", "engine=terraforge-rust-kernel-v1.2"],
        liveProven: false
      }
    ],
    expectedBinaries: [
      {
        name: "terraforge-kernel-cost",
        expectedPaths: ["packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe"],
        foundPath: null
      }
    ],
    normalWorkflowStubs: [],
    unusedRustServices: []
  });

  assert.equal(report.passed, false);
  assert.equal(report.summary.rustCrates, 1);
  assert.equal(report.summary.runtimeIntegrations, 1);
  assert.equal(report.summary.liveProvenRuntimeIntegrations, 0);
  assert.ok(report.warnings.some((warning) => warning.source === "live_runtime"));
});

test("passes when launch-relevant Rust integrations have binaries and live proof", () => {
  const report = buildJune10RustRuntimeUsageReport({
    repoRoot: "C:/repo",
    crates: [
      {
        name: "terraforge-kernel-cost",
        path: "packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml",
        launchRelevant: true,
        quarantined: false
      }
    ],
    runtimeIntegrations: [
      {
        endpoint: "POST /api/costforge/batch-calculate",
        filePath: "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
        integrationEvidence: ["IKernelValuationService"],
        liveProven: true
      }
    ],
    expectedBinaries: [
      {
        name: "terraforge-kernel-cost",
        expectedPaths: ["packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe"],
        foundPath: "packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe"
      }
    ],
    normalWorkflowStubs: [],
    unusedRustServices: []
  });

  assert.equal(report.passed, true);
  assert.equal(report.warnings.length, 0);
});

test("inspects a fixture repo and ignores quarantined Rust crates", () => {
  const root = makeRustFixture();
  const report = inspectJune10RustRuntimeUsage({ repoRoot: root });

  assert.equal(report.summary.rustCrates, 3);
  assert.equal(report.summary.launchRelevantRustCrates, 2);
  assert.equal(report.summary.quarantinedRustCrates, 1);
  assert.equal(report.summary.runtimeIntegrations, 3);
  assert.equal(report.summary.normalWorkflowStubs, 0);
  assert.equal(report.summary.unusedRustServices, 1);
  assert.ok(report.runtimeIntegrations.some((integration) => integration.endpoint === "POST /api/costforge/batch-calculate"));
  assert.ok(report.runtimeIntegrations.some((integration) => integration.endpoint === "POST /api/valuation/kernel-cost-approach"));
  assert.equal(report.passed, false);
});

test("CLI writes Rust runtime usage JSON and Markdown evidence", async () => {
  const root = makeRustFixture();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-rust-runtime-out-"));
  const outJson = path.join(tmp, "rust.json");
  const outMd = path.join(tmp, "rust.md");

  const result = await execFileAsync(
    "node",
    [
      "os-platform/core/pilot/june10-rust-runtime-usage.mjs",
      "--repo-root",
      root,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd() }
  );

  assert.match(result.stdout, /"passed": false/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.launchRelevantRustCrates, 2);
  assert.match(fs.readFileSync(outMd, "utf8"), /June 10 Rust Runtime Usage/);
});
