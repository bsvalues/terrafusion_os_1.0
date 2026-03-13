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

    // POST /pilot/canon/create — Create new file (allowlisted, 1MB limit, must not exist)
    if (method === "POST" && pathname === "/pilot/canon/create") {
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

      const absPath = path.join(REPO_ROOT, normalized);
      if (fs.existsSync(absPath)) {
        writeJson(res, 409, { error: "ALREADY_EXISTS", message: `File already exists: ${normalized}` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_create_file",
        correlationId,
        summary: `Canon create invoked: ${normalized} (${byteLen} bytes)`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const parentDir = path.dirname(absPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(absPath, content, "utf8");
        const stat = fs.statSync(absPath);

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_create_file",
          correlationId,
          summary: `Created ${normalized} (${stat.size} bytes)`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 201, { filePath: normalized, size: stat.size, createdAt: new Date().toISOString() });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_create_file",
          correlationId,
          summary: `Canon create failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "CREATE_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // POST /pilot/canon/delete — Delete file (allowlisted, must exist)
    if (method === "POST" && pathname === "/pilot/canon/delete") {
      const body = await readJsonBody(req);
      const filePath = typeof body.filePath === "string" ? body.filePath : "";
      const correlationId = `canon-${Date.now()}`;

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

      const absPath = path.join(REPO_ROOT, normalized);
      if (!fs.existsSync(absPath)) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `File does not exist: ${normalized}` });
        return;
      }

      const stat = fs.statSync(absPath);
      if (stat.isDirectory()) {
        writeJson(res, 400, { error: "IS_DIRECTORY", message: `Cannot delete directory: ${normalized}` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_delete_file",
        correlationId,
        summary: `Canon delete invoked: ${normalized} (${stat.size} bytes)`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        fs.unlinkSync(absPath);

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_delete_file",
          correlationId,
          summary: `Deleted ${normalized}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { filePath: normalized, deletedAt: new Date().toISOString() });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_delete_file",
          correlationId,
          summary: `Canon delete failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "DELETE_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── Canon Rename/Move File ───────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/rename") {
      const body = await readJsonBody(req);
      const correlationId = `corr-canon-rename-${Date.now()}`;

      const rawOld = typeof body?.oldPath === "string" ? body.oldPath.replace(/\\/g, "/") : "";
      const rawNew = typeof body?.newPath === "string" ? body.newPath.replace(/\\/g, "/") : "";

      if (!rawOld || !rawNew) {
        writeJson(res, 400, { error: "MISSING_PARAMS", message: "oldPath and newPath are required" });
        return;
      }

      const normalizedOld = rawOld.replace(/^\/+/, "");
      const normalizedNew = rawNew.replace(/^\/+/, "");

      if (normalizedOld.includes("..") || normalizedNew.includes("..")) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal not allowed" });
        return;
      }

      const allowedOld = ALLOWED_PREFIXES.some((prefix) => normalizedOld.startsWith(prefix));
      const allowedNew = ALLOWED_PREFIXES.some((prefix) => normalizedNew.startsWith(prefix));
      if (!allowedOld || !allowedNew) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Both paths must be in the allowlist" });
        return;
      }

      const absOld = path.join(REPO_ROOT, normalizedOld);
      const absNew = path.join(REPO_ROOT, normalizedNew);

      if (!fs.existsSync(absOld)) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `Source file does not exist: ${normalizedOld}` });
        return;
      }

      const statOld = fs.statSync(absOld);
      if (statOld.isDirectory()) {
        writeJson(res, 400, { error: "IS_DIRECTORY", message: `Cannot rename directory: ${normalizedOld}` });
        return;
      }

      if (fs.existsSync(absNew)) {
        writeJson(res, 409, { error: "CONFLICT", message: `Destination already exists: ${normalizedNew}` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_rename_file",
        correlationId,
        summary: `Canon rename invoked: ${normalizedOld} → ${normalizedNew}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        // Ensure destination parent directory exists
        const destDir = path.dirname(absNew);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        fs.renameSync(absOld, absNew);

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_rename_file",
          correlationId,
          summary: `Renamed ${normalizedOld} → ${normalizedNew}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, { oldPath: normalizedOld, newPath: normalizedNew, renamedAt: new Date().toISOString() });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_rename_file",
          correlationId,
          summary: `Canon rename failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "RENAME_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── Canon Diff/Compare Files ─────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/diff") {
      const body = await readJsonBody(req);
      const correlationId = `corr-canon-diff-${Date.now()}`;

      const rawLeft = typeof body?.leftPath === "string" ? body.leftPath.replace(/\\/g, "/") : "";
      const rawRight = typeof body?.rightPath === "string" ? body.rightPath.replace(/\\/g, "/") : "";

      if (!rawLeft || !rawRight) {
        writeJson(res, 400, { error: "MISSING_PARAMS", message: "leftPath and rightPath are required" });
        return;
      }

      const normalizedLeft = rawLeft.replace(/^\/+/, "");
      const normalizedRight = rawRight.replace(/^\/+/, "");

      if (normalizedLeft.includes("..") || normalizedRight.includes("..")) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal not allowed" });
        return;
      }

      const allowedLeft = ALLOWED_PREFIXES.some((prefix) => normalizedLeft.startsWith(prefix));
      const allowedRight = ALLOWED_PREFIXES.some((prefix) => normalizedRight.startsWith(prefix));
      if (!allowedLeft || !allowedRight) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Both paths must be in the allowlist" });
        return;
      }

      const absLeft = path.join(REPO_ROOT, normalizedLeft);
      const absRight = path.join(REPO_ROOT, normalizedRight);

      if (!fs.existsSync(absLeft)) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `Left file does not exist: ${normalizedLeft}` });
        return;
      }
      if (!fs.existsSync(absRight)) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `Right file does not exist: ${normalizedRight}` });
        return;
      }

      const MAX_DIFF_SIZE = 512 * 1024;
      const statLeft = fs.statSync(absLeft);
      const statRight = fs.statSync(absRight);

      if (statLeft.isDirectory()) {
        writeJson(res, 400, { error: "IS_DIRECTORY", message: `Cannot diff directory: ${normalizedLeft}` });
        return;
      }
      if (statRight.isDirectory()) {
        writeJson(res, 400, { error: "IS_DIRECTORY", message: `Cannot diff directory: ${normalizedRight}` });
        return;
      }
      if (statLeft.size > MAX_DIFF_SIZE) {
        writeJson(res, 413, { error: "TOO_LARGE", message: `Left file exceeds 512KB limit` });
        return;
      }
      if (statRight.size > MAX_DIFF_SIZE) {
        writeJson(res, 413, { error: "TOO_LARGE", message: `Right file exceeds 512KB limit` });
        return;
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_diff_files",
        correlationId,
        summary: `Canon diff invoked: ${normalizedLeft} ↔ ${normalizedRight}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const leftContent = fs.readFileSync(absLeft, "utf-8");
        const rightContent = fs.readFileSync(absRight, "utf-8");

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_diff_files",
          correlationId,
          summary: `Diff loaded: ${normalizedLeft} (${statLeft.size}B) ↔ ${normalizedRight} (${statRight.size}B)`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 200, {
          leftPath: normalizedLeft,
          rightPath: normalizedRight,
          leftContent,
          rightContent,
          leftSize: statLeft.size,
          rightSize: statRight.size,
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_diff_files",
          correlationId,
          summary: `Canon diff failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "DIFF_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── Canon Git Status ──────────────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/git-status") {
      const body = await readJsonBody(req);
      const correlationId = `corr-canon-gitstatus-${Date.now()}`;
      const scopePath = typeof body?.path === "string" ? body.path.replace(/\\/g, "/").replace(/^\/+/, "") : "";

      if (scopePath && scopePath.includes("..")) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal not allowed" });
        return;
      }

      if (scopePath) {
        const allowed = ALLOWED_PREFIXES.some((prefix) => scopePath.startsWith(prefix));
        if (!allowed) {
          writeJson(res, 403, { error: "FORBIDDEN", message: "Path must be in the allowlist" });
          return;
        }
      }

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_git_status",
        correlationId,
        summary: `Canon git status invoked${scopePath ? `: ${scopePath}` : " (all)"}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const { execSync } = await import("node:child_process");
        // Get current branch
        let branch = "unknown";
        try {
          branch = execSync("git rev-parse --abbrev-ref HEAD", {
            cwd: REPO_ROOT,
            encoding: "utf-8",
            timeout: 10000,
          }).trim();
        } catch (_) {
          // If git not available, branch stays "unknown"
        }

        // Get porcelain status
        let rawStatus = "";
        try {
          const args = scopePath
            ? `git status --porcelain -- "${scopePath}"`
            : "git status --porcelain";
          rawStatus = execSync(args, {
            cwd: REPO_ROOT,
            encoding: "utf-8",
            timeout: 15000,
          });
        } catch (_) {
          // git status may fail if not a repo
        }

        const entries = [];
        if (rawStatus) {
          const lines = rawStatus.split("\n").filter((l) => l.length > 0);
          for (const line of lines) {
            // Porcelain format: XY filename
            const statusCode = line.substring(0, 2);
            const filePath = line.substring(3).trim();
            if (!filePath) continue;

            // Filter to allowed prefixes only
            const normalizedFile = filePath.replace(/\\/g, "/");
            const inAllowlist = ALLOWED_PREFIXES.some((prefix) => normalizedFile.startsWith(prefix));
            if (!inAllowlist) continue;

            // Map porcelain codes to readable status
            let status = "unknown";
            const x = statusCode[0];
            const y = statusCode[1];
            if (x === "?" && y === "?") status = "untracked";
            else if (x === "A" || y === "A") status = "added";
            else if (x === "M" || y === "M") status = "modified";
            else if (x === "D" || y === "D") status = "deleted";
            else if (x === "R") status = "renamed";
            else if (x === "C") status = "copied";
            else if (x === "U" || y === "U") status = "conflict";

            entries.push({ filePath: normalizedFile, status });
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_git_status",
          correlationId,
          summary: `Git status: ${entries.length} entries, branch=${branch}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, { entries, branch });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_git_status",
          correlationId,
          summary: `Canon git status failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "GIT_STATUS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── Canon File Outline ────────────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/outline") {
      const body = await readJsonBody(req);
      const correlationId = `corr-canon-outline-${Date.now()}`;

      const rawPath = typeof body?.filePath === "string" ? body.filePath.replace(/\\/g, "/") : "";
      if (!rawPath) {
        writeJson(res, 400, { error: "MISSING_PARAMS", message: "filePath is required" });
        return;
      }

      const normalized = rawPath.replace(/^\/+/, "");
      if (normalized.includes("..")) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal not allowed" });
        return;
      }

      const allowed = ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
      if (!allowed) {
        writeJson(res, 403, { error: "FORBIDDEN", message: "Path must be in the allowlist" });
        return;
      }

      const absPath = path.join(REPO_ROOT, normalized);
      if (!fs.existsSync(absPath)) {
        writeJson(res, 404, { error: "NOT_FOUND", message: `File does not exist: ${normalized}` });
        return;
      }

      const stat = fs.statSync(absPath);
      if (stat.isDirectory()) {
        writeJson(res, 400, { error: "IS_DIRECTORY", message: `Cannot outline directory: ${normalized}` });
        return;
      }

      const MAX_OUTLINE_FILE = 512 * 1024;
      if (stat.size > MAX_OUTLINE_FILE) {
        writeJson(res, 413, { error: "TOO_LARGE", message: "File exceeds 512KB limit for outline" });
        return;
      }

      // Detect language from extension
      const ext = path.extname(normalized).toLowerCase();
      const LANG_MAP = {
        ".ts": "typescript", ".tsx": "typescriptreact",
        ".js": "javascript", ".mjs": "javascript", ".jsx": "javascriptreact",
        ".json": "json", ".css": "css", ".md": "markdown",
        ".yml": "yaml", ".yaml": "yaml",
      };
      const language = LANG_MAP[ext] || "plaintext";

      traceService.emit({
        type: "tool_invoked",
        toolId: "canon_file_outline",
        correlationId,
        summary: `Canon outline invoked: ${normalized}`,
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      try {
        const content = fs.readFileSync(absPath, "utf-8");
        const lines = content.split("\n");
        const symbols = [];

        if (language === "typescript" || language === "typescriptreact" || language === "javascript" || language === "javascriptreact") {
          // Extract TypeScript/JavaScript symbols via regex
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // export interface Name
            let m = line.match(/^export\s+interface\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "interface", line: lineNum }); continue; }

            // export type Name
            m = line.match(/^export\s+type\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "type", line: lineNum }); continue; }

            // export class Name
            m = line.match(/^export\s+(?:abstract\s+)?class\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "class", line: lineNum }); continue; }

            // export enum Name
            m = line.match(/^export\s+enum\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "enum", line: lineNum }); continue; }

            // export function name / export async function name
            m = line.match(/^export\s+(?:async\s+)?function\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "function", line: lineNum }); continue; }

            // export const name = ... (including arrow functions and handlers)
            m = line.match(/^export\s+const\s+(\w+)/);
            if (m) {
              const isFunc = line.includes("=>") || line.includes("function") || line.includes("async");
              symbols.push({ name: m[1], kind: isFunc ? "function" : "variable", line: lineNum });
              continue;
            }

            // export default function name
            m = line.match(/^export\s+default\s+(?:async\s+)?function\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "function", line: lineNum }); continue; }

            // function name (non-exported)
            m = line.match(/^(?:async\s+)?function\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "function", line: lineNum }); continue; }

            // const name = (...)  => or function expression at top-level (starts at col 0)
            m = line.match(/^const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
            if (m) { symbols.push({ name: m[1], kind: "function", line: lineNum }); continue; }

            // interface Name (non-exported)
            m = line.match(/^interface\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "interface", line: lineNum }); continue; }

            // class Name (non-exported)
            m = line.match(/^(?:abstract\s+)?class\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "class", line: lineNum }); continue; }

            // type Name (non-exported)
            m = line.match(/^type\s+(\w+)/);
            if (m) { symbols.push({ name: m[1], kind: "type", line: lineNum }); continue; }
          }
        } else if (language === "json") {
          // JSON: extract top-level keys
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
              const keys = Object.keys(parsed);
              for (let k = 0; k < keys.length; k++) {
                // Find the line number of each key
                const keyPattern = `"${keys[k]}"`;
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes(keyPattern)) {
                    symbols.push({ name: keys[k], kind: "property", line: i + 1 });
                    break;
                  }
                }
              }
            }
          } catch (_) {
            // Invalid JSON — no symbols
          }
        } else if (language === "css") {
          // CSS: extract selectors (class and id)
          for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/^([.#][\w-]+(?:\s*[,>+~]\s*[.#][\w-]+)*)\s*\{/);
            if (m) {
              symbols.push({ name: m[1].trim(), kind: "selector", line: i + 1 });
            }
          }
        } else if (language === "markdown") {
          // Markdown: extract headings
          for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/^(#{1,6})\s+(.+)/);
            if (m) {
              symbols.push({ name: m[2].trim(), kind: `h${m[1].length}`, line: i + 1 });
            }
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_file_outline",
          correlationId,
          summary: `Outline extracted: ${normalized} — ${symbols.length} symbols (${language})`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, { filePath: normalized, symbols, language });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_file_outline",
          correlationId,
          summary: `Canon outline failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "OUTLINE_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_diagnostics (POST /pilot/canon/diagnostics) ──────────────
    if (method === "POST" && pathname === "/pilot/canon/diagnostics") {
      const correlationId = `corr-diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const body = await readJsonBody(req);
        const scope = typeof body?.scope === "string" ? body.scope : "typecheck";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_diagnostics",
          correlationId,
          summary: `Canon diagnostics invoked: scope=${scope}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        const startTime = Date.now();
        let stdout = "";
        let stderr = "";
        let exitCode = 0;

        // Run the appropriate command
        const cmd = scope === "lint"
          ? "pnpm run lint 2>&1"
          : "pnpm run type-check 2>&1";

        try {
          const { execSync } = await import("node:child_process");
          stdout = execSync(cmd, {
            cwd: process.cwd(),
            timeout: 60_000,
            encoding: "utf-8",
            env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
            maxBuffer: 2 * 1024 * 1024,
          });
        } catch (execErr) {
          // type-check exits non-zero when there are errors — that's expected
          exitCode = execErr.status ?? 1;
          stdout = execErr.stdout ?? "";
          stderr = execErr.stderr ?? "";
        }

        const durationMs = Date.now() - startTime;
        const combined = (stdout + "\n" + stderr).trim();
        const lines = combined.split("\n");

        // Parse TypeScript diagnostic output: file(line,column): severity TScode: message
        // Also handles: file:line:column - severity TScode: message (alternate format)
        const diagnostics = [];
        const diagRegex = /^(.+?)[\(:]+(\d+)[,:](\d+)[\)]*\s*[-:]\s*(error|warning|info|message)\s+(TS\d+)\s*:\s*(.+)$/;

        for (const line of lines) {
          const m = line.match(diagRegex);
          if (m) {
            const filePath = m[1].trim();
            // Only include diagnostics for files in allowed prefixes
            const normalizedPath = filePath.replace(/\\/g, "/");
            const ALLOWED_DIAG_PREFIXES = [
              "os-platform/core/pilot/",
              "os-platform/core/types/",
              "tools/registry/",
              "frontend/apps/os-shell/",
            ];
            const inScope = ALLOWED_DIAG_PREFIXES.some(p => normalizedPath.startsWith(p));
            if (!inScope) continue;

            const severity = m[4] === "error" ? "error"
              : m[4] === "warning" ? "warning"
              : "info";

            diagnostics.push({
              file: normalizedPath,
              line: parseInt(m[2], 10),
              column: parseInt(m[3], 10),
              severity,
              message: m[6].trim(),
              code: m[5],
            });
          }
        }

        const errorCount = diagnostics.filter(d => d.severity === "error").length;
        const warningCount = diagnostics.filter(d => d.severity === "warning").length;
        const infoCount = diagnostics.filter(d => d.severity === "info").length;

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_diagnostics",
          correlationId,
          summary: `Diagnostics complete: ${diagnostics.length} issues (${errorCount}E/${warningCount}W/${infoCount}I) in ${durationMs}ms`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          diagnostics,
          errorCount,
          warningCount,
          infoCount,
          durationMs,
          exitCode,
          scope,
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_diagnostics",
          correlationId,
          summary: `Canon diagnostics failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "DIAGNOSTICS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_bookmarks (POST /pilot/canon/bookmarks) ──────────────────
    if (method === "POST" && pathname === "/pilot/canon/bookmarks") {
      const correlationId = `corr-bkmk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const body = await readJsonBody(req);
        const action = typeof body?.action === "string" ? body.action : "list";
        const filePath = typeof body?.filePath === "string" ? body.filePath : "";
        const line = typeof body?.line === "number" ? body.line : 0;
        const label = typeof body?.label === "string" ? body.label : "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_bookmarks",
          correlationId,
          summary: `Canon bookmarks invoked: action=${action}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        // In-memory bookmarks store (module-level, persists across requests)
        if (!globalThis.__canonBookmarks) {
          globalThis.__canonBookmarks = [];
        }
        /** @type {Array<{filePath: string, line: number, label: string, createdAt: string}>} */
        const store = globalThis.__canonBookmarks;

        const ALLOWED_PREFIXES = [
          "os-platform/core/pilot/",
          "os-platform/core/types/",
          "tools/registry/",
          "frontend/apps/os-shell/src/canon/",
          "frontend/apps/os-shell/src/pages/",
          "frontend/apps/os-shell/src/api/",
          "frontend/apps/os-shell/src/styles/",
          "golden/",
        ];

        if (action === "add") {
          if (!filePath) {
            writeJson(res, 400, { error: "MISSING_FILE_PATH", message: "filePath is required for add" });
            return;
          }
          if (!line || line < 1) {
            writeJson(res, 400, { error: "INVALID_LINE", message: "line must be a positive integer" });
            return;
          }
          const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
          if (normalized.includes("..")) {
            writeJson(res, 403, { error: "PATH_TRAVERSAL", message: "Path traversal not allowed" });
            return;
          }
          if (!ALLOWED_PREFIXES.some(p => normalized.startsWith(p))) {
            writeJson(res, 403, { error: "OUTSIDE_ALLOWED_SCOPE", message: "File not in allowed paths" });
            return;
          }
          // Prevent duplicate bookmark at same file+line
          const exists = store.some(b => b.filePath === normalized && b.line === line);
          if (!exists) {
            store.push({
              filePath: normalized,
              line,
              label: label || `Line ${line}`,
              createdAt: new Date().toISOString(),
            });
          }
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_bookmarks",
            correlationId,
            summary: `Bookmark added: ${normalized}:${line}`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          writeJson(res, 200, { bookmarks: [...store], action: "add" });

        } else if (action === "remove") {
          if (!filePath) {
            writeJson(res, 400, { error: "MISSING_FILE_PATH", message: "filePath is required for remove" });
            return;
          }
          const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
          const before = store.length;
          globalThis.__canonBookmarks = store.filter(
            b => !(b.filePath === normalized && b.line === line)
          );
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_bookmarks",
            correlationId,
            summary: `Bookmark removed: ${normalized}:${line} (${before - globalThis.__canonBookmarks.length} removed)`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          writeJson(res, 200, { bookmarks: [...globalThis.__canonBookmarks], action: "remove" });

        } else if (action === "clear") {
          const count = store.length;
          globalThis.__canonBookmarks = [];
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_bookmarks",
            correlationId,
            summary: `Bookmarks cleared: ${count} removed`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          writeJson(res, 200, { bookmarks: [], action: "clear" });

        } else {
          // list (default)
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_bookmarks",
            correlationId,
            summary: `Bookmarks listed: ${store.length} total`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          writeJson(res, 200, { bookmarks: [...store], action: "list" });
        }
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_bookmarks",
          correlationId,
          summary: `Canon bookmarks failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "BOOKMARKS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_file_index (POST /pilot/canon/file-index) ────────────────
    if (method === "POST" && pathname === "/pilot/canon/file-index") {
      const correlationId = `corr-fileindex-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const scopePrefix = typeof body.scope === "string" ? body.scope : "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_file_index",
          correlationId,
          summary: `Canon file index requested${scopePrefix ? ` scope=${scopePrefix}` : ""}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        // Path traversal rejection
        if (scopePrefix.includes("..")) {
          writeJson(res, 403, { error: "TRAVERSAL_REJECTED", message: "Path traversal not allowed" });
          return;
        }

        const ALLOWED_PREFIXES = [
          "os-platform/core/pilot/",
          "os-platform/core/types/",
          "tools/registry/",
          "frontend/apps/os-shell/src/canon/",
          "frontend/apps/os-shell/src/pages/",
          "frontend/apps/os-shell/src/api/",
          "frontend/apps/os-shell/src/styles/",
          "golden/",
        ];

        // If scope is given, validate it falls under allowed prefixes
        if (scopePrefix && !ALLOWED_PREFIXES.some((p) => scopePrefix.startsWith(p) || p.startsWith(scopePrefix))) {
          writeJson(res, 403, { error: "FORBIDDEN_SCOPE", message: `Scope '${scopePrefix}' is not within allowed paths` });
          return;
        }

        const prefixesToScan = scopePrefix
          ? ALLOWED_PREFIXES.filter((p) => p.startsWith(scopePrefix) || scopePrefix.startsWith(p))
          : ALLOWED_PREFIXES;

        const files = [];
        const visited = new Set();

        for (const prefix of prefixesToScan) {
          const absDir = path.resolve(prefix);
          if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) continue;

          const walk = (dir) => {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
            for (const entry of entries) {
              const full = path.join(dir, entry.name);
              const rel = path.relative(".", full).replace(/\\/g, "/");
              if (visited.has(rel)) continue;
              if (entry.name === "node_modules" || entry.name === ".git") continue;
              if (entry.isDirectory()) {
                walk(full);
              } else if (entry.isFile()) {
                visited.add(rel);
                let size = 0;
                try { size = fs.statSync(full).size; } catch { /* skip */ }
                files.push({ path: rel, name: entry.name, size });
              }
            }
          };
          walk(absDir);
        }

        // Sort by path for consistent output
        files.sort((a, b) => a.path.localeCompare(b.path));

        // Cap at 5000 files to prevent excessive payloads
        const capped = files.slice(0, 5000);

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_file_index",
          correlationId,
          summary: `Canon file index returned ${capped.length} files`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          files: capped,
          totalFiles: capped.length,
          scope: scopePrefix || "all",
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_file_index",
          correlationId,
          summary: `Canon file index failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "FILE_INDEX_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_recent_files (POST /pilot/canon/recent-files) ────────────
    if (method === "POST" && pathname === "/pilot/canon/recent-files") {
      const correlationId = `corr-recent-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const action = typeof body.action === "string" ? body.action : "list";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_recent_files",
          correlationId,
          summary: `Canon recent files action=${action}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        // In-memory store (persists across requests, not across restarts)
        if (!globalThis.__canonRecentFiles) {
          globalThis.__canonRecentFiles = [];
        }

        const MAX_RECENT = 50;

        const ALLOWED_PREFIXES = [
          "os-platform/core/pilot/",
          "os-platform/core/types/",
          "tools/registry/",
          "frontend/apps/os-shell/src/canon/",
          "frontend/apps/os-shell/src/pages/",
          "frontend/apps/os-shell/src/api/",
          "frontend/apps/os-shell/src/styles/",
          "golden/",
        ];

        if (action === "add") {
          const filePath = typeof body.filePath === "string" ? body.filePath : "";
          if (!filePath) {
            writeJson(res, 400, { error: "MISSING_PATH", message: "filePath is required for add action" });
            return;
          }
          if (filePath.includes("..")) {
            writeJson(res, 403, { error: "TRAVERSAL_REJECTED", message: "Path traversal not allowed" });
            return;
          }
          if (!ALLOWED_PREFIXES.some((p) => filePath.startsWith(p))) {
            writeJson(res, 403, { error: "FORBIDDEN_PATH", message: `Path '${filePath}' is not within allowed prefixes` });
            return;
          }

          // Remove existing entry for this file (move to top)
          globalThis.__canonRecentFiles = globalThis.__canonRecentFiles.filter(
            (e) => e.filePath !== filePath,
          );

          // Add to front
          const name = filePath.split("/").pop() || filePath;
          globalThis.__canonRecentFiles.unshift({
            filePath,
            name,
            openedAt: new Date().toISOString(),
          });

          // Cap at MAX_RECENT
          if (globalThis.__canonRecentFiles.length > MAX_RECENT) {
            globalThis.__canonRecentFiles = globalThis.__canonRecentFiles.slice(0, MAX_RECENT);
          }

          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_recent_files",
            correlationId,
            summary: `Added '${filePath}' to recent files (${globalThis.__canonRecentFiles.length} total)`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });

          writeJson(res, 200, {
            files: globalThis.__canonRecentFiles,
            action: "add",
          });
        } else if (action === "list") {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_recent_files",
            correlationId,
            summary: `Listed ${globalThis.__canonRecentFiles.length} recent files`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });

          writeJson(res, 200, {
            files: globalThis.__canonRecentFiles,
            action: "list",
          });
        } else if (action === "clear") {
          const count = globalThis.__canonRecentFiles.length;
          globalThis.__canonRecentFiles = [];

          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_recent_files",
            correlationId,
            summary: `Cleared ${count} recent files`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });

          writeJson(res, 200, {
            files: [],
            action: "clear",
          });
        } else {
          writeJson(res, 400, { error: "INVALID_ACTION", message: `Unknown action '${action}'. Use: add, list, clear` });
          return;
        }
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_recent_files",
          correlationId,
          summary: `Canon recent files failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "RECENT_FILES_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_symbol_search (POST /pilot/canon/symbol-search) ────────────
    if (method === "POST" && pathname === "/pilot/canon/symbol-search") {
      const correlationId = `corr-symbol-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const query = typeof body.query === "string" ? body.query.trim() : "";
        const maxResults = typeof body.maxResults === "number" && body.maxResults > 0
          ? Math.min(body.maxResults, 200)
          : 50;

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_symbol_search",
          correlationId,
          summary: `Canon symbol search query="${query}" max=${maxResults}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        if (!query) {
          writeJson(res, 400, { error: "MISSING_QUERY", message: "query is required" });
          return;
        }

        const ALLOWED_PREFIXES = [
          "os-platform/core/pilot/",
          "os-platform/core/types/",
          "tools/registry/",
          "frontend/apps/os-shell/src/canon/",
          "frontend/apps/os-shell/src/pages/",
          "frontend/apps/os-shell/src/api/",
          "frontend/apps/os-shell/src/styles/",
          "golden/",
        ];

        const SYMBOL_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".mts"];

        // Symbol extraction patterns (regex-based, not AST — fast & sufficient)
        const SYMBOL_PATTERNS = [
          { kind: "function", re: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm },
          { kind: "class", re: /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm },
          { kind: "interface", re: /^(?:export\s+)?interface\s+(\w+)/gm },
          { kind: "type", re: /^(?:export\s+)?type\s+(\w+)\s*[=<]/gm },
          { kind: "constant", re: /^(?:export\s+)?const\s+(\w+)\s*[=:]/gm },
          { kind: "enum", re: /^(?:export\s+)?enum\s+(\w+)/gm },
          { kind: "variable", re: /^(?:export\s+)?(?:let|var)\s+(\w+)\s*[=:]/gm },
        ];

        // Collect all source files recursively
        const allFiles = [];
        const collectFiles = (dir, prefix) => {
          let entries;
          try { entries = require("fs").readdirSync(dir, { withFileTypes: true }); }
          catch { return; }
          for (const ent of entries) {
            if (ent.name === "node_modules" || ent.name === ".git") continue;
            const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
            if (ent.isDirectory()) {
              collectFiles(require("path").join(dir, ent.name), rel);
            } else if (SYMBOL_EXTENSIONS.some((ext) => ent.name.endsWith(ext))) {
              allFiles.push({ absPath: require("path").join(dir, ent.name), relPath: rel });
            }
          }
        };

        const rootDir = process.cwd();
        for (const prefix of ALLOWED_PREFIXES) {
          const absDir = require("path").join(rootDir, prefix);
          try {
            if (require("fs").existsSync(absDir)) {
              collectFiles(absDir, prefix.replace(/\/$/, ""));
            }
          } catch { /* skip */ }
        }

        // Extract symbols and match against query
        const qLower = query.toLowerCase();
        const symbols = [];
        let totalFiles = allFiles.length;

        for (const file of allFiles) {
          if (symbols.length >= maxResults) break;
          let content;
          try {
            content = require("fs").readFileSync(file.absPath, "utf-8");
          } catch { continue; }

          const lines = content.split("\n");

          for (const pattern of SYMBOL_PATTERNS) {
            // Reset regex state
            pattern.re.lastIndex = 0;
            let match;
            while ((match = pattern.re.exec(content)) !== null) {
              const name = match[1];
              if (!name) continue;
              const nameLower = name.toLowerCase();

              // Fuzzy match: query chars appear in order in name
              let qi = 0;
              for (let ci = 0; ci < nameLower.length && qi < qLower.length; ci++) {
                if (nameLower[ci] === qLower[qi]) qi++;
              }
              if (qi < qLower.length) continue;

              // Find line number
              const offset = match.index;
              let line = 1;
              for (let i = 0; i < offset && i < content.length; i++) {
                if (content[i] === "\n") line++;
              }

              symbols.push({
                filePath: file.relPath,
                name,
                kind: pattern.kind,
                line,
              });

              if (symbols.length >= maxResults) break;
            }
            if (symbols.length >= maxResults) break;
          }
        }

        // Sort: exact prefix matches first, then by name length (shorter = better)
        symbols.sort((a, b) => {
          const aExact = a.name.toLowerCase().startsWith(qLower) ? 0 : 1;
          const bExact = b.name.toLowerCase().startsWith(qLower) ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          return a.name.length - b.name.length;
        });

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_symbol_search",
          correlationId,
          summary: `Found ${symbols.length} symbols across ${totalFiles} files`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          symbols,
          query,
          totalFiles,
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_symbol_search",
          correlationId,
          summary: `Canon symbol search failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "SYMBOL_SEARCH_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_snippets (POST /pilot/canon/snippets) ──────────────────────
    if (method === "POST" && pathname === "/pilot/canon/snippets") {
      const correlationId = `canon-snippets-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const action = body?.action;

        if (!globalThis.__canonSnippets) {
          globalThis.__canonSnippets = [];
        }

        if (action === "list") {
          const lang = body?.language;
          let snippets = globalThis.__canonSnippets;
          if (lang) {
            snippets = snippets.filter((s) => s.language === lang);
          }
          writeJson(res, 200, { snippets, inserted: undefined });
          emitTrace({
            type: "tool_succeeded", tool: "canon_snippets", correlationId,
            summary: `Listed ${snippets.length} snippet(s)`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          return;
        }

        if (action === "create") {
          const name = body?.name;
          const bodyContent = body?.body;
          if (!name || typeof name !== "string" || !bodyContent || typeof bodyContent !== "string") {
            writeJson(res, 400, { error: "INVALID_PARAMS", message: "name and body are required for create" });
            return;
          }
          const snippet = {
            id: `snip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            language: body?.language || "plaintext",
            prefix: body?.prefix || "",
            body: bodyContent,
            description: body?.description || "",
          };
          globalThis.__canonSnippets.push(snippet);
          writeJson(res, 200, { snippets: globalThis.__canonSnippets, inserted: undefined });
          emitTrace({
            type: "tool_succeeded", tool: "canon_snippets", correlationId,
            summary: `Created snippet "${name}" (${snippet.id})`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          return;
        }

        if (action === "delete") {
          const id = body?.id;
          if (!id || typeof id !== "string") {
            writeJson(res, 400, { error: "INVALID_PARAMS", message: "id is required for delete" });
            return;
          }
          const before = globalThis.__canonSnippets.length;
          globalThis.__canonSnippets = globalThis.__canonSnippets.filter((s) => s.id !== id);
          const removed = before - globalThis.__canonSnippets.length;
          writeJson(res, 200, { snippets: globalThis.__canonSnippets, inserted: undefined });
          emitTrace({
            type: "tool_succeeded", tool: "canon_snippets", correlationId,
            summary: `Deleted ${removed} snippet(s) with id "${id}"`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          return;
        }

        if (action === "insert") {
          const id = body?.id;
          if (!id || typeof id !== "string") {
            writeJson(res, 400, { error: "INVALID_PARAMS", message: "id is required for insert" });
            return;
          }
          const snippet = globalThis.__canonSnippets.find((s) => s.id === id);
          if (!snippet) {
            writeJson(res, 404, { error: "NOT_FOUND", message: `Snippet "${id}" not found` });
            return;
          }
          writeJson(res, 200, { snippets: globalThis.__canonSnippets, inserted: snippet.body });
          emitTrace({
            type: "tool_succeeded", tool: "canon_snippets", correlationId,
            summary: `Inserted snippet "${snippet.name}"`,
            context: { countyId: "system", userId: "canon", mode: "pilot" },
          });
          return;
        }

        writeJson(res, 400, { error: "INVALID_ACTION", message: `Unknown action: ${action}` });
      } catch (err) {
        emitTrace({
          type: "tool_failed", tool: "canon_snippets", correlationId,
          summary: `Canon snippets failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "SNIPPETS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_minimap (POST /pilot/canon/minimap) ────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/minimap") {
      const correlationId = `canon-minimap-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const filePath = body?.filePath;

        if (!filePath || typeof filePath !== "string") {
          writeJson(res, 400, { error: "INVALID_PARAMS", message: "filePath is required" });
          return;
        }

        // Validate path is within allowed prefixes
        const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
        const allowed = ALLOWED_PREFIXES.some((p) => normalizedPath.startsWith(p));
        if (!allowed) {
          writeJson(res, 403, { error: "PATH_DENIED", message: `Path not in allowed scope: ${filePath}` });
          return;
        }

        // Prevent traversal
        if (normalizedPath.includes("..")) {
          writeJson(res, 403, { error: "PATH_TRAVERSAL", message: "Path traversal not allowed" });
          return;
        }

        const absPath = path.resolve(WORKSPACE_ROOT, normalizedPath);
        if (!fs.existsSync(absPath)) {
          writeJson(res, 404, { error: "NOT_FOUND", message: `File not found: ${filePath}` });
          return;
        }

        const content = fs.readFileSync(absPath, "utf-8");
        const lines = content.split("\n");
        const totalLines = lines.length;

        // Parse sections (functions, classes, interfaces, types, imports, comment blocks)
        const sections = [];
        const SECTION_PATTERNS = [
          { re: /^(export\s+)?(async\s+)?function\s+(\w+)/, kind: "function" },
          { re: /^(export\s+)?(abstract\s+)?class\s+(\w+)/, kind: "class" },
          { re: /^(export\s+)?interface\s+(\w+)/, kind: "interface" },
          { re: /^(export\s+)?type\s+(\w+)/, kind: "type" },
          { re: /^import\s+/, kind: "import" },
          { re: /^(export\s+)(default\s+)?/, kind: "export" },
          { re: /^\/\*\*/, kind: "comment" },
        ];

        let currentSection = null;
        let braceDepth = 0;
        let inBlockComment = false;

        for (let i = 0; i < totalLines; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();

          // Track block comments
          if (inBlockComment) {
            if (trimmed.includes("*/")) {
              inBlockComment = false;
              if (currentSection && currentSection.kind === "comment") {
                currentSection.endLine = i + 1;
                sections.push(currentSection);
                currentSection = null;
              }
            }
            continue;
          }

          if (trimmed.startsWith("/**") || trimmed.startsWith("/*")) {
            inBlockComment = !trimmed.includes("*/");
            if (inBlockComment && !currentSection) {
              currentSection = { startLine: i + 1, endLine: i + 1, label: "comment block", kind: "comment", depth: 0 };
            }
            continue;
          }

          // Check for section patterns
          for (const { re, kind } of SECTION_PATTERNS) {
            const match = trimmed.match(re);
            if (match) {
              const label = match[3] || match[2] || kind;
              const indent = line.length - line.trimStart().length;
              const depth = Math.floor(indent / 2);
              if (currentSection) {
                currentSection.endLine = i;
                sections.push(currentSection);
              }
              currentSection = { startLine: i + 1, endLine: i + 1, label, kind, depth };
              break;
            }
          }

          // Track brace depth for ending sections
          for (const ch of trimmed) {
            if (ch === "{") braceDepth++;
            if (ch === "}") {
              braceDepth--;
              if (braceDepth <= 0 && currentSection) {
                braceDepth = 0;
                currentSection.endLine = i + 1;
                sections.push(currentSection);
                currentSection = null;
              }
            }
          }
        }

        if (currentSection) {
          currentSection.endLine = totalLines;
          sections.push(currentSection);
        }

        // Generate symbol density: count symbols per 10-line bucket
        const bucketSize = 10;
        const bucketCount = Math.ceil(totalLines / bucketSize);
        const symbolDensity = new Array(bucketCount).fill(0);

        const SYMBOL_RE = /(?:function|class|interface|type|const|let|var|enum|export)\s+\w+/g;
        for (let i = 0; i < totalLines; i++) {
          const matches = lines[i].match(SYMBOL_RE);
          if (matches) {
            const bucket = Math.floor(i / bucketSize);
            symbolDensity[bucket] += matches.length;
          }
        }

        writeJson(res, 200, { filePath, totalLines, sections, symbolDensity });
        emitTrace({
          type: "tool_succeeded", tool: "canon_minimap", correlationId,
          summary: `Minimap for "${filePath}": ${totalLines} lines, ${sections.length} sections`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
      } catch (err) {
        emitTrace({
          type: "tool_failed", tool: "canon_minimap", correlationId,
          summary: `Canon minimap failed: ${err?.message ?? String(err)}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "MINIMAP_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_editor_settings ───────────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/editor-settings") {
      const DEFAULTS = {
        minimap: true,
        wordWrap: true,
        fontSize: 12,
        tabSize: 2,
        theme: "dark",
        lineNumbers: true,
        autoSave: true,
        bracketPairColorization: true,
      };
      if (!globalThis.__canonEditorSettings) {
        globalThis.__canonEditorSettings = { ...DEFAULTS };
      }
      try {
        const body = await readJsonBody(req);
        const action = body?.action ?? "get";
        if (action === "reset") {
          globalThis.__canonEditorSettings = { ...DEFAULTS };
          writeJson(res, 200, { settings: globalThis.__canonEditorSettings, persisted: true });
        } else if (action === "set" && body?.settings) {
          Object.assign(globalThis.__canonEditorSettings, body.settings);
          writeJson(res, 200, { settings: globalThis.__canonEditorSettings, persisted: true });
        } else {
          writeJson(res, 200, { settings: globalThis.__canonEditorSettings, persisted: true });
        }
      } catch (err) {
        traceEvent?.({
          type: "tool_failed",
          tool: "canon_editor_settings",
          error: err?.message ?? String(err),
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "EDITOR_SETTINGS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_find_replace ──────────────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/find-replace") {
      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "golden/",
      ];
      const MAX_FILE_SIZE = 512 * 1024;
      const MAX_RESULTS = 500;

      try {
        const body = await readJsonBody(req);
        const action = body?.action ?? "find";
        const query = body?.query;
        const replacement = body?.replacement ?? "";
        const isRegex = body?.isRegex === true;
        const caseSensitive = body?.caseSensitive === true;
        const scopeFile = body?.filePath;

        if (!query || typeof query !== "string") {
          writeJson(res, 400, { error: "BAD_REQUEST", message: "query is required" });
          return;
        }

        // Build regex from query
        let pattern;
        try {
          const flags = caseSensitive ? "g" : "gi";
          pattern = isRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
        } catch (regErr) {
          writeJson(res, 400, { error: "BAD_REQUEST", message: "Invalid regex: " + regErr.message });
          return;
        }

        // Collect files
        const collectFiles = async (dir) => {
          const results = [];
          try {
            const entries = await fsp.readdir(path.join(ROOT, dir), { withFileTypes: true });
            for (const entry of entries) {
              const rel = dir + entry.name + (entry.isDirectory() ? "/" : "");
              if (entry.isDirectory()) {
                if (entry.name === "node_modules" || entry.name === ".git") continue;
                results.push(...(await collectFiles(rel)));
              } else {
                results.push(rel);
              }
            }
          } catch { /* skip unreadable */ }
          return results;
        };

        let files = [];
        if (scopeFile) {
          const normalized = scopeFile.replace(/\\/g, "/");
          if (normalized.includes("..") || path.isAbsolute(scopeFile)) {
            writeJson(res, 403, { error: "FORBIDDEN", message: "Path traversal rejected" });
            return;
          }
          const allowed = ALLOWED_PREFIXES.some((p) => normalized.startsWith(p));
          if (!allowed) {
            writeJson(res, 403, { error: "FORBIDDEN", message: "Path outside allowed scope" });
            return;
          }
          files = [normalized];
        } else {
          for (const prefix of ALLOWED_PREFIXES) {
            files.push(...(await collectFiles(prefix)));
          }
        }

        const matches = [];
        let filesSearched = 0;
        let replacementsApplied = 0;

        for (const filePath of files) {
          if (matches.length >= MAX_RESULTS) break;
          const absPath = path.join(ROOT, filePath);
          try {
            const stat = await fsp.stat(absPath);
            if (stat.size > MAX_FILE_SIZE || stat.isDirectory()) continue;
          } catch { continue; }

          let content;
          try {
            content = await fsp.readFile(absPath, "utf-8");
          } catch { continue; }
          filesSearched++;

          const lines = content.split("\n");

          if (action === "find") {
            for (let i = 0; i < lines.length && matches.length < MAX_RESULTS; i++) {
              const line = lines[i];
              let m;
              pattern.lastIndex = 0;
              while ((m = pattern.exec(line)) !== null && matches.length < MAX_RESULTS) {
                matches.push({
                  filePath,
                  line: i + 1,
                  column: m.index + 1,
                  lineText: line.length > 200 ? line.slice(0, 200) + "…" : line,
                  matchText: m[0],
                });
                if (!pattern.global) break;
              }
            }
          } else if (action === "replaceAll") {
            // Count matches first for preview
            for (let i = 0; i < lines.length && matches.length < MAX_RESULTS; i++) {
              const line = lines[i];
              let m;
              pattern.lastIndex = 0;
              while ((m = pattern.exec(line)) !== null && matches.length < MAX_RESULTS) {
                matches.push({
                  filePath,
                  line: i + 1,
                  column: m.index + 1,
                  lineText: line.length > 200 ? line.slice(0, 200) + "…" : line,
                  matchText: m[0],
                });
                if (!pattern.global) break;
              }
            }
            // Perform replacement
            const newContent = content.replace(pattern, replacement);
            if (newContent !== content) {
              await fsp.writeFile(absPath, newContent, "utf-8");
              replacementsApplied += matches.filter((m) => m.filePath === filePath).length;
            }
          }
        }

        traceEvent?.({
          type: action === "find" ? "tool_succeeded" : "tool_succeeded",
          tool: "canon_find_replace",
          action,
          totalMatches: matches.length,
          filesSearched,
          replacementsApplied,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          matches,
          totalMatches: matches.length,
          filesSearched,
          replacementsApplied,
        });
      } catch (err) {
        traceEvent?.({
          type: "tool_failed",
          tool: "canon_find_replace",
          error: err?.message ?? String(err),
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "FIND_REPLACE_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── POST /pilot/canon/format-file ─────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/format-file") {
      const body = await readJsonBody(req);
      const filePath = typeof body.filePath === "string" ? body.filePath : "";
      const tabSize = typeof body.tabSize === "number" ? Math.max(1, Math.min(8, body.tabSize)) : 2;
      const useTabs = body.useTabs === true;
      const insertFinalNewline = body.insertFinalNewline !== false;

      if (!filePath) {
        writeJson(res, 400, { error: "MISSING_FILE_PATH", message: "filePath is required" });
        return;
      }
      if (filePath.includes("..")) {
        writeJson(res, 403, { error: "PATH_TRAVERSAL", message: "Path traversal rejected" });
        return;
      }

      const ALLOWED_PREFIXES = [
        "os-platform/core/pilot/",
        "os-platform/core/types/",
        "tools/registry/",
        "frontend/apps/os-shell/src/canon/",
        "frontend/apps/os-shell/src/pages/",
        "frontend/apps/os-shell/src/api/",
        "frontend/apps/os-shell/src/styles/",
        "golden/",
      ];
      const allowed = ALLOWED_PREFIXES.some((p) => filePath.startsWith(p));
      if (!allowed) {
        writeJson(res, 403, { error: "OUTSIDE_ALLOWED_SCOPE", message: `Path not in allowed prefixes` });
        return;
      }

      try {
        traceEvent?.({
          type: "tool_invoked",
          tool: "canon_format_file",
          params: { filePath, tabSize, useTabs, insertFinalNewline },
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        const fullPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
          writeJson(res, 404, { error: "FILE_NOT_FOUND", message: `File not found: ${filePath}` });
          return;
        }
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          writeJson(res, 400, { error: "IS_DIRECTORY", message: "Cannot format a directory" });
          return;
        }
        if (stat.size > 1024 * 1024) {
          writeJson(res, 413, { error: "FILE_TOO_LARGE", message: "File exceeds 1MB limit" });
          return;
        }

        const startTime = Date.now();
        const original = fs.readFileSync(fullPath, "utf-8");
        const ext = path.extname(filePath).toLowerCase();

        // Detect language
        const LANG_MAP = {
          ".ts": "typescript", ".tsx": "typescript",
          ".js": "javascript", ".mjs": "javascript", ".mts": "javascript",
          ".json": "json",
          ".css": "css",
          ".md": "markdown", ".mdx": "markdown",
          ".html": "html", ".htm": "html",
          ".yaml": "yaml", ".yml": "yaml",
        };
        const language = LANG_MAP[ext] || "plaintext";
        const indent = useTabs ? "\t" : " ".repeat(tabSize);

        let formatted = original;

        // JSON: parse and re-stringify with proper indent
        if (language === "json") {
          try {
            const parsed = JSON.parse(original);
            formatted = JSON.stringify(parsed, null, useTabs ? "\t" : tabSize);
          } catch {
            // If JSON is invalid, just do basic whitespace cleanup
          }
        }

        // All languages: normalize line endings to LF
        formatted = formatted.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // All languages: remove trailing whitespace per line
        formatted = formatted.split("\n").map((line) => line.trimEnd()).join("\n");

        // TypeScript/JavaScript/CSS: normalize indentation (convert tabs↔spaces)
        if (["typescript", "javascript", "css"].includes(language)) {
          const lines = formatted.split("\n");
          formatted = lines.map((line) => {
            const match = line.match(/^(\s*)/);
            if (!match || !match[1]) return line;
            const ws = match[1];
            // Count effective indent level
            let level = 0;
            for (const ch of ws) {
              if (ch === "\t") level += tabSize;
              else level += 1;
            }
            const indentLevel = Math.round(level / tabSize);
            return indent.repeat(indentLevel) + line.trimStart();
          }).join("\n");
        }

        // Ensure final newline
        if (insertFinalNewline && !formatted.endsWith("\n")) {
          formatted += "\n";
        }
        // Remove trailing newlines if not inserting final newline
        if (!insertFinalNewline) {
          formatted = formatted.replace(/\n+$/, "");
        }

        const changed = formatted !== original;
        if (changed) {
          fs.writeFileSync(fullPath, formatted, "utf-8");
        }

        const durationMs = Date.now() - startTime;

        traceEvent?.({
          type: "tool_succeeded",
          tool: "canon_format_file",
          result: { filePath, formatted: changed, language, durationMs },
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        writeJson(res, 200, {
          filePath,
          formatted: changed,
          originalSize: Buffer.byteLength(original, "utf-8"),
          formattedSize: Buffer.byteLength(formatted, "utf-8"),
          language,
          durationMs,
          content: formatted,
        });
      } catch (err) {
        traceEvent?.({
          type: "tool_failed",
          tool: "canon_format_file",
          error: err?.message ?? String(err),
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });
        writeJson(res, 500, { error: "FORMAT_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── POST /pilot/canon/editor-layout ─────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/editor-layout") {
      const body = await readJsonBody(req);
      const action = typeof body.action === "string" ? body.action : "get";
      const validModes = ["single", "split-vertical", "split-horizontal"];
      const mode = validModes.includes(body.mode) ? body.mode : "single";

      if (!["get", "set"].includes(action)) {
        writeJson(res, 400, { error: "INVALID_ACTION", message: "action must be 'get' or 'set'" });
        return;
      }

      // Server-side layout state (persisted in memory for dev)
      if (!globalThis.__canonEditorLayout) {
        globalThis.__canonEditorLayout = "single";
      }

      if (action === "set") {
        globalThis.__canonEditorLayout = mode;
      }

      const currentMode = globalThis.__canonEditorLayout;

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_editor_layout",
        result: { mode: currentMode, panes: currentMode === "single" ? 1 : 2 },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, {
        mode: currentMode,
        panes: currentMode === "single" ? 1 : 2,
      });
      return;
    }

    // ── POST /pilot/canon/folding-ranges ──────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/folding-ranges") {
      const body = await readJsonBody(req);
      const filePath = typeof body.filePath === "string" ? body.filePath : "";
      const ext = filePath.split(".").pop() || "";
      const langMap = { ts: "typescript", tsx: "typescriptreact", js: "javascript", jsx: "javascriptreact", css: "css", json: "json", md: "markdown" };
      const language = langMap[ext] || "plaintext";

      // Compute basic folding ranges from file content if available
      const content = typeof body._content === "string" ? body._content : "";
      const ranges = [];
      if (content) {
        const lines = content.split("\n");
        const stack = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          // Detect brace-based blocks
          if (trimmed.includes("{") && !trimmed.startsWith("//") && !trimmed.startsWith("*")) {
            stack.push({ startLine: i + 1, kind: "region" });
          }
          if (trimmed.includes("}") && stack.length > 0) {
            const open = stack.pop();
            if (open && i + 1 - open.startLine >= 2) {
              ranges.push({ startLine: open.startLine, endLine: i + 1, kind: open.kind });
            }
          }
          // Detect block comments
          if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
            stack.push({ startLine: i + 1, kind: "comment" });
          }
          if (trimmed.includes("*/") && stack.length > 0 && stack[stack.length - 1].kind === "comment") {
            const open = stack.pop();
            if (open && i + 1 - open.startLine >= 1) {
              ranges.push({ startLine: open.startLine, endLine: i + 1, kind: "comment" });
            }
          }
          // Detect import blocks
          if (i > 0 && trimmed.startsWith("import ") && !lines[i - 1].trimStart().startsWith("import ")) {
            stack.push({ startLine: i + 1, kind: "imports" });
          }
          if (!trimmed.startsWith("import ") && stack.length > 0 && stack[stack.length - 1].kind === "imports") {
            const open = stack.pop();
            if (open && i - open.startLine >= 2) {
              ranges.push({ startLine: open.startLine, endLine: i, kind: "imports" });
            }
          }
        }
      }

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_folding_ranges",
        result: { filePath, rangeCount: ranges.length, language },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { filePath, ranges, language });
      return;
    }

    // ── POST /pilot/canon/line-markers ────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/line-markers") {
      const body = await readJsonBody(req);
      const fp = typeof body.filePath === "string" ? body.filePath : "";
      const action = typeof body.action === "string" ? body.action : "list";

      if (!["list", "set", "clear"].includes(action)) {
        writeJson(res, 400, { error: "INVALID_ACTION", message: "action must be 'list', 'set', or 'clear'" });
        return;
      }

      // In-memory marker store keyed by filePath
      if (!globalThis.__canonLineMarkers) {
        globalThis.__canonLineMarkers = {};
      }

      if (action === "clear") {
        globalThis.__canonLineMarkers[fp] = [];
      } else if (action === "set") {
        const markers = Array.isArray(body.markers) ? body.markers : [];
        globalThis.__canonLineMarkers[fp] = markers;
      }

      const markers = globalThis.__canonLineMarkers[fp] || [];

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_line_markers",
        result: { filePath: fp, action, markerCount: markers.length },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { filePath: fp, markers, count: markers.length });
      return;
    }

    // ── POST /pilot/canon/hover-info ──────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/hover-info") {
      const body = await readJsonBody(req);
      const fp = typeof body.filePath === "string" ? body.filePath : "";
      const line = typeof body.line === "number" ? body.line : 1;
      const col = typeof body.column === "number" ? body.column : 1;
      const content = typeof body.content === "string" ? body.content : "";

      let symbol = null;
      let markdown = "";

      if (content) {
        const lines = content.split("\n");
        const targetLine = lines[line - 1] || "";

        // Extract the word at the column position
        const before = targetLine.slice(0, col - 1);
        const after = targetLine.slice(col - 1);
        const wordStart = before.match(/[\w$]*$/)?.[0] || "";
        const wordEnd = after.match(/^[\w$]*/)?.[0] || "";
        const word = wordStart + wordEnd;

        if (word) {
          // Search backward from the target line for a JSDoc/TSDoc block
          let jsdoc = "";
          let declLine = -1;
          for (let i = line - 1; i >= 0; i--) {
            const l = lines[i] || "";
            // Check if this line declares the symbol
            const declPattern = new RegExp(
              "(?:export\\s+)?(?:function|const|let|var|class|interface|type|enum)\\s+" + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b"
            );
            if (declPattern.test(l)) {
              declLine = i + 1;
              // Look for JSDoc immediately above
              let docEnd = i - 1;
              if (docEnd >= 0 && lines[docEnd].trim().endsWith("*/")) {
                let docStart = docEnd;
                while (docStart > 0 && !lines[docStart].trim().startsWith("/**")) {
                  docStart--;
                }
                jsdoc = lines.slice(docStart, docEnd + 1).join("\n");
              }
              break;
            }
          }

          // Determine symbol kind from declaration line
          let kind = "symbol";
          let type = "";
          if (declLine > 0) {
            const decl = lines[declLine - 1] || "";
            if (/\bfunction\b/.test(decl)) kind = "function";
            else if (/\bclass\b/.test(decl)) kind = "class";
            else if (/\binterface\b/.test(decl)) kind = "interface";
            else if (/\btype\b/.test(decl)) kind = "type";
            else if (/\benum\b/.test(decl)) kind = "enum";
            else if (/\bconst\b/.test(decl)) { kind = "const"; }
            else if (/\blet\b|\bvar\b/.test(decl)) kind = "variable";

            // Extract type annotation if present (e.g., ": string", ": number[]")
            const typeMatch = decl.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\s*(?::\\s*([^=({]+))"));
            if (typeMatch) type = typeMatch[1].trim();

            // Extract parameters for functions
            const paramMatch = decl.match(/\(([^)]*)\)/);
            const params = paramMatch ? paramMatch[1].split(",").map(p => p.trim()).filter(Boolean) : [];

            symbol = { name: word, kind, type: type || undefined, description: jsdoc || undefined, parameters: params.length ? params : undefined, filePath: fp, line: declLine };

            // Build markdown hover content
            const parts = [];
            parts.push("```typescript");
            parts.push(`(${kind}) ${word}${type ? ": " + type : ""}${params.length ? "(" + params.join(", ") + ")" : ""}`);
            parts.push("```");
            if (jsdoc) {
              // Strip comment delimiters
              const cleaned = jsdoc.replace(/\/\*\*|\*\/|\s*\*\s?/g, " ").trim();
              parts.push("---");
              parts.push(cleaned);
            }
            markdown = parts.join("\n");
          } else {
            // Word found but no declaration — return basic info
            symbol = { name: word, kind: "unknown" };
            markdown = "```\n" + word + "\n```";
          }
        }
      }

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_hover_info",
        result: { filePath: fp, line, column: col, hasSymbol: !!symbol },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { filePath: fp, line, column: col, symbol, markdown });
      return;
    }

    // ── POST /pilot/canon/goto-definition ─────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/goto-definition") {
      const body = await readJsonBody(req);
      const fp = typeof body.filePath === "string" ? body.filePath : "";
      const line = typeof body.line === "number" ? body.line : 1;
      const col = typeof body.column === "number" ? body.column : 1;
      const content = typeof body.content === "string" ? body.content : "";
      const explicitSymbol = typeof body.symbol === "string" ? body.symbol : "";

      const definitions = [];

      if (content) {
        const lines = content.split("\n");
        const targetLine = lines[line - 1] || "";

        // Extract the word at the column position (or use explicit symbol)
        let word = explicitSymbol;
        if (!word) {
          const before = targetLine.slice(0, col - 1);
          const after = targetLine.slice(col - 1);
          const wordStart = before.match(/[\w$]*$/)?.[0] || "";
          const wordEnd = after.match(/^[\w$]*/)?.[0] || "";
          word = wordStart + wordEnd;
        }

        if (word) {
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const declPattern = new RegExp(
            "(?:export\\s+)?(?:function|const|let|var|class|interface|type|enum)\\s+" + escapedWord + "\\b"
          );

          // Search all lines for declarations
          for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (declPattern.test(l)) {
              // Determine kind
              let kind = "symbol";
              if (/\bfunction\b/.test(l)) kind = "function";
              else if (/\bclass\b/.test(l)) kind = "class";
              else if (/\binterface\b/.test(l)) kind = "interface";
              else if (/\btype\b/.test(l)) kind = "type";
              else if (/\benum\b/.test(l)) kind = "enum";
              else if (/\bconst\b/.test(l)) kind = "const";
              else if (/\blet\b|\bvar\b/.test(l)) kind = "variable";

              // Find column of the symbol name in the line
              const symIdx = l.indexOf(word);
              const defCol = symIdx >= 0 ? symIdx + 1 : 1;

              definitions.push({
                filePath: fp,
                line: i + 1,
                column: defCol,
                endColumn: defCol + word.length,
                kind,
                preview: l.trim().slice(0, 120),
              });
            }
          }
        }
      }

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_goto_definition",
        result: { filePath: fp, line, column: col, definitionCount: definitions.length },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { filePath: fp, line, column: col, definitions });
      return;
    }

    // ── POST /pilot/canon/completions ─────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/completions") {
      const body = await readJsonBody(req);
      const fp = typeof body.filePath === "string" ? body.filePath : "";
      const line = typeof body.line === "number" ? body.line : 1;
      const col = typeof body.column === "number" ? body.column : 1;
      const content = typeof body.content === "string" ? body.content : "";
      const trigger = typeof body.triggerCharacter === "string" ? body.triggerCharacter : "";

      const items = [];

      if (content) {
        const fileLines = content.split("\n");
        const ext = fp.split(".").pop()?.toLowerCase() || "";
        const isTS = ["ts", "tsx", "js", "jsx", "mjs"].includes(ext);

        // Extract all declared symbols from the file
        const declPattern = /(?:export\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([\w$]+)/g;
        let match;
        while ((match = declPattern.exec(content)) !== null) {
          const name = match[1];
          let kind = "variable";
          const line0 = match[0];
          if (/\bfunction\b/.test(line0)) kind = "function";
          else if (/\bclass\b/.test(line0)) kind = "class";
          else if (/\binterface\b/.test(line0)) kind = "interface";
          else if (/\btype\b/.test(line0)) kind = "type";
          else if (/\benum\b/.test(line0)) kind = "enum";
          else if (/\bconst\b/.test(line0)) kind = "constant";
          items.push({ label: name, kind, detail: kind, insertText: name, sortText: "1_" + name });
        }

        // Add language keywords
        if (isTS) {
          const keywords = [
            "async", "await", "break", "case", "catch", "class", "const",
            "continue", "default", "do", "else", "enum", "export", "extends",
            "finally", "for", "function", "if", "import", "interface", "let",
            "new", "return", "static", "switch", "throw", "try", "type",
            "typeof", "var", "void", "while", "yield",
          ];
          for (const kw of keywords) {
            items.push({ label: kw, kind: "keyword", detail: "keyword", insertText: kw, sortText: "2_" + kw });
          }
        }

        // Deduplicate by label
        const seen = new Set();
        const deduped = [];
        for (const item of items) {
          if (!seen.has(item.label)) {
            seen.add(item.label);
            deduped.push(item);
          }
        }
        items.length = 0;
        items.push(...deduped);
      }

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_completions",
        result: { filePath: fp, line, column: col, itemCount: items.length },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { filePath: fp, line, column: col, items });
      return;
    }

    // ── POST /pilot/canon/editor-themes ───────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/editor-themes") {
      const body = await readJsonBody(req);
      const action = typeof body.action === "string" ? body.action : "list";
      const themeId = typeof body.themeId === "string" ? body.themeId : null;

      const themes = [
        { id: "terracanon-dark", displayName: "TerraCanon Dark", base: "vs-dark" },
        { id: "terracanon-light", displayName: "TerraCanon Light", base: "vs" },
        { id: "terracanon-high-contrast", displayName: "TerraCanon High Contrast", base: "hc-black" },
      ];

      // In-memory active theme (resets on restart)
      if (!globalThis.__canonActiveTheme) globalThis.__canonActiveTheme = "terracanon-dark";

      if (action === "set" && themeId && themes.some((t) => t.id === themeId)) {
        globalThis.__canonActiveTheme = themeId;
      }

      const active = globalThis.__canonActiveTheme;

      traceEvent?.({
        type: "tool_succeeded",
        tool: "canon_editor_themes",
        result: { action, active, themeCount: themes.length },
        context: { countyId: "system", userId: "canon", mode: "pilot" },
      });

      writeJson(res, 200, { action, active, themes });
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

    // ── canon_code_actions (POST /pilot/canon/code-actions) ──────────────
    if (method === "POST" && pathname === "/pilot/canon/code-actions") {
      const correlationId = `corr-codeact-${Date.now()}`;
      try {
        const body = await readJsonBody(req);
        const filePath = typeof body.filePath === "string" ? body.filePath : "";
        const content = typeof body.content === "string" ? body.content : "";
        const startLine = typeof body.startLine === "number" ? body.startLine : 1;
        const startColumn = typeof body.startColumn === "number" ? body.startColumn : 1;
        const endLine = typeof body.endLine === "number" ? body.endLine : startLine;
        const endColumn = typeof body.endColumn === "number" ? body.endColumn : startColumn;

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_code_actions",
          correlationId,
          summary: `Code actions for ${filePath} L${startLine}:${startColumn}-L${endLine}:${endColumn}`,
          context: { countyId: "system", userId: "canon", mode: "pilot" },
        });

        const lines = content.split("\n");
        const lineText = lines[startLine - 1] ?? "";
        const actions = [];

        // Quick-fix: wrap in try-catch (async code)
        if (/\bawait\b/.test(lineText) || /\.then\(/.test(lineText)) {
          actions.push({
            title: "Wrap in try/catch",
            kind: "quickfix",
            isPreferred: false,
          });
        }

        // Quick-fix: add missing import
        const importMatch = lineText.match(/\bfrom\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          actions.push({
            title: `Add missing import from '${importMatch[1]}'`,
            kind: "quickfix",
            isPreferred: true,
          });
        }

        // Refactor: extract variable/function (if selection spans code)
        const hasSelection = startLine !== endLine || startColumn !== endColumn;
        if (hasSelection) {
          actions.push({
            title: "Extract to variable",
            kind: "refactor.extract",
            isPreferred: false,
          });
          actions.push({
            title: "Extract to function",
            kind: "refactor.extract",
            isPreferred: false,
          });
        }

        // Source: toggle export
        const trimmed = lineText.trim();
        if (/^(?:export\s+)?(?:const|let|var|function|class|interface|type|enum)\b/.test(trimmed)) {
          const hasExport = /^export\s/.test(trimmed);
          actions.push({
            title: hasExport ? "Remove export" : "Add export",
            kind: "source",
            isPreferred: false,
          });
        }

        // Quick-fix: convert to optional chaining
        if (/&&\s*\w+\./.test(lineText)) {
          actions.push({
            title: "Convert to optional chaining",
            kind: "quickfix",
            isPreferred: false,
          });
        }

        // Quick-fix: convert to arrow function
        if (/\bfunction\s+\w+\s*\(/.test(lineText) && !/^export\s+default\s+function/.test(trimmed)) {
          actions.push({
            title: "Convert to arrow function",
            kind: "refactor",
            isPreferred: false,
          });
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_code_actions",
          correlationId,
          summary: `Returned ${actions.length} code actions`,
        });

        writeJson(res, 200, { actions, filePath });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_code_actions",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "CODE_ACTIONS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── POST /pilot/canon/find-references ─────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/find-references") {
      const correlationId = crypto.randomUUID();
      try {
        const body = await readJsonBody(req);
        const filePath = body.filePath ?? "";
        const line = body.line ?? 1;
        const column = body.column ?? 1;
        const content = body.content ?? "";
        const includeDeclaration = body.includeDeclaration !== false;

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_find_references",
          correlationId,
          summary: `find-references ${filePath}:${line}:${column}`,
        });

        const lines = content.split("\n");
        const targetLine = lines[line - 1] ?? "";

        // Extract word under cursor
        const before = targetLine.substring(0, column);
        const wordStart = before.search(/[\w$]+$/);
        const wordEnd = targetLine.substring(wordStart >= 0 ? wordStart : column - 1).search(/[^\w$]/);
        const cursorWord = wordStart >= 0
          ? targetLine.substring(wordStart, wordEnd >= 0 ? wordStart + wordEnd : undefined).match(/[\w$]+/)?.[0] ?? ""
          : "";

        if (!cursorWord) {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_find_references",
            correlationId,
            summary: "no symbol at cursor",
          });
          writeJson(res, 200, { references: [], symbol: "", filePath });
          return;
        }

        const references = [];
        const pattern = new RegExp(`\\b${cursorWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");

        for (let i = 0; i < lines.length; i++) {
          let match;
          while ((match = pattern.exec(lines[i])) !== null) {
            const isDecl = /(?:function|class|interface|type|const|let|var|enum|export)\s/.test(
              lines[i].substring(0, match.index),
            );
            if (!includeDeclaration && isDecl) continue;
            references.push({
              filePath,
              line: i + 1,
              column: match.index + 1,
              endLine: i + 1,
              endColumn: match.index + 1 + cursorWord.length,
              context: lines[i].trim(),
              isDeclaration: isDecl,
            });
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_find_references",
          correlationId,
          summary: `found ${references.length} references to "${cursorWord}"`,
        });

        writeJson(res, 200, { references, symbol: cursorWord, filePath });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_find_references",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "FIND_REFERENCES_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── POST /pilot/canon/rename-symbol ───────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/rename-symbol") {
      const correlationId = crypto.randomUUID();
      try {
        const body = await readJsonBody(req);
        const filePath = body.filePath ?? "";
        const line = body.line ?? 1;
        const column = body.column ?? 1;
        const newName = body.newName ?? "";
        const content = body.content ?? "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_rename_symbol",
          correlationId,
          summary: `rename-symbol ${filePath}:${line}:${column} → "${newName}"`,
        });

        if (!newName) {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_rename_symbol",
            correlationId,
            summary: "no new name provided",
          });
          writeJson(res, 200, { edits: [], oldName: "", newName: "", filePath });
          return;
        }

        const lines = content.split("\n");
        const targetLine = lines[line - 1] ?? "";

        // Extract word under cursor
        const before = targetLine.substring(0, column);
        const wordStart = before.search(/[\w$]+$/);
        const fromStart = wordStart >= 0 ? wordStart : column - 1;
        const wordMatch = targetLine.substring(fromStart).match(/^[\w$]+/);
        const oldName = wordMatch?.[0] ?? "";

        if (!oldName || oldName === newName) {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_rename_symbol",
            correlationId,
            summary: oldName ? "old name equals new name" : "no symbol at cursor",
          });
          writeJson(res, 200, { edits: [], oldName, newName, filePath });
          return;
        }

        const edits = [];
        const pattern = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");

        for (let i = 0; i < lines.length; i++) {
          let match;
          while ((match = pattern.exec(lines[i])) !== null) {
            edits.push({
              filePath,
              line: i + 1,
              column: match.index + 1,
              endLine: i + 1,
              endColumn: match.index + 1 + oldName.length,
              newText: newName,
            });
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_rename_symbol",
          correlationId,
          summary: `renamed "${oldName}" → "${newName}" (${edits.length} edits)`,
        });

        writeJson(res, 200, { edits, oldName, newName, filePath });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_rename_symbol",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "RENAME_SYMBOL_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_signature_help ──────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/signature-help") {
      const correlationId = `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const body = await readJsonBody(req);
        const filePath = typeof body.filePath === "string" ? body.filePath : "untitled";
        const line = typeof body.line === "number" ? body.line : 1;
        const column = typeof body.column === "number" ? body.column : 1;
        const content = typeof body.content === "string" ? body.content : "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_signature_help",
          correlationId,
          summary: `Signature help at ${filePath}:${line}:${column}`,
        });

        const lines = content.split("\n");
        const currentLine = lines[line - 1] ?? "";
        const before = currentLine.substring(0, column - 1);

        let parenDepth = 0;
        let commaCount = 0;
        let funcEnd = -1;

        for (let i = before.length - 1; i >= 0; i--) {
          const ch = before[i];
          if (ch === ")") parenDepth++;
          else if (ch === "(") {
            if (parenDepth > 0) { parenDepth--; }
            else { funcEnd = i; break; }
          } else if (ch === "," && parenDepth === 0) {
            commaCount++;
          }
        }

        if (funcEnd < 0) {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_signature_help",
            correlationId,
            summary: "No call site found",
          });
          writeJson(res, 200, { signatures: [], activeSignature: 0, activeParameter: 0 });
          return;
        }

        const prefix = before.substring(0, funcEnd);
        const fnMatch = prefix.match(/([\w$]+)\s*$/);
        const funcName = fnMatch?.[1] ?? "unknown";

        const lineOffset = lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0);
        const afterParen = content.substring(lineOffset + funcEnd + 1);
        let depth = 1;
        let argEnd = afterParen.length;
        for (let i = 0; i < afterParen.length; i++) {
          if (afterParen[i] === "(") depth++;
          else if (afterParen[i] === ")") {
            depth--;
            if (depth === 0) { argEnd = i; break; }
          }
        }
        const argsText = afterParen.substring(0, argEnd);
        const argParts = argsText.split(",").map((a) => a.trim()).filter(Boolean);

        const parameters = argParts.length > 0
          ? argParts.map((a, idx) => ({ label: `param${idx + 1}: ${a}` }))
          : [{ label: "args" }];

        const sigLabel = `${funcName}(${parameters.map((p) => p.label).join(", ")})`;

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_signature_help",
          correlationId,
          summary: `Signature: ${funcName} with ${parameters.length} params`,
        });
        writeJson(res, 200, {
          signatures: [{ label: sigLabel, documentation: `Signature for ${funcName}`, parameters }],
          activeSignature: 0,
          activeParameter: Math.min(commaCount, parameters.length - 1),
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_signature_help",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "SIGNATURE_HELP_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_document_highlights ─────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/document-highlights") {
      const correlationId = `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const body = await readJsonBody(req);
        const filePath = typeof body.filePath === "string" ? body.filePath : "untitled";
        const line = typeof body.line === "number" ? body.line : 1;
        const column = typeof body.column === "number" ? body.column : 1;
        const content = typeof body.content === "string" ? body.content : "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_document_highlights",
          correlationId,
          summary: `Document highlights at ${filePath}:${line}:${column}`,
        });

        const lines = content.split("\n");
        const currentLine = lines[line - 1] ?? "";
        const before = currentLine.substring(0, column - 1);
        const wordStart = before.search(/[\w$]+$/);
        const fromStart = wordStart >= 0 ? wordStart : column - 1;
        const wordMatch = currentLine.substring(fromStart).match(/^[\w$]+/);
        const symbol = wordMatch?.[0] ?? "";

        if (!symbol) {
          traceService.emit({
            type: "tool_succeeded",
            toolId: "canon_document_highlights",
            correlationId,
            summary: "No symbol at cursor",
          });
          writeJson(res, 200, { highlights: [], symbol: "" });
          return;
        }

        const highlights = [];
        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`\\b${escaped}\\b`, "g");
        const writePatterns = [
          new RegExp(`\\b${escaped}\\s*=[^=]`),
          new RegExp(`(const|let|var|function)\\s+${escaped}\\b`),
        ];

        for (let i = 0; i < lines.length; i++) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(lines[i])) !== null) {
            const isWrite = writePatterns.some((wp) => wp.test(lines[i]));
            highlights.push({
              line: i + 1,
              column: match.index + 1,
              endLine: i + 1,
              endColumn: match.index + 1 + symbol.length,
              kind: isWrite ? "write" : "read",
            });
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_document_highlights",
          correlationId,
          summary: `Found ${highlights.length} highlights for "${symbol}"`,
        });
        writeJson(res, 200, { highlights, symbol });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_document_highlights",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "DOCUMENT_HIGHLIGHTS_FAILED", message: err?.message ?? String(err) });
      }
      return;
    }

    // ── canon_git_diff ────────────────────────────────────────
    if (method === "POST" && pathname === "/pilot/canon/git-diff") {
      const correlationId = `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const body = await readJsonBody(req);
        const filePath = typeof body.filePath === "string" ? body.filePath : "untitled";
        const content = typeof body.content === "string" ? body.content : "";
        const originalContent = typeof body.originalContent === "string" ? body.originalContent : "";

        traceService.emit({
          type: "tool_invoked",
          toolId: "canon_git_diff",
          correlationId,
          summary: `Git diff for ${filePath}`,
        });

        const currentLines = content.split("\n");
        const originalLines = originalContent.split("\n");
        const changes = [];
        const maxLen = Math.max(currentLines.length, originalLines.length);

        for (let i = 0; i < maxLen; i++) {
          const orig = originalLines[i];
          const curr = currentLines[i];
          if (orig === undefined && curr !== undefined) {
            changes.push({ line: i + 1, type: "added" });
          } else if (orig !== undefined && curr === undefined) {
            changes.push({ line: i + 1, type: "deleted" });
          } else if (orig !== curr) {
            changes.push({ line: i + 1, type: "modified" });
          }
        }

        traceService.emit({
          type: "tool_succeeded",
          toolId: "canon_git_diff",
          correlationId,
          summary: `Diff: +${changes.filter(c => c.type === "added").length} ~${changes.filter(c => c.type === "modified").length} -${changes.filter(c => c.type === "deleted").length}`,
        });
        writeJson(res, 200, {
          changes,
          filePath,
          linesAdded: changes.filter(c => c.type === "added").length,
          linesDeleted: changes.filter(c => c.type === "deleted").length,
          linesModified: changes.filter(c => c.type === "modified").length,
        });
      } catch (err) {
        traceService.emit({
          type: "tool_failed",
          toolId: "canon_git_diff",
          correlationId,
          summary: err?.message ?? String(err),
        });
        writeJson(res, 500, { error: "GIT_DIFF_FAILED", message: err?.message ?? String(err) });
      }
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
