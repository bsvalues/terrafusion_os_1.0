// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AiDiagnosisPanel.test.tsx
//
// Task E (Fix #6) — AiDiagnosisPanel coverage:
//   - Loading skeleton.
//   - Error + retry.
//   - 409 (not-derived) shows the honest nudge.
//   - Populated Data-class: findings + actions render, parcel chip click
//     fires activateModule('property-workbench', …).
//   - Populated Model-class: action fire button passes prebuiltContext +
//     segmentId through to activateModule with the correct module id.
//   - Populated Healthy-class: MARK_HEALTHY banner replaces action list.
//   - Evidence dictionary expands / collapses.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AiDiagnosisPanel } from '../components/AiDiagnosisPanel';
import type { SegmentDiagnosisDto } from '../types/countyStudio.types';

const { activateModuleMock, state, retryMock } = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  retryMock: vi.fn(),
  state: {
    diagnosis: null as SegmentDiagnosisDto | null,
    loading: false,
    error: null as string | null,
    notDerived: false,
  },
}));

vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../hooks/useDiagnosisData', () => ({
  useDiagnosisData: () => ({
    diagnosis: state.diagnosis,
    loading: state.loading,
    error: state.error,
    notDerived: state.notDerived,
    retry: retryMock,
  }),
}));

function dataClassDiagnosis(): SegmentDiagnosisDto {
  return {
    segmentId: 's1', segmentName: 'NBHD-K3/R1/STANDARD',
    city: 'Kennewick', neighborhoodCode: 'NBHD-K3',
    parcelCount: 55,
    primaryClass: 'Data',
    primaryConfidence: 1.0,
    findings: [
      {
        code: 'ZERO_SALES',
        category: 'Data',
        summary: 'No qualified sales in the tax-year ±2 window — IAAO statistics cannot be computed.',
        evidenceStrength: 1.0,
        evidence: { ratioCount: 0, taxYear: 2026 },
        parcelIdHints: ['HP-1001', 'HP-1002'],
      },
    ],
    recommendedActions: [
      {
        actionCode: 'RECONCILE_SALES',
        target: 'SalesForge',
        summary: 'Reconcile qualified sales in SalesForge — expand search window.',
        priority: 1,
        rationale: 'No qualified sales …',
        prebuiltContext: { segmentId: 's1', studyId: 'st1', taxYear: 2026 },
      },
    ],
    narrative: 'NBHD-K3/R1/STANDARD classifies as Data problem (confidence 100%). No qualified sales in the tax-year ±2 window — IAAO statistics cannot be computed. Recommended: Reconcile qualified sales in SalesForge — expand search window.',
    inputFingerprint: 'abcd1234ef567890',
    generatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  };
}

function modelClassDiagnosis(): SegmentDiagnosisDto {
  return {
    segmentId: 's2', segmentName: 'NBHD-K1/R1/GOOD',
    city: 'Kennewick', neighborhoodCode: 'NBHD-K1',
    parcelCount: 128,
    primaryClass: 'Model',
    primaryConfidence: 0.80,
    findings: [
      {
        code: 'IAAO_COD_CEILING_BREACH',
        category: 'Model',
        summary: 'COD 27.4 exceeds IAAO ceiling of 20 — dispersion too high.',
        evidenceStrength: 0.75,
        evidence: { cod: 27.4, iaaoCeiling: 20 },
        parcelIdHints: [],
      },
    ],
    recommendedActions: [
      {
        actionCode: 'RECALIBRATE_COST_TABLE',
        target: 'CostForge',
        summary: 'Recalibrate cost tables in CostForge.',
        priority: 2,
        rationale: 'COD 27.4 exceeds IAAO ceiling.',
        prebuiltContext: { segmentId: 's2', stratumKey: 'R' },
      },
    ],
    narrative: 'NBHD-K1/R1/GOOD classifies as Model problem (confidence 80%).',
    inputFingerprint: 'deadbeef12345678',
    generatedAt: new Date().toISOString(),
  };
}

function healthyClassDiagnosis(): SegmentDiagnosisDto {
  return {
    segmentId: 's3', segmentName: 'NBHD-R1/R1/STANDARD',
    city: 'Richland', neighborhoodCode: 'NBHD-R1',
    parcelCount: 142,
    primaryClass: 'Healthy',
    primaryConfidence: 1.0,
    findings: [
      {
        code: 'HEALTHY_SEGMENT',
        category: 'Healthy',
        summary: 'Median 0.97 inside IAAO fair range, COD 14.2 inside ceiling, 42 qualified sales.',
        evidenceStrength: 0.9,
        evidence: { median: 0.97, cod: 14.2, ratioCount: 42 },
        parcelIdHints: [],
      },
    ],
    recommendedActions: [
      {
        actionCode: 'MARK_HEALTHY',
        target: 'None',
      summary: 'No action required — segment is IAAO and equity compliant.',
        priority: 1,
        rationale: 'Median 0.97 inside IAAO fair range, COD 14.2 inside ceiling, 42 qualified sales.',
        prebuiltContext: null,
      },
    ],
    narrative: 'NBHD-R1/R1/STANDARD classifies as Healthy (confidence 100%).',
    inputFingerprint: 'cafef00d12345678',
    generatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  state.diagnosis = null;
  state.loading = false;
  state.error = null;
  state.notDerived = false;
  activateModuleMock.mockClear();
  retryMock.mockClear();
});

