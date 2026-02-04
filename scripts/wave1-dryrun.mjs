/**
 * Wave 1 Intake Dry-Run Harness
 *
 * Simulates intake events (accept/reject/error paths) without touching Zone A files.
 * Validates:
 * - Log formatting
 * - Trace emission
 * - Error classification
 * - Correlation ID pivoting
 *
 * Phase: Pre-Unfreeze (Zone B)
 * Sprint: Zone B (2026-02-04) + Wave 1 Unfreeze Prep
 *
 * Usage:
 *   node scripts/wave1-dryrun.mjs
 *   node scripts/wave1-dryrun.mjs --scenario pii
 *   node scripts/wave1-dryrun.mjs --scenario all
 */

import { randomUUID } from 'node:crypto';

// Load trace service singleton
const traceModule = await import('../os-platform/core/trace/index.js');
const trace = traceModule.default || traceModule;
const traceService = trace.traceService;

// Mock intake handler (matches test pattern)
class IntakeHandler {
  constructor(correlationId) {
    this.correlationId = correlationId;
    this.component = 'IntakeHandler';
  }

  async processNomination(nomination) {
    try {
      // Emit start event
      this.emitTrace({
        type: 'intake_started',
        correlationId: this.correlationId,
        component: this.component,
        payload: {
          nominationId: nomination.id,
          timestamp: new Date().toISOString(),
        },
      });

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
        return { decision: 'REJECTED_PII', correlationId: this.correlationId };
      }

      // Evidence check
      if (!nomination.evidence || nomination.evidence.trim().length === 0) {
        this.emitTrace({
          type: 'nomination_rejected',
          correlationId: this.correlationId,
          errorCode: 'REJECTED_MISSING_EVIDENCE',
          component: this.component,
          payload: {
            nominationId: nomination.id,
            reason: 'Missing or empty evidence field',
          },
        });
        return { decision: 'REJECTED_MISSING_EVIDENCE', correlationId: this.correlationId };
      }

      // Cutoff check (UTC)
      const CUTOFF = new Date('2026-02-21T23:59:59Z');
      const submissionTime = new Date(nomination.timestamp);
      if (submissionTime > CUTOFF) {
        this.emitTrace({
          type: 'nomination_rejected',
          correlationId: this.correlationId,
          errorCode: 'REJECTED_LATE',
          component: this.component,
          payload: {
            nominationId: nomination.id,
            reason: 'Submitted after cutoff (UTC)',
            cutoff: CUTOFF.toISOString(),
            submitted: submissionTime.toISOString(),
          },
        });
        return { decision: 'REJECTED_LATE', correlationId: this.correlationId };
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

      this.emitTrace({
        type: 'intake_completed',
        correlationId: this.correlationId,
        component: this.component,
        payload: {
          nominationId: nomination.id,
          decision: 'APPROVED',
          slot: nomination.slot,
        },
      });

      return { decision: 'APPROVED', slot: nomination.slot, correlationId: this.correlationId };
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
  }

  containsPII(text) {
    const PII_PATTERNS = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone (US format)
    ];
    return PII_PATTERNS.some(pattern => pattern.test(text));
  }

  emitTrace(event) {
    traceService.emit(event);
  }
}

// Test scenarios
const scenarios = {
  good: {
    id: 'nom-good-001',
    title: 'Implement feature X for production deployment',
    evidence: 'Complete evidence package with technical justification and impact analysis.',
    slot: 1,
    timestamp: '2026-02-21T10:00:00Z',
  },
  pii: {
    id: 'nom-bad-pii',
    title: 'Fix bug reported by user@example.com',
    evidence: 'Evidence package',
    slot: 2,
    timestamp: '2026-02-21T11:00:00Z',
  },
  missing_evidence: {
    id: 'nom-bad-evidence',
    title: 'Add logging to service layer',
    evidence: '', // Empty
    slot: 3,
    timestamp: '2026-02-21T12:00:00Z',
  },
  late: {
    id: 'nom-bad-late',
    title: 'Refactor authentication module',
    evidence: 'Evidence package',
    slot: 4,
    timestamp: '2026-02-22T00:00:01Z', // After cutoff
  },
};

async function runScenario(name, nomination) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scenario: ${name.toUpperCase()}`);
  console.log('='.repeat(60));

  const correlationId = randomUUID();
  const handler = new IntakeHandler(correlationId);

  console.log(`\nNomination:`);
  console.log(`  ID: ${nomination.id}`);
  console.log(`  Title: ${nomination.title}`);
  console.log(
    `  Evidence: ${nomination.evidence ? nomination.evidence.substring(0, 50) + '...' : '(empty)'}`
  );
  console.log(`  Timestamp: ${nomination.timestamp}`);
  console.log(`  Correlation ID: ${correlationId}`);

  try {
    const result = await handler.processNomination(nomination);
    console.log(`\nResult: ${result.decision}`);
    if (result.slot) {
      console.log(`  Slot: ${result.slot}`);
    }
  } catch (error) {
    console.log(`\nError: ${error.message}`);
  }

  // Query traces
  const startTime = performance.now();
  const traces = traceService.query({ correlationId });
  const queryTime = performance.now() - startTime;

  console.log(`\nTrace Events (${traces.length} events, query time: ${queryTime.toFixed(2)}ms):`);
  traces.forEach((trace, idx) => {
    console.log(`  [${idx + 1}] ${trace.type}`);
    if (trace.errorCode) {
      console.log(`      errorCode: ${trace.errorCode}`);
    }
    console.log(`      component: ${trace.component}`);
    if (trace.payload) {
      console.log(
        `      payload: ${JSON.stringify(trace.payload, null, 8).replace(/\n/g, '\n      ')}`
      );
    }
  });

  console.log(
    `\nQuery Performance: ${queryTime < 100 ? '✅' : '❌'} (${queryTime.toFixed(2)}ms < 100ms SLO)`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const scenario = args.find(arg => !arg.startsWith('--'))?.toLowerCase();

  console.log('='.repeat(60));
  console.log('Wave 1 Intake Dry-Run Harness');
  console.log('='.repeat(60));
  console.log('Phase: Pre-Unfreeze (Zone B)');
  console.log('Purpose: Validate intake mechanics without touching Zone A');
  console.log('='.repeat(60));

  if (scenario && scenario !== 'all' && scenarios[scenario]) {
    await runScenario(scenario, scenarios[scenario]);
  } else if (scenario === 'all' || !scenario) {
    for (const [name, nomination] of Object.entries(scenarios)) {
      await runScenario(name, nomination);
    }
  } else {
    console.log('\nUsage:');
    console.log('  node scripts/wave1-dryrun.mjs              # Run all scenarios');
    console.log('  node scripts/wave1-dryrun.mjs all          # Run all scenarios');
    console.log('  node scripts/wave1-dryrun.mjs good         # Happy path');
    console.log('  node scripts/wave1-dryrun.mjs pii          # PII rejection');
    console.log('  node scripts/wave1-dryrun.mjs missing_evidence  # Missing evidence');
    console.log('  node scripts/wave1-dryrun.mjs late         # Late submission');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Dry-Run Complete');
  console.log('='.repeat(60));
  console.log('Note: No Zone A files modified. Traces stored in-memory only.');
  console.log('Ready for Wave 1 unfreeze on 2026-02-21.');
}

main().catch(err => {
  console.error('Dry-run failed:', err);
  process.exit(1);
});
