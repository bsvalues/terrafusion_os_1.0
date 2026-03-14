#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_KERNEL_URL = "http://localhost:5000";
const DEFAULT_PILOT_URL = "http://localhost:4317";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/r1-local-proof.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    kernelUrl: trimSlash(readValue("--kernel-url", process.env.R1_KERNEL_URL || DEFAULT_KERNEL_URL)),
    pilotUrl: trimSlash(readValue("--pilot-url", process.env.R1_PILOT_URL || DEFAULT_PILOT_URL)),
    outPath: readValue("--out", process.env.R1_PROOF_OUT || DEFAULT_OUT_PATH),
  };
}

function trimSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function printPass(name, detail) {
  process.stdout.write(`PASS ${name}${detail ? ` - ${detail}` : ""}\n`);
}

function printFail(name, detail) {
  process.stderr.write(`FAIL ${name}${detail ? ` - ${detail}` : ""}\n`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForTrace(pilotUrl, correlationId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const trace = await fetchJson(`${pilotUrl}/pilot/trace/${encodeURIComponent(correlationId)}`);
    if (trace.ok && Array.isArray(trace.body?.events) && trace.body.events.length > 0) {
      return trace;
    }
    await sleep(250);
  }

  throw new Error(`Timed out waiting for trace events for correlationId ${correlationId}`);
}

async function main() {
  const { kernelUrl, pilotUrl, outPath } = parseArgs(process.argv);
  const evidence = {
    generatedAt: new Date().toISOString(),
    kernelUrl,
    pilotUrl,
    checks: [],
    summary: {
      ok: false,
      failures: 0,
    },
    note: "Local governed-path proof only. Does not claim PACS or Benton production data truth.",
  };

  const recordCheck = (name, ok, detail, payload) => {
    evidence.checks.push({ name, ok, detail, payload });
    if (ok) {
      printPass(name, detail);
    } else {
      printFail(name, detail);
      evidence.summary.failures += 1;
    }
  };

  try {
    const kernelHealth = await fetchJson(`${kernelUrl}/health`);
    assert(kernelHealth.ok, `Kernel health returned ${kernelHealth.status}`);
    recordCheck("kernel.health", true, kernelHealth.body?.status || "healthy", kernelHealth.body);

    const pilotHealth = await fetchJson(`${pilotUrl}/pilot/health`);
    assert(pilotHealth.ok, `Pilot health returned ${pilotHealth.status}`);
    recordCheck("pilot.health", true, pilotHealth.body?.status || "operational", pilotHealth.body);

    const tools = await fetchJson(`${pilotUrl}/pilot/tools`);
    assert(tools.ok, `Pilot tools returned ${tools.status}`);
    const valuationTool = Array.isArray(tools.body?.tools)
      ? tools.body.tools.find((tool) => tool.toolId === "run_valuation_model")
      : null;
    assert(valuationTool, "run_valuation_model missing from Pilot tool list");
    recordCheck(
      "pilot.tools.run_valuation_model",
      true,
      `toolCount=${tools.body?.count ?? "unknown"}`,
      valuationTool
    );

    const baseInvocation = {
      toolId: "run_valuation_model",
      params: {
        county: "benton",
        parcelId: "BENTON-001",
        taxYear: 2025,
        modelType: "cost",
      },
      mode: "pilot",
      parcelId: "BENTON-001",
    };

    const noConfirmation = await fetchJson(`${pilotUrl}/pilot/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseInvocation,
        reasonCode: "annual_certification",
      }),
    });
    assert(noConfirmation.body?.errorCode === "CONFIRMATION_REQUIRED", "Expected CONFIRMATION_REQUIRED");
    assert(typeof noConfirmation.body?.correlationId === "string", "Missing correlationId on confirmation gate");
    recordCheck(
      "pilot.invoke.confirmation_gate",
      true,
      noConfirmation.body.errorCode,
      noConfirmation.body
    );

    const noReasonCode = await fetchJson(`${pilotUrl}/pilot/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseInvocation,
        confirmation: true,
      }),
    });
    assert(noReasonCode.body?.errorCode === "REASON_CODE_REQUIRED", "Expected REASON_CODE_REQUIRED");
    assert(typeof noReasonCode.body?.correlationId === "string", "Missing correlationId on reason-code gate");
    recordCheck(
      "pilot.invoke.reason_code_gate",
      true,
      noReasonCode.body.errorCode,
      noReasonCode.body
    );

    const success = await fetchJson(`${pilotUrl}/pilot/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseInvocation,
        confirmation: true,
        reasonCode: "annual_certification",
      }),
    });
    assert(success.body?.ok === true, "Expected successful run_valuation_model invocation");
    assert(typeof success.body?.correlationId === "string", "Missing correlationId on successful invocation");
    assert(typeof success.body?.traceEventId === "string", "Missing traceEventId on successful invocation");
    assert(typeof success.body?.result?.estimatedValue === "number", "Missing numeric estimatedValue");
    recordCheck(
      "pilot.invoke.run_valuation_model",
      true,
      `correlationId=${success.body.correlationId}`,
      success.body
    );

    const trace = await waitForTrace(pilotUrl, success.body.correlationId);
    const eventTypes = Array.isArray(trace.body?.events)
      ? trace.body.events.map((event) => event.type)
      : [];
    assert(eventTypes.includes("tool_invoked"), "Trace missing tool_invoked");
    assert(eventTypes.includes("tool_completed"), "Trace missing tool_completed");
    recordCheck(
      "pilot.trace.run_valuation_model",
      true,
      eventTypes.join(","),
      trace.body
    );

    evidence.summary.ok = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordCheck("r1.local.proof", false, message, { error: message });
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`Evidence written to ${outPath}\n`);

  process.exitCode = evidence.summary.ok ? 0 : 1;
}

await main();
