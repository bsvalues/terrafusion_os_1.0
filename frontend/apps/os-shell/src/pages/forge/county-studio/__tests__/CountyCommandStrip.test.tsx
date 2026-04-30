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

  it('renders compact countywide metrics when health summary exists', () => {
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
    expect(screen.getByTestId('command-metric-ratio')).toHaveTextContent('0.963');
    expect(screen.getByTestId('command-metric-cod')).toHaveTextContent('12.4');
    expect(screen.getByTestId('command-metric-prd')).toHaveTextContent('1.012');
    expect(screen.getByTestId('command-metric-critical')).toHaveTextContent('3');
    expect(screen.getByTestId('command-metric-warning')).toHaveTextContent('9');
    expect(screen.getByTestId('command-metric-needs-data')).toHaveTextContent('1');
    expect(screen.getByTestId('command-metric-exceptions')).toHaveTextContent('18');
    expect(screen.getByTestId('operational-contract-id')).toHaveTextContent('terraforge_operational_health_v1');
    expect(screen.getByTestId('correction-contract-id')).toHaveTextContent('terraforge_correction_priority_v1');
    expect(screen.getByTestId('county-trust-posture')).toHaveTextContent(/Benton production provisional/i);
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
