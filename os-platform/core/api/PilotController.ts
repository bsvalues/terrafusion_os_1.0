/**
 * TerraFusion OS - Pilot API Adapter
 *
 * Single choke point for all tool invocations.
 * All tool calls MUST route through this adapter.
 *
 * HARD RULE: If a PR adds a new tool call path, it must use this adapter or it doesn't merge.
 */

import { randomUUID } from 'crypto';
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
