// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ObjectInspector.test.tsx
//
// Task D — three-tab Inspector coverage:
//   - Panel renders when a segment is selected, hides when none.
//   - Metrics tab surfaces the equity row (PRB band, VEI bar, classification
//     pill, Equity Score). No-warnings copy when warnings array empty.
//   - Trend tab shows sparklines when history has ≥ 2 points, and the explicit
//     empty copy for 0 / 1 points — no filler.
//   - Action tab: Spatial (Atlas + Workbench) always active; Corrective
//     handoff buttons follow the backend's DeeplinkQuery nullability.
//   - Retained contract: Open-in-Atlas still navigates, Find-Parcels still
//     activates the workbench module.

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ObjectInspector } from '../components/ObjectInspector';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type {
  CountySegmentDetailDto,
  CountyStudySessionDto,
  SegmentActionContextDto,
} from '../types/countyStudio.types';

// Vitest hoists vi.mock() blocks above all imports; anything they reference
// must be declared via vi.hoisted() so it is available during that hoisted
// evaluation. See https://vitest.dev/api/vi.html#vi-mock
const {
  mockNavigate,
  activateModuleMock,
  retryDetailMock,
  retryContextMock,
  state,
} = vi.hoisted(() => ({
  mockNavigate:        vi.fn(),
  activateModuleMock:  vi.fn(),
  retryDetailMock:     vi.fn(),
  retryContextMock:    vi.fn(),
  state: {
    detail:         null as CountySegmentDetailDto | null,
    detailLoading:  false,
    detailError:    null as string | null,
    context:        null as SegmentActionContextDto | null,
    contextLoading: false,
    contextError:   null as string | null,
  },
}));

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/orchestration/moduleActivation', () => ({
  default:         activateModuleMock,
  activateModule:  activateModuleMock,
}));

vi.mock('../hooks/useInspectorData', () => ({
  useInspectorData: () => ({
    detail:         state.detail,
    detailLoading:  state.detailLoading,
    detailError:    state.detailError,
    retryDetail:    retryDetailMock,
    context:        state.context,
    contextLoading: state.contextLoading,
    contextError:   state.contextError,
    retryContext:   retryContextMock,
  }),
}));

// Diagnosis tab uses its own hook — stub it with an inert response so
// Inspector tests (metrics / trend / action) don't exercise the panel.
vi.mock('../hooks/useDiagnosisData', () => ({
  useDiagnosisData: () => ({
    diagnosis: null,
    loading: false,
    error: null,
    notDerived: false,
    retry: () => {},
  }),
}));

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-1', countyId: 'benton', taxYear: 2026,
  studyType: 'RatioStudy', status: 'Active',
  baselineVersion: null, activeSegmentSetId: 'set-1',
  createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
};

const MOCK_SEG = {
  segmentId: 's1', segmentSetId: 'ss1', name: 'West Richland R1',
  segmentType: 'Residential', parcelCount: 412,
  medianRatio: 0.97, cod: 14.2, prd: 1.01,
  stabilityScore: 72, riskScore: 35,
  exceptionCount: 8, geographyRef: null,
};

function baseDetail(overrides: Partial<CountySegmentDetailDto> = {}): CountySegmentDetailDto {
  return {
    segmentId: 's1', segmentSetId: 'ss1', studyId: 'study-1', countyId: 'benton',
    taxYear: 2026,
    name: 'West Richland R1', segmentType: 'Residential',
    city: 'West Richland', neighborhoodCode: 'NBHD-WR',
    parcelCount: 412, medianRatio: 0.97, cod: 14.2, prd: 1.01,
    stabilityScore: 72, riskScore: 35, exceptionCount: 8,
    prb: 0.02, vei: 88, equityClassification: 'Fair',
    equityScore: 92,
    ratioCount: 42,
    yearHistory: [],
    complianceStatus: 'IaaoCompliant',
    warnings: [],
    derivedAt: '2026-04-10T12:00:00Z',
    ...overrides,
  };
}

function baseContext(overrides: Partial<SegmentActionContextDto> = {}): SegmentActionContextDto {
  return {
    segmentId: 's1', studyId: 'study-1', countyId: 'benton', taxYear: 2026,
    segmentType: 'Residential', city: 'West Richland', neighborhoodCode: 'NBHD-WR',
    parcelIds: ['P1', 'P2', 'P3'], totalParcels: 3, truncated: false,
    salesForge:  { stratumKey: 'R', taxYear: 2026, qualifiedSaleCount: 18, deeplinkQuery: null },
    costForge:   { stratumKey: 'R', taxYear: 2026, deeplinkQuery: null },
    compsForge:  { sampleParcelIds: ['P1', 'P2'], deeplinkQuery: null },
    dais:        { workflowTemplate: 'SegmentReview', deeplinkQuery: null },
    dossier:     { packetTemplate: 'SegmentEvidence', deeplinkQuery: null },
    ...overrides,
  };
}

