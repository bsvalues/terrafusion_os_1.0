/**
 * TerraFusion OS - Pilot API Adapter
 *
 * Single choke point for all tool invocations.
 * All tool calls MUST route through this adapter.
 *
 * HARD RULE: If a PR adds a new tool call path, it must use this adapter or it doesn't merge.
 */

import { randomUUID } from 'crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextFunction, Request, Response, Router } from 'express';
import { toolRegistry, ToolRunner, toolRunner } from '../pilot/index.js';
import {
    createMetricsService,
    getMetricsService,
    type TimeWindow,
} from '../trace/MetricsService.js';
import {
    canViewCorrelation,
    filterVisibleTraceEvents,
    hasElevatedTraceRole,
    recordAccessDenied,
    type TraceAccessPrincipal,
} from '../trace/TraceAccessControl.js';
import { traceService } from '../trace/index.js';
import type { Mode, ToolExecutionContext, ToolExecutionInput } from '../types/index.js';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface PilotInvokeRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: Mode;
  parcelId?: string;
  dossierId?: string;
  confirmation?: boolean;
  reasonCode?: string;
  supervisorApproval?: {
    approvedBy: string;
    role: string;
  };
}

export interface PilotInvokeResponse {
  ok: boolean;
  correlationId: string;
  result?: unknown;
  error?: string;
  errorCode?: string;
  traceEventId?: string;
}

export interface PilotValidateRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: Mode;
  confirmation?: boolean;
  reasonCode?: string;
}

export interface PilotValidateResponse {
  valid: boolean;
  violations: string[];
  tool?: {
    toolId: string;
    suite: string;
    risk: string;
    requiresConfirmation?: boolean;
    reasonCodes?: string[];
  };
}

interface CanonPingRequest {
  echo?: string;
}

interface WorkbenchExplainModelInputsRequest {
  echo?: string;
}

interface WorkbenchCompareAssessedValueHistoryInput {
  county?: unknown;
  parcelId?: unknown;
  years?: unknown;
  includeBreakdown?: unknown;
}

interface WorkbenchCompareAssessedValueHistoryRequest {
  input?: WorkbenchCompareAssessedValueHistoryInput;
}

const DEFAULT_COMPARE_HISTORY_INPUT = {
  county: 'benton',
  parcelId: 'P-300',
  years: [2024, 2022, 2023] as number[],
  includeBreakdown: false,
};

interface CanonCommandResponse {
  tool: string;
  version: number;
  startedAt: string;
  dryRun: boolean;
  overallOk: boolean;
  error?: string;
  stderr?: string;
  rawStdout?: string;
  rawStderr?: string;
  normalized?: unknown;
  raw?: unknown;
}

const MAX_CANON_ECHO_LENGTH = 160;
const CANON_COMMAND_TIMEOUT_MS = 10_000;

const SAFE_CANON_ENV_KEYS = [
  'PATH',
  'SystemRoot',
  'ComSpec',
  'HOME',
  'USERPROFILE',
  'PNPM_HOME',
  'TEMP',
  'TMP',
  'NODE_OPTIONS',
];

