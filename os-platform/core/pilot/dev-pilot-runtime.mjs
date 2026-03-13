#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers } from "./index.js";
import { traceService } from "../trace/index.js";

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
  parcelId: "1-0531-100-0001-000",
  years: [2025, 2024, 2023],
  includeBreakdown: false,
};
const DEFAULT_EXPLAIN_INPUT = {
  county: "benton",
  modelId: "cost-approach",
  asOfYear: 2025,
};
const DEFAULT_SALES_COMPS_INPUT = {
  county: "benton",
  subjectId: "1-0531-100-0001-000",
  compIds: ["C-101", "C-102", "C-103"],
  adjustments: true,
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

  const echo = normalizeEcho(echoFallback);
  const inputCount = echo ? 1 : 0;
  const ok = typeof raw.ok === "boolean" ? raw.ok : true;

  return {
    ok,
    ts: startedAt,
    echo,
    toolId: "terracanon-ping",
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

function normalizeSalesCompsInput(body) {
  if (!body || typeof body !== "object" || body.input === undefined || body.input === null) {
    return {
      params: {
        ...DEFAULT_SALES_COMPS_INPUT,
        compIds: [...DEFAULT_SALES_COMPS_INPUT.compIds],
      },
    };
  }

  const input = body.input;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "input must be an object" };
  }

  const source = input;
  const allowed = new Set(["county", "subjectId", "compIds", "adjustments"]);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      return { error: `input contains unsupported key: ${key}` };
    }
  }

  const params = {
    ...DEFAULT_SALES_COMPS_INPUT,
    compIds: [...DEFAULT_SALES_COMPS_INPUT.compIds],
  };

  if ("county" in source) {
    if (typeof source.county !== "string" || !source.county.trim()) {
      return { error: "input.county must be a non-empty string" };
    }
    params.county = source.county.trim().toLowerCase();
  }

  if ("subjectId" in source) {
    if (typeof source.subjectId !== "string" || !source.subjectId.trim()) {
      return { error: "input.subjectId must be a non-empty string" };
    }
    params.subjectId = source.subjectId.trim().slice(0, 128);
  }

  if ("compIds" in source) {
    if (!Array.isArray(source.compIds) || source.compIds.length === 0 || source.compIds.length > 12) {
      return { error: "input.compIds must be an array of 1-12 ids" };
    }
    const compIds = source.compIds.map((value) => String(value).trim()).filter(Boolean);
    if (compIds.length !== source.compIds.length) {
      return { error: "input.compIds must contain non-empty values" };
    }
    params.compIds = compIds.map((value) => value.slice(0, 128));
  }

  if ("adjustments" in source) {
    if (typeof source.adjustments !== "boolean") {
      return { error: "input.adjustments must be boolean" };
    }
    params.adjustments = source.adjustments;
  }

  return { params };
}

let compareRunnerPromise = null;
let sharedRegistry = null;