function setup(segments: typeof MOCK_SEG[] = [MOCK_SEG], selected: string | null = 's1') {
  act(() => {
    useCountyStudioStore.getState().setStudy(MOCK_STUDY);
    useCountyStudioStore.getState().setSegments(segments);
    useCountyStudioStore.getState().selectSegment(selected);
  });
}

/**
 * Radix Tabs only renders the active panel. fireEvent.click is not enough —
 * the trigger uses pointer events, so use @testing-library/user-event which
 * drives a full pointer sequence.
 */
async function switchToTab(tabTestId: string) {
  const user = userEvent.setup();
  await user.click(screen.getByTestId(tabTestId));
}

beforeEach(() => {
  state.detail =baseDetail();
  state.detailLoading =false;
  state.detailError =null;
  state.context =baseContext();
  state.contextLoading =false;
  state.contextError =null;
  retryDetailMock.mockClear();
  retryContextMock.mockClear();
  mockNavigate.mockClear();
  activateModuleMock.mockClear();
  setup();
});

// ── Panel visibility ──────────────────────────────────────────────────────

describe('ObjectInspector — panel visibility', () => {
  it('renders nothing actionable when no segment is selected', () => {
    act(() => { useCountyStudioStore.getState().selectSegment(null); });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.queryByTestId('object-inspector')).not.toBeInTheDocument();
    expect(screen.getByText(/select a segment/i)).toBeInTheDocument();
  });

  it('renders the four tab triggers when a segment is selected', () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.getByTestId('inspector-tab-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-tab-trend')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-tab-action')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-tab-diagnosis')).toBeInTheDocument();
  });
});

// ── Metrics tab ───────────────────────────────────────────────────────────

describe('ObjectInspector — Metrics tab', () => {
  it('renders the equity row with PRB / VEI / Classification / Score', () => {
    state.detail =baseDetail({ prb: 0.02, vei: 88, equityClassification: 'Fair', equityScore: 92 });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    const row = screen.getByTestId('inspector-equity-row');
    expect(row).toBeInTheDocument();
    const prb = within(row).getByTestId('inspector-prb-value');
    expect(prb).toHaveAttribute('data-band', 'fair');
    expect(prb.textContent).toContain('0.020');
    const pill = within(row).getByTestId('inspector-classification-pill');
    expect(pill).toHaveAttribute('data-classification', 'Fair');
    const score = within(row).getByTestId('inspector-equity-score');
    expect(score.textContent).toBe('92');
  });

  it('flags PRB band=breach when |PRB| > 0.10', () => {
    state.detail =baseDetail({ prb: -0.15, equityClassification: 'Regressive' });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    const prb = screen.getByTestId('inspector-prb-value');
    expect(prb).toHaveAttribute('data-band', 'breach');
    const pill = screen.getByTestId('inspector-classification-pill');
    expect(pill).toHaveAttribute('data-classification', 'Regressive');
  });

  it('shows "No warnings" copy when warnings array is empty', () => {
    state.detail =baseDetail({ warnings: [] });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.getByTestId('inspector-no-warnings')).toHaveTextContent(/meets IAAO and equity fairness bands/i);
  });

  it('renders warnings list when present', () => {
    state.detail =baseDetail({
      warnings: [
        'median 0.82 outside fair range (0.90–1.10)',
        'low sample size (12 parcels, 30 recommended)',
      ],
    });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    const list = screen.getByTestId('inspector-warnings');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows retry button on detail error and triggers retryDetail', () => {
    state.detail =null;
    state.detailError ='HTTP 500: boom';
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    fireEvent.click(screen.getByTestId('inspector-metrics-retry'));
    expect(retryDetailMock).toHaveBeenCalled();
  });
});

// ── Trend tab ─────────────────────────────────────────────────────────────

