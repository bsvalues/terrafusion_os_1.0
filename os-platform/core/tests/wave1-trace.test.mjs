/**
 * Wave 1 Trace Emission Tests
 *
 * Validates that Wave 1 intake operations emit structured trace events with:
 * - correlationId (request-level identifier for pivoting)
 * - errorCode (classification for reject reasons)
 * - component (emission boundary: IntakeHandler, etc.)
 * - stackTrace (full stack for handler errors)
 *
 * Phase: Pre-Unfreeze (Zone B)
 * Sprint: Zone B (2026-02-04) + Wave 1 Unfreeze Prep
 *
 * Test Strategy:
 * - Simulate intake events (accept/reject paths)
 * - Verify trace emission contract
 * - Validate correlationId pivoting
 * - Ensure <100ms query latency (from Zone B sprint SLO)
 */

import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

// Test imports
let traceService;

// Test setup - load trace service singleton
before(async () => {
  const traceModule = await import('../trace/index.js');
  const trace = traceModule.default || traceModule;
  traceService = trace.traceService;
});

// Mock intake handler for testing
class MockIntakeHandler {
  constructor(correlationId) {
    this.correlationId = correlationId;
    this.component = 'IntakeHandler';
  }

  async processNomination(nomination) {
    const startTime = Date.now();

    try {
      // PII check
      if (this.containsPII(nomination.title)) {
        this.emitTrace({
          type: 'nomination_rejected',
          correlationId: this.correlationId,
          errorCode: 'REJECTED_PII',
          component: this.component,
          payload: {
            nominationId: nomination.id,
            reason: 'PII detected in title',
          },
        });
        return { decision: 'REJECTED_PII' };
      }

      // Evidence check
      if (!nomination.evidence) {
        this.emitTrace({
          type: 'nomination_rejected',
          correlationId: this.correlationId,
          errorCode: 'REJECTED_MISSING_EVIDENCE',
          component: this.component,
          payload: {
            nominationId: nomination.id,
            reason: 'Missing evidence field',
          },
        });
        return { decision: 'REJECTED_MISSING_EVIDENCE' };
      }

      // Accept path
      this.emitTrace({
        type: 'nomination_accepted',
        correlationId: this.correlationId,
        component: this.component,
        payload: {
          nominationId: nomination.id,
          slot: nomination.slot,
        },
      });

      return { decision: 'APPROVED', slot: nomination.slot };
    } catch (error) {
      // Handler error with full stack trace
      this.emitTrace({
        type: 'nomination_failed',
        correlationId: this.correlationId,
        errorCode: 'HANDLER_ERROR',
        component: this.component,
        stackTrace: error.stack,
        payload: {
          nominationId: nomination.id,
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  containsPII(text) {
    const PII_PATTERNS = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];
    return PII_PATTERNS.some(pattern => pattern.test(text));
  }

  emitTrace(event) {
    traceService.emit(event);
  }
}

describe('Wave1 Trace: Structured Error Events', () => {
  test('emits trace on PII rejection with errorCode', async () => {
    const correlationId = `test-pii-${Date.now()}`;
    const handler = new MockIntakeHandler(correlationId);

    const nomination = {
      id: 'nom-001',
      title: 'Fix bug for user@example.com',
      evidence: 'test evidence',
      slot: 1,
    };

    const result = await handler.processNomination(nomination);

    assert.equal(result.decision, 'REJECTED_PII');

    // Verify trace event structure
    const events = traceService.query({ correlationId });
    assert.ok(events.length > 0, 'Should emit at least one trace event');

    const rejectEvent = events.find(e => e.type === 'nomination_rejected');
    assert.ok(rejectEvent, 'Should emit nomination_rejected event');
    assert.equal(rejectEvent.errorCode, 'REJECTED_PII');
    assert.equal(rejectEvent.component, 'IntakeHandler');
    assert.equal(rejectEvent.payload.nominationId, 'nom-001');
  });

  test('emits trace on missing evidence rejection with errorCode', async () => {
    const correlationId = `test-evidence-${Date.now()}`;
    const handler = new MockIntakeHandler(correlationId);

    const nomination = {
      id: 'nom-002',
      title: 'Valid title',
      evidence: null, // Missing
      slot: 2,
    };

    const result = await handler.processNomination(nomination);

    assert.equal(result.decision, 'REJECTED_MISSING_EVIDENCE');

    const events = traceService.query({ correlationId });
    const rejectEvent = events.find(e => e.type === 'nomination_rejected');
    assert.equal(rejectEvent.errorCode, 'REJECTED_MISSING_EVIDENCE');
    assert.equal(rejectEvent.component, 'IntakeHandler');
  });

  test('emits trace on handler error with stackTrace', async () => {
    const correlationId = `test-error-${Date.now()}`;
    const handler = new MockIntakeHandler(correlationId);

    // Mock: force handler error
    handler.processNomination = async function (nomination) {
      try {
        throw new Error('Simulated handler crash');
      } catch (error) {
        this.emitTrace({
          type: 'nomination_failed',
          correlationId: this.correlationId,
          errorCode: 'HANDLER_ERROR',
          component: this.component,
          stackTrace: error.stack,
          payload: {
            nominationId: nomination.id,
            errorMessage: error.message,
          },
        });
        throw error;
      }
    };

    const nomination = { id: 'nom-003', title: 'Test', evidence: 'valid', slot: 3 };

    await assert.rejects(() => handler.processNomination(nomination), /Simulated handler crash/);

    const events = traceService.query({ correlationId });
    const failEvent = events.find(e => e.type === 'nomination_failed');
    assert.ok(failEvent, 'Should emit nomination_failed event');
    assert.equal(failEvent.errorCode, 'HANDLER_ERROR');
    assert.ok(failEvent.stackTrace, 'Should include stack trace');
    assert.ok(failEvent.stackTrace.includes('Simulated handler crash'));
  });

  test('emits trace on accept path (success)', async () => {
    const correlationId = `test-accept-${Date.now()}`;
    const handler = new MockIntakeHandler(correlationId);

    const nomination = {
      id: 'nom-004',
      title: 'Valid nomination',
      evidence: 'Complete evidence package',
      slot: 4,
    };

    const result = await handler.processNomination(nomination);

    assert.equal(result.decision, 'APPROVED');

    const events = traceService.query({ correlationId });
    const acceptEvent = events.find(e => e.type === 'nomination_accepted');
    assert.ok(acceptEvent, 'Should emit nomination_accepted event');
    assert.equal(acceptEvent.component, 'IntakeHandler');
    assert.equal(acceptEvent.payload.nominationId, 'nom-004');
    assert.equal(acceptEvent.payload.slot, 4);
  });
});

describe('Wave1 Trace: Correlation ID Pivoting', () => {
  test('correlationId links full intake request path', async () => {
    const correlationId = `test-pivot-${Date.now()}`;
    const handler = new MockIntakeHandler(correlationId);

    // Simulate multi-step intake: validate → process → write
    const nomination = {
      id: 'nom-005',
      title: 'Multi-step nomination',
      evidence: 'Evidence',
      slot: 5,
    };

    // Step 1: Validate (emit trace)
    traceService.emit({
      type: 'intake_started',
      correlationId,
      component: 'IntakeValidator',
      payload: { nominationId: nomination.id },
    });

    // Step 2: Process (emit trace via handler)
    const result = await handler.processNomination(nomination);

    // Step 3: Write (emit trace)
    traceService.emit({
      type: 'intake_completed',
      correlationId,
      component: 'IntakeWriter',
      payload: { nominationId: nomination.id, decision: result.decision },
    });

    // Query all events for this correlationId
    const events = traceService.query({ correlationId });

    assert.ok(events.length >= 3, 'Should have at least 3 events in chain');

    const eventTypes = events.map(e => e.type);
    assert.ok(eventTypes.includes('intake_started'), 'Should include intake_started');
    assert.ok(eventTypes.includes('nomination_accepted'), 'Should include nomination_accepted');
    assert.ok(eventTypes.includes('intake_completed'), 'Should include intake_completed');

    // Verify all events share same correlationId
    assert.ok(events.every(e => e.correlationId === correlationId));
  });

  test('query by correlationId returns full causal chain', async () => {
    const correlationId = `test-chain-${Date.now()}`;

    // Emit sequence of events
    traceService.emit({ type: 'event_1', correlationId, component: 'A', payload: {} });
    traceService.emit({ type: 'event_2', correlationId, component: 'B', payload: {} });
    traceService.emit({ type: 'event_3', correlationId, component: 'C', payload: {} });

    const events = traceService.query({ correlationId });

    assert.equal(events.length, 3, 'Should return all events in chain');
    assert.deepEqual(
      events.map(e => e.type),
      ['event_1', 'event_2', 'event_3']
    );
  });
});

describe('Wave1 Trace: Query Performance (<100ms SLO)', () => {
  test('query by correlationId completes in <100ms', async () => {
    const correlationId = `test-perf-${Date.now()}`;

    // Emit 10 events
    for (let i = 0; i < 10; i++) {
      traceService.emit({
        type: `event_${i}`,
        correlationId,
        component: 'PerfTest',
        payload: { index: i },
      });
    }

    const startTime = performance.now();
    const events = traceService.query({ correlationId });
    const duration = performance.now() - startTime;

    assert.ok(events.length === 10, 'Should return all events');
    assert.ok(duration < 100, `Query should complete in <100ms, got ${duration.toFixed(2)}ms`);
  });

  test('query by errorCode completes in <100ms', async () => {
    const errorCode = 'REJECTED_PII';

    // Emit 10 rejection events
    for (let i = 0; i < 10; i++) {
      traceService.emit({
        type: 'nomination_rejected',
        correlationId: `test-error-${i}`,
        errorCode,
        component: 'IntakeHandler',
        payload: { nominationId: `nom-${i}` },
      });
    }

    const startTime = performance.now();
    const events = traceService.query({ errorCode });
    const duration = performance.now() - startTime;

    assert.ok(events.length >= 10, 'Should return at least 10 events');
    assert.ok(duration < 100, `Query should complete in <100ms, got ${duration.toFixed(2)}ms`);
  });
});

describe('Wave1 Trace: Query Interface Ergonomics', () => {
  test('traceService.query supports correlationId filter', () => {
    const correlationId = `test-filter-${Date.now()}`;

    traceService.emit({ type: 'test_event', correlationId, component: 'Test', payload: {} });

    const events = traceService.query({ correlationId });
    assert.ok(events.every(e => e.correlationId === correlationId));
  });

  test('traceService.query supports errorCode filter', () => {
    const errorCode = 'REJECTED_LATE';

    traceService.emit({
      type: 'nomination_rejected',
      correlationId: `test-late-${Date.now()}`,
      errorCode,
      component: 'IntakeHandler',
      payload: {},
    });

    const events = traceService.query({ errorCode });
    assert.ok(
      events.filter(e => e.errorCode === errorCode).length > 0,
      'Should return events matching errorCode'
    );
  });

  test('traceService.query supports component filter', () => {
    const component = 'IntakeValidator';

    traceService.emit({
      type: 'validation_started',
      correlationId: `test-component-${Date.now()}`,
      component,
      payload: {},
    });

    const events = traceService.query({ component });
    assert.ok(
      events.filter(e => e.component === component).length > 0,
      'Should return events matching component'
    );
  });

  test('traceService.query supports type filter', () => {
    const type = 'nomination_rejected';

    traceService.emit({
      type,
      correlationId: `test-type-${Date.now()}`,
      component: 'IntakeHandler',
      payload: {},
    });

    const events = traceService.query({ type });
    assert.ok(events.every(e => e.type === type));
  });
});
