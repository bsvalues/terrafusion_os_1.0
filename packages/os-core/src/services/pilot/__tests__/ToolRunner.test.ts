import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolRunner, type PilotContext, type ToolDefinition } from '../ToolRunner';

// Mock TerraTraceService module used by ToolRunner
vi.mock('../../trace/TerraTraceService', () => {
  return {
    TerraTraceService: {
      emit: vi.fn(async () => 'trace-123'),
      emitResult: vi.fn(async () => 'trace-result-456'),
    },
  };
});

// Import mocked service for assertions
import { TerraTraceService } from '../../trace/TerraTraceService';

function makeContext(overrides: Partial<PilotContext> = {}): PilotContext {
  return {
    userId: 'u1',
    userRole: 'admin',
    permissions: ['parcel:read', 'valuation:commit', 'tools:demo'],
    activeMode: 'pilot',
    countyId: 'benton',
    parcelId: '123-abc',
    ...overrides,
  };
}

function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    id: 'atlas.parcel.read',
    suite: 'atlas',
    writeLane: 'atlas:read',
    risk: 'read_only',
    requiredPermissions: ['parcel:read'],
    handler: vi.fn(async params => ({ ok: true, params })),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ToolRunner', () => {
  it('fails closed if tool definition is missing id/suite/handler', async () => {
    const ctx = makeContext();
    await expect(ToolRunner.execute({} as any, {}, ctx)).rejects.toThrow(
      /Tool definition invalid/i
    );
    expect(TerraTraceService.emit).not.toHaveBeenCalled();
  });

  it('fails closed if context is missing userId/countyId', async () => {
    const tool = makeTool();
    const badCtx = makeContext({ userId: '' as any });
    await expect(ToolRunner.execute(tool, {}, badCtx)).rejects.toThrow(/Pilot context invalid/i);
    expect(TerraTraceService.emit).not.toHaveBeenCalled();
  });

  it('denies when required permissions are missing and emits permission_denied trace', async () => {
    const tool = makeTool({ requiredPermissions: ['parcel:read', 'workflow:write'] });
    const ctx = makeContext({ permissions: ['parcel:read'] });

    await expect(ToolRunner.execute(tool, { parcelId: 'p1' }, ctx)).rejects.toThrow(
      /Permission Denied/i
    );

    expect(TerraTraceService.emit).toHaveBeenCalledTimes(1);
    const callArg = (TerraTraceService.emit as any).mock.calls[0][0];

    expect(callArg.event.suite).toBe('os');
    expect(callArg.event.action).toBe('permission_denied');
    expect(callArg.countyId).toBe('benton');
    expect(callArg.parcelId).toBe('123-abc');
    expect(callArg.data.inputs.tool).toBe(tool.id);
  });

  it('enforces risk gate for write_high tools when _confirmationToken is missing (before lane check)', async () => {
    const tool = makeTool({
      id: 'forge.valuation.commit',
      suite: 'forge',
      writeLane: 'dais:workflow', // would be a lane violation, but risk gate should fire first
      risk: 'write_high',
      requiredPermissions: ['valuation:commit'],
    });

    const ctx = makeContext();

    await expect(ToolRunner.execute(tool, { some: 'param' }, ctx)).rejects.toThrow(
      /requires explicit confirmation token/i
    );

    // No invocation trace should have been emitted because it fails before audit invocation
    expect(TerraTraceService.emit).not.toHaveBeenCalled();
    expect(TerraTraceService.emitResult).not.toHaveBeenCalled();
  });

  it('enforces lane isolation when writeLane does not start with suite (when risk gate is satisfied)', async () => {
    const tool = makeTool({
      id: 'forge.valuation.commit',
      suite: 'forge',
      writeLane: 'dais:workflow',
      risk: 'write_high',
      requiredPermissions: ['valuation:commit'],
    });

    const ctx = makeContext();
    await expect(
      ToolRunner.execute(tool, { _confirmationToken: 'ok', any: 1 }, ctx)
    ).rejects.toThrow(/Lane Violation/i);

    // Still fails before audit invocation trace (risk gate passed, lane check fails before emit)
    expect(TerraTraceService.emit).not.toHaveBeenCalled();
    expect(TerraTraceService.emitResult).not.toHaveBeenCalled();
  });

  it('logs invocation and success outcome on successful tool execution', async () => {
    const tool = makeTool({
      id: 'atlas.parcel.read',
      suite: 'atlas',
      writeLane: 'atlas:read',
      risk: 'read_only',
      requiredPermissions: ['parcel:read'],
      handler: vi.fn(async () => ({ ok: true, email: 'test@example.com' })),
    });

    const ctx = makeContext();
    const result = await ToolRunner.execute(tool, { parcelId: 'p1' }, ctx);

    expect(result.ok).toBe(true);

    // Invocation trace emitted once
    expect(TerraTraceService.emit).toHaveBeenCalledTimes(1);
    const invocation = (TerraTraceService.emit as any).mock.calls[0][0];

    expect(invocation.event.suite).toBe(tool.suite);
    expect(invocation.event.action).toBe('tool_invoked');
    expect(invocation.data.metadata.toolId).toBe(tool.id);
    expect(invocation.data.metadata.writeLane).toBe(tool.writeLane);
    expect(invocation.data.metadata.risk).toBe(tool.risk);

    // Result trace emitted once with correlationId = returned traceId
    expect(TerraTraceService.emitResult).toHaveBeenCalledTimes(1);
    const [traceIdArg, outputArg, errorArg] = (TerraTraceService.emitResult as any).mock.calls[0];
    expect(traceIdArg).toBe('trace-123');
    expect(outputArg).toMatchObject({ ok: true });
    expect(errorArg).toBeUndefined();
  });

  it('logs invocation and failure outcome when handler throws', async () => {
    const tool = makeTool({
      id: 'atlas.parcel.read',
      suite: 'atlas',
      writeLane: 'atlas:read',
      risk: 'read_only',
      requiredPermissions: ['parcel:read'],
      handler: vi.fn(async () => {
        throw new Error('boom');
      }),
    });

    const ctx = makeContext();

    await expect(ToolRunner.execute(tool, { parcelId: 'p1' }, ctx)).rejects.toThrow('boom');

    expect(TerraTraceService.emit).toHaveBeenCalledTimes(1);
    expect(TerraTraceService.emitResult).toHaveBeenCalledTimes(1);

    const [traceIdArg, outputArg, errorArg] = (TerraTraceService.emitResult as any).mock.calls[0];
    expect(traceIdArg).toBe('trace-123');
    expect(outputArg).toBeNull();
    expect(errorArg).toBe('boom');
  });
});
