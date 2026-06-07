#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildCountyStudioRealDevPortPreflightReport
} from "./county-studio-real-dev-port-preflight.mjs";

const repoRoot = process.cwd();

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  return {
    port: address.port,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test("allows real dev port preflight when required ports are free", () => {
  const report = buildCountyStudioRealDevPortPreflightReport({
    portChecks: [
      { serviceName: "governed pilot runtime", port: 4317, requiredForDev: true, occupied: false },
      { serviceName: "TerraFusion API runtime", port: 5046, requiredForDev: true, occupied: false }
    ],
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_PORT_PREFLIGHT_PASS");
  assert.equal(report.portPreflightPassed, true);
  assert.equal(report.productionProofAllowed, false);
  assert.equal(report.operationalProofAllowed, false);
  assert.equal(report.occupiedPorts.length, 0);
  assert.deepEqual(
    report.requiredPorts.map((item) => [item.serviceName, item.port, item.envVar]),
    [
      ["governed pilot runtime", 4317, "TF_PILOT_PORT"],
      ["TerraFusion API runtime", 5046, "TF_API_PORT"]
    ]
  );
});

test("blocks real dev port preflight when a required port is occupied by a conflicting service", () => {
  const report = buildCountyStudioRealDevPortPreflightReport({
    portChecks: [
      {
        serviceName: "governed pilot runtime",
        port: 4317,
        requiredForDev: true,
        occupied: true,
        owningProcess: { processId: 50784, processName: "node" }
      },
      { serviceName: "TerraFusion API runtime", port: 5046, requiredForDev: true, occupied: false }
    ],
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_PORT_PREFLIGHT_BLOCKED");
  assert.equal(report.portPreflightPassed, false);
  assert.equal(report.productionProofAllowed, false);
  assert.equal(report.operationalProofAllowed, false);
  assert.equal(report.occupiedPorts.length, 1);
  assert.equal(report.occupiedPorts[0].port, 4317);
  assert.match(report.occupiedPorts[0].remediation, /Stop the conflicting process/i);
  assert.match(report.occupiedPorts[0].remediation, /TF_PILOT_PORT/i);
});

test("CLI writes blocked evidence for an actually occupied required port", async () => {
  const reserved = await reservePort();
  try {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-county-studio-port-preflight-"));
    const outJson = path.join(tmp, "port-preflight.json");
    const outMd = path.join(tmp, "port-preflight.md");

    const result = spawnSync(
      "node",
      [
        "os-platform/core/pilot/county-studio-real-dev-port-preflight.mjs",
        "--pilot-port",
        String(reserved.port),
        "--api-port",
        "0",
        "--out-json",
        outJson,
        "--out-md",
        outMd
      ],
      { cwd: repoRoot, encoding: "utf8" }
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /REAL_DEV_PORT_PREFLIGHT_BLOCKED/);
    assert.ok(fs.existsSync(outJson));
    assert.ok(fs.existsSync(outMd));

    const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
    const markdown = fs.readFileSync(outMd, "utf8");
    assert.equal(report.portPreflightPassed, false);
    assert.equal(report.occupiedPorts[0].port, reserved.port);
    assert.equal(report.productionProofAllowed, false);
    assert.equal(report.operationalProofAllowed, false);
    assert.match(markdown, /Occupied Ports/);
    assert.match(markdown, /TF_PILOT_PORT/);
  } finally {
    await reserved.close();
  }
});
