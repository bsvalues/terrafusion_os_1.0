import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { CountyCommandStrip } from '../components/CountyCommandStrip';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountyHealthSummaryDto, CountyStudySessionDto } from '../types/countyStudio.types';

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-1',
  countyId: 'benton',
  countyName: 'Benton County',
  taxYear: 2026,
  studyType: 'RatioStudy',
  status: 'Active',
  baselineVersion: null,
  activeSegmentSetId: 'set-1',
  createdAt: '',
  updatedAt: '',
  createdBy: 'test',
  updatedBy: 'test',
};

const summary = (overrides: Partial<CountyHealthSummaryDto> = {}): CountyHealthSummaryDto => ({
  contractId: 'terraforge_operational_health_v1',
  correctionPriorityContractId: 'terraforge_correction_priority_v1',
  studyId: 'study-1',
  countyId: 'benton',
  taxYear: 2026,
  parcelCount: 89247,
  ratioCount: 1240,
  medianRatio: 0.963,
  cod: 12.4,
  prd: 1.012,
  stabilityScore: 84,
  riskScore: 22,
  exceptionCount: 18,
  complianceStatus: 'IaaoCompliant',
  topAlerts: [],
  criticalCount: 3,
  warningCount: 9,
  healthyCount: 22,
  derivedAt: new Date().toISOString(),
  ...overrides,
});

describe('CountyCommandStrip', () => {
  beforeEach(() => {
    act(() => {
      const store = useCountyStudioStore.getState();
      store.setStudy(null);
      store.setSegments([]);
      store.setHealthSummary(null);
      store.setLoadStatus('healthSummary', 'idle');
    });
  });

  it('renders one compact roll posture bar instead of a metric-card farm', () => {
    act(() => {
      const store = useCountyStudioStore.getState();
      store.setStudy(MOCK_STUDY);
      store.setSegments([
        {
          segmentId: 'seg-1',
          segmentSetId: 'set-1',
          name: 'Seg 1',
          segmentType: 'Residential',
          parcelCount: 100,
          medianRatio: 0.95,
          cod: 13.1,
          prd: 1.01,
          stabilityScore: 80,
          riskScore: 21,
          exceptionCount: 2,
          geographyRef: 'NBHD-1',
        },
        {
          segmentId: 'seg-2',
          segmentSetId: 'set-1',
          name: 'Seg 2',
          segmentType: 'Residential',
          parcelCount: 40,
          medianRatio: null,
          cod: null,
          prd: null,
          stabilityScore: 41,
          riskScore: 77,
          exceptionCount: 4,
          geographyRef: 'NBHD-2',
        },
      ]);
      store.setHealthSummary(summary());
      store.setLoadStatus('healthSummary', 'success');
    });

    render(<CountyCommandStrip />);

    expect(screen.getByTestId('county-command-strip')).toBeInTheDocument();
    const posture = screen.getByTestId('county-roll-posture-strip');
    expect(posture).toHaveTextContent('Roll Posture');
    expect(posture).toHaveTextContent('At Risk');
    expect(posture).toHaveTextContent('Median 0.963');
    expect(posture).toHaveTextContent('COD 12.4');
    expect(posture).toHaveTextContent('PRD 1.012');
    expect(posture).toHaveTextContent('3 Critical');
    expect(posture).toHaveTextContent('Defensibility');
    expect(posture).toHaveTextContent(/Trust: provisional/i);
    expect(screen.queryByTestId('command-metric-ratio')).not.toBeInTheDocument();
    expect(screen.queryByTestId('command-metric-cod')).not.toBeInTheDocument();
    expect(screen.queryByTestId('command-metric-prd')).not.toBeInTheDocument();
    expect(screen.queryByText('terraforge_operational_health_v1')).not.toBeInTheDocument();
    expect(screen.queryByText('terraforge_correction_priority_v1')).not.toBeInTheDocument();
  });

  it('renders derive-first guidance when county health is unavailable because no segment set is derived', () => {
    act(() => {
      const store = useCountyStudioStore.getState();
      store.setStudy({ ...MOCK_STUDY, activeSegmentSetId: null });
      store.setLoadStatus(
        'healthSummary',
        'error',
        '[apiFetchJson] 409 Conflict for /county-study/studies/study-1/health-summary — {"error":"Study study-1 has no active segment set. Derive segments first via LeftRail → Derive Segment Metrics."}',
      );
    });

    render(<CountyCommandStrip />);

    expect(screen.getByTestId('county-command-strip-derive-cta')).toHaveTextContent(/derive segment metrics/i);
    expect(screen.queryByTestId('county-command-strip-error')).not.toBeInTheDocument();
  });

  it('surfaces backend errors honestly when county health summary fails', () => {
    act(() => {
      const store = useCountyStudioStore.getState();
      store.setStudy(MOCK_STUDY);
      store.setLoadStatus('healthSummary', 'error', 'HTTP 500: boom');
    });

    render(<CountyCommandStrip />);

    expect(screen.getByTestId('county-command-strip-error')).toHaveTextContent(/HTTP 500: boom/);
  });
});
