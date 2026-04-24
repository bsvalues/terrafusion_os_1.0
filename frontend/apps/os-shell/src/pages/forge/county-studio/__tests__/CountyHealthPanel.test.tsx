// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyHealthPanel.test.tsx
//
// Task C — Dense unit tests for CountyHealthPanel covering every state:
//   loading / empty (409) / error / populated, plus drill-through and
//   composite-risk pill colour correctness.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { CountyHealthPanel } from '../components/CountyHealthPanel';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type {
  CountyHealthSummaryDto,
  HealthAlertDto,
  CountyStudySessionDto,
} from '../types/countyStudio.types';

// useStudyData is only used for retryHealthSummary — stub it so the panel
// renders without kicking off real fetches.
const retryHealthSummaryMock = vi.fn(async () => {});
vi.mock('../hooks/useStudyData', () => ({
  useStudyData: () => ({
    retrySegments: vi.fn(async () => {}),
    retryCohorts: vi.fn(async () => {}),
    retryScenarios: vi.fn(async () => {}),
    retryCityRollup: vi.fn(async () => {}),
    retryNeighborhoodRollup: vi.fn(async () => {}),
    retryHealthSummary: retryHealthSummaryMock,
    retryAll: vi.fn(async () => {}),
  }),
}));

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-1', countyId: 'benton', taxYear: 2026,
  studyType: 'RatioStudy', status: 'Draft',
  baselineVersion: null, activeSegmentSetId: 'set-1',
  createdAt: '', updatedAt: '', createdBy: 'test', updatedBy: 'test',
};

const alert = (
  overrides: Partial<HealthAlertDto> = {},
): HealthAlertDto => ({
  segmentId: 'seg-1',
  segmentName: 'NBHD-K1 · R1 · GOOD',
  neighborhoodCode: 'NBHD-K1',
  city: 'Kennewick',
  parcelCount: 120,
  medianRatio: 0.88,
  cod: 27.4,
  prd: 1.04,
  exceptionCount: 12,
  compositeRisk: 72,
  reasons: ['COD 27.4 exceeds IAAO ceiling (20)', 'median 0.88 outside fair range (0.90–1.10)'],
  ...overrides,
});

const summary = (overrides: Partial<CountyHealthSummaryDto> = {}): CountyHealthSummaryDto => ({
  studyId: 'study-1',
  countyId: 'benton',
  taxYear: 2026,
  parcelCount: 89_247,
  ratioCount: 1_240,
  medianRatio: 0.96,
  cod: 12.3,
  prd: 1.01,
  stabilityScore: 85,
  riskScore: 22,
  exceptionCount: 8,
  complianceStatus: 'IaaoCompliant',
  topAlerts: [
    alert({ segmentId: 's1', compositeRisk: 82, segmentName: 'Seg1', city: 'Kennewick', neighborhoodCode: 'NBHD-K1' }),
    alert({ segmentId: 's2', compositeRisk: 48, segmentName: 'Seg2', city: 'Richland',  neighborhoodCode: 'NBHD-R1' }),
    alert({ segmentId: 's3', compositeRisk: 22, segmentName: 'Seg3', city: 'Pasco',     neighborhoodCode: 'NBHD-P1' }),
  ],
  criticalCount: 1,
  warningCount: 3,
  healthyCount: 8,
  derivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  ...overrides,
});

