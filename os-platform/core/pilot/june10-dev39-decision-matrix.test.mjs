import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildPacket, writePacket } from "./june10-dev39-decision-matrix.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const scriptPath = path.join(__dirname, "june10-dev39-decision-matrix.mjs");

test("builds the dev39 decision matrix from current audit evidence", () => {
  const packet = buildPacket();

  assert.equal(packet.productionTouched, false);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.verdict.controlledStatewideRuntimePreview, "READY_FOR_DEMO");
  assert.equal(packet.verdict.productionReadiness, "NO_GO");
  assert.equal(packet.verdict.fullApplicationCapability, "NOT_READY");
  assert.equal(packet.verdict.fullStatewideCertification, "NO_GO");
  assert.ok(packet.metrics.endpointMatrix.totalEndpoints > 0);
  assert.ok(packet.metrics.syntheticSurfaceAudit.productionRiskFiles > 0);
  assert.equal(packet.decisions.productionBinding, "BLOCKED");
});

test("writes latest JSON and Markdown decision matrix artifacts", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-dev39-matrix-"));
  const outJson = path.join(dir, "matrix.json");
  const outMd = path.join(dir, "matrix.md");

  const packet = writePacket({ outJson, outMd });

  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).packetHash, packet.packetHash);
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.match(markdown, /Controlled Statewide Runtime Preview/);
  assert.match(markdown, /Production Binding/);
});

test("CLI invocation writes the latest decision matrix artifacts", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-dev39-matrix-cli-"));
  const outJson = path.join(dir, "matrix.json");
  const outMd = path.join(dir, "matrix.md");

  const result = spawnSync(process.execPath, [scriptPath, "--out-json", outJson, "--out-md", outMd], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /matrix\.json/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).name, "June 10 dev39 Decision Matrix");
  assert.match(fs.readFileSync(outMd, "utf8"), /June 10 dev39 Decision Matrix/);
});
