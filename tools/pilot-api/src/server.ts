/**
 * @terrafusion/pilot-api - HTTP bridge for ToolRunner
 *
 * Port: 3333 (configurable via PILOT_API_PORT)
 * Base: /api
 *
 * Endpoints:
 *   POST /api/tools/execute - Execute tool with Gate 3-6 enforcement
 *   GET  /api/tools         - List available tools
 *   GET  /health            - Health check (no auth)
 *
 * Context: Derived from headers (dev stub) or JWT (production)
 *   x-user-id, x-county-id, x-permissions (comma-sep), x-role, x-mode
 */

import {
    ToolRegistry,
    ToolRunner,
    registerDefaultTools,
    type PilotContext,
} from '@terrafusion/os-core';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';

// ════════════════════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════════════════════

const PORT = parseInt(process.env.PILOT_API_PORT || '3333', 10);
const isDev = process.env.NODE_ENV !== 'production';

// ════════════════════════════════════════════════════════════════════════════
// Initialize services (ToolRegistry is a singleton, ToolRunner is static)
// ════════════════════════════════════════════════════════════════════════════

registerDefaultTools();

// ════════════════════════════════════════════════════════════════════════════
// Express app
// ════════════════════════════════════════════════════════════════════════════

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: isDev ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST'],
  })
);
app.use(express.json({ limit: '1mb' }));

// ════════════════════════════════════════════════════════════════════════════
// Context middleware: headers → PilotContext
// ════════════════════════════════════════════════════════════════════════════

interface AuthenticatedRequest extends Request {
  pilotContext: PilotContext;
}

const contextSchema = z.object({
  userId: z.string().min(1),
  countyId: z.string().min(1),
  role: z.string().default('analyst'),
  permissions: z.string().default(''),
  mode: z.enum(['pilot', 'muse']).default('pilot'),
  parcelId: z.string().optional(),
});

function deriveContext(req: Request, res: Response, next: NextFunction): void {
  // Dev stub: if no headers and isDev, use defaults
  const rawUserId = req.headers['x-user-id'] as string | undefined;
  const rawCountyId = req.headers['x-county-id'] as string | undefined;
  const rawRole = req.headers['x-role'] as string | undefined;
  const rawPermissions = req.headers['x-permissions'] as string | undefined;
  const rawMode = req.headers['x-mode'] as string | undefined;
  const rawParcelId = req.headers['x-parcel-id'] as string | undefined;

  // Dev fallback
  if (isDev && !rawUserId && !rawCountyId) {
    (req as AuthenticatedRequest).pilotContext = {
      userId: 'dev-user',
      userRole: 'analyst',
      permissions: ['atlas:read', 'dais:read', 'forge:read'],
      activeMode: 'pilot',
      countyId: 'benton',
    };
    return next();
  }

  // Parse and validate
  const parsed = contextSchema.safeParse({
    userId: rawUserId,
    countyId: rawCountyId,
    role: rawRole,
    permissions: rawPermissions,
    mode: rawMode,
    parcelId: rawParcelId,
  });

  if (!parsed.success) {
    res.status(401).json({
      error: 'Missing or invalid context headers',
      required: ['x-user-id', 'x-county-id'],
      optional: ['x-role', 'x-permissions', 'x-mode', 'x-parcel-id'],
    });
    return;
  }

  const { userId, countyId, role, permissions, mode, parcelId } = parsed.data;

  (req as AuthenticatedRequest).pilotContext = {
    userId,
    userRole: role,
    permissions: permissions ? permissions.split(',').map(p => p.trim()) : [],
    activeMode: mode,
    countyId,
    parcelId,
  };

  next();
}

// ════════════════════════════════════════════════════════════════════════════
// Routes
// ════════════════════════════════════════════════════════════════════════════

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: '@terrafusion/pilot-api',
    toolCount: ToolRegistry.count(),
    timestamp: new Date().toISOString(),
  });
});

// List tools
app.get('/api/tools', deriveContext, (req, res) => {
  const ctx = (req as AuthenticatedRequest).pilotContext;
  const tools = ToolRegistry.list();

  // Filter to tools user has permission for
  const filtered = tools.filter(t =>
    ctx.permissions.some(p => t.requiredPermissions.includes(p) || p === '*')
  );

  res.json({
    tools: filtered.map(t => ({
      id: t.id,
      suite: t.suite,
      risk: t.risk,
      requiredPermissions: t.requiredPermissions,
    })),
    count: filtered.length,
  });
});

// Execute tool (Gate 3-6 enforcement)
const executeSchema = z.object({
  toolName: z.string().min(1),
  input: z.record(z.unknown()).optional().default({}),
});

app.post('/api/tools/execute', deriveContext, async (req, res) => {
  const ctx = (req as AuthenticatedRequest).pilotContext;

  const parsed = executeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    });
    return;
  }

  const { toolName, input } = parsed.data;

  try {
    // Get tool definition from registry
    const tool = ToolRegistry.get(toolName);
    // Execute through ToolRunner (static method)
    const result = await ToolRunner.execute(tool, input, ctx);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Map error to HTTP status
    if (message.includes('Unknown tool') || message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('Permission Denied') || message.includes('forbidden')) {
      res.status(403).json({ error: message });
    } else if (message.includes('Risk Gate') || message.includes('BLOCKED')) {
      res.status(403).json({ error: message });
    } else if (message.includes('Lane Violation')) {
      res.status(403).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Error handler
// ════════════════════════════════════════════════════════════════════════════

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[pilot-api] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ════════════════════════════════════════════════════════════════════════════
// Start server
// ════════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`[pilot-api] 🚀 TerraFusion Pilot API on http://localhost:${PORT}`);
  console.log(`[pilot-api] 📋 ${ToolRegistry.count()} tools registered`);
  console.log(`[pilot-api] 🔒 Gate 3-6 enforcement active`);
  if (isDev) {
    console.log(`[pilot-api] ⚠️  DEV MODE: header-based context (x-user-id, x-county-id, etc.)`);
  }
});

export { app };
