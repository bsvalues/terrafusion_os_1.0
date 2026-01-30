/**
 * TerraFusion OS - Runtime Lock Test
 *
 * Contract test that verifies runtime enforcement cannot be bypassed.
 * This is the "runtime proof" equivalent to the CI proof.
 *
 * Run with: node --test os-platform/core/tests/runtime-lock.test.mjs
 */

import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Setup: Dynamic imports for ESM compatibility
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const manifestPath = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

// Import the modules
let ToolRegistry, ToolRunner, TraceService, ErrorCodes;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  ToolRegistry = pilotModule.ToolRegistry;
  ToolRunner = pilotModule.ToolRunner;
  TraceService = traceModule.TraceService;
  ErrorCodes = pilotModule.ErrorCodes;
});

// ============================================================================
// Test Fixtures
// ============================================================================

function createTestContext(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'test-user',
    roles: ['appraiser'],
    mode: 'pilot',
    ...overrides,
  };
}

function createSupervisorApproval() {
  return {
    approvedBy: 'supervisor-001',
    approvedAt: new Date().toISOString(),
    role: 'supervisor',
  };
}

// ============================================================================
// Runtime Lock Tests
// ============================================================================

describe('RuntimeLock: Enforcement cannot be bypassed', () => {
  let registry;
  let trace;
  let runner;

  beforeEach(async () => {
    // Fresh instances for each test
    registry = new ToolRegistry();
    await registry.initialize(manifestPath);

    trace = new TraceService();
    runner = new ToolRunner({ registry, trace });

    // Register a mock handler for each tool
    for (const tool of registry.listTools()) {
      runner.registerHandler(tool.toolId, async (params, ctx, t) => {
        return { executed: true, tool: t.toolId, params };
      });
    }
  });

  describe('Gate 5: RiskPolicy Enforcement', () => {
    it('MUST reject write_high without confirmation', async () => {
      const result = await runner.execute({
        toolId: 'run_valuation_model',
        params: { parcelId: 'P-123' },
        context: createTestContext({
          confirmation: false, // Missing confirmation
          reasonCode: 'annual_certification',
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject without confirmation');
      assert.strictEqual(result.errorCode, ErrorCodes.CONFIRMATION_REQUIRED);
    });

    it('MUST reject write_high without reason code', async () => {
      const result = await runner.execute({
        toolId: 'run_valuation_model',
        params: { parcelId: 'P-123' },
        context: createTestContext({
          confirmation: true,
          // Missing reasonCode
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject without reason code');
      assert.strictEqual(result.errorCode, ErrorCodes.REASON_CODE_REQUIRED);
    });

    it('MUST reject write_high with invalid reason code', async () => {
      const result = await runner.execute({
        toolId: 'run_valuation_model',
        params: { parcelId: 'P-123' },
        context: createTestContext({
          confirmation: true,
          reasonCode: 'invalid_reason', // Not in allowed list
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject invalid reason code');
      assert.strictEqual(result.errorCode, ErrorCodes.REASON_CODE_INVALID);
    });

    it('MUST reject irreversible without supervisor approval', async () => {
      const result = await runner.execute({
        toolId: 'request_trace_redaction',
        params: { traceEventId: 'evt-123' },
        context: createTestContext({
          confirmation: true,
          reasonCode: 'court_order',
          // Missing supervisorApproval
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject without supervisor approval');
      assert.strictEqual(result.errorCode, ErrorCodes.SUPERVISOR_APPROVAL_REQUIRED);
    });

    it('MUST reject irreversible with unauthorized supervisor role', async () => {
      const result = await runner.execute({
        toolId: 'request_trace_redaction',
        params: { traceEventId: 'evt-123' },
        context: createTestContext({
          confirmation: true,
          reasonCode: 'court_order',
          supervisorApproval: {
            approvedBy: 'fake-supervisor',
            approvedAt: new Date().toISOString(),
            role: 'intern', // Not authorized
          },
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject unauthorized role');
      assert.strictEqual(result.errorCode, ErrorCodes.SUPERVISOR_ROLE_INVALID);
    });

    it('MUST allow irreversible with proper authorization', async () => {
      const result = await runner.execute({
        toolId: 'request_trace_redaction',
        params: { traceEventId: 'evt-123' },
        context: createTestContext({
          confirmation: true,
          reasonCode: 'court_order',
          supervisorApproval: createSupervisorApproval(),
        }),
      });

      assert.strictEqual(result.ok, true, 'Should allow with proper authorization');
      assert.ok(result.correlationId, 'Should have correlation ID');
    });
  });

  describe('Trace Audit: All invocations are recorded', () => {
    it('MUST trace successful invocations', async () => {
      const result = await runner.execute({
        toolId: 'route_to_parcel',
        params: { parcelId: 'P-123' },
        context: createTestContext(),
      });

      assert.strictEqual(result.ok, true);

      // Check trace events
      const events = trace.getByCorrelationId(result.correlationId);
      assert.ok(events.length >= 2, 'Should have invoke + complete events');

      const invokeEvent = events.find(e => e.type === 'tool_invoked');
      const completeEvent = events.find(e => e.type === 'tool_completed');

      assert.ok(invokeEvent, 'Should have invoked event');
      assert.ok(completeEvent, 'Should have completed event');
      assert.strictEqual(invokeEvent.toolId, 'route_to_parcel');
    });

    it('MUST trace failed enforcement', async () => {
      const result = await runner.execute({
        toolId: 'run_valuation_model',
        params: { parcelId: 'P-123' },
        context: createTestContext({ confirmation: false }),
      });

      assert.strictEqual(result.ok, false);

      // Check that denial was traced
      const events = trace.getByCorrelationId(result.correlationId);
      const failEvent = events.find(e => e.type === 'tool_failed');

      assert.ok(failEvent, 'Should trace enforcement failure');
      assert.ok(failEvent.summary.includes('Enforcement failed'));
    });
  });

  describe('Pre-flight Validation', () => {
    it('MUST report violations before execution', () => {
      const { valid, violations } = runner.validate({
        toolId: 'request_trace_redaction',
        params: {},
        context: createTestContext(),
      });

      assert.strictEqual(valid, false);
      assert.ok(violations.length > 0, 'Should report violations');
      assert.ok(
        violations.some(v => v.includes('SUPERVISOR_APPROVAL_REQUIRED')),
        'Should flag missing supervisor approval'
      );
    });

    it('MUST pass for properly configured invocations', () => {
      const { valid, violations } = runner.validate({
        toolId: 'request_trace_redaction',
        params: {},
        context: createTestContext({
          confirmation: true,
          reasonCode: 'court_order',
          supervisorApproval: createSupervisorApproval(),
        }),
      });

      assert.strictEqual(valid, true);
      assert.strictEqual(violations.length, 0);
    });
  });

  describe('Mode Enforcement', () => {
    it('MUST reject pilot-mode tool in muse mode', async () => {
      const result = await runner.execute({
        toolId: 'run_valuation_model', // mode: pilot
        params: { parcelId: 'P-123' },
        context: createTestContext({
          mode: 'muse', // Wrong mode
          confirmation: true,
          reasonCode: 'annual_certification',
        }),
      });

      assert.strictEqual(result.ok, false, 'Should reject mode mismatch');
      assert.strictEqual(result.errorCode, ErrorCodes.MODE_MISMATCH);
    });
  });
});

// ============================================================================
// Self-test runner for Node.js
// ============================================================================

console.log('RuntimeLock Test Suite');
console.log('======================');
console.log('Run with: node --test os-platform/core/tests/runtime-lock.test.mjs');
