#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { backendGet, unwrapBackend } from "./backendClient.js";
import { acquirePilotToken } from "./pilotAuth.js";

const DEFAULT_PARCEL_ID = process.env.BENTON_PROOF_PARCEL_ID || "100984010001008";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/benton-comps-proof.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    parcelId: readValue("--parcel-id", DEFAULT_PARCEL_ID),
    outPath: readValue("--out", process.env.BENTON_COMPS_PROOF_OUT || DEFAULT_OUT_PATH),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { parcelId, outPath } = parseArgs(process.argv);
  const evidence = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: process.env.TF_API_BASE_URL || `http://localhost:${process.env.TF_API_PORT || "5000"}`,
    parcelId,
    checks: [],
    summary: { ok: false, failures: 0 },
    scope: "Benton comparable-sales proof for TerraFusion operational CostForge endpoints",
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

    const routeA = await backendGet(`/api/costforge/comps/${encodeURIComponent(parcelId)}`, { token: token.token });
    const routeAData = unwrapBackend(routeA, "costforge comps route");
    const compsA = Array.isArray(routeAData?.comps) ? routeAData.comps : [];
    assert(compsA.length > 0, "Route /api/costforge/comps returned zero comparables");
    assert(typeof routeAData?.selectionMethod === "string" && routeAData.selectionMethod.length > 0, "Route /api/costforge/comps missing selectionMethod");
    record("costforge.comps.routeA", true, `count=${compsA.length}`, routeAData);

    const routeB = await backendGet(`/api/costforge/parcels/${encodeURIComponent(parcelId)}/comparables?limit=5`, {
      token: token.token,
    });
    const routeBData = unwrapBackend(routeB, "parcel comparables route");
    const compsB = Array.isArray(routeBData?.comparables) ? routeBData.comparables : [];
    assert(compsB.length > 0, "Route /api/costforge/parcels/{parcelId}/comparables returned zero comparables");
    assert(typeof routeBData?.selectionMethod === "string" && routeBData.selectionMethod.length > 0, "Route /api/costforge/parcels/{parcelId}/comparables missing selectionMethod");
    record("costforge.comps.routeB", true, `count=${compsB.length}`, routeBData);

    const aIds = new Set(compsA.map((item) => item.id).filter(Boolean));
    const overlap = compsB.filter((item) => aIds.has(item.id)).length;
    assert(overlap > 0, "Comparable endpoints do not materially overlap on live Benton data");
    record("costforge.comps.overlap", true, `overlap=${overlap}`, {
      routeACount: compsA.length,
      routeBCount: compsB.length,
      overlap,
    });

    evidence.summary.ok = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record("benton.comps.proof", false, message, { error: message });
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`Evidence written to ${outPath}\n`);
  process.exitCode = evidence.summary.ok ? 0 : 1;
}

await main();
