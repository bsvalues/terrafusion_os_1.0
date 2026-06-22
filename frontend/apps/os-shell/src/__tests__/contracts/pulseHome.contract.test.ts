/**
 * PulseHome contract tests — unavailable-safe semantics.
 *
 * These guard the honesty invariants of the future live Home data layer:
 *   - A live read always carries a source (no live-without-source).
 *   - An unavailable read carries a reason and NO data field.
 *   - loading is distinct from unavailable.
 *   - Guards and helpers force callers to handle the gap, not fabricate.
 *
 * Design-only: this exercises the contract module, not any UI.
 */

import { describe, it, expect } from 'vitest';
import {
  formatPulseSource,
  isPulseLive,
  isPulseLoading,
  isPulseUnavailable,
  pulseDataOrNull,
  pulseLive,
  pulseLoading,
  pulseUnavailable,
  type PulseHomeBrief,
  type PulseRead,
  type PulseSourceAttribution,
} from '../../contracts/pulseHome';

const source: PulseSourceAttribution = {
  system: 'TerraForge ratio study',
  reference: 'ratio-study:2026-06-13',
  observedAt: '2026-06-13T07:42:00Z',
};

describe('PulseRead — live', () => {
  it('carries data and a source', () => {
    const read = pulseLive({ value: 0.89 }, source);
    expect(read.state).toBe('live');
    expect(read.data).toEqual({ value: 0.89 });
    expect(read.source).toBe(source);
  });

  it('is narrowed by isPulseLive', () => {
    const read: PulseRead<number> = pulseLive(42, source);
    expect(isPulseLive(read)).toBe(true);
    if (isPulseLive(read)) {
      // type-narrowed access — compiles only because source is guaranteed
      expect(read.source.reference).toBe('ratio-study:2026-06-13');
    }
  });
});

describe('PulseRead — unavailable', () => {
  it('carries a reason and exposes no data field', () => {
    const read = pulseUnavailable('TerraForge ratio study returned no data.');
    expect(read.state).toBe('unavailable');
    expect(read.reason).toMatch(/returned no data/i);
    expect('data' in read).toBe(false);
    expect('source' in read).toBe(false);
  });

  it('is narrowed by isPulseUnavailable', () => {
    const read: PulseRead<number> = pulseUnavailable('gap');
    expect(isPulseUnavailable(read)).toBe(true);
  });
});

describe('PulseRead — loading', () => {
  it('is distinct from unavailable', () => {
    const read = pulseLoading();
    expect(read.state).toBe('loading');
    expect(isPulseLoading(read)).toBe(true);
    expect(isPulseUnavailable(read)).toBe(false);
    expect(isPulseLive(read)).toBe(false);
  });
});

describe('pulseDataOrNull — forces gap handling', () => {
  it('returns data only when live', () => {
    expect(pulseDataOrNull(pulseLive(7, source))).toBe(7);
  });

  it('returns null for unavailable and loading (never a fabricated default)', () => {
    expect(pulseDataOrNull(pulseUnavailable('gap'))).toBeNull();
    expect(pulseDataOrNull(pulseLoading())).toBeNull();
  });
});

describe('formatPulseSource', () => {
  it('renders system and reference together', () => {
    expect(formatPulseSource(source)).toBe(
      'TerraForge ratio study · ratio-study:2026-06-13'
    );
  });
});

describe('PulseHomeBrief — shape sanity', () => {
  it('supports a live brief with sourced conditions and ranked actions', () => {
    const brief: PulseHomeBrief = {
      county: { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 },
      generatedAt: '2026-06-13T07:42:00Z',
      overallCondition: 'attention',
      headline: 'Two functions need attention.',
      conditions: [
        {
          function: 'valuation',
          level: 'attention',
          reason: 'Commercial ratio slipped below tolerance.',
          destination: 'forge.valuation-review',
        },
      ],
      priorityActions: [
        {
          id: 'act-1',
          title: 'Review Grandview East calibration',
          why: 'Median ratio moved below tolerance.',
          rank: 1,
          urgency: 'today',
          evidence: [{ evidenceId: 'ev-sales', label: 'qualified sales' }],
          destination: 'forge.valuation-review',
        },
      ],
      recommendedFirstActionId: 'act-1',
    };

    const read: PulseRead<PulseHomeBrief> = pulseLive(brief, source);
    expect(isPulseLive(read)).toBe(true);
    expect(brief.priorityActions[0].rank).toBe(1);
    // Counts are not inlined on the action — they reference evidence ids.
    expect(brief.priorityActions[0].evidence[0].evidenceId).toBe('ev-sales');
  });
});
