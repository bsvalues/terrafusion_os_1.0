/**
 * Pulse Function Summary — aggregation / partial-availability tests.
 *
 * Proves the aggregator surfaces real partial availability across multiple
 * providers: certification + appeals live (each with its own state), while a
 * not-yet-wired function reports unavailable and another reports loading.
 * No function's truth is borrowed to cover another's gap.
 */

import { describe, it, expect } from 'vitest';
import {
  projectAvailability,
  summarizePulseFunctions,
  type PulseFunctionSource,
} from '../../services/pulse/pulseFunctionSummary';
import { readCertificationBrief } from '../../services/pulse/providers/certificationPulseProvider';
import { readAppealsBrief } from '../../services/pulse/providers/appealsPulseProvider';
import {
  pulseLive,
  pulseLoading,
  pulseUnavailable,
  type PulseHomeBrief,
  type PulseSourceAttribution,
} from '../../contracts/pulseHome';
import type { CertificationStatus } from '../../services/suites/daisService';

const county = { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 };

const source: PulseSourceAttribution = {
  system: 'test',
  reference: 'test:ref',
  observedAt: '2026-06-13T00:00:00Z',
};

const sampleBrief: PulseHomeBrief = {
  county,
  generatedAt: '2026-06-13T00:00:00Z',
  overallCondition: 'watching',
  headline: 'h',
  conditions: [{ function: 'certification', level: 'watching', reason: 'in progress' }],
  priorityActions: [],
};

describe('projectAvailability — all three states', () => {
  it('projects a live read to its function level + reason', () => {
    const a = projectAvailability('certification', pulseLive(sampleBrief, source));
    expect(a).toEqual({
      function: 'certification',
      state: 'live',
      level: 'watching',
      reason: 'in progress',
    });
  });

  it('projects an unavailable read to a gap with its reason', () => {
    const a = projectAvailability('appeals', pulseUnavailable('no source'));
    expect(a.state).toBe('unavailable');
    expect(a.reason).toBe('no source');
    expect(a.level).toBeUndefined();
  });

  it('projects a loading read to loading with no level', () => {
    const a = projectAvailability('notices', pulseLoading());
    expect(a.state).toBe('loading');
    expect(a.level).toBeUndefined();
    expect(a.reason).toBeUndefined();
  });
});

describe('summarizePulseFunctions — real partial availability', () => {
  it('mixes live certification + live appeals + unavailable exemptions', async () => {
    const certRows: CertificationStatus[] = [
      {
        area: 'Countywide',
        totalParcels: 100,
        completedParcels: 99,
        percentComplete: 99,
        deadline: '2026-07-01',
        status: 'at-risk',
      },
    ];

    const sources: PulseFunctionSource[] = [
      {
        function: 'certification',
        read: (c) => readCertificationBrief(c, { getCertificationStatus: async () => certRows }),
      },
      {
        function: 'appeals',
        read: (c) => readAppealsBrief(c, { getAllAppeals: async () => [] }),
      },
      {
        // not yet wired — honest gap, not a fabricated "stable"
        function: 'exemptions',
        read: async () => pulseUnavailable('No governed exemptions source is wired yet.'),
      },
    ];

    const summary = await summarizePulseFunctions(county, sources);
    const byFn = Object.fromEntries(summary.map((s) => [s.function, s]));

    expect(byFn.certification.state).toBe('live');
    expect(byFn.certification.level).toBe('attention');

    expect(byFn.appeals.state).toBe('live');
    expect(byFn.appeals.level).toBe('stable');

    expect(byFn.exemptions.state).toBe('unavailable');
    expect(byFn.exemptions.reason).toMatch(/no governed exemptions source is wired/i);
  });

  it('reports a throwing provider as unavailable without sinking the rest', async () => {
    const sources: PulseFunctionSource[] = [
      {
        function: 'appeals',
        read: (c) => readAppealsBrief(c, { getAllAppeals: async () => [] }),
      },
      {
        function: 'certification',
        read: async () => {
          throw new Error('boom');
        },
      },
    ];

    const summary = await summarizePulseFunctions(county, sources);
    const byFn = Object.fromEntries(summary.map((s) => [s.function, s]));

    expect(byFn.appeals.state).toBe('live');
    expect(byFn.certification.state).toBe('unavailable');
    expect(byFn.certification.reason).toMatch(/certification read failed: boom/i);
  });
});