describe('CountyHealthPanel', () => {
  beforeEach(() => {
    act(() => {
      const s = useCountyStudioStore.getState();
      s.setStudy(MOCK_STUDY);
      s.setHealthSummary(null);
      s.setLoadStatus('healthSummary', 'idle');
      s.drillToCounty();
    });
    retryHealthSummaryMock.mockClear();
  });

  it('renders loading skeleton while loading', () => {
    act(() => { useCountyStudioStore.getState().setLoadStatus('healthSummary', 'loading'); });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('health-panel-loading')).toBeInTheDocument();
  });

  it('renders empty-state CTA on 409 error', () => {
    act(() => {
      useCountyStudioStore.getState().setLoadStatus(
        'healthSummary', 'error', 'HTTP 409: /county-study/studies/study-1/health-summary');
    });
    render(<CountyHealthPanel />);
    const empty = screen.getByTestId('health-panel-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent(/Derive Segment Metrics/i);
  });

  it('renders error state with retry button for non-409 errors', () => {
    act(() => {
      useCountyStudioStore.getState().setLoadStatus(
        'healthSummary', 'error', 'HTTP 500: boom');
    });
    render(<CountyHealthPanel />);
    const err = screen.getByTestId('health-panel-error');
    expect(err).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('health-panel-retry'));
    expect(retryHealthSummaryMock).toHaveBeenCalledOnce();
  });

  it('renders populated panel with all four summary cards', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(summary());
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('county-health-panel')).toBeInTheDocument();
    expect(screen.getByTestId('health-card-lamp')).toBeInTheDocument();
    expect(screen.getByTestId('health-card-median')).toHaveTextContent('0.960');
    expect(screen.getByTestId('health-card-cod')).toHaveTextContent('12.3');
    expect(screen.getByTestId('health-card-prd')).toHaveTextContent('1.010');
  });

  it('IAAO lamp reflects compliance status', () => {
    const cases: Array<[CountyHealthSummaryDto['complianceStatus'], string]> = [
      ['IaaoCompliant',     'IAAO Compliant'],
      ['MarginalCompliance','Marginal'],
      ['NonCompliant',      'Non-compliant'],
      ['InsufficientData',  'Insufficient Data'],
    ];
    for (const [status, label] of cases) {
      act(() => {
        useCountyStudioStore.getState().setHealthSummary(summary({ complianceStatus: status }));
        useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
      });
      const { unmount } = render(<CountyHealthPanel />);
      const lamp = screen.getByTestId('health-lamp');
      expect(lamp.getAttribute('data-status')).toBe(status);
      expect(screen.getByLabelText(new RegExp(label, 'i'))).toBeInTheDocument();
      unmount();
    }
  });

  it('renders top-5 alerts with correct composite-risk pill colour bucket', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(summary());
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    const pills = screen.getAllByTestId('composite-risk-pill');
    expect(pills).toHaveLength(3);
    expect(pills[0].getAttribute('data-bucket')).toBe('high');   // 82
    expect(pills[1].getAttribute('data-bucket')).toBe('medium'); // 48
    expect(pills[2].getAttribute('data-bucket')).toBe('low');    // 22
  });

  it('clicking a top-5 alert drills to its segment', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(summary());
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    const rows = screen.getAllByTestId('health-alert-row');
    fireEvent.click(rows[1]); // Seg2 @ Richland / NBHD-R1
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('neighborhood');
    expect(s.selectedCity).toBe('Richland');
    expect(s.selectedNeighborhood).toBe('NBHD-R1');
    expect(s.selectedSegmentId).toBe('s2');
  });

  it('severity bars show Critical / Warning / Healthy counts', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(
        summary({ criticalCount: 4, warningCount: 6, healthyCount: 10 }));
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('severity-bar-critical')).toHaveTextContent('4');
    expect(screen.getByTestId('severity-bar-warning')).toHaveTextContent('6');
    expect(screen.getByTestId('severity-bar-healthy')).toHaveTextContent('10');
  });

  it('clicking Critical bar collapses drill back to county landing', () => {
    act(() => {
      useCountyStudioStore.getState().drillToCity('Kennewick');
      useCountyStudioStore.getState().setHealthSummary(summary());
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    fireEvent.click(screen.getByTestId('severity-bar-critical'));
    expect(useCountyStudioStore.getState().drillLevel).toBe('county');
  });

  it('footer surfaces "derived N hours ago" relative time', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(
        summary({ derivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }));
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('health-derived-timestamp')).toHaveTextContent(/3 hours ago/);
  });

  it('null metrics render em-dash instead of throwing', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(
        summary({ medianRatio: null, cod: null, prd: null }));
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('health-card-median')).toHaveTextContent('—');
    expect(screen.getByTestId('health-card-cod')).toHaveTextContent('—');
    expect(screen.getByTestId('health-card-prd')).toHaveTextContent('—');
  });

  it('populated panel reflects ratio + parcel counts in the lamp card subtext', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(
        summary({ ratioCount: 1_500, parcelCount: 42_000 }));
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    expect(screen.getByTestId('health-card-lamp'))
      .toHaveTextContent(/1,500 sales/);
    expect(screen.getByTestId('health-card-lamp'))
      .toHaveTextContent(/42,000 parcels/);
  });

  it('info tooltip exposes composite-risk explanation for hover/keyboard', () => {
    act(() => {
      useCountyStudioStore.getState().setHealthSummary(summary());
      useCountyStudioStore.getState().setLoadStatus('healthSummary', 'success');
    });
    render(<CountyHealthPanel />);
    const info = screen.getByTestId('health-risk-info');
    const label = info.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/COD ceiling/);
    expect(label).toMatch(/vertical-equity/);
    expect(label).toMatch(/exception rate/);
  });
});
