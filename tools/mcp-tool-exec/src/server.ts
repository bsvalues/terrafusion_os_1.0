#!/usr/bin/env node
/**
 * TerraFusion MCP Tool Executor
 *
 * Runtime enforcement gateway for all TerraFusion tools.
 * Routes tool calls through ToolRunner for permission/risk/lane enforcement.
 *
 * Usage:
 *   pnpm -C tools/mcp-tool-exec dev
 *
 * MCP Tool:
 *   terrafusion.executeTool({ toolId, params, context })
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
    ToolRegistry,
    ToolRunner,
    registerDefaultTools,
    type PilotContext,
} from '@terrafusion/os-core';

// Register demo tools on startup
registerDefaultTools();

// Create MCP server
const server = new Server(
  {
    name: 'terrafusion-tool-exec',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = ToolRegistry.list();

  return {
    tools: [
      {
        name: 'terrafusion.executeTool',
        description:
          'Execute a registered TerraFusion tool through the runtime enforcement layer (ToolRunner). Enforces permissions, risk gates, and lane isolation.',
        inputSchema: {
          type: 'object',
          properties: {
            toolId: {
              type: 'string',
              description: `Tool ID to execute. Available: ${tools.map(t => t.id).join(', ')}`,
            },
            params: {
              type: 'object',
              description:
                'Parameters to pass to the tool handler. For write_high/irreversible risk tools, include _confirmationToken.',
            },
            context: {
              type: 'object',
              description:
                'Pilot context (userId, countyId, permissions, userRole, activeMode). Required for enforcement.',
              properties: {
                userId: { type: 'string' },
                countyId: { type: 'string' },
                permissions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                userRole: {
                  type: 'string',
                  description: 'User role (e.g. assessor, viewer, admin)',
                },
                activeMode: { type: 'string', enum: ['pilot', 'muse'], description: 'Active mode' },
              },
              required: ['userId', 'countyId', 'permissions', 'userRole', 'activeMode'],
            },
          },
          required: ['toolId', 'params', 'context'],
        },
      },
      {
        name: 'terrafusion.listTools',
        description: 'List all registered tools with their metadata (suite, risk, permissions).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Execute tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  if (name === 'terrafusion.listTools') {
    const tools = ToolRegistry.list();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            tools.map(t => ({
              id: t.id,
              suite: t.suite,
              risk: t.risk,
              requiredPermissions: t.requiredPermissions,
              writeLane: t.writeLane,
            })),
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'terrafusion.executeTool') {
    const { toolId, params, context } = args as {
      toolId: string;
      params: Record<string, unknown>;
      context: PilotContext;
    };

    // Resolve tool definition
    const tool = ToolRegistry.get(toolId);
    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: `Tool not found: ${toolId}`,
              availableTools: ToolRegistry.list().map(t => t.id),
            }),
          },
        ],
        isError: true,
      };
    }

    // Execute through ToolRunner (enforces permissions, risk gates, lane isolation)
    try {
      const { result, traceId } = await ToolRunner.execute(tool, params, context);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: true,
              toolId,
              correlationId: traceId,
              result,
            }),
          },
        ],
      };
    } catch (err) {
      const error = err as Error & { traceId?: string };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              toolId,
              error: error.message,
              correlationId: error.traceId,
              // Note: ToolRunner already emits trace for permission_denied
              // No trace for invariant/risk/lane failures (fail-closed, no leak)
            }),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🛡️ TerraFusion MCP Tool Executor running on stdio');
  console.error(`   ${ToolRegistry.count()} tools registered`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
