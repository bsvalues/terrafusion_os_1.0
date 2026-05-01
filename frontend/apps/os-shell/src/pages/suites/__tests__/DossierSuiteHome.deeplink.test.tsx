// frontend/apps/os-shell/src/pages/suites/__tests__/DossierSuiteHome.deeplink.test.tsx
//
// Task D3 — DossierSuiteHome deeplink consumption.
// Verifies the mount-time handler for County Studio Inspector metadata:
//   - packetTemplate=SegmentEvidence + segmentId → createDraft → panel renders
//   - deeplinkQuery-only fallback parsing still creates the draft
//   - Unrecognized template does NOT create a draft
//   - Dismiss draft clears the panel
//   - Back-chip click → activateModule('county-studio', { metadata: { segmentId } })
//   - no-metadata mount leaves draft store empty

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import DossierSuiteHome from '../DossierSuiteHome';
import { useSegmentEvidenceDraftStore } from '../segmentEvidenceDraftStore';
import { useDownstreamClosureReceiptStore } from '../downstreamClosureReceiptStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

// Stub the county stats hook + sub-panels.
vi.mock('../../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats:   { totalParcels: 0, activeAppeals: 0, pendingAssessments: 0 },
    loading: false,
    error:   null,
    source:  'live',
  }),
}));

vi.mock('../../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="stub-parcel-banner" />,
}));
vi.mock('../../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: () => <div data-testid="stub-module-grid" />,
}));
vi.mock('../../../components/suites/OperationalQueue', () => ({
  OperationalQueue: () => <div data-testid="stub-op-queue" />,
}));

vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));

function resetStore() {
  act(() => {
    useSegmentEvidenceDraftStore.getState().clearDraft();
    useDownstreamClosureReceiptStore.getState().clearReceipt('exc-dossier');
  });
}

describe('DossierSuiteHome — County Studio deeplink consumption (Task D3)', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    resetStore();
  });

  it('does not create a draft when no metadata is provided', () => {
    render(<DossierSuiteHome />);
    expect(useSegmentEvidenceDraftStore.getState().activeDraft).toBeNull();
    expect(screen.queryByTestId('dossier-evidence-draft-panel')).not.toBeInTheDocument();
  });

  it('creates a SegmentEvidence draft from pre-split metadata and renders the panel', () => {
    render(
      <DossierSuiteHome
        metadata={{
          packetTemplate: 'SegmentEvidence',
          segmentId:      'seg-42',
          segmentLabel:   'Richland NBHD-R3',
        }}
      />,
    );
    const draft = useSegmentEvidenceDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.template).toBe('SegmentEvidence');
    expect(draft!.segmentId).toBe('seg-42');
    expect(draft!.segmentLabel).toBe('Richland NBHD-R3');

    expect(screen.getByTestId('dossier-evidence-draft-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-draft-segment-label').textContent).toBe('Richland NBHD-R3');
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    render(
      <DossierSuiteHome
        metadata={{ deeplinkQuery: '?template=SegmentEvidence&segmentId=seg-raw' }}
      />,
    );
    const draft = useSegmentEvidenceDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.segmentId).toBe('seg-raw');
    expect(draft!.segmentLabel).toBe('seg-raw');
    expect(screen.getByTestId('dossier-evidence-draft-panel')).toBeInTheDocument();
  });

  it('persists exception handoff receipt and opens downstream packet continuation', () => {
    render(
      <DossierSuiteHome
        metadata={{ deeplinkQuery: '?template=SegmentEvidence&segmentId=seg-raw&exceptionSetId=exc-dossier' }}
      />,
    );

    const draft = useSegmentEvidenceDraftStore.getState().activeDraft;
    expect(draft?.handoff?.exceptionSetId).toBe('exc-dossier');
    expect(screen.getByTestId('dossier-draft-receipt-status')).toHaveTextContent('Drafted');

    fireEvent.click(screen.getByTestId('dossier-draft-open-builder'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dossier'].status).toBe('Opened');
    expect(activateModuleMock).toHaveBeenCalledWith(
      'property-workbench',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({
          tabId: 'dossier',
          segmentId: 'seg-raw',
          exceptionSetId: 'exc-dossier',
        }),
      }),
    );

    fireEvent.click(screen.getByTestId('dossier-draft-return-receipt'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dossier'].status).toBe('Returned');
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({
          segmentId: 'seg-raw',
          exceptionSetId: 'exc-dossier',
          downstreamStatus: 'Returned',
        }),
      }),
    );
  });

  it('does not create a draft for an unrecognized template', () => {
    render(
      <DossierSuiteHome
        metadata={{ packetTemplate: 'NotARealTemplate', segmentId: 'seg-x' }}
      />,
    );
    expect(useSegmentEvidenceDraftStore.getState().activeDraft).toBeNull();
    expect(screen.queryByTestId('dossier-evidence-draft-panel')).not.toBeInTheDocument();
  });

  it('Dismiss draft clears the panel', () => {
    render(
      <DossierSuiteHome
        metadata={{ packetTemplate: 'SegmentEvidence', segmentId: 'seg-rm', segmentLabel: 'Remove Me' }}
      />,
    );
    expect(screen.getByTestId('dossier-evidence-draft-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dossier-draft-dismiss'));
    expect(screen.queryByTestId('dossier-evidence-draft-panel')).not.toBeInTheDocument();
    expect(useSegmentEvidenceDraftStore.getState().activeDraft).toBeNull();
  });

  it('Back-chip click fires activateModule("county-studio") with segmentId', () => {
    render(
      <DossierSuiteHome
        metadata={{ packetTemplate: 'SegmentEvidence', segmentId: 'seg-back', segmentLabel: 'Back Segment' }}
      />,
    );
    const chip = screen.getByTestId('dossier-draft-back-chip');
    expect(chip).toHaveAttribute('data-segment-id', 'seg-back');
    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source:   'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      }),
    );
  });
});
