/**
 * @deprecated — This ToolRunner is superseded by os-platform/core/pilot/ToolRunner.ts
 *
 * The canonical ToolRunner now includes RBAC permission checking (Gate 5b)
 * ported from this file's requiredPermissions pattern. Use the canonical
 * version for all new development.
 *
 * Migration: Import from 'os-platform/core/pilot/index.js' instead.
 * Removal target: R1 Week 3 (after integration smoke passes)
 */

import { TerraTraceService } from '../trace/TerraTraceService';

// --- Types ---
export type RiskLevel = 'read_only' | 'write_low' | 'write_high' | 'irreversible';

export interface ToolDefinition {
  id: string;
  suite: 'forge' | 'atlas' | 'dais' | 'dossier' | 'gpt';
  writeLane: string; // e.g. "dais:workflow"
  risk: RiskLevel;
  requiredPermissions: string[];
  handler: (params: any, context: any) => Promise<any>;
}

export interface PilotContext {
  userId: string;
  userRole: string;
  permissions: string[]; // RBAC claims
  activeMode: 'pilot' | 'muse';
  countyId: string;
  parcelId?: string;
}

export class ToolRunner {
  static async execute(
    tool: ToolDefinition,
    params: any,
    context: PilotContext
  ): Promise<{ result: any; traceId: string }> {
    console.log(`[ToolRunner] 🚀 Requesting: ${tool.id} [Risk: ${tool.risk}]`);

    // 0) Basic invariants (fail-closed)
    if (!tool?.id || !tool?.suite || !tool?.handler) {
      throw new Error('⛔ Tool definition invalid (missing id/suite/handler).');
    }
    if (!context?.userId || !context?.countyId) {
      throw new Error('⛔ Pilot context invalid (missing userId/countyId).');
    }

    // 1) PERMISSION CHECK (RBAC)
    const hasPerms = (tool.requiredPermissions ?? []).every(p => context.permissions.includes(p));
    if (!hasPerms) {
      const traceId = await TerraTraceService.emit({
        countyId: context.countyId,
        parcelId: context.parcelId,
        actor: { userId: context.userId, role: context.userRole },
        event: { suite: 'os', module: 'pilot', action: 'permission_denied', category: 'system' },
        data: { inputs: { tool: tool.id, required: tool.requiredPermissions } },
        compliance: { classification: 'RESTRICTED', retention: '7_years' },
      });
      const error = new Error(
        `⛔ Permission Denied: Missing ${tool.requiredPermissions.join(', ')}`
      );
      (error as Error & { traceId?: string }).traceId = traceId;
      throw error;
    }

    // 2) RISK POLICY ENFORCEMENT (Gate 5)
    if (tool.risk === 'write_high' || tool.risk === 'irreversible') {
      if (!params?._confirmationToken) {
        throw new Error(`🛡️ Risk Gate: Tool '${tool.id}' requires explicit confirmation token.`);
      }
      // In production: verify token signature/TTL/scope
    }

    // 3) WRITE-LANE CHECK (Gate 4)
    // Enforces suite-write isolation (simplified)
    if (tool.writeLane && !tool.writeLane.startsWith(tool.suite)) {
      throw new Error(
        `🚧 Lane Violation: Suite '${tool.suite}' cannot write to lane '${tool.writeLane}'`
      );
    }

    // 4) AUDIT: LOG INVOCATION
    const traceId = await TerraTraceService.emit({
      countyId: context.countyId,
      parcelId: context.parcelId,
      actor: { userId: context.userId, role: context.userRole },
      event: { suite: tool.suite, module: 'pilot', action: 'tool_invoked', category: 'workflow' },
      data: {
        inputs: params,
        metadata: { toolId: tool.id, risk: tool.risk, writeLane: tool.writeLane },
      },
      compliance: { classification: 'CONFIDENTIAL', retention: '7_years' },
    });

    // 5) EXECUTE
    try {
      const result = await tool.handler(params, context);

      // 6) AUDIT: LOG SUCCESS
      await TerraTraceService.emitResult(traceId, result);
      return { result, traceId };
    } catch (error: any) {
      // 7) AUDIT: LOG FAILURE
      await TerraTraceService.emitResult(traceId, null, error?.message ?? String(error));
      throw error;
    }
  }
}