function resolvePnpmCommand(): string {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function normalizeEcho(value: unknown): string {
  if (typeof value !== 'string') return 'hello';
  const trimmed = value.trim();
  if (!trimmed) return 'hello';
  return trimmed.slice(0, MAX_CANON_ECHO_LENGTH);
}

function normalizeCompareAssessedValueHistoryInput(
  body: WorkbenchCompareAssessedValueHistoryRequest | undefined
): { params?: Record<string, unknown>; error?: string } {
  const base = {
    county: DEFAULT_COMPARE_HISTORY_INPUT.county,
    parcelId: DEFAULT_COMPARE_HISTORY_INPUT.parcelId,
    years: [...DEFAULT_COMPARE_HISTORY_INPUT.years],
    includeBreakdown: DEFAULT_COMPARE_HISTORY_INPUT.includeBreakdown,
  };

  if (!body || body.input === undefined || body.input === null) {
    return { params: base };
  }

  const input = body.input;
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'input must be an object' };
  }

  let serialized = '';
  try {
    serialized = JSON.stringify(input);
  } catch {
    return { error: 'input must be JSON-serializable' };
  }
  if (serialized.length > 2_000) {
    return { error: 'input payload too large (max 2000 chars)' };
  }

  const source = input as Record<string, unknown>;
  const allowedKeys = new Set(['county', 'parcelId', 'years', 'includeBreakdown']);
  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key)) {
      return { error: `input contains unsupported key: ${key}` };
    }
  }

  if ('county' in source) {
    if (typeof source.county !== 'string' || !source.county.trim()) {
      return { error: 'input.county must be a non-empty string' };
    }
    base.county = source.county.trim().toLowerCase();
  }

  if ('parcelId' in source) {
    if (typeof source.parcelId !== 'string' || !source.parcelId.trim()) {
      return { error: 'input.parcelId must be a non-empty string' };
    }
    base.parcelId = source.parcelId.trim().slice(0, 128);
  }

  if ('years' in source) {
    if (!Array.isArray(source.years) || source.years.length === 0 || source.years.length > 8) {
      return { error: 'input.years must be an array of 1-8 years' };
    }
    const parsedYears = source.years.map((value) => Number(value));
    if (parsedYears.some((year) => !Number.isInteger(year) || year < 1900 || year > 2100)) {
      return { error: 'input.years must contain valid integer years' };
    }
    base.years = parsedYears;
  }

  if ('includeBreakdown' in source) {
    if (typeof source.includeBreakdown !== 'boolean') {
      return { error: 'input.includeBreakdown must be boolean' };
    }
    base.includeBreakdown = source.includeBreakdown;
  }

  return { params: base };
}

function defaultToolForCommand(commandLabel: string): string {
  if (commandLabel === 'canon:ping') return 'terracanon-ping';
  if (commandLabel === 'canon:doctor') return 'terracanon-doctor';
  if (commandLabel === 'canon:gatefast') return 'terracanon-gatefast';
  return 'terracanon-canon-command';
}

function parseCanonCommandResponse(
  commandLabel: string,
  stdout: string,
  stderr: string,
  exitCode: number
): CanonCommandResponse {
  const startedAt = new Date().toISOString();
  const trimmed = stdout.trim();
  if (!trimmed) {
    return {
      tool: defaultToolForCommand(commandLabel),
      version: 1,
      startedAt,
      dryRun: false,
      overallOk: false,
      error: `${commandLabel} produced no JSON output (exit ${exitCode})`,
      stderr: stderr.trim(),
      rawStdout: stdout,
      rawStderr: stderr,
      normalized: null,
      raw: null,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<CanonCommandResponse>;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('payload is not an object');
    }

    const normalized: CanonCommandResponse = {
      tool: typeof parsed.tool === 'string' ? parsed.tool : defaultToolForCommand(commandLabel),
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : startedAt,
      dryRun: typeof parsed.dryRun === 'boolean' ? parsed.dryRun : false,
      overallOk: typeof parsed.overallOk === 'boolean' ? parsed.overallOk : exitCode === 0,
      error: typeof parsed.error === 'string' ? parsed.error : undefined,
      stderr: typeof parsed.stderr === 'string' ? parsed.stderr : undefined,
      rawStdout: typeof parsed.rawStdout === 'string' ? parsed.rawStdout : undefined,
      rawStderr: typeof parsed.rawStderr === 'string' ? parsed.rawStderr : undefined,
      normalized: parsed.normalized,
      raw: parsed.raw,
    };

    const withExitState =
      exitCode === 0
        ? normalized
        : {
            ...normalized,
            overallOk: false,
            error: normalized.error || `${commandLabel} exited with code ${exitCode}`,
          };

    if (stderr.trim()) {
      return { ...withExitState, stderr: withExitState.stderr || stderr.trim() };
    }

    return withExitState;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      tool: defaultToolForCommand(commandLabel),
      version: 1,
      startedAt,
      dryRun: false,
      overallOk: false,
      error: `${commandLabel} returned invalid JSON: ${message}`,
      stderr: stderr.trim(),
      rawStdout: stdout,
      rawStderr: stderr,
      normalized: null,
      raw: null,
    };
  }
}

