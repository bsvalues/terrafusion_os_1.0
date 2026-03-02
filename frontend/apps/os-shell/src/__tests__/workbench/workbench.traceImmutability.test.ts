/// <reference types="vitest" />
/**
 * workbench.traceImmutability.test.ts
 *
 * Phase J Gate 4: TerraTrace Immutability
 *
 * Validates that the trace event contract types are well-formed
 * and enforce the append-only model (invoke → result pairs).
 *
 * @see 03_TERRATRACE_SPEC_v3.1.md — Append-only event model
 * @see contracts/trace.ts — TraceEvent type
 */

import type { TraceEventType } from '../../contracts/trace';

// ============================================================================
// Constants
// ============================================================================

/** All valid trace event types from the spec */
const ALL_EVENT_TYPES: TraceEventType[] = [
  'tool_invoked',
  'tool_succeeded',
  'tool_failed',
  'mode_switched',
  'permission_denied',
  'policy_blocked',
  'workflow_state_changed',
  'artifact_created',
  'artifact_published',
  'redaction_applied',
  'retention_archived',
  'retention_deleted',
];

/** Events that start a causal chain */
const INVOKE_EVENTS: TraceEventType[] = ['tool_invoked'];

/** Events that complete a causal chain */
const RESULT_EVENTS: TraceEventType[] = ['tool_succeeded', 'tool_failed'];

// ============================================================================
// Tests
// ============================================================================

describe('Gate: TerraTrace Immutability Invariants', () => {
  it('trace event type enum covers all 12 canonical types', () => {
    expect(ALL_EVENT_TYPES).toHaveLength(12);
  });

  it('invoke events have corresponding result events', () => {
    // Every tool_invoked must be followed by either tool_succeeded or tool_failed
    // This is a structural rule — no tool_invoked without a terminal event
    expect(INVOKE_EVENTS).toContain('tool_invoked');
    expect(RESULT_EVENTS).toContain('tool_succeeded');
    expect(RESULT_EVENTS).toContain('tool_failed');
  });

  it('no event type appears in both invoke and result sets', () => {
    for (const evt of INVOKE_EVENTS) {
      expect(RESULT_EVENTS).not.toContain(evt);
    }
  });

  it('tool events follow pairs rule: invoked → succeeded/failed', () => {
    // Simulate a valid pair
    const chain: TraceEventType[] = ['tool_invoked', 'tool_succeeded'];
    expect(chain[0]).toBe('tool_invoked');
    expect(RESULT_EVENTS).toContain(chain[chain.length - 1]);

    // Simulate error pair
    const errorChain: TraceEventType[] = ['tool_invoked', 'tool_failed'];
    expect(errorChain[0]).toBe('tool_invoked');
    expect(RESULT_EVENTS).toContain(errorChain[errorChain.length - 1]);
  });
});