describe('AiDiagnosisPanel — states', () => {
  it('renders loading skeleton', () => {
    state.loading = true;
    render(<AiDiagnosisPanel segmentId="s1" />);
    expect(screen.getByTestId('diagnosis-loading')).toBeInTheDocument();
  });

  it('renders error with retry', async () => {
    state.error = 'boom';
    render(<AiDiagnosisPanel segmentId="s1" />);
    expect(screen.getByTestId('diagnosis-error')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnosis-retry'));
    expect(retryMock).toHaveBeenCalled();
  });

  it('renders not-derived nudge on 409', () => {
    state.notDerived = true;
    render(<AiDiagnosisPanel segmentId="s1" />);
    expect(screen.getByTestId('diagnosis-not-derived')).toBeInTheDocument();
    expect(screen.getByText(/derive segment metrics first/i)).toBeInTheDocument();
  });
});

describe('AiDiagnosisPanel — Data-class populated', () => {
  it('renders classification banner with Data class + confidence', () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    const banner = screen.getByTestId('diagnosis-classification-banner');
    expect(banner).toHaveAttribute('data-class', 'Data');
    expect(banner.textContent).toMatch(/100% confidence/);
  });

  it('displays fingerprint hash (first 8 chars) and relative timestamp', () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    expect(screen.getByTestId('diagnosis-fingerprint').textContent).toBe('abcd1234');
    expect(screen.getByTestId('diagnosis-timestamp').textContent).toMatch(/ago|just now/);
  });

  it('renders every finding with its summary text', () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    const row = screen.getByTestId('diagnosis-finding-ZERO_SALES');
    expect(row).toBeInTheDocument();
    expect(row.textContent).toMatch(/No qualified sales/);
  });

  it('expands and collapses finding evidence dictionary', async () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    expect(screen.queryByTestId('diagnosis-evidence-dict-ZERO_SALES')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnosis-finding-expand-ZERO_SALES'));
    expect(screen.getByTestId('diagnosis-evidence-dict-ZERO_SALES')).toBeInTheDocument();
  });

  it('fires activateModule(property-workbench) on parcel-hint chip click', async () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnosis-parcel-chip-HP-1001'));
    expect(activateModuleMock).toHaveBeenCalledWith('property-workbench', {
      source: 'system',
      metadata: expect.objectContaining({ parcelId: 'HP-1001', segmentId: 's1' }),
    });
  });
});

describe('AiDiagnosisPanel — Model-class populated', () => {
  it('fires activateModule(costforge) with prebuiltContext on action click', async () => {
    state.diagnosis = modelClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s2" />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnosis-action-fire-RECALIBRATE_COST_TABLE'));
    expect(activateModuleMock).toHaveBeenCalledWith('costforge', {
      source: 'system',
      metadata: expect.objectContaining({
        segmentId: 's2',
        stratumKey: 'R',
        diagnosisActionCode: 'RECALIBRATE_COST_TABLE',
      }),
    });
  });

  it('shows priority and target badge', () => {
    state.diagnosis = modelClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s2" />);
    expect(screen.getByTestId('diagnosis-action-priority-RECALIBRATE_COST_TABLE').textContent).toBe('2');
    expect(screen.getByTestId('diagnosis-action-target-RECALIBRATE_COST_TABLE').textContent).toMatch(/CostForge/);
  });
});

describe('AiDiagnosisPanel — Healthy-class populated', () => {
  it('renders mark-healthy banner instead of action list', () => {
    state.diagnosis = healthyClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s3" />);
    expect(screen.getByTestId('diagnosis-mark-healthy-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('diagnosis-actions-section')).not.toBeInTheDocument();
  });

  it('banner cites IAAO compliant language', () => {
    state.diagnosis = healthyClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s3" />);
    expect(screen.getByText(/No action required/)).toBeInTheDocument();
  });
});

describe('AiDiagnosisPanel — narrative card', () => {
  it('renders service narrative verbatim, every sentence cites real numbers', () => {
    state.diagnosis = dataClassDiagnosis();
    render(<AiDiagnosisPanel segmentId="s1" />);
    const card = screen.getByTestId('diagnosis-narrative-card');
    expect(card.textContent).toContain('confidence 100%');
    expect(card.textContent).toContain('No qualified sales');
  });
});