function runCanonCommand(
  commandLabel: string,
  commandArgs: string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const canonEnv: Record<string, string> = {};
    for (const key of SAFE_CANON_ENV_KEYS) {
      const value = process.env[key];
      if (typeof value === 'string') {
        canonEnv[key] = value;
      }
    }
    canonEnv.TF_CANON_ADAPTER = '1';

    const child = spawn(resolvePnpmCommand(), commandArgs, {
      cwd: path.resolve(process.cwd()),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: canonEnv,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      child.kill();
      settled = true;
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${commandLabel} timed out after ${CANON_COMMAND_TIMEOUT_MS}ms`,
      });
    }, CANON_COMMAND_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
      });
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

// ============================================================================
// Auth Context Extraction (stub - integrate with actual auth)
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    roles: string[];
    countyId: string;
  };
}

function extractContext(req: AuthenticatedRequest, body: PilotInvokeRequest): ToolExecutionContext {
  // In production, this comes from JWT/session
  const user = req.user ?? {
    userId: 'anonymous',
    roles: ['viewer'],
    countyId: 'benton', // Default county for dev
  };

  const context: ToolExecutionContext = {
    countyId: user.countyId,
    userId: user.userId,
    roles: user.roles,
    mode: body.mode ?? 'pilot',
    parcelId: body.parcelId,
    dossierId: body.dossierId,
    confirmation: body.confirmation,
    reasonCode: body.reasonCode,
  };

  // Handle supervisor approval
  if (body.supervisorApproval) {
    context.supervisorApproval = {
      approvedBy: body.supervisorApproval.approvedBy,
      approvedAt: new Date().toISOString(),
      role: body.supervisorApproval.role,
    };
  }

  return context;
}

// ============================================================================
// Pilot Router (Express)
// ============================================================================

export function createPilotRouter(runner?: ToolRunner): Router {
  const router = Router();
  const effectiveRunner = runner ?? toolRunner;

  // Initialize metrics service (singleton)
  if (!getMetricsService()) {
    createMetricsService(traceService);
  }

  /**
   * POST /pilot/invoke
   *
   * The ONLY way to invoke a tool. All other paths are forbidden.
   */
  router.post('/invoke', async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as PilotInvokeRequest;

    // Validate request
    if (!body.toolId) {
      return res.status(400).json({
        ok: false,
        correlationId: randomUUID(),
        error: 'toolId is required',
        errorCode: 'INVALID_REQUEST',
      } satisfies PilotInvokeResponse);
    }

    // Build context from auth + request
    const context = extractContext(req, body);

    // Execute through ToolRunner (the only path)
    const input: ToolExecutionInput = {
      toolId: body.toolId,
      params: body.params ?? {},
      context,
    };

    const result = await effectiveRunner.execute(input);

    // Map to response
    const response: PilotInvokeResponse = {
      ok: result.ok,
      correlationId: result.correlationId,
    };

    if (result.ok) {
      response.result = result.result;
      response.traceEventId = result.traceEventId;
    } else {
      response.error = result.error;
      response.errorCode = result.errorCode;
    }

    return res.status(result.ok ? 200 : 400).json(response);
  });

  /**
   * POST /pilot/validate
   *
   * Pre-flight check: validates a tool invocation without executing.
   * Use this to show confirmation dialogs before write_high actions.
   */
  router.post('/validate', async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as PilotValidateRequest;

    if (!body.toolId) {
      return res.status(400).json({
        valid: false,
        violations: ['toolId is required'],
      } satisfies PilotValidateResponse);
    }

    const context = extractContext(req, {
      ...body,
      params: body.params ?? {},
    });

    const input: ToolExecutionInput = {
      toolId: body.toolId,
      params: body.params ?? {},
      context,
    };

    const { valid, violations } = effectiveRunner.validate(input);

    // Get tool info for UI
    const tool = toolRegistry.getTool(body.toolId);

    const response: PilotValidateResponse = {
      valid,
      violations,
    };

    if (tool) {
      response.tool = {
        toolId: tool.toolId,
        suite: tool.suite,
        risk: tool.risk,
        requiresConfirmation: tool.requiresConfirmation,
        reasonCodes: tool.reasonCodes,
      };
    }

    return res.status(200).json(response);
  });

  /**
   * GET /pilot/tools
   *
   * List available tools (filtered by mode).
   */
  router.get('/tools', (req: Request, res: Response) => {
    const mode = (req.query.mode as Mode) || undefined;

    let tools = toolRegistry.listTools();
    if (mode) {
      tools = tools.filter(t => t.mode === mode);
    }

    return res.json({
      count: tools.length,
      tools: tools.map(t => ({
        toolId: t.toolId,
        displayName: t.displayName,
        suite: t.suite,
        mode: t.mode,
        risk: t.risk,
        description: t.description,
        requiresConfirmation: t.requiresConfirmation,
        reasonCodes: t.reasonCodes,
      })),
    });
  });

  /**
   * GET /pilot/tools/:toolId
   *
   * Get a specific tool definition.
   */
  router.get('/tools/:toolId', (req: Request, res: Response) => {
    const tool = toolRegistry.getTool(req.params.toolId);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    return res.json(tool);
  });

  /**
   * GET /pilot/traces
   *
   * List trace events with parcel-scoped filtering and date range.
   * Newest-first ordering with offset/limit pagination.
   *
   * Query params:
   *   - parcelId (required) — scope to a single parcel
   *   - toolId (optional)   — filter by tool
   *   - from (optional)     — ISO 8601 lower bound (inclusive)
   *   - to (optional)       — ISO 8601 upper bound (inclusive)
   *   - limit (optional)    — page size, default 50, max 200
   *   - offset (optional)   — pagination offset, default 0
   *
   * ACCESS RULES: same county isolation as /trace/:correlationId.
   */
  router.get('/traces', async (req: AuthenticatedRequest, res: Response) => {
    const parcelId = req.query.parcelId as string | undefined;
    if (!parcelId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'parcelId query parameter is required',
      });
    }

    // Parse and validate limit
    const rawLimit = req.query.limit as string | undefined;
    const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit, 10) || 50), 200) : 50;

    // Parse and validate offset
    const rawOffset = req.query.offset as string | undefined;
    const offset = rawOffset ? Math.max(0, parseInt(rawOffset, 10) || 0) : 0;

    // Parse date bounds
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    if (from && isNaN(new Date(from).getTime())) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'from must be a valid ISO 8601 timestamp',
      });
    }
    if (to && isNaN(new Date(to).getTime())) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'to must be a valid ISO 8601 timestamp',
      });
    }
    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'from must not be after to',
      });
    }

    const toolId = req.query.toolId as string | undefined;

    // Default from=now-30d when no date bounds specified (retention window)
    const effectiveFrom = from || (to ? undefined : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Build access principal from auth context
    const user = req.user ?? {
      userId: 'anonymous',
      roles: ['viewer'],
      countyId: 'benton',
    };

    const principal: TraceAccessPrincipal = {
      userId: user.userId,
      roles: user.roles,
      countyId: user.countyId,
    };

    // Audit: emit trace_accessed event for this request
    // NOTE: parcelId intentionally omitted from context to prevent audit events
    // from appearing in parcel-scoped queries (avoids audit noise in feed)
    const accessCorrelationId = `trace-list-${randomUUID().slice(0, 8)}`;
    traceService.emit({
      type: 'trace_accessed',
      toolId: 'pilot:traces:list',
      correlationId: accessCorrelationId,
      summary: `Trace list accessed: parcelId=${parcelId}`,
      context: {
        countyId: principal.countyId,
        userId: principal.userId,
        sessionId: '',
        mode: 'pilot',
      },
    });

    // Query trace events (async path for persistent store)
    const events = await traceService.queryAsync({
      parcelId,
      toolId,
      from: effectiveFrom || undefined,
      to: to || undefined,
      limit,
      offset,
    });

    // Filter by county isolation + access control
    let filteredCount = 0;
    const visibleEvents = events.filter(e => {
      // Always deny cross-county
      if (e.context.countyId.toLowerCase() !== principal.countyId.toLowerCase()) {
        recordAccessDenied('cross_county');
        filteredCount++;
        return false;
      }
      // Elevated roles see all in-county; others only own
      if (hasElevatedTraceRole(principal)) return true;
      if (e.context.userId !== principal.userId) {
        recordAccessDenied('user_mismatch');
        filteredCount++;
        return false;
      }
      return true;
    });

    // Audit: emit permission_denied if events were filtered out
    if (filteredCount > 0) {
      traceService.emit({
        type: 'permission_denied',
        toolId: 'pilot:traces:list',
        correlationId: accessCorrelationId,
        summary: `Trace list: ${filteredCount} event(s) filtered by access control`,
        context: {
          countyId: principal.countyId,
          userId: principal.userId,
          sessionId: '',
          mode: 'pilot',
        },
      });
    }

    return res.json({
      events: visibleEvents,
      pagination: { offset, limit, returned: visibleEvents.length },
      nextCursor: null, // Reserved for future cursor-based pagination
    });
  });

  /**
   * GET /pilot/traces/stats
   *
   * Trace store statistics for operability dashboards.
   * Returns total event count, oldest/newest timestamps.
   * Requires elevated trace role (admin, compliance_officer).
   */
  router.get('/traces/stats', async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user ?? {
      userId: 'anonymous',
      roles: ['viewer'],
      countyId: 'benton',
    };

    const principal: TraceAccessPrincipal = {
      userId: user.userId,
      roles: user.roles,
      countyId: user.countyId,
    };

    if (!hasElevatedTraceRole(principal)) {
      traceService.emit({
        type: 'permission_denied',
        toolId: 'pilot:traces:stats',
        correlationId: `trace-stats-${randomUUID().slice(0, 8)}`,
        summary: `Trace stats access denied: user=${principal.userId}`,
        context: {
          countyId: principal.countyId,
          userId: principal.userId,
          sessionId: '',
          mode: 'pilot',
        },
      });
      recordAccessDenied('user_mismatch');
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Trace stats require elevated role',
      });
    }

    // Audit: emit trace_accessed for stats
    traceService.emit({
      type: 'trace_accessed',
      toolId: 'pilot:traces:stats',
      correlationId: `trace-stats-${randomUUID().slice(0, 8)}`,
      summary: `Trace stats accessed by ${principal.userId}`,
      context: {
        countyId: principal.countyId,
        userId: principal.userId,
        sessionId: '',
        mode: 'pilot',
      },
    });

    const stats = await traceService.stats();
    return res.json(stats);
  });

  /**
   * GET /pilot/trace/:correlationId
   *
   * Get trace events for a tool invocation.
   *
   * ACCESS RULES (Phase 7.1):
   *   - Default: user can only see their own traces (actor.userId === me)
   *   - Elevated roles (admin, compliance_officer): can see any trace in same countyId
   *   - Always deny cross-county trace access
   *   - Return 403 if user has no access (don't leak existence via 404)
   */
  router.get('/trace/:correlationId', (req: AuthenticatedRequest, res: Response) => {
    // Build access principal from auth context
    const user = req.user ?? {
      userId: 'anonymous',
      roles: ['viewer'],
      countyId: 'benton',
    };

    const principal: TraceAccessPrincipal = {
      userId: user.userId,
      roles: user.roles,
      countyId: user.countyId,
    };

    // Get all events for this correlation
    const allEvents = traceService.getByCorrelationId(req.params.correlationId);

    // Check if principal can view any events in this correlation
    if (!canViewCorrelation(principal, allEvents)) {
      // Determine which rule was violated for metrics
      if (allEvents.length > 0) {
        const firstEvent = allEvents[0];
        if (firstEvent.context.countyId.toLowerCase() !== principal.countyId.toLowerCase()) {
          recordAccessDenied('cross_county');
        } else {
          recordAccessDenied('user_mismatch');
        }
      }

      return res.status(403).json({
        error: 'TRACE_ACCESS_DENIED',
        message: 'You do not have permission to view this trace',
      });
    }

    // Filter to only events the principal can access
    const visibleEvents = filterVisibleTraceEvents(principal, allEvents);

    return res.json({ events: visibleEvents });
  });

  /**
   * GET /pilot/health
   *
   * Health check for the Pilot service.
   */
  router.get('/health', (req: Request, res: Response) => {
    return res.json({
      status: 'operational',
      service: 'terra-pilot',
      registryVersion: toolRegistry.getVersion(),
      toolCount: toolRegistry.listTools().length,
      traceEventCount: traceService.getEventCount(),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * POST /pilot/canon/ping
   *
   * Local adapter endpoint that executes `pnpm canon:ping --json`.
   * Returns the canon wrapper payload directly for deterministic UI rendering.
   */
  router.post('/canon/ping', async (req: Request, res: Response) => {
    const body = (req.body as CanonPingRequest) || {};
    const echo = normalizeEcho(body.echo);
    const { exitCode, stdout, stderr } = await runCanonCommand('canon:ping', [
      'canon:ping',
      '--json',
      '--echo',
      echo,
    ]);
    const payload = parseCanonCommandResponse('canon:ping', stdout, stderr, exitCode);
    return res.status(200).json(payload);
  });

  /**
   * POST /pilot/canon/doctor
   *
   * Local adapter endpoint that executes `pnpm canon:doctor --json`.
   */
  router.post('/canon/doctor', async (_req: Request, res: Response) => {
    const { exitCode, stdout, stderr } = await runCanonCommand('canon:doctor', [
      'canon:doctor',
      '--json',
    ]);
    const payload = parseCanonCommandResponse('canon:doctor', stdout, stderr, exitCode);
    return res.status(200).json(payload);
  });

  /**
   * POST /pilot/canon/gatefast
   *
   * Local adapter endpoint that executes `pnpm canon:gatefast --json`.
   */
  router.post('/canon/gatefast', async (_req: Request, res: Response) => {
    const { exitCode, stdout, stderr } = await runCanonCommand('canon:gatefast', [
      'canon:gatefast',
      '--json',
    ]);
    const payload = parseCanonCommandResponse('canon:gatefast', stdout, stderr, exitCode);
    return res.status(200).json(payload);
  });

  /**
   * POST /pilot/workbench/explain-model-inputs
   *
   * Local adapter endpoint that executes `pnpm canon:ping --json --echo <value>`.
   * This is the minimal read-only Workbench action surface.
   */
  router.post('/workbench/explain-model-inputs', async (req: Request, res: Response) => {
    const body = (req.body as WorkbenchExplainModelInputsRequest) || {};
    const echo = normalizeEcho(body.echo);
    const { exitCode, stdout, stderr } = await runCanonCommand('canon:ping', [
      'canon:ping',
      '--json',
      '--echo',
      echo,
    ]);
    const payload = parseCanonCommandResponse('canon:ping', stdout, stderr, exitCode);
    return res.status(200).json(payload);
  });

  /**
   * POST /pilot/workbench/compare-assessed-value-history
   *
   * Local adapter endpoint for read-only Workbench action.
   * Executes compare_assessed_value_history through ToolRunner with deterministic defaults.
   */
  router.post(
    '/workbench/compare-assessed-value-history',
    async (req: AuthenticatedRequest, res: Response) => {
      const startedAt = new Date().toISOString();
      const normalizedRequest = normalizeCompareAssessedValueHistoryInput(
        req.body as WorkbenchCompareAssessedValueHistoryRequest
      );

      if (!normalizedRequest.params) {
        return res.status(200).json({
          tool: 'compare_assessed_value_history',
          version: 1,
          startedAt,
          dryRun: false,
          overallOk: false,
          error: normalizedRequest.error || 'invalid input',
          normalized: null,
          raw: null,
        });
      }

      const user = req.user ?? {
        userId: 'anonymous',
        roles: ['viewer'],
        countyId: 'benton',
      };

      const context: ToolExecutionContext = {
        countyId: user.countyId,
        userId: user.userId,
        roles: user.roles,
        mode: 'muse',
      };

      const result = await effectiveRunner.execute({
        toolId: 'compare_assessed_value_history',
        params: normalizedRequest.params,
        context,
      });

      if (result.ok) {
        return res.status(200).json({
          tool: 'compare_assessed_value_history',
          version: 1,
          startedAt,
          dryRun: false,
          overallOk: true,
          normalized: result.result,
          raw: {
            correlationId: result.correlationId,
            traceEventId: result.traceEventId,
          },
        });
      }

      return res.status(200).json({
        tool: 'compare_assessed_value_history',
        version: 1,
        startedAt,
        dryRun: false,
        overallOk: false,
        error: result.error || 'compare_assessed_value_history failed',
        rawStderr: result.errorCode ? String(result.errorCode) : undefined,
        raw: {
          correlationId: result.correlationId,
          errorCode: result.errorCode,
        },
      });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNANCE DASHBOARD ENDPOINTS (Phase 7.4)
  // Role-gated: only elevated roles (admin, compliance_officer, auditor, supervisor)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /pilot/metrics/summary
   *
   * Get GovernanceLock metrics summary.
   *
   * Query params:
   *   - window: '1h' | '24h' | '7d' | '30d' (default: '24h')
   *
   * ACCESS RULES:
   *   - 403 for non-elevated roles
   *   - Always scoped to user's countyId
   */
  router.get('/metrics/summary', (req: AuthenticatedRequest, res: Response) => {
    const user = req.user ?? {
      userId: 'anonymous',
      roles: ['viewer'],
      countyId: 'benton',
    };

    const principal: TraceAccessPrincipal = {
      userId: user.userId,
      roles: user.roles,
      countyId: user.countyId,
    };

    // Role gate: only elevated roles can view dashboard
    if (!hasElevatedTraceRole(principal)) {
      return res.status(403).json({
        error: 'DASHBOARD_ACCESS_DENIED',
        message:
          'Dashboard access requires elevated role (admin, compliance_officer, auditor, supervisor)',
      });
    }

    const metricsService = getMetricsService();
    if (!metricsService) {
      return res.status(503).json({
        error: 'METRICS_UNAVAILABLE',
        message: 'Metrics service not initialized',
      });
    }

    // Parse window param
    const windowParam = req.query.window as string;
    const validWindows: TimeWindow[] = ['1h', '24h', '7d', '30d'];
    const window: TimeWindow = validWindows.includes(windowParam as TimeWindow)
      ? (windowParam as TimeWindow)
      : '24h';

    // Get summary scoped to user's county
    const summary = metricsService.getSummary(window, principal.countyId);

    return res.json(summary);
  });

  /**
   * GET /pilot/metrics/high-risk
   *
   * Get recent high-risk activity feed.
   *
   * Query params:
   *   - limit: number (default: 50, max: 200)
   *
   * ACCESS RULES:
   *   - 403 for non-elevated roles
   *   - Always scoped to user's countyId
   */
  router.get('/metrics/high-risk', (req: AuthenticatedRequest, res: Response) => {
    const user = req.user ?? {
      userId: 'anonymous',
      roles: ['viewer'],
      countyId: 'benton',
    };

    const principal: TraceAccessPrincipal = {
      userId: user.userId,
      roles: user.roles,
      countyId: user.countyId,
    };

    // Role gate
    if (!hasElevatedTraceRole(principal)) {
      return res.status(403).json({
        error: 'DASHBOARD_ACCESS_DENIED',
        message: 'Dashboard access requires elevated role',
      });
    }

    const metricsService = getMetricsService();
    if (!metricsService) {
      return res.status(503).json({
        error: 'METRICS_UNAVAILABLE',
        message: 'Metrics service not initialized',
      });
    }

    // Parse limit param
    const limitParam = parseInt(req.query.limit as string, 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 200);

    // Get feed scoped to user's county
    const feed = metricsService.getHighRiskFeed(limit, principal.countyId);

    return res.json(feed);
  });

  return router;
}

// ============================================================================
// Middleware: Reject Non-Pilot Tool Calls
// ============================================================================

/**
 * Middleware that rejects any attempt to invoke tools outside the Pilot path.
 * Add this to routes that might be tempted to call tools directly.
 */
export function rejectDirectToolCalls(req: Request, res: Response, next: NextFunction): void {
  // Check for suspicious patterns in request body
  const body = req.body;
  if (body && typeof body === 'object') {
    const suspicious = ['toolId', 'execute_tool', 'run_tool', 'invoke_tool'];
    for (const key of suspicious) {
      if (key in body) {
        return res.status(403).json({
          error: 'Direct tool invocation is forbidden',
          message: 'All tool calls must go through POST /pilot/invoke',
          violatedRule: 'GovernanceLock: Single execution path',
        }) as unknown as void;
      }
    }
  }
  next();
}

// ============================================================================
// Default Export
// ============================================================================

export default createPilotRouter;
