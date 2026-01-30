/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GOVERNANCE DASHBOARD - ENDPOINT TESTS
 * Phase 7.4: Dashboard access control and metrics validation
 *
 * Tests:
 *   - Role gating for elevated roles
 *   - MetricsService basic functionality
 *   - High-risk feed structure
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

// Test data
const ELEVATED_ROLES = ['admin', 'compliance_officer', 'auditor', 'supervisor'];
const NON_ELEVATED_ROLES = ['viewer', 'user', 'operator'];

// Mock modules
let TraceService;
let createMetricsService;
let hasElevatedTraceRole;

// ═══════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════

describe('GovernanceLock Dashboard - Phase 7.4', async () => {
  before(async () => {
    // Dynamic import for ESM compatibility
    const traceModule = await import('../trace/index.js');
    TraceService = traceModule.TraceService;
    createMetricsService = traceModule.createMetricsService;
    hasElevatedTraceRole = traceModule.hasElevatedTraceRole;
  });

  // ═══════════════════════════════════════════════════════════════
  // ROLE GATING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Role Gating', () => {
    it('hasElevatedTraceRole returns false for non-elevated roles', () => {
      for (const role of NON_ELEVATED_ROLES) {
        const principal = { userId: 'u1', roles: [role], countyId: 'benton' };
        const result = hasElevatedTraceRole(principal);
        assert.strictEqual(result, false, `Role ${role} should NOT be elevated`);
      }
    });

    it('hasElevatedTraceRole returns true for elevated roles', () => {
      for (const role of ELEVATED_ROLES) {
        const principal = { userId: 'u1', roles: [role], countyId: 'benton' };
        const result = hasElevatedTraceRole(principal);
        assert.strictEqual(result, true, `Role ${role} SHOULD be elevated`);
      }
    });

    it('hasElevatedTraceRole returns true with mixed roles containing one elevated', () => {
      const principal = { userId: 'u1', roles: ['viewer', 'auditor', 'user'], countyId: 'benton' };
      const result = hasElevatedTraceRole(principal);
      assert.strictEqual(result, true, 'Should be elevated with auditor in role list');
    });

    it('hasElevatedTraceRole works with administrator alias', () => {
      const principal = { userId: 'u1', roles: ['administrator'], countyId: 'benton' };
      const result = hasElevatedTraceRole(principal);
      assert.strictEqual(result, true, 'administrator should be elevated');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // METRICS SERVICE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('MetricsService', () => {
    let traceService;
    let metricsService;

    beforeEach(() => {
      // Create fresh trace service for each test
      traceService = new TraceService({ ringBufferSize: 100 });
      metricsService = createMetricsService(traceService);
    });

    it('getSummary returns valid structure', () => {
      const summary = metricsService.getSummary('24h', 'benton');

      assert.ok(summary, 'Summary should exist');
      assert.strictEqual(summary.window, '24h');
      assert.ok(summary.windowStart, 'Should have windowStart');
      assert.ok(summary.windowEnd, 'Should have windowEnd');

      // Invocations structure
      assert.ok(summary.invocations, 'Should have invocations');
      assert.strictEqual(typeof summary.invocations.total, 'number');
      assert.ok(summary.invocations.byRisk, 'Should have byRisk');
      assert.ok(summary.invocations.byMode, 'Should have byMode');

      // Denials structure
      assert.ok(summary.denials, 'Should have denials');
      assert.strictEqual(typeof summary.denials.total, 'number');

      // Top tools structure
      assert.ok(Array.isArray(summary.topTools), 'topTools should be array');
    });

    it('getSummary counts emitted events', () => {
      // Emit some test events
      traceService.emit({
        correlationId: 'c1',
        toolId: 'test.tool1',
        type: 'tool_invoked',
        context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
        summary: 'Test invoke (read_only)',
      });
      traceService.emit({
        correlationId: 'c2',
        toolId: 'test.tool2',
        type: 'tool_invoked',
        context: { countyId: 'benton', userId: 'u1', mode: 'muse' },
        summary: 'Test invoke write_high',
      });

      const summary = metricsService.getSummary('24h', 'benton');

      assert.strictEqual(summary.invocations.total, 2, 'Should count 2 invocations');
      assert.strictEqual(summary.invocations.byMode.pilot, 1, 'Should count 1 pilot mode');
      assert.strictEqual(summary.invocations.byMode.muse, 1, 'Should count 1 muse mode');
    });

    it('getSummary filters by countyId', () => {
      // Events for different counties
      traceService.emit({
        correlationId: 'c1',
        toolId: 'test.tool1',
        type: 'tool_invoked',
        context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
        summary: 'Benton event',
      });
      traceService.emit({
        correlationId: 'c2',
        toolId: 'test.tool2',
        type: 'tool_invoked',
        context: { countyId: 'yakima', userId: 'u2', mode: 'pilot' },
        summary: 'Yakima event',
      });

      const bentonSummary = metricsService.getSummary('24h', 'benton');
      const yakimaSummary = metricsService.getSummary('24h', 'yakima');

      assert.strictEqual(bentonSummary.invocations.total, 1, 'Benton should only see 1');
      assert.strictEqual(yakimaSummary.invocations.total, 1, 'Yakima should only see 1');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // HIGH RISK FEED TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('HighRiskFeed', () => {
    let traceService;
    let metricsService;

    beforeEach(() => {
      traceService = new TraceService({ ringBufferSize: 100 });
      metricsService = createMetricsService(traceService);
    });

    it('getHighRiskFeed returns valid structure', () => {
      const feed = metricsService.getHighRiskFeed(50, 'benton');

      assert.ok(feed, 'Feed should exist');
      assert.ok(Array.isArray(feed.events), 'events should be array');
      assert.strictEqual(typeof feed.hasMore, 'boolean', 'hasMore should be boolean');
    });

    it('getHighRiskFeed filters by countyId', () => {
      traceService.emit({
        correlationId: 'c1',
        toolId: 'test.benton',
        type: 'tool_invoked',
        context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
        summary: 'Benton write_high event',
      });
      traceService.emit({
        correlationId: 'c2',
        toolId: 'test.yakima',
        type: 'tool_invoked',
        context: { countyId: 'yakima', userId: 'u2', mode: 'pilot' },
        summary: 'Yakima write_high event',
      });

      const bentonFeed = metricsService.getHighRiskFeed(50, 'benton');
      const yakimaFeed = metricsService.getHighRiskFeed(50, 'yakima');

      assert.strictEqual(bentonFeed.events.length, 1, 'Benton sees only Benton events');
      assert.strictEqual(yakimaFeed.events.length, 1, 'Yakima sees only Yakima events');
    });

    it('getHighRiskFeed respects limit', () => {
      // Add many high-risk events
      for (let i = 0; i < 10; i++) {
        traceService.emit({
          correlationId: `c${i}`,
          toolId: `test.tool${i}`,
          type: 'tool_invoked',
          context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
          summary: `Event ${i} write_high`,
        });
      }

      const feed = metricsService.getHighRiskFeed(5, 'benton');

      assert.strictEqual(feed.events.length, 5, 'Should respect limit of 5');
      assert.strictEqual(feed.hasMore, true, 'Should indicate more available');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TOP TOOLS TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Top Tools', () => {
    let traceService;
    let metricsService;

    beforeEach(() => {
      traceService = new TraceService({ ringBufferSize: 100 });
      metricsService = createMetricsService(traceService);
    });

    it('ranks tools by usage count descending', () => {
      // tool1: 3 uses, tool2: 1 use, tool3: 2 uses
      for (let i = 0; i < 3; i++) {
        traceService.emit({
          correlationId: `c1-${i}`,
          toolId: 'test.tool1',
          type: 'tool_invoked',
          context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
          summary: 'Tool 1',
        });
      }
      traceService.emit({
        correlationId: 'c2',
        toolId: 'test.tool2',
        type: 'tool_invoked',
        context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
        summary: 'Tool 2',
      });
      for (let i = 0; i < 2; i++) {
        traceService.emit({
          correlationId: `c3-${i}`,
          toolId: 'test.tool3',
          type: 'tool_invoked',
          context: { countyId: 'benton', userId: 'u1', mode: 'pilot' },
          summary: 'Tool 3',
        });
      }

      const summary = metricsService.getSummary('24h', 'benton');

      assert.strictEqual(summary.topTools.length, 3, 'Should have 3 tools');
      assert.strictEqual(summary.topTools[0].toolId, 'test.tool1', 'Tool1 should be first');
      assert.strictEqual(summary.topTools[0].count, 3, 'Tool1 should have 3 uses');
      assert.strictEqual(summary.topTools[1].toolId, 'test.tool3', 'Tool3 should be second');
      assert.strictEqual(summary.topTools[1].count, 2, 'Tool3 should have 2 uses');
      assert.strictEqual(summary.topTools[2].toolId, 'test.tool2', 'Tool2 should be third');
      assert.strictEqual(summary.topTools[2].count, 1, 'Tool2 should have 1 use');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
// Tests: 12 total
//   - Role gating: 4
//   - MetricsService: 3
//   - HighRiskFeed: 3
//   - Top Tools: 1 (ranking)
//
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════