describe('ObjectInspector — Trend tab', () => {
  it('shows the empty-history copy when fewer than 2 points', async () => {
    state.detail =baseDetail({ yearHistory: [] });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-trend');
    expect(screen.getByTestId('inspector-trend-empty')).toHaveTextContent(/at least 2 tax years/i);
  });

  it('renders 3 sparklines when history has ≥ 2 points', async () => {
    state.detail =baseDetail({
      yearHistory: [
        { taxYear: 2025, parcelCount: 400, medianRatio: 0.94, cod: 15.5, prd: 1.02, prb: 0.01, exceptionCount: 10, isCurrentYear: false },
        { taxYear: 2026, parcelCount: 412, medianRatio: 0.97, cod: 14.2, prd: 1.01, prb: 0.02, exceptionCount: 8,  isCurrentYear: true  },
      ],
    });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-trend');
    expect(screen.getByTestId('inspector-trend-populated')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-sparkline-median')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-sparkline-cod')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-sparkline-exc.-rate')).toBeInTheDocument();
  });

  it('flags the current-year point in sparklines', async () => {
    state.detail =baseDetail({
      yearHistory: [
        { taxYear: 2024, parcelCount: 380, medianRatio: 0.92, cod: 16.5, prd: 1.03, prb: 0.03, exceptionCount: 12, isCurrentYear: false },
        { taxYear: 2025, parcelCount: 400, medianRatio: 0.94, cod: 15.5, prd: 1.02, prb: 0.01, exceptionCount: 10, isCurrentYear: false },
        { taxYear: 2026, parcelCount: 412, medianRatio: 0.97, cod: 14.2, prd: 1.01, prb: 0.02, exceptionCount: 8,  isCurrentYear: true  },
      ],
    });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-trend');
    const median = screen.getByTestId('inspector-sparkline-median');
    const currents = median.querySelectorAll('circle[data-current="true"]');
    expect(currents.length).toBeGreaterThan(0);
    currents.forEach((c) => expect(c.getAttribute('data-year')).toBe('2026'));
  });
});

// ── Action tab ────────────────────────────────────────────────────────────

describe('ObjectInspector — Action tab', () => {
  it('renders all 5 corrective handoff buttons', async () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    expect(screen.getByTestId('inspector-handoff-salesforge')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-handoff-costforge')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-handoff-compsforge')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-handoff-dais')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-handoff-dossier')).toBeInTheDocument();
  });

  it('disables handoff buttons whose deeplink is null with honest tooltip', async () => {
    state.context =baseContext();  // all deeplinks null by default
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    const sales = screen.getByTestId('inspector-handoff-salesforge');
    expect(sales).toHaveAttribute('data-enabled', 'false');
    expect(sales).toBeDisabled();
    expect(sales).toHaveAttribute('title', expect.stringMatching(/not yet active/i));
  });

  it('enables a handoff button when its deeplink is present and fires activateModule', async () => {
    state.context =baseContext({
      salesForge: { stratumKey: 'R', taxYear: 2026, qualifiedSaleCount: 18, deeplinkQuery: '?stratum=R&year=2026' },
    });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    const sales = screen.getByTestId('inspector-handoff-salesforge');
    expect(sales).toHaveAttribute('data-enabled', 'true');
    expect(sales).not.toBeDisabled();
    fireEvent.click(sales);
    expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', expect.objectContaining({
      source: 'system',
      metadata: expect.objectContaining({ stratumKey: 'R', taxYear: 2026 }),
    }));
  });

  it('renders spatial handoffs (Atlas + Workbench) even when context fails to load', async () => {
    state.context =null;
    state.contextError ='HTTP 500';
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    expect(screen.getByTestId('inspector-handoff-atlas')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-handoff-workbench')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-action-error')).toBeInTheDocument();
  });

  it('Open in Atlas still navigates to atlas-live (regression for existing handoff)', async () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    fireEvent.click(screen.getByTestId('inspector-handoff-atlas'));
    expect(mockNavigate).toHaveBeenCalledWith('/forge/atlas-live?studyId=study-1&segmentId=s1&countyId=benton');
  });

  it('Find Parcels in Workbench still activates the workbench module (regression)', async () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    fireEvent.click(screen.getByTestId('inspector-handoff-workbench'));
    expect(activateModuleMock).toHaveBeenCalledWith('property-workbench', expect.objectContaining({
      source: 'system',
      metadata: expect.objectContaining({ segmentId: 's1', countyId: 'benton' }),
    }));
  });

  it('surfaces Truncated notice when parcel list is capped', async () => {
    state.context =baseContext({
      parcelIds: Array.from({ length: 1000 }, (_, i) => `P${i}`),
      totalParcels: 1500,
      truncated: true,
    });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    await switchToTab('inspector-tab-action');
    expect(screen.getByTestId('inspector-action-truncated')).toHaveTextContent(/1,500/);
  });
});
