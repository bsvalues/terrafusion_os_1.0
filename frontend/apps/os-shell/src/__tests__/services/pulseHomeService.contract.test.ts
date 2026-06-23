/**
 * Pulse Home Read Layer (MVP) — contract tests.
 *
 * Proves the unavailable-safe adapter behaves honestly:
 *   - Default readers report an explicit gap for every region (no fabrication).
 *   - County scope + label resolve correctly (label defaults to countyId).
 *   - PARTIAL availability: a live region coexists with unavailable regions.
 *   - A throwing reader is mapped to unavailable, never a crash or a value.
 *   - Live regions always carry their source.
 *
 * Service-only: no UI is rendered.
 */

import { describe, it, expect } from 'vitest';
import {
  getPulseHomeSnapshot,
  DEFAULT_PULSE_HOME_READERS,
  type PulseHomeReaders,
} from '../../services/pulse/pulseHomeService';
import {
  isPulseLive,
  isPulseUnavailable,
  pulseLive,
  pulseUnavailable,
  type PulseActivityEvent,
  type PulseEvidenceSummary,
  type PulseHomeBrief,
  type PulseSourceAttribution,
} from '../../contracts/pulseHome';

const source: PulseSourceAttribution = {
  system: 'TerraForge ratio study',
  reference: 'ratio-study:2026-06-13',
  observedAt: '2026-06-13T07:42:00Z',
};

const liveBrief: PulseHomeBrief = {
  county: { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 },
  generatedAt: '2026-06-13T07:42:00Z',
  overallCondition: 'attention',
  headline: 'One function needs attention.',
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

describe('getPulseHomeSnapshot — default (no sources wired)', () => {
  it('reports an explicit gap for every region', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026);
    expect(isPulseUnavailable(snap.brief)).toBe(true);
    expect(isPulseUnavailable(snap.activity)).toBe(true);
    expect(isPulseUnavailable(snap.evidence)).toBe(true);
    if (isPulseUnavailable(snap.brief)) {
      expect(snap.brief.reason).toMatch(/unavailable rather than fabricated/i);
    }
  });

  it('scopes the snapshot to the county + roll year (label defaults to id)', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026);
    expect(snap.county).toEqual({ countyId: 'benton', label: 'benton', rollYear: 2026 });
  });

  it('uses a provided label without inventing one', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026, { label: 'Benton County, WA' });
    expect(snap.county.label).toBe('Benton County, WA');
  });

  it('default readers never synthesize data', async () => {
    const ctx = { county: { countyId: 'benton', label: 'benton', rollYear: 2026 } };
    expect(isPulseUnavailable(await DEFAULT_PULSE_HOME_READERS.readBrief(ctx))).toBe(true);
    expect(isPulseUnavailable(await DEFAULT_PULSE_HOME_READERS.readActivity(ctx))).toBe(true);
    expect(isPulseUnavailable(await DEFAULT_PULSE_HOME_READERS.readEvidence(ctx))).toBe(true);
  });
});

describe('getPulseHomeSnapshot — partial availability', () => {
  it('renders a live brief alongside unavailable activity + evidence', async () => {
    const readers: Partial<PulseHomeReaders> = {
      readBrief: async () => pulseLive(liveBrief, source),
    };
    const snap = await getPulseHomeSnapshot('benton', 2026, { readers });

    expect(isPulseLive(snap.brief)).toBe(true);
    expect(isPulseUnavailable(snap.activity)).toBe(true);
    expect(isPulseUnavailable(snap.evidence)).toBe(true);

    // A live region must carry its source.
    if (isPulseLive(snap.brief)) {
      expect(snap.brief.source).toBe(source);
      expect(snap.brief.data.recommendedFirstActionId).toBe('act-1');
    }
  });

  it('supports all three regions live, each with a source', async () => {
    const activity: PulseActivityEvent[] = [
      {
        id: 'evt-1',
        kind: 'ratio_study_updated',
        occurredAt: '2026-06-13T07:42:00Z',
        summary: 'Ratio study updated',
        source,
      },
    ];
    const evidence: PulseEvidenceSummary = {
      items: [
        {
          id: 'ev-sales',
          kind: 'qualified_sales',
          label: 'Qualified sales reviewed',
          count: 31,
          source,
        },
      ],
    };
    const snap = await getPulseHomeSnapshot('benton', 2026, {
      readers: {
        readBrief: async () => pulseLive(liveBrief, source),
        readActivity: async () => pulseLive(activity, source),
        readEvidence: async () => pulseLive(evidence, source),
      },
    });

    expect(isPulseLive(snap.brief)).toBe(true);
    expect(isPulseLive(snap.activity)).toBe(true);
    expect(isPulseLive(snap.evidence)).toBe(true);
  });
});

describe('getPulseHomeSnapshot — reader failure is a gap, not a crash', () => {
  it('maps a throwing reader to unavailable while other regions resolve', async () => {
    const snap = await getPulseHomeSnapshot('benton', 2026, {
      readers: {
        readEvidence: async () => {
          throw new Error('endpoint 503');
        },
        readBrief: async () => pulseLive(liveBrief, source),
      },
    });

    expect(isPulseLive(snap.brief)).toBe(true);
    expect(isPulseUnavailable(snap.evidence)).toBe(true);
    if (isPulseUnavailable(snap.evidence)) {
      expect(snap.evidence.reason).toMatch(/evidence read failed: endpoint 503/i);
    }
  });
});
