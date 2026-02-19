#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ToolRegistry, ToolRunner, registerPhase84Handlers } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const PILOT_PORT = Number(process.env.PILOT_PORT || "4317");
const CANON_TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = 64 * 1024;
const SAFE_ENV_KEYS = [
  "PATH",
  "Path",
  "SystemRoot",
  "WINDIR",
  "ComSpec",
  "PATHEXT",
  "HOME",
  "USERPROFILE",
  "PNPM_HOME",
  "TEMP",
  "TMP",
  "NODE_OPTIONS",
];

const DEFAULT_COMPARE_INPUT = {
  county: "benton",
  parcelId: "P-300",
  years: [2024, 2022, 2023],
  includeBreakdown: false,
};
const DEFAULT_EXPLAIN_INPUT = {
  county: "benton",
  modelId: "res_avm_v3",
  asOfYear: 2025,
};

function nowIso() {
  return new Date().toISOString();
}

function writeJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`));
        req.destroy();
        return;
      }
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`invalid JSON body: ${err?.message ?? String(err)}`));
      }
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

function normalizeEcho(value) {
  if (typeof value !== "string") return "hello";
  const trimmed = value.trim();
  if (!trimmed) return "hello";
  return trimmed.slice(0, 160);
}

function buildPingNormalizedFallback(raw, startedAt, echoFallback) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const result =
    raw.result && typeof raw.result === "object" && !Array.isArray(raw.result)
      ? raw.result
      : null;
  const inputCount = Array.isArray(result?.inputs) ? result.inputs.length : 0;

  const toolId =
    typeof raw.toolId === "string" && raw.toolId.trim()
      ? raw.toolId.trim()
      : "canon_ping";
  const ok = typeof raw.ok === "boolean" ? raw.ok : true;

  return {
    ok,
    ts: startedAt,
    echo: normalizeEcho(echoFallback),
    toolId,
    inputCount,
  };
}

function parseCanonResponse(commandLabel, stdout, stderr, exitCode, options = {}) {
  const startedAt = nowIso();
  const trimmed = stdout.trim();

  if (!trimmed) {
    return {
      tool: commandLabel === "canon:ping" ? "terracanon-ping" : commandLabel.replace("canon:", "terracanon-"),
      version: 1,
      startedAt,
      dryRun: false,
      overallOk: false,
      error: `${commandLabel} produced no JSON output (exit ${exitCode})`,
      rawStdout: stdout,
      rawStderr: stderr,
      normalized: null,
      raw: null,
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("payload is not an object");
    }

    let overallOk = typeof parsed.overallOk === "boolean" ? parsed.overallOk : exitCode === 0;
    let error = typeof parsed.error === "string" ? parsed.error : undefined;
    let normalizedPayload = parsed.normalized;
    let pingRecovered = false;

    if (
      commandLabel === "canon:ping" &&
      !overallOk &&
      !normalizedPayload &&
      typeof error === "string" &&
      error.includes("missing keys")
    ) {
      const fallback = buildPingNormalizedFallback(parsed.raw, startedAt, options.echoFallback);
      if (fallback) {
        normalizedPayload = fallback;
        overallOk = fallback.ok;
        error = fallback.ok ? undefined : error;
        pingRecovered = fallback.ok;
      }
    }

    const normalized = {
      tool:
        typeof parsed.tool === "string"
          ? parsed.tool
          : commandLabel === "canon:ping"
            ? "terracanon-ping"
            : commandLabel.replace("canon:", "terracanon-"),
      version: typeof parsed.version === "number" ? parsed.version : 1,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : startedAt,
      dryRun: typeof parsed.dryRun === "boolean" ? parsed.dryRun : false,
      overallOk,
      error,
      stderr: typeof parsed.stderr === "string" ? parsed.stderr : undefined,
      rawStdout: typeof parsed.rawStdout === "string" ? parsed.rawStdout : undefined,
      rawStderr: typeof parsed.rawStderr === "string" ? parsed.rawStderr : undefined,
      normalized: normalizedPayload,
      raw: parsed.raw,
    };

    if (exitCode !== 0 && !pingRecovered) {
      return {
        ...normalized,
        overallOk: false,
        error: normalized.error || `${commandLabel} exited with code ${exitCode}`,
      };
    }

    if (stderr.trim()) {
      return { ...normalized, stderr: normalized.stderr || stderr.trim() };
    }

    return normalized;
  } catch (err) {
    return {
      tool: commandLabel === "canon:ping" ? "terracanon-ping" : commandLabel.replace("canon:", "terracanon-"),
      version: 1,
      startedAt,
      dryRun: false,
      overallOk: false,
      error: `${commandLabel} returned invalid JSON: ${err?.message ?? String(err)}`,
      rawStdout: stdout,
      rawStderr: stderr,
      normalized: null,
      raw: null,
    };
  }
}

function runCanonCommand(commandLabel, cliFlags) {
  return new Promise((resolve) => {
    const safeEnv = {};
    for (const key of SAFE_ENV_KEYS) {
      const value = process.env[key];
      if (typeof value === "string") {
        safeEnv[key] = value;
      }
    }
    safeEnv.TF_CANON_ADAPTER = "1";

    const commandName = commandLabel.replace("canon:", "");
    const child = spawn(process.execPath, ["tools/canon/canon.mjs", commandName, ...cliFlags], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: safeEnv,
    });

    let stdout = "";
    let stderr = "";
    let done = false;

    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      child.kill();
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${commandLabel} timed out after ${CANON_TIMEOUT_MS}ms`,
      });
    }, CANON_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      resolve({
        exitCode: 1,
        stdout: "",
        stderr: err.message,
      });
    });

    child.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function normalizeCompareInput(body) {
  if (!body || typeof body !== "object" || body.input === undefined || body.input === null) {
    return { params: { ...DEFAULT_COMPARE_INPUT, years: [...DEFAULT_COMPARE_INPUT.years] } };
  }

  const input = body.input;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "input must be an object" };
  }

  const source = input;
  const allowed = new Set(["county", "parcelId", "years", "includeBreakdown"]);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      return { error: `input contains unsupported key: ${key}` };
    }
  }

  const params = { ...DEFAULT_COMPARE_INPUT, years: [...DEFAULT_COMPARE_INPUT.years] };

  if ("county" in source) {
    if (typeof source.county !== "string" || !source.county.trim()) {
      return { error: "input.county must be a non-empty string" };
    }
    params.county = source.county.trim().toLowerCase();
  }

  if ("parcelId" in source) {
    if (typeof source.parcelId !== "string" || !source.parcelId.trim()) {
      return { error: "input.parcelId must be a non-empty string" };
    }
    params.parcelId = source.parcelId.trim().slice(0, 128);
  }

  if ("years" in source) {
    if (!Array.isArray(source.years) || source.years.length === 0 || source.years.length > 8) {
      return { error: "input.years must be an array of 1-8 years" };
    }
    const years = source.years.map((value) => Number(value));
    if (years.some((year) => !Number.isInteger(year) || year < 1900 || year > 2100)) {
      return { error: "input.years must contain valid integer years" };
    }
    params.years = years;
  }

  if ("includeBreakdown" in source) {
    if (typeof source.includeBreakdown !== "boolean") {
      return { error: "input.includeBreakdown must be boolean" };
    }
    params.includeBreakdown = source.includeBreakdown;
  }

  return { params };
}

