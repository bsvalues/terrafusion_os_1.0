// frontend/apps/os-shell/src/pages/forge/cost/__tests__/CostForge.deeplink.test.tsx
//
// Task D2 — CostForge deeplink consumption.
// Verifies the mount-time handler for County Studio Inspector metadata:
//   - taxYear → setTaxYear
//   - stratumKey + segmentId → setHandoffContext → Scoped From chip renders
//   - chip click → activateModule('county-studio', { metadata: { segmentId } })
//   - deeplinkQuery-only fallback parsing still produces the same effects
//   - no-metadata mount leaves store pristine

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import CostForge from '../CostForge';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

// Stats fetch hits a real endpoint — stub it out.
vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: vi.fn().mockRejectedValue(new DOMException('stub', 'AbortError')),
  apiFetch:     vi.fn(),
}));

// Child panels do their own network work — replace with placeholders.
vi.mock('../tabs/TriageTab', () => ({ TriageTab: () => <div data-testid="stub-triage" /> }));
vi.mock('../tabs/NeighborhoodAuditTab', () => ({ NeighborhoodAuditTab: () => <div data-testid="stub-hood-audit" /> }));
vi.mock('../tabs/CalibrationWorkbenchTab', () => ({ CalibrationWorkbenchTab: () => <div data-testid="stub-cal" /> }));
vi.mock('../tabs/DataQualityTab', () => ({ DataQualityTab: () => <div data-testid="stub-dq" /> }));
vi.mock('../CostApproachRunner', () => ({ CostApproachRunner: () => <div /> }));
vi.mock('../DepreciationCalculator', () => ({ DepreciationCalculator: () => <div /> }));
vi.mock('../CostManual', () => ({ CostManual: () => <div /> }));
vi.mock('../CalcTracePanel', () => ({ CalcTracePanel: () => <div /> }));

function resetStore() {
  act(() => {
    const s = useCostForgeWorkspaceStore.getState();
    s.setActiveTab('triage');
    s.setTaxYear(2026);
    s.setHandoffContext(null, null, null);
    s.setSelectedHood(null);
  });
}

describe('CostForge — County Studio deeplink consumption (Task D2)', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    resetStore();
  });

  it('does not touch handoff context when no metadata is provided', () => {
    render(<CostForge />);
    const s = useCostForgeWorkspaceStore.getState();
    expect(s.contextStratumKey).toBeNull();
    expect(s.contextSegmentId).toBeNull();
    expect(screen.queryByTestId('cf-scoped-from-chip')).not.toBeInTheDocument();
  });

  it('consumes pre-split metadata (stratumKey / taxYear / segmentId) on mount', () => {
    render(
      <CostForge
        metadata={{
          deeplinkQuery: '?stratum=R1&year=2025&segmentId=seg-42',
          stratumKey: 'R1',
          taxYear: 2025,
          segmentId: 'seg-42',
          segmentLabel: 'Kennewick R1',
        }}
      />
    );
    const s = useCostForgeWorkspaceStore.getState();
    expect(s.taxYear).toBe(2025);
    expect(s.contextStratumKey).toBe('R1');
    expect(s.contextSegmentId).toBe('seg-42');
    expect(s.contextSegmentLabel).toBe('Kennewick R1');

    const chip = screen.getByTestId('cf-scoped-from-chip');
    expect(chip).toHaveAttribute('data-segment-id', 'seg-42');
    expect(chip).toHaveAttribute('data-stratum', 'R1');
    expect(chip.textContent).toMatch(/Kennewick R1/);
    expect(chip.textContent).toMatch(/Stratum R1/);
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    render(
      <CostForge
        metadata={{ deeplinkQuery: '?stratum=C2&year=2024&segmentId=seg-7' }}
      />
    );
    const s = useCostForgeWorkspaceStore.getState();
    expect(s.taxYear).toBe(2024);
    expect(s.contextStratumKey).toBe('C2');
    expect(s.contextSegmentId).toBe('seg-7');
    const chip = screen.getByTestId('cf-scoped-from-chip');
    expect(chip.textContent).toMatch(/seg-7/);
  });

  it('drills neighborhood rollups directly into hood audit', () => {
    render(
      <CostForge
        metadata={{
          countyName: 'Benton County',
          taxYear: 2026,
          rollupScope: 'neighborhood',
          neighborhoodCode: 'NBHD-K1',
          neighborhoodName: 'Kennewick Core',
        }}
      />
    );

    const s = useCostForgeWorkspaceStore.getState();
    expect(s.selectedHoodCd).toBe('NBHD-K1');
    expect(s.activeTab).toBe('hood-audit');
    expect(screen.getAllByText(/Kennewick Core/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/neighborhood and reval area are the operative county cost segments/i),
    ).toBeInTheDocument();
  });

  it('keeps city overview handoffs in triage mode', () => {
    render(
      <CostForge
        metadata={{
          countyName: 'Benton County',
          taxYear: 2026,
          rollupScope: 'city',
          city: 'Kennewick',
        }}
      />
    );

    const s = useCostForgeWorkspaceStore.getState();
    expect(s.selectedHoodCd).toBeNull();
    expect(s.activeTab).toBe('triage');
    expect(screen.getByText(/City overview · Kennewick/)).toBeInTheDocument();
    expect(
      screen.getByText(/counties actually calibrate by reval area and neighborhood/i),
    ).toBeInTheDocument();
  });

  it('Scoped From chip click fires activateModule("county-studio") with segmentId', () => {
    render(
      <CostForge
        metadata={{ stratumKey: 'R1', taxYear: 2026, segmentId: 'seg-back' }}
      />
    );
    const chip = screen.getByTestId('cf-scoped-from-chip');
    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      })
    );
  });
});
