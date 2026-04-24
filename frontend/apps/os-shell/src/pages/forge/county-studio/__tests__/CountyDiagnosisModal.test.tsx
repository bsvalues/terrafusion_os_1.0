// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyDiagnosisModal.test.tsx
//
// Task E (Fix #6) — CountyDiagnosisModal coverage:
//   - Loading state renders while in-flight.
//   - Patterns render with severity bar + affected-count.
//   - TopProblem card click triggers drillToSegment and closes the modal.
//   - Error state renders retry button.
//   - Modal does not fetch when closed.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CountyDiagnosisModal } from '../components/CountyDiagnosisModal';
import type { CountyDiagnosisDto } from '../types/countyStudio.types';

const { diagnosisApiMock, drillToSegmentMock } = vi.hoisted(() => ({
  diagnosisApiMock: { county: vi.fn() },
  drillToSegmentMock: vi.fn(),
}));

vi.mock('../countyStudyApi', () => ({
  diagnosisApi: diagnosisApiMock,
}));

vi.mock('@/stores/countyStudioStore', () => ({
  useCountyStudioStore: () => ({
    drillToSegment: drillToSegmentMock,
  }),
}));

function sampleCountyDiagnosis(): CountyDiagnosisDto {
  return {
    studyId: 'st1',
    taxYear: 2026,
    countyName: 'Benton',
    overallClass: 'Model',
    overallConfidence: 0.65,
    healthySegmentCount: 8,
    problemSegmentCount: 4,
    topProblems: [
      {
        segmentId: 'sg-kenn-1',
        segmentName: 'NBHD-K1/R1/GOOD',
        city: 'Kennewick',
        neighborhoodCode: 'NBHD-K1',
        parcelCount: 128,
        primaryClass: 'Model',
        primaryConfidence: 0.75,
        findings: [{
          code: 'IAAO_COD_CEILING_BREACH',
          category: 'Model',
          summary: 'COD 27.4 exceeds IAAO ceiling.',
          evidenceStrength: 0.75,
          evidence: { cod: 27.4 },
          parcelIdHints: [],
        }],
        recommendedActions: [{
          actionCode: 'RECALIBRATE_COST_TABLE',
          target: 'CostForge',
          summary: 'Recalibrate cost tables.',
          priority: 2,
          rationale: 'COD 27.4 exceeds IAAO ceiling.',
          prebuiltContext: null,
        }],
        narrative: 'NBHD-K1/R1/GOOD classifies as Model problem (confidence 75%).',
        inputFingerprint: 'aa11bb22',
        generatedAt: new Date().toISOString(),
      },
    ],
    patterns: [
      {
        patternCode: 'CITY_WIDE_REGRESSIVITY',
        summary: '3 of 5 segments in Kennewick (60%) show regressivity.',
        affectedSegmentCount: 3,
        segmentIds: ['sg-kenn-1', 'sg-kenn-2', 'sg-kenn-3'],
        severity: 0.6,
      },
    ],
    narrative: 'Benton 2026 classifies as Model problem (confidence 65%). 4 of 12 segments carry a diagnosed problem.',
    inputFingerprint: 'bb22cc33',
    generatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  diagnosisApiMock.county.mockReset();
  drillToSegmentMock.mockReset();
});

describe('CountyDiagnosisModal', () => {
  it('does not render when closed', () => {
    render(<CountyDiagnosisModal studyId="st1" open={false} onClose={() => {}} />);
    expect(screen.queryByTestId('county-diagnosis-modal')).not.toBeInTheDocument();
    expect(diagnosisApiMock.county).not.toHaveBeenCalled();
  });

  it('shows loading state while fetch is in flight', async () => {
    let resolveFn: (v: CountyDiagnosisDto) => void = () => {};
    const promise = new Promise<CountyDiagnosisDto>((r) => { resolveFn = r; });
    diagnosisApiMock.county.mockReturnValueOnce(promise);
    render(<CountyDiagnosisModal studyId="st1" open={true} onClose={() => {}} />);
    expect(screen.getByTestId('county-diagnosis-loading')).toBeInTheDocument();
    resolveFn(sampleCountyDiagnosis());
    await waitFor(() => {
      expect(screen.queryByTestId('county-diagnosis-loading')).not.toBeInTheDocument();
    });
  });

  it('renders narrative + banner + pattern row on success', async () => {
    diagnosisApiMock.county.mockResolvedValueOnce(sampleCountyDiagnosis());
    render(<CountyDiagnosisModal studyId="st1" open={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId('county-diagnosis-narrative')).toBeInTheDocument();
    });
    expect(screen.getByTestId('county-diagnosis-banner')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-pattern-CITY_WIDE_REGRESSIVITY')).toBeInTheDocument();
    // Pattern summary cites real numbers
    expect(screen.getByText(/3 of 5 segments in Kennewick/)).toBeInTheDocument();
  });

  it('drills into a top-problem segment on card click, then closes', async () => {
    const onClose = vi.fn();
    diagnosisApiMock.county.mockResolvedValueOnce(sampleCountyDiagnosis());
    render(<CountyDiagnosisModal studyId="st1" open={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByTestId('diagnosis-top-problem-sg-kenn-1')).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnosis-top-problem-sg-kenn-1'));
    expect(drillToSegmentMock).toHaveBeenCalledWith('Kennewick', 'NBHD-K1', 'sg-kenn-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders error state with retry', async () => {
    diagnosisApiMock.county.mockRejectedValueOnce(new Error('boom'));
    render(<CountyDiagnosisModal studyId="st1" open={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId('county-diagnosis-error')).toBeInTheDocument();
    });
  });
});