function normalizeExplainInput(body) {
  const fallbackEcho = normalizeEcho(body?.echo);

  if (!body || typeof body !== "object" || body.input === undefined || body.input === null) {
    return {
      params: { ...DEFAULT_EXPLAIN_INPUT },
      echo: fallbackEcho,
    };
  }

  const input = body.input;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "input must be an object", echo: fallbackEcho };
  }

  const source = input;
  const allowed = new Set(["county", "modelId", "asOfYear"]);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      return { error: `input contains unsupported key: ${key}`, echo: fallbackEcho };
    }
  }

  const params = { ...DEFAULT_EXPLAIN_INPUT };

  if ("county" in source) {
    if (typeof source.county !== "string" || !source.county.trim()) {
      return { error: "input.county must be a non-empty string", echo: fallbackEcho };
    }
    params.county = source.county.trim().toLowerCase();
  }

  if ("modelId" in source) {
    if (typeof source.modelId !== "string" || !source.modelId.trim()) {
      return { error: "input.modelId must be a non-empty string", echo: fallbackEcho };
    }
    params.modelId = source.modelId.trim().slice(0, 128);
  }

  if ("asOfYear" in source) {
    const asOfYear = Number(source.asOfYear);
    if (!Number.isInteger(asOfYear) || asOfYear < 1900 || asOfYear > 2100) {
      return { error: "input.asOfYear must be a valid integer year", echo: fallbackEcho };
    }
    params.asOfYear = asOfYear;
  }

  return { params, echo: fallbackEcho };
}

let compareRunnerPromise = null;

async function getCompareRunner() {
  if (!compareRunnerPromise) {
    compareRunnerPromise = (async () => {
      const registry = new ToolRegistry();
      await registry.initialize(path.resolve(REPO_ROOT, "tools/registry/terrapilot.tools.json"));
      const runner = new ToolRunner({ registry });
      registerPhase84Handlers(runner);
      return runner;
    })();
  }
  return compareRunnerPromise;
}

