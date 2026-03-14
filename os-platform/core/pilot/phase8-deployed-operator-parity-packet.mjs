#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const PRODUCTION_EDGE_IP = "72.60.126.11";
const SUBJECT_PARCEL_ID = "100984010001008";
const LOGIN_EMAIL = process.env.TF_PHASE8_EMAIL || "admin@terrafusionmarket.com";
const LOGIN_PASSWORD = process.env.TF_PHASE8_PASSWORD || "TerraFusion2026!";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase8-deployed-operator-parity.latest.json"
);

function curlBinary() {
  return process.platform === "win32" ? "curl.exe" : "curl";
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE8_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

function curlRequest(url, { method = "GET", headers = {}, data = null, resolveHost = null } = {}) {
  const args = ["--silent", "--show-error", "--location", "--write-out", "\n__STATUS__:%{http_code}"];
  if (resolveHost) {
    args.push("--resolve", `${resolveHost.host}:443:${resolveHost.ip}`);
    args.push("--resolve", `${resolveHost.host}:80:${resolveHost.ip}`);
    args.push("-k");
  }
  if (method !== "GET") {
    args.push("-X", method);
  }
  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }
  if (data !== null) {
    args.push("-H", "Content-Type: application/json");
    args.push("--data", typeof data === "string" ? data : JSON.stringify(data));
  }
  args.push(url);

  const stdout = execFileSync(curlBinary(), args, { encoding: "utf8" });
  const marker = "\n__STATUS__:";
  const idx = stdout.lastIndexOf(marker);
  const body = idx === -1 ? stdout : stdout.slice(0, idx);
  const status = idx === -1 ? null : Number(stdout.slice(idx + marker.length).trim());

  let json = null;
  try {
    json = JSON.parse(body.trim());
  } catch {
    json = null;
  }

  return { status, body, json };
}

function decodeJwtClaims(token) {
  const segments = token.split(".");
  if (segments.length < 2) {
    throw new Error("Invalid JWT received from login endpoint");
  }

  return JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  for (const env of [
    { name: "staging", baseUrl: STAGING_BASE_URL, resolveHost: null },
    {
      name: "production",
      baseUrl: PRODUCTION_BASE_URL,
      resolveHost: { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP },
    },
  ]) {
    const login = curlRequest(`${env.baseUrl}/api/auth/login`, {
      method: "POST",
      data: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD },
      resolveHost: env.resolveHost,
    });

    const loginOk = login.status === 200 && !!login.json?.token;
    const claims = loginOk ? decodeJwtClaims(login.json.token) : null;
    record(
      `${env.name}.operator.login`,
      loginOk,
      loginOk ? LOGIN_EMAIL : `status=${login.status}`,
      claims,
      loginOk ? null : `${env.name} operator login failed`
    );

    if (!loginOk) {
      continue;
    }

    const countyClaimOk = !!claims?.countyId && !!claims?.countyCode;
    record(
      `${env.name}.operator.county_claims`,
      countyClaimOk,
      countyClaimOk
        ? `countyId=${claims.countyId}, countyCode=${claims.countyCode}`
        : "missing countyId/countyCode in JWT",
      claims,
      countyClaimOk ? null : `${env.name} JWT is still missing Benton county context`
    );

    const comps = curlRequest(`${env.baseUrl}/api/costforge/comps/${SUBJECT_PARCEL_ID}`, {
      headers: { Authorization: `Bearer ${login.json.token}` },
      resolveHost: env.resolveHost,
    });

    const comparableCount = Array.isArray(comps.json?.comparables)
      ? comps.json.comparables.length
      : Array.isArray(comps.json?.comps)
        ? comps.json.comps.length
        : 0;

    const compsOk = comps.status === 200 && comparableCount > 0;
    record(
      `${env.name}.operator.comps`,
      compsOk,
      `status=${comps.status}, comps=${comparableCount}`,
      comps.json ?? comps.body,
      compsOk ? null : `${env.name} live CostForge comps path is not returning Benton comparables`
    );
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 8 deployed Benton operator parity packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 8 deployed Benton operator parity packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase8.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 8 deployed operator parity packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 8 deployed operator parity packet failed to execute"],
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});
