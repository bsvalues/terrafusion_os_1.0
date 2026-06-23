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
import { useAdjustmentApplyHandoffStore } from '../adjustmentApplyHandoffStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
const recordDownstreamReceiptMock = vi.hoisted(() => vi.fn());
const updateDownstreamReceiptStatusMock = vi.hoisted(() => vi.fn());
const updateDownstreamReceiptStatusByReceiptIdMock = vi.hoisted(() => vi.fn());
const recordApplyHandoffReceiptMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));
vi.mock('../../../services/countyStudyHandoffApi', () => ({
  adjustmentSetApi: {
    recordApplyHandoffReceipt: recordApplyHandoffReceiptMock,
  },
  exceptionApi: {
    recordDownstreamReceipt: recordDownstreamReceiptMock,
    updateDownstreamReceiptStatus: updateDownstreamReceiptStatusMock,
    updateDownstreamReceiptStatusByReceiptId: updateDownstreamReceiptStatusByReceiptIdMock,
  },
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
    useDownstreamClosureReceiptStore.getState().clearReceipt('receipt-dossier-direct');
    useAdjustmentApplyHandoffStore.getState().clearHandoff('adj-apply');
  });
}

describe('DossierSuiteHome — County Studio deeplink consumption (Task D3)', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    recordDownstreamReceiptMock.mockResolvedValue({});
    updateDownstreamReceiptStatusMock.mockResolvedValue({});
    updateDownstreamReceiptStatusByReceiptIdMock.mockResolvedValue({});
    recordApplyHandoffReceiptMock.mockResolvedValue({
      receiptId: 'apply-receipt',
      adjustmentSetId: 'adj-apply',
      studyId: 'study-apply',
      countyId: 'county-apply',
      scenarioId: 'scenario-apply',
      template: 'AdjustmentApplyPacket',
      status: 'Opened',
      preparedAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:01:00.000Z',
      evidenceRef: null,
      notes: null,
      updatedBy: 'dossier',
    });
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
    expect(recordDownstreamReceiptMock).toHaveBeenCalledWith(
      'exc-dossier',
      expect.objectContaining({
        destination: 'Dossier',
        template: 'SegmentEvidence',
        segmentId: 'seg-raw',
        status: 'Drafted',
      }),
    );

    fireEvent.click(screen.getByTestId('dossier-draft-open-builder'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dossier'].status).toBe('Opened');
    expect(recordDownstreamReceiptMock).toHaveBeenCalledWith(
      'exc-dossier',
      expect.objectContaining({ status: 'Opened' }),
    );
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
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dossier'].evidenceRef).toBe('dossier-evidence-return:seg-raw');
    expect(recordDownstreamReceiptMock).toHaveBeenCalledWith(
      'exc-dossier',
      expect.objectContaining({
        status: 'Returned',
        downstreamEntityId: 'dossier-return:seg-raw',
        evidenceRef: 'dossier-evidence-return:seg-raw',
      }),
    );
    expect(screen.getByTestId('dossier-draft-evidence-ref')).toHaveTextContent('dossier-evidence-return:seg-raw');
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

  it('opens and returns direct segment inspector receipt by receipt id', () => {
    render(
      <DossierSuiteHome
        metadata={{
          packetTemplate: 'SegmentEvidence',
          segmentId: 'seg-direct',
          segmentLabel: 'Direct Segment',
          downstreamReceiptId: 'receipt-dossier-direct',
        }}
      />,
    );

    const draft = useSegmentEvidenceDraftStore.getState().activeDraft;
    expect(draft?.handoff?.receiptId).toBe('receipt-dossier-direct');
    expect(screen.getByTestId('dossier-draft-receipt-status')).toHaveTextContent('Drafted');

    fireEvent.click(screen.getByTestId('dossier-draft-open-builder'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['receipt-dossier-direct'].status).toBe('Opened');
    expect(updateDownstreamReceiptStatusByReceiptIdMock).toHaveBeenCalledWith(
      'receipt-dossier-direct',
      'Opened',
      expect.objectContaining({ downstreamEntityId: 'dossier-builder:seg-direct' }),
    );
    expect(activateModuleMock).toHaveBeenCalledWith(
      'property-workbench',
      expect.objectContaining({
        metadata: expect.objectContaining({
          segmentId: 'seg-direct',
          downstreamReceiptId: 'receipt-dossier-direct',
        }),
      }),
    );

    fireEvent.click(screen.getByTestId('dossier-draft-return-receipt'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['receipt-dossier-direct'].status).toBe('Returned');
    expect(useDownstreamClosureReceiptStore.getState().receipts['receipt-dossier-direct'].evidenceRef).toBe('dossier-evidence-return:seg-direct');
    expect(updateDownstreamReceiptStatusByReceiptIdMock).toHaveBeenCalledWith(
      'receipt-dossier-direct',
      'Returned',
      expect.objectContaining({
        downstreamEntityId: 'dossier-return:seg-direct',
        evidenceRef: 'dossier-evidence-return:seg-direct',
      }),
    );
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        metadata: expect.objectContaining({
          segmentId: 'seg-direct',
          downstreamReceiptId: 'receipt-dossier-direct',
          downstreamStatus: 'Returned',
        }),
      }),
    );
  });

  it('opens a County Studio adjustment apply handoff without claiming publish ownership', () => {
    render(
      <DossierSuiteHome
        metadata={{
          applyTemplate: 'AdjustmentApplyPacket',
          adjustmentSetId: 'adj-apply',
          scenarioId: 'scenario-apply',
          studyId: 'study-apply',
        }}
      />,
    );

    expect(useAdjustmentApplyHandoffStore.getState().handoffs['adj-apply']).toMatchObject({
      adjustmentSetId: 'adj-apply',
      scenarioId: 'scenario-apply',
      studyId: 'study-apply',
      status: 'Opened',
    });
    expect(recordApplyHandoffReceiptMock).toHaveBeenCalledWith(
      'adj-apply',
      expect.objectContaining({
        status: 'Opened',
        template: 'AdjustmentApplyPacket',
      }),
    );
    expect(screen.getByTestId('dossier-apply-handoff')).toHaveTextContent('County Studio Handoff · Apply Packet');
    expect(screen.getByTestId('dossier-apply-handoff')).toHaveTextContent('value mutation still belongs to the governed apply lane');
    expect(screen.getByTestId('dossier-apply-handoff-status')).toHaveTextContent('Opened');
  });

  it('renders an active apply handoff from the store when the Dossier window is already open', () => {
    act(() => {
      useAdjustmentApplyHandoffStore.getState().prepareHandoff({
        adjustmentSetId: 'adj-apply',
        scenarioId: 'scenario-apply',
        studyId: 'study-apply',
        effectiveScope: {
          cohortId: 'cohort-007',
          neighborhoodCode: 'NBHD-420',
          modelGroup: 'MG-12',
          valueTier: 'Upper',
          nested: { segmentId: 'seg-420' },
        },
      });
    });

    render(<DossierSuiteHome />);

    expect(screen.getByTestId('dossier-apply-handoff')).toHaveTextContent('County Studio Handoff · Apply Packet');
    expect(screen.getByTestId('dossier-apply-handoff')).toHaveTextContent('NBHD-420');
    expect(screen.getByTestId('dossier-apply-handoff')).toHaveTextContent('MG-12');
    expect(screen.getByTestId('dossier-apply-handoff')).not.toHaveTextContent('Kennewick');
  });

  it('records external apply return status without mutating values in County Studio', () => {
    render(
      <DossierSuiteHome
        metadata={{
          applyTemplate: 'AdjustmentApplyPacket',
          adjustmentSetId: 'adj-apply',
          scenarioId: 'scenario-apply',
          studyId: 'study-apply',
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('dossier-apply-record-applied'));

    expect(useAdjustmentApplyHandoffStore.getState().handoffs['adj-apply']).toMatchObject({
      status: 'AppliedExternally',
      evidenceRef: 'dossier-apply-return:adj-apply',
    });
    expect(recordApplyHandoffReceiptMock).toHaveBeenCalledWith(
      'adj-apply',
      expect.objectContaining({
        status: 'AppliedExternally',
        evidenceRef: 'dossier-apply-return:adj-apply',
      }),
    );
    expect(screen.getByTestId('dossier-apply-handoff-status')).toHaveTextContent('AppliedExternally');
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