async function handleCompareAssessedValueHistory(body) {
  const startedAt = nowIso();
  const normalizedRequest = normalizeCompareInput(body);
  if (!normalizedRequest.params) {
    return {
      status: 200,
      payload: {
        tool: "compare_assessed_value_history",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: normalizedRequest.error || "invalid input",
        normalized: null,
        raw: null,
      },
    };
  }

  try {
    const runner = await getCompareRunner();
    const result = await runner.execute({
      toolId: "compare_assessed_value_history",
      params: normalizedRequest.params,
      context: {
        countyId: "benton",
        userId: "pilot-runtime",
        roles: ["appraiser"],
        mode: "muse",
      },
    });

    if (result.ok) {
      return {
        status: 200,
        payload: {
          tool: "compare_assessed_value_history",
          version: 1,
          startedAt,
          dryRun: false,
          overallOk: true,
          normalized: result.result,
          raw: {
            correlationId: result.correlationId,
            traceEventId: result.traceEventId,
          },
        },
      };
    }

    return {
      status: 200,
      payload: {
        tool: "compare_assessed_value_history",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: result.error || "compare_assessed_value_history failed",
        rawStderr: result.errorCode ? String(result.errorCode) : undefined,
        raw: {
          correlationId: result.correlationId,
          errorCode: result.errorCode,
        },
      },
    };
  } catch (err) {
    return {
      status: 200,
      payload: {
        tool: "compare_assessed_value_history",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: err?.message ?? String(err),
        raw: null,
      },
    };
  }
}

async function handleExplainModelInputs(body) {
  const startedAt = nowIso();
  const normalizedRequest = normalizeExplainInput(body);
  if (!normalizedRequest.params) {
    return {
      status: 200,
      payload: {
        tool: "explain_model_inputs",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: normalizedRequest.error || "invalid input",
        normalized: null,
        raw: null,
      },
    };
  }

  try {
    const runner = await getCompareRunner();
    const result = await runner.execute({
      toolId: "explain_model_inputs",
      params: normalizedRequest.params,
      context: {
        countyId: "benton",
        userId: "pilot-runtime",
        roles: ["appraiser"],
        mode: "muse",
      },
    });

    if (result.ok) {
      const inputs = Array.isArray(result.result?.inputs) ? result.result.inputs : [];
      return {
        status: 200,
        payload: {
          tool: "explain_model_inputs",
          version: 1,
          startedAt,
          dryRun: false,
          overallOk: true,
          normalized: {
            ok: true,
            ts: startedAt,
            echo: normalizedRequest.echo,
            toolId: "explain_model_inputs",
            inputCount: inputs.length,
          },
          raw: {
            correlationId: result.correlationId,
            traceEventId: result.traceEventId,
            result: result.result,
          },
        },
      };
    }

    return {
      status: 200,
      payload: {
        tool: "explain_model_inputs",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: result.error || "explain_model_inputs failed",
        rawStderr: result.errorCode ? String(result.errorCode) : undefined,
        raw: {
          correlationId: result.correlationId,
          errorCode: result.errorCode,
        },
      },
    };
  } catch (err) {
    return {
      status: 200,
      payload: {
        tool: "explain_model_inputs",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: err?.message ?? String(err),
        raw: null,
      },
    };
  }
}

const server = createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const method = req.method || "GET";
  const requestUrl = new URL(req.url || "/", `http://localhost:${PILOT_PORT}`);
  const pathname = requestUrl.pathname;

  try {
    if (method === "GET" && pathname === "/pilot/health") {
      writeJson(res, 200, {
        status: "operational",
        service: "terrafusion-pilot-runtime",
        timestamp: nowIso(),
      });
      return;
    }

    if (method === "POST" && pathname === "/pilot/canon/ping") {
      const body = await readJsonBody(req);
      const echo = normalizeEcho(body.echo);
      const result = await runCanonCommand("canon:ping", ["--json", "--echo", echo]);
      writeJson(
        res,
        200,
        parseCanonResponse("canon:ping", result.stdout, result.stderr, result.exitCode, {
          echoFallback: echo,
        })
      );
      return;
    }

    if (method === "POST" && pathname === "/pilot/canon/doctor") {
      const result = await runCanonCommand("canon:doctor", ["--json"]);
      writeJson(
        res,
        200,
        parseCanonResponse("canon:doctor", result.stdout, result.stderr, result.exitCode)
      );
      return;
    }

    if (method === "POST" && pathname === "/pilot/canon/gatefast") {
      const result = await runCanonCommand("canon:gatefast", ["--json"]);
      writeJson(
        res,
        200,
        parseCanonResponse("canon:gatefast", result.stdout, result.stderr, result.exitCode)
      );
      return;
    }

    if (method === "POST" && pathname === "/pilot/workbench/explain-model-inputs") {
      const body = await readJsonBody(req);
      const result = await handleExplainModelInputs(body);
      writeJson(res, result.status, result.payload);
      return;
    }

    if (method === "POST" && pathname === "/pilot/workbench/compare-assessed-value-history") {
      const body = await readJsonBody(req);
      const result = await handleCompareAssessedValueHistory(body);
      writeJson(res, result.status, result.payload);
      return;
    }

    writeJson(res, 404, {
      error: "NOT_FOUND",
      message: `No pilot route for ${method} ${pathname}`,
    });
  } catch (err) {
    writeJson(res, 500, {
      error: "INTERNAL_ERROR",
      message: err?.message ?? String(err),
    });
  }
});

server.listen(PILOT_PORT, () => {
  console.log(`[pilot] runtime listening on http://localhost:${PILOT_PORT}/pilot`);
});
