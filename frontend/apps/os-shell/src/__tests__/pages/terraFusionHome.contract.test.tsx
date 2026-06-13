/**
 * TerraFusionHome renderer — contract tests.
 *
 * Proves Home is a pure, honest renderer of a PulseHomeSnapshot:
 *   - Renders county scope from the snapshot.
 *   - Live regions render their real data (headline, conditions, actions,
 *     evidence counts with source).
 *   - Unavailable regions show an explicit reason — never fabricated data.
 *   - Loading regions show a loading state, distinct from unavailable.
 *   - With every region unavailable, NO numbers / condition levels / headlines
 *     appear (nothing is invented to fill a gap).
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import TerraFusionHome from '../../pages/TerraFusionHome';
import {
  pulseLive,
  pulseLoading,
  pulseUnavailable,
  type PulseActivityEvent,
  type PulseEvidenceSummary,
  type PulseHomeBrief,
  type PulseHomeSnapshot,
  type PulseSourceAttribution,
} from '../../contracts/pulseHome';

const county = { countyId: 'benton', label: 'Benton County, WA', rollYear: 2026 };

const source: PulseSourceAttribution = {
  system: 'TerraDais certification readiness',
  reference: 'dais:/api/dais/cert/status',
  observedAt: '2026-06-13T07:42:00Z',
};

const liveBrief: PulseHomeBrief = {
  county,
  generatedAt: '2026-06-13T07:42:00Z',
  overallCondition: 'attention',
  headline: 'Certification needs attention: 1 area at risk.',
  conditions: [
    { function: 'certification', level: 'attention', reason: '1 certification area at risk.' },
  ],
  priorityActions: [
    {
      id: 'cert-countywide',
      title: 'Resolve Countywide certification',
      why: 'Countywide certification is at-risk; resolve remaining signoffs.',
      rank: 1,
      urgency: 'this_week',
      dueLabel: 'Due 2026-07-01',
      evidence: [],
      destination: 'certification.roll-readiness',
    },
  ],
  recommendedFirstActionId: 'cert-countywide',
};

function snapshot(over: Partial<PulseHomeSnapshot> = {}): PulseHomeSnapshot {
  return {
    county,
    brief: pulseUnavailable('No governed morning-brief source is wired yet.'),
    activity: pulseUnavailable('No governed activity feed is wired yet.'),
    evidence: pulseUnavailable('No governed evidence source is wired yet.'),
    ...over,
  };
}

describe('TerraFusionHome — scope + landmark', () => {
  it('renders the landmark and county scope from the snapshot', () => {
    render(<TerraFusionHome snapshot={snapshot()} />);
    expect(screen.getByTestId('terrafusion-home')).toBeInTheDocument();
    const truth = screen.getByTestId('tfh-truthbar');
    expect(truth).toHaveTextContent('Benton County, WA');
    expect(truth).toHaveTextContent('2026 Roll');
  });
});

describe('TerraFusionHome — all regions unavailable (no fabrication)', () => {
  it('shows explicit unavailable fallbacks with reasons', () => {
    render(<TerraFusionHome snapshot={snapshot()} />);
    expect(screen.getByTestId('tfh-brief-unavailable')).toHaveTextContent(/wired yet/i);
    expect(screen.getByTestId('tfh-pulse-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('tfh-actions-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('tfh-activity-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('tfh-evidence-unavailable')).toBeInTheDocument();
  });

  it('invents no condition, headline, or count when everything is a gap', () => {
    render(<TerraFusionHome snapshot={snapshot()} />);
    expect(screen.queryByTestId('tfh-brief-live')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tfh-pulse-live')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tfh-evidence-live')).not.toBeInTheDocument();
    // No condition labels invented.
    for (const label of ['Stable', 'Watching', 'Attention', 'Critical']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    // Truth bar shows no "Condition:" because the brief is not live.
    expect(screen.getByTestId('tfh-truthbar')).not.toHaveTextContent('Condition:');
  });
});

describe('TerraFusionHome — live brief', () => {
  it('renders headline, condition, action, and source', () => {
    render(<TerraFusionHome snapshot={snapshot({ brief: pulseLive(liveBrief, source) })} />);

    expect(screen.getByTestId('tfh-brief-live')).toHaveTextContent(
      'Certification needs attention: 1 area at risk.'
    );
    // condition row + truth bar both render an "Attention" pill
    expect(screen.getAllByText('Attention').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('tfh-pulse-live')).toHaveTextContent('1 certification area at risk.');

    const actions = screen.getByTestId('tfh-actions-live');
    expect(actions).toHaveTextContent('Resolve Countywide certification');
    expect(actions).toHaveTextContent('resolve remaining signoffs');
    expect(actions).toHaveTextContent('Due 2026-07-01');

    // Source attribution is shown for the live brief.
    expect(screen.getByTestId('tfh-brief-live')).toHaveTextContent(/Source: TerraDais certification readiness/);
  });

  it('shows "No actions required" for a live brief with no actions', () => {
    const calm: PulseHomeBrief = {
      ...liveBrief,
      overallCondition: 'stable',
      headline: 'Roll certification is complete across all areas.',
      conditions: [{ function: 'certification', level: 'stable', reason: 'All certification areas complete.' }],
      priorityActions: [],
      recommendedFirstActionId: undefined,
    };
    render(<TerraFusionHome snapshot={snapshot({ brief: pulseLive(calm, source) })} />);
    expect(screen.getByTestId('tfh-actions-empty')).toBeInTheDocument();
  });
});

describe('TerraFusionHome — loading regions', () => {
  it('shows loading states distinct from unavailable', () => {
    render(
      <TerraFusionHome
        snapshot={snapshot({
          brief: pulseLoading(),
          activity: pulseLoading(),
          evidence: pulseLoading(),
        })}
      />
    );
    expect(screen.getByTestId('tfh-brief-loading')).toBeInTheDocument();
    expect(screen.getByTestId('tfh-activity-loading')).toBeInTheDocument();
    expect(screen.getByTestId('tfh-evidence-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('tfh-brief-unavailable')).not.toBeInTheDocument();
  });
});

describe('TerraFusionHome — live activity + evidence', () => {
  it('renders activity events from a live read', () => {
    const events: PulseActivityEvent[] = [
      {
        id: 'e1',
        kind: 'ratio_study_updated',
        occurredAt: '2026-06-13T07:42:00Z',
        summary: 'Ratio study updated',
        detail: 'Grandview East commercial',
        source,
      },
    ];
    render(<TerraFusionHome snapshot={snapshot({ activity: pulseLive(events, source) })} />);
    const list = screen.getByTestId('tfh-activity-live');
    expect(list).toHaveTextContent('Ratio study updated');
    expect(list).toHaveTextContent('Grandview East commercial');
  });

  it('renders evidence counts with source from a live read', () => {
    const ev: PulseEvidenceSummary = {
      items: [
        {
          id: 'ev-sales',
          kind: 'qualified_sales',
          label: 'Qualified sales reviewed',
          count: 31,
          detail: 'last 90 days',
          source,
        },
      ],
    };
    render(<TerraFusionHome snapshot={snapshot({ evidence: pulseLive(ev, source) })} />);
    const list = screen.getByTestId('tfh-evidence-live');
    expect(list).toHaveTextContent('31');
    expect(list).toHaveTextContent('Qualified sales reviewed');
    expect(list).toHaveTextContent(/Source:/);
  });
});