async function getCompareRunner() {
  if (!compareRunnerPromise) {
    compareRunnerPromise = (async () => {
      const registry = new ToolRegistry();
      await registry.initialize(path.resolve(REPO_ROOT, "tools/registry/terrapilot.tools.json"));
      sharedRegistry = registry;
      const runner = new ToolRunner({ registry });
      registerPhase84Handlers(runner);
      // Register R1 real handlers when backend is available.
      // Presence of TF_API_BASE_URL or TF_API_PORT signals a running backend.
      if (process.env.TF_API_BASE_URL || process.env.TF_API_PORT) {
        registerR1Handlers(runner, traceService);
        const target = process.env.TF_API_BASE_URL || `http://localhost:${process.env.TF_API_PORT}`;
        console.log(`[pilot] R1 real handlers active → backend ${target}`);
      } else {
        console.log("[pilot] R1 real handlers inactive (no TF_API_BASE_URL/TF_API_PORT) → canned stubs");
      }
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

async function handleSummarizeSalesCompsRationale(body) {
  const startedAt = nowIso();
  const normalizedRequest = normalizeSalesCompsInput(body);
  if (!normalizedRequest.params) {
    return {
      status: 200,
      payload: {
        tool: "summarize_sales_comps_rationale",
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
      toolId: "summarize_sales_comps_rationale",
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
          tool: "summarize_sales_comps_rationale",
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
        tool: "summarize_sales_comps_rationale",
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: result.error || "summarize_sales_comps_rationale failed",
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
        tool: "summarize_sales_comps_rationale",
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
      await getCompareRunner();
      const toolCount = sharedRegistry ? sharedRegistry.listTools().length : 0;
      writeJson(res, 200, {
        status: "operational",
        service: "terrafusion-pilot-runtime",
        registryVersion: "R1",
        toolCount,
        traceEventCount: traceService ? traceService.getEventCount() : 0,
        timestamp: nowIso(),
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // PILOT API ENDPOINTS (pilotApi.ts contract)
    // These are the endpoints the frontend calls via pilotApi.ts
    // ═══════════════════════════════════════════════════════════════

    // GET /pilot/tools — list available tools (pilotApi.listPilotTools)
    if (method === "GET" && pathname === "/pilot/tools") {
      const mode = requestUrl.searchParams.get("mode") || undefined;
      await getCompareRunner();
      const allTools = sharedRegistry.listTools();
      const tools = mode
        ? allTools.filter((t) => t.mode === mode || !t.mode)
        : allTools;
      writeJson(res, 200, {
        count: tools.length,
        tools: tools.map((t) => ({
          toolId: t.toolId,
          displayName: t.displayName || t.toolId,
          suite: t.suite,
          mode: t.mode || "pilot",
          risk: t.risk,
          description: t.description || "",
          requiresConfirmation: t.requiresConfirmation || false,
          reasonCodes: t.reasonCodes || [],
          requiresSupervisorApproval: t.requiresSupervisorApproval || false,
          supervisorRoles: t.supervisorRoles || [],
        })),
      });
      return;
    }

    // GET /pilot/tools/:toolId — get single tool (pilotApi.getPilotTool)
    if (method === "GET" && pathname.startsWith("/pilot/tools/") && pathname.split("/").length === 4) {
      const toolId = decodeURIComponent(pathname.split("/")[3]);
      await getCompareRunner();
      const tool = sharedRegistry.getTool(toolId);
      if (!tool) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `Tool not found: ${toolId}` });
        return;
      }
      writeJson(res, 200, tool);
      return;
    }

    // POST /pilot/invoke — invoke a tool (pilotApi.invokePilotTool)
    if (method === "POST" && pathname === "/pilot/invoke") {
      const body = await readJsonBody(req);
      const { toolId, params, mode, confirmation, reasonCode, supervisorApproval, parcelId, dossierId } = body;

      if (!toolId || typeof toolId !== "string") {
        writeJson(res, 400, { ok: false, correlationId: `err-${Date.now()}`, error: "toolId is required", errorCode: "VALIDATION" });
        return;
      }

      const runner = await getCompareRunner();
      const tool = sharedRegistry.getTool(toolId);

      if (!tool) {
        writeJson(res, 404, { ok: false, correlationId: `err-${Date.now()}`, error: `Tool not found: ${toolId}`, errorCode: "NOT_FOUND" });
        return;
      }

      // Build execution context from headers
      const userId = req.headers["x-user-id"] || "dev-user";
      const countyId = req.headers["x-county-id"] || "benton";
      const userRole = req.headers["x-role"] || "appraiser";
      const userMode = mode || req.headers["x-mode"] || "pilot";

      // Confirmation gate enforcement
      if (tool.requiresConfirmation && !confirmation) {
        writeJson(res, 200, {
          ok: false,
          correlationId: `gate-${Date.now()}`,
          error: `Tool ${toolId} requires confirmation (risk: ${tool.risk})`,
          errorCode: "CONFIRMATION_REQUIRED",
        });
        return;
      }

      if (tool.reasonCodeRequired && !reasonCode) {
        writeJson(res, 200, {
          ok: false,
          correlationId: `gate-${Date.now()}`,
          error: `Tool ${toolId} requires a reason code`,
          errorCode: "REASON_CODE_REQUIRED",
        });
        return;
      }

      try {
        const result = await runner.execute({
          toolId,
          params: params || {},
          context: {
            countyId,
            userId,
            roles: [userRole],
            mode: userMode,
            parcelId: parcelId || params?.parcelId,
            dossierId,
            confirmation: !!confirmation,
            reasonCode: reasonCode || undefined,
          },
        });

        writeJson(res, 200, {
          ok: result.ok !== false,
          correlationId: result.correlationId || `corr-${Date.now()}`,
          result: result.result || result,
          error: result.error || undefined,
          errorCode: result.errorCode || undefined,
          traceEventId: result.traceEventId || undefined,
        });
      } catch (err) {
        writeJson(res, 200, {
          ok: false,
          correlationId: `err-${Date.now()}`,
          error: err?.message ?? String(err),
          errorCode: "EXECUTION_FAILED",
        });
      }
      return;
    }

    // POST /pilot/validate — validate a tool invocation (pilotApi.validatePilotTool)
    if (method === "POST" && pathname === "/pilot/validate") {
      const body = await readJsonBody(req);
      const { toolId, params, mode, confirmation, reasonCode } = body;

      if (!toolId) {
        writeJson(res, 400, { valid: false, violations: ["toolId is required"] });
        return;
      }

      await getCompareRunner();
      const tool = sharedRegistry.getTool(toolId);

      if (!tool) {
        writeJson(res, 404, { valid: false, violations: [`Tool not found: ${toolId}`] });
        return;
      }

      const violations = [];
      const confirmationRequired = tool.requiresConfirmation || false;
      const reasonCodeRequired = tool.reasonCodeRequired || false;
      const supervisorRequired = tool.requiresSupervisorApproval || false;

      if (confirmationRequired && !confirmation) {
        violations.push("Confirmation required for this tool");
      }
      if (reasonCodeRequired && !reasonCode) {
        violations.push("Reason code required for this tool");
      }

      writeJson(res, 200, {
        valid: violations.length === 0,
        violations,
        tool: {
          toolId: tool.toolId,
          suite: tool.suite,
          risk: tool.risk,
          requiresConfirmation: confirmationRequired,
          reasonCodes: tool.reasonCodes || [],
          requiresSupervisorApproval: supervisorRequired,
          supervisorRoles: tool.supervisorRoles || [],
        },
        preflight: {
          confirmationRequired,
          confirmationProvided: !!confirmation,
          reasonCodeRequired,
          reasonCodeProvided: !!reasonCode,
          supervisorRequired,
          supervisorProvided: false,
        },
      });
      return;
    }

    // GET /pilot/trace/:correlationId — get trace events (pilotApi.getPilotTrace)
    if (method === "GET" && pathname.startsWith("/pilot/trace/") && pathname.split("/").length === 4) {
      const correlationId = decodeURIComponent(pathname.split("/")[3]);
      if (traceService && typeof traceService.getByCorrelationId === "function") {
        const events = traceService.getByCorrelationId(correlationId);
        writeJson(res, 200, { events: events || [] });
      } else {
        writeJson(res, 200, { events: [] });
      }
      return;
    }

    // GET /pilot/trace — list trace events for a parcel (pilotApi.listPilotTraceEvents)
    if (method === "GET" && pathname === "/pilot/trace") {
      const parcelId = requestUrl.searchParams.get("parcelId");
      const toolId = requestUrl.searchParams.get("toolId");
      const limit = parseInt(requestUrl.searchParams.get("limit") || "50", 10);
      const offset = parseInt(requestUrl.searchParams.get("offset") || "0", 10);

      if (traceService && typeof traceService.query === "function") {
        const allEvents = traceService.query({ parcelId, toolId });
        const events = allEvents.slice(offset, offset + limit);
        writeJson(res, 200, {
          events,
          pagination: { offset, limit, returned: events.length },
        });
      } else {
        writeJson(res, 200, { events: [], pagination: { offset, limit, returned: 0 } });
      }
      return;
    }

    // GET /pilot/trace/stats — trace store diagnostics (pilotApi.getPilotTraceStats)
    if (method === "GET" && pathname === "/pilot/trace/stats") {
      if (traceService && typeof traceService.stats === "function") {
        writeJson(res, 200, traceService.stats());
      } else {
        writeJson(res, 200, {
          totalEvents: 0,
          oldestTimestamp: null,
          newestTimestamp: null,
        });
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // CANON ENDPOINTS (existing)
    // ═══════════════════════════════════════════════════════════════

    if (method === "POST" && pathname === "/pilot/canon/ping") {
      const body = await readJsonBody(req);
      const echo = normalizeEcho(body.echo);
      const correlationId = `canon-${Date.now()}`;
      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_ping",
        correlationId,
        summary: `Canon ping invoked (echo=${echo})`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      const result = await runCanonCommand("canon:ping", ["--json", "--echo", echo]);
      const parsed = parseCanonResponse("canon:ping", result.stdout, result.stderr, result.exitCode, {
        echoFallback: echo,
      });
      traceService.emit({
        type: parsed.overallOk ? "tool_succeeded" : "tool_failed",
        toolId: "canon_ping",
        correlationId,
        summary: parsed.overallOk ? "Canon ping succeeded" : `Canon ping failed: ${parsed.error ?? "unknown"}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      writeJson(res, 200, parsed);
      return;
    }

    if (method === "POST" && pathname === "/pilot/canon/doctor") {
      const correlationId = `canon-${Date.now()}`;
      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_doctor",
        correlationId,
        summary: "Canon doctor invoked",
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      const result = await runCanonCommand("canon:doctor", ["--json"]);
      const parsed = parseCanonResponse("canon:doctor", result.stdout, result.stderr, result.exitCode);
      traceService.emit({
        type: parsed.overallOk ? "tool_succeeded" : "tool_failed",
        toolId: "canon_doctor",
        correlationId,
        summary: parsed.overallOk ? "Canon doctor passed" : `Canon doctor failed: ${parsed.error ?? "unknown"}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      writeJson(res, 200, parsed);
      return;
    }

    if (method === "POST" && pathname === "/pilot/canon/gatefast") {
      const correlationId = `canon-${Date.now()}`;
      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_gatefast",
        correlationId,
        summary: "Canon gatefast invoked",
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      const result = await runCanonCommand("canon:gatefast", ["--json"]);
      const parsed = parseCanonResponse("canon:gatefast", result.stdout, result.stderr, result.exitCode);
      traceService.emit({
        type: parsed.overallOk ? "tool_succeeded" : "tool_failed",
        toolId: "canon_gatefast",
        correlationId,
        summary: parsed.overallOk ? "Canon gatefast passed" : `Canon gatefast failed: ${parsed.error ?? "unknown"}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      writeJson(res, 200, parsed);
      return;
    }

    // POST /pilot/canon/corpus — Golden Corpus status
    if (method === "POST" && pathname === "/pilot/canon/corpus") {
      const correlationId = `canon-${Date.now()}`;
      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_corpus_status",
        correlationId,
        summary: "Canon corpus status invoked",
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });
      try {
        const lockPath = path.join(REPO_ROOT, "golden", "GOLDEN_CORPUS.lock.json");
        const raw = fs.readFileSync(lockPath, "utf8");
        const corpus = JSON.parse(raw);
        const result = {
          ok: true,
          ts: nowIso(),
          version: corpus.version || "unknown",
          releaseTag: corpus.releaseTag || "unknown",
          artifactCount: Array.isArray(corpus.artifacts) ? corpus.artifacts.length : 0,
          artifacts: Array.isArray(corpus.artifacts) ? corpus.artifacts : [],
          ledgerHeadSha256: corpus.ledgerState?.ledgerHeadSha256 || "",
          sequenceNumber: corpus.ledgerState?.sequenceNumber ?? -1,
        };
        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_corpus_status",
          correlationId,
          summary: `Golden Corpus: ${result.artifactCount} artifacts, release ${result.releaseTag}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, result);
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_corpus_status",
          correlationId,
          summary: `Canon corpus status failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, {
          ok: false,
          ts: nowIso(),
          error: err?.message ?? String(err),
          artifactCount: 0,
          artifacts: [],
        });
      }
      return;
    }

    // POST /pilot/canon/ls — List directory (read-only, allowlisted)
    if (method === "POST" && pathname === "/pilot/canon/ls") {
      const body = await readJsonBody(req);
      const dirPath = typeof body.dirPath === "string" ? body.dirPath : "";
      const correlationId = `canon-${Date.now()}`;

      // Security: allowlist + traversal rejection
      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "golden/",
      ];

      const normalized = dirPath.replace(/\\/g, "/").replace(/\/+$/, "");
      if (normalized.includes("..") || path.isAbsolute(dirPath)) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal rejected" });
        return;
      }

      const allowed = ALLOWED_PREFIXES.some(
        (prefix) => normalized === prefix.replace(/\/$/, "") || normalized.startsWith(prefix)
      );
      if (!allowed) {
        writeJson(res, 403, { error: "FORBIDDEN", message: `Path not in allowlist: ${normalized}` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_list_dir",
        correlationId,
        summary: `Canon ls invoked: ${normalized}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const absPath = path.join(REPO_ROOT, normalized);
        const entries = fs.readdirSync(absPath, { withFileTypes: true });
        const result = entries
          .filter((e) => e.isFile() || e.isDirectory())
          .map((e) => ({
            name: e.name,
            type: e.isDirectory() ? "directory" : "file",
            ...(e.isFile() ? { size: fs.statSync(path.join(absPath, e.name)).size } : {}),
          }))
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_list_dir",
          correlationId,
          summary: `Listed ${result.length} entries in ${normalized}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { dirPath: normalized, entries: result });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_list_dir",
          correlationId,
          summary: `Canon ls failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { dirPath: normalized, entries: [], error: err?.message ?? String(err) });
      }
      return;
    }

    // POST /pilot/canon/read — Read file (read-only, allowlisted, 512KB limit)
    if (method === "POST" && pathname === "/pilot/canon/read") {
      const body = await readJsonBody(req);
      const filePath = typeof body.filePath === "string" ? body.filePath : "";
      const correlationId = `canon-${Date.now()}`;
      const MAX_FILE_BYTES = 512 * 1024;

      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "golden/",
      ];

      const normalized = filePath.replace(/\\/g, "/");
      if (normalized.includes("..") || path.isAbsolute(filePath)) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal rejected" });
        return;
      }

      const allowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
      if (!allowed) {
        writeJson(res, 403, { error: "FORBIDDEN", message: `Path not in allowlist: ${normalized}` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_read_file",
        correlationId,
        summary: `Canon read invoked: ${normalized}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const absPath = path.join(REPO_ROOT, normalized);
        const stat = fs.statSync(absPath);
        if (!stat.isFile()) {
          throw new Error("Not a file");
        }
        if (stat.size > MAX_FILE_BYTES) {
          throw new Error(`File exceeds 512KB limit (${stat.size} bytes)`);
        }
        const content = fs.readFileSync(absPath, "utf8");

        // Detect language from extension
        const ext = path.extname(normalized).toLowerCase();
        const LANG_MAP = {
          ".ts": "typescript", ".tsx": "typescriptreact",
          ".js": "javascript", ".jsx": "javascriptreact",
          ".mjs": "javascript", ".json": "json",
          ".css": "css", ".html": "html",
          ".md": "markdown", ".yml": "yaml", ".yaml": "yaml",
        };
        const language = LANG_MAP[ext] || "plaintext";

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_read_file",
          correlationId,
          summary: `Read ${normalized} (${stat.size} bytes, ${language})`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { filePath: normalized, content, size: stat.size, language });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_read_file",
          correlationId,
          summary: `Canon read failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { filePath: normalized, content: "", size: 0, language: "plaintext", error: err?.message ?? String(err) });
      }
      return;
    }

    // POST /pilot/canon/write — Write file (allowlisted, 1MB limit)
    if (method === "POST" && pathname === "/pilot/canon/write") {
      const body = await readJsonBody(req);
      const filePath = typeof body.filePath === "string" ? body.filePath : "";
      const content = typeof body.content === "string" ? body.content : "";
      const correlationId = `canon-${Date.now()}`;
      const MAX_WRITE_BYTES = 1024 * 1024;

      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "golden/",
      ];

      const normalized = filePath.replace(/\\/g, "/");
      if (normalized.includes("..") || path.isAbsolute(filePath)) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal rejected" });
        return;
      }

      const allowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
      if (!allowed) {
        writeJson(res, 403, { error: "FORBIDDEN", message: `Path not in allowlist: ${normalized}` });
        return;
      }

      const byteLen = Buffer.byteLength(content, "utf8");
      if (byteLen > MAX_WRITE_BYTES) {
        writeJson(res, 413, { error: "TOO_LARGE", message: `Content exceeds 1MB limit (${byteLen} bytes)` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_write_file",
        correlationId,
        summary: `Canon write invoked: ${normalized} (${byteLen} bytes)`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const absPath = path.join(REPO_ROOT, normalized);
        // Ensure parent directory exists
        const parentDir = path.dirname(absPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(absPath, content, "utf8");
        const stat = fs.statSync(absPath);

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_write_file",
          correlationId,
          summary: `Wrote ${normalized} (${stat.size} bytes)`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { filePath: normalized, size: stat.size, writtenAt: new Date().toISOString() });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_write_file",
          correlationId,
          summary: `Canon write failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "WRITE_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // POST /pilot/canon/search — Search files (read-only, allowlisted)
    if (method === "POST" && pathname === "/pilot/canon/search") {
      const body = await readJsonBody(req);
      const query = typeof body.query === "string" ? body.query : "";
      const scopePath = typeof body.path === "string" ? body.path : "";
      const isRegex = body.isRegex === true;
      const maxResults = Math.min(Math.max(Number(body.maxResults) || 100, 1), 500);
      const correlationId = `canon-${Date.now()}`;

      if (!query) {
        writeJson(res, 400, { error: "BAD_REQUEST", message: "query is required" });
        return;
      }

      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "golden/",
      ];

      // If a scope path is given, validate it
      const normalizedScope = scopePath.replace(/\\/g, "/").replace(/\/+$/, "");
      if (normalizedScope) {
        if (normalizedScope.includes("..") || path.isAbsolute(scopePath)) {
          writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal rejected" });
          return;
        }
        const scopeAllowed = ALLOWED_PREFIXES.some(
          (prefix) => normalizedScope === prefix.replace(/\/$/, "") || normalizedScope.startsWith(prefix)
        );
        if (!scopeAllowed) {
          writeJson(res, 403, { error: "FORBIDDEN", message: `Path not in allowlist: ${normalizedScope}` });
          return;
        }
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_search_files",
        correlationId,
        summary: `Canon search invoked: "${query}" ${normalizedScope ? `in ${normalizedScope}` : "(all allowed)"}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        // Build regex from query
        let pattern;
        try {
          pattern = isRegex ? new RegExp(query, "gi") : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        } catch {
          writeJson(res, 400, { error: "BAD_REQUEST", message: "Invalid regex pattern" });
          return;
        }

        const matches = [];
        const searchPrefixes = normalizedScope
          ? [normalizedScope.endsWith("/") ? normalizedScope : normalizedScope + "/"]
          : ALLOWED_PREFIXES;

        // Recursively collect files
        function collectFiles(dir, fileList) {
          try {
            const entries = fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true });
            for (const entry of entries) {
              const rel = dir + "/" + entry.name;
              if (entry.isDirectory()) {
                collectFiles(rel, fileList);
              } else if (entry.isFile()) {
                fileList.push(rel);
              }
            }
          } catch {
            // Skip unreadable directories
          }
          return fileList;
        }

        const allFiles = [];
        for (const prefix of searchPrefixes) {
          const trimmed = prefix.replace(/\/$/, "");
          collectFiles(trimmed, allFiles);
        }

        // Search through files
        const MAX_FILE_SIZE = 512 * 1024;
        let truncated = false;

        for (const filePath of allFiles) {
          if (matches.length >= maxResults) {
            truncated = true;
            break;
          }

          try {
            const absPath = path.join(REPO_ROOT, filePath);
            const stat = fs.statSync(absPath);
            if (stat.size > MAX_FILE_SIZE) continue; // skip large files
            if (stat.size === 0) continue;

            const content = fs.readFileSync(absPath, "utf8");
            const lines = content.split("\n");

            for (let i = 0; i < lines.length; i++) {
              if (matches.length >= maxResults) {
                truncated = true;
                break;
              }
              pattern.lastIndex = 0;
              const m = pattern.exec(lines[i]);
              if (m) {
                matches.push({
                  filePath,
                  line: i + 1,
                  column: m.index + 1,
                  text: lines[i].length > 200 ? lines[i].slice(0, 200) + "…" : lines[i],
                });
              }
            }
          } catch {
            // Skip unreadable files
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_search_files",
          correlationId,
          summary: `Found ${matches.length} matches for "${query}"${truncated ? " (truncated)" : ""}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { query, matches, totalMatches: matches.length, truncated });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_search_files",
          correlationId,
          summary: `Canon search failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "SEARCH_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // POST /pilot/canon/exec — Execute allowlisted command in Canon terminal
    if (method === "POST" && pathname === "/pilot/canon/exec") {
      const body = await readJsonBody(req);
      const command = typeof body.command === "string" ? body.command.trim() : "";
      const correlationId = `canon-${Date.now()}`;

      if (!command) {
        writeJson(res, 400, { error: "BAD_REQUEST", message: "command is required" });
        return;
      }

      // Command allowlist — only governance-safe commands permitted
      const COMMAND_ALLOWLIST = {
        "type-check": { bin: "pnpm", args: ["run", "type-check"] },
        "build:core-js": { bin: "pnpm", args: ["run", "build:core-js"] },
        "check:generated": { bin: "pnpm", args: ["run", "check:generated"] },
        "test:phase83": { bin: process.execPath, args: ["--test", "os-platform/core/tests/phase83-tools.test.mjs"] },
        "lint": { bin: "pnpm", args: ["run", "lint"] },
        "canon:doctor": { bin: process.execPath, args: ["tools/canon/canon.mjs", "doctor"] },
        "canon:gatefast": { bin: process.execPath, args: ["tools/canon/canon.mjs", "gatefast"] },
        "canon:corpus-status": { bin: process.execPath, args: ["tools/canon/canon.mjs", "corpus-status"] },
      };

      const entry = COMMAND_ALLOWLIST[command];
      if (!entry) {
        const allowed = Object.keys(COMMAND_ALLOWLIST).join(", ");
        writeJson(res, 403, {
          error: "FORBIDDEN",
          message: `Command not in allowlist. Allowed: ${allowed}`,
        });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_terminal_exec",
        correlationId,
        summary: `Canon terminal exec: ${command}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      const startTime = Date.now();

      try {
        const result = await new Promise((resolve) => {
          const safeEnv = {};
          for (const key of SAFE_ENV_KEYS) {
            const value = process.env[key];
            if (typeof value === "string") safeEnv[key] = value;
          }
          safeEnv.TF_CANON_ADAPTER = "1";

          const child = spawn(entry.bin, entry.args, {
            cwd: REPO_ROOT,
            stdio: ["ignore", "pipe", "pipe"],
            env: safeEnv,
          });

          let stdout = "";
          let stderr = "";
          let done = false;
          const EXEC_TIMEOUT = 60_000; // 60s for build commands

          const timer = setTimeout(() => {
            if (done) return;
            done = true;
            child.kill();
            resolve({
              exitCode: 1,
              stdout,
              stderr: `${stderr}\nCommand timed out after ${EXEC_TIMEOUT}ms`,
            });
          }, EXEC_TIMEOUT);

          child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
          child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

          child.on("error", (err) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve({ exitCode: 1, stdout: "", stderr: err.message });
          });

          child.on("close", (code) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve({ exitCode: code ?? 1, stdout, stderr });
          });
        });

        const durationMs = Date.now() - startTime;

        traceService.emit({
          type: result.exitCode === 0 ? "tool_succeeded" : "tool_failed",
          toolId: "canon_terminal_exec",
          correlationId,
          summary: `Canon exec ${command}: exit ${result.exitCode} (${durationMs}ms)`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          command,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          durationMs,
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_terminal_exec",
          correlationId,
          summary: `Canon exec failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "EXEC_FAILED", message: err?.message ?? String(err) });
      }
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

    if (method === "POST" && pathname === "/pilot/workbench/summarize-sales-comps-rationale") {
      const body = await readJsonBody(req);
      const result = await handleSummarizeSalesCompsRationale(body);
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
