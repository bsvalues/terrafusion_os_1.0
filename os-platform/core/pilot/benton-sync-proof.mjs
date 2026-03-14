#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { backendGet, unwrapBackend } from "./backendClient.js";
import { acquirePilotToken } from "./pilotAuth.js";

const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/benton-sync-proof.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    outPath: readValue("--out", process.env.BENTON_SYNC_PROOF_OUT || DEFAULT_OUT_PATH),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const apiBaseUrl = process.env.TF_API_BASE_URL || `http://localhost:${process.env.TF_API_PORT || "5000"}`;
  const evidence = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl,
    checks: [],
    summary: { ok: false, failures: 0 },
    scope: "Benton sync proof for the canonical TerraFusionSync conversion lane",
  };

  const record = (name, ok, detail, payload) => {
    evidence.checks.push({ name, ok, detail, payload });
    if (!ok) evidence.summary.failures += 1;
    const stream = ok ? process.stdout : process.stderr;
    stream.write(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}\n`);
  };

  try {
    const token = await acquirePilotToken();
    record("auth.login", true, token.email, { roles: token.roles, expiresAt: token.expiresAt.toISOString() });

    const health = await backendGet("/health", { token: token.token });
    const healthData = unwrapBackend(health, "backend health");
    const healthStatus = typeof healthData?.status === "string" ? healthData.status.toLowerCase() : "";
    assert(healthStatus === "healthy", "Backend health did not return healthy");
    record("backend.health", true, healthData.status, healthData);

    const syncStatusBefore = await backendGet("/api/TerraFusionSync/status", { token: token.token });
    record(
      "sync.status.before",
      true,
      syncStatusBefore.ok ? "status available" : `status unavailable: ${syncStatusBefore.error}`,
      syncStatusBefore
    );

    const syncResponse = await fetch(`${apiBaseUrl}/api/TerraFusionSync/counties/Benton/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({
        DataTypes: ["Sales"],
        BatchSize: 2000,
        ForceFullSync: false,
      }),
      signal: AbortSignal.timeout(480_000),
    });
    const syncText = await syncResponse.text();
    const syncData = syncText ? JSON.parse(syncText) : {};
    assert(syncResponse.ok, `Benton sync returned ${syncResponse.status}`);
    assert(syncData?.success === true, "Benton sync did not report success");
    assert(typeof syncData?.recordsProcessed === "number", "Benton sync missing recordsProcessed");
    const salesAdded = Number(syncData?.metadata?.salesAdded ?? 0);
    const salesUpdated = Number(syncData?.metadata?.salesUpdated ?? 0);
    const salesSkipped = Number(syncData?.metadata?.salesSkipped ?? 0);
    const salesActivity = salesAdded + salesUpdated + salesSkipped;
    assert(salesActivity > 0, "Benton sync returned no sales activity metadata");
    record(
      "sync.county.benton",
      true,
      `recordsProcessed=${syncData.recordsProcessed}, salesAdded=${salesAdded}, salesUpdated=${salesUpdated}, salesSkipped=${salesSkipped}`,
      syncData
    );

    const syncStatusAfter = await backendGet("/api/TerraFusionSync/status", { token: token.token });
    record(
      "sync.status.after",
      true,
      syncStatusAfter.ok ? "status available" : `status unavailable: ${syncStatusAfter.error}`,
      syncStatusAfter
    );

    evidence.summary.ok = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record("benton.sync.proof", false, message, { error: message });
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`Evidence written to ${outPath}\n`);
  process.exitCode = evidence.summary.ok ? 0 : 1;
}

await main();
