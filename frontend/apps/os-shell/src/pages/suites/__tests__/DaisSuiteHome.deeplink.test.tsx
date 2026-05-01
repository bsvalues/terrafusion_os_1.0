import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import DaisSuiteHome from '../DaisSuiteHome';
import { useSegmentWorkflowDraftStore } from '../segmentWorkflowDraftStore';
import { useDownstreamClosureReceiptStore } from '../downstreamClosureReceiptStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../useDaisSuiteStats', () => ({
  useDaisSuiteStats: () => ({
    stats: {
      activeAppeals: 0,
      totalLevyRevenue: 0,
      pendingAssessments: 0,
      assessmentCompletionPercent: 0,
    },
    loading: false,
    error: null,
    source: 'live',
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
vi.mock('../../../components/dais/NoticeBatchQueuePanel', () => ({
  default: () => <div data-testid="stub-notice-panel" />,
}));
vi.mock('../../../components/dais/CertRollPanel', () => ({
  default: () => <div data-testid="stub-cert-panel" />,
}));
vi.mock('../../../components/dais/ManagementDashboardPanel', () => ({
  default: () => <div data-testid="stub-management-panel" />,
}));
vi.mock('../../../components/dais/SupervisorFlagQueue', () => ({
  default: () => <div data-testid="stub-supervisor-panel" />,
}));

vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));

function resetStore() {
  act(() => {
    useSegmentWorkflowDraftStore.getState().clearDraft();
    useDownstreamClosureReceiptStore.getState().clearReceipt('exc-dais');
  });
}

describe('DaisSuiteHome - County Studio deeplink consumption', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    resetStore();
  });

  it('does not create a draft when no metadata is provided', () => {
    render(<DaisSuiteHome />);
    expect(useSegmentWorkflowDraftStore.getState().activeDraft).toBeNull();
    expect(screen.queryByTestId('dais-workflow-draft-panel')).not.toBeInTheDocument();
  });

  it('creates a SegmentReview draft from pre-split metadata and renders the panel', () => {
    render(
      <DaisSuiteHome
        metadata={{
          workflowTemplate: 'SegmentReview',
          segmentId: 'seg-42',
          segmentLabel: 'Richland NBHD-R3',
        }}
      />,
    );

    const draft = useSegmentWorkflowDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.template).toBe('SegmentReview');
    expect(draft!.segmentId).toBe('seg-42');
    expect(draft!.segmentLabel).toBe('Richland NBHD-R3');
    expect(screen.getByTestId('dais-workflow-draft-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dais-draft-segment-label').textContent).toBe('Richland NBHD-R3');
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    render(
      <DaisSuiteHome
        metadata={{ deeplinkQuery: '?template=SegmentReview&segmentId=seg-raw' }}
      />,
    );

    const draft = useSegmentWorkflowDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.segmentId).toBe('seg-raw');
    expect(draft!.segmentLabel).toBe('seg-raw');
    expect(screen.getByTestId('dais-workflow-draft-panel')).toBeInTheDocument();
  });

  it('persists exception handoff receipt and opens downstream workbench continuation', () => {
    render(
      <DaisSuiteHome
        metadata={{ deeplinkQuery: '?template=SegmentReview&segmentId=seg-raw&exceptionSetId=exc-dais' }}
      />,
    );

    const draft = useSegmentWorkflowDraftStore.getState().activeDraft;
    expect(draft?.handoff?.exceptionSetId).toBe('exc-dais');
    expect(screen.getByTestId('dais-draft-receipt-status')).toHaveTextContent('Drafted');

    fireEvent.click(screen.getByTestId('dais-draft-open-workbench'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dais'].status).toBe('Opened');
    expect(activateModuleMock).toHaveBeenCalledWith(
      'property-workbench',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({
          tabId: 'dais',
          segmentId: 'seg-raw',
          exceptionSetId: 'exc-dais',
        }),
      }),
    );

    fireEvent.click(screen.getByTestId('dais-draft-return-receipt'));
    expect(useDownstreamClosureReceiptStore.getState().receipts['exc-dais'].status).toBe('Returned');
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({
          segmentId: 'seg-raw',
          exceptionSetId: 'exc-dais',
          downstreamStatus: 'Returned',
        }),
      }),
    );
  });

  it('does not create a draft for an unrecognized template', () => {
    render(
      <DaisSuiteHome
        metadata={{ workflowTemplate: 'NotARealTemplate', segmentId: 'seg-x' }}
      />,
    );

    expect(useSegmentWorkflowDraftStore.getState().activeDraft).toBeNull();
    expect(screen.queryByTestId('dais-workflow-draft-panel')).not.toBeInTheDocument();
  });

  it('Dismiss draft clears the panel', () => {
    render(
      <DaisSuiteHome
        metadata={{ workflowTemplate: 'SegmentReview', segmentId: 'seg-rm', segmentLabel: 'Remove Me' }}
      />,
    );

    expect(screen.getByTestId('dais-workflow-draft-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dais-draft-dismiss'));
    expect(screen.queryByTestId('dais-workflow-draft-panel')).not.toBeInTheDocument();
    expect(useSegmentWorkflowDraftStore.getState().activeDraft).toBeNull();
  });

  it('Back-chip click fires activateModule("county-studio") with segmentId', () => {
    render(
      <DaisSuiteHome
        metadata={{ workflowTemplate: 'SegmentReview', segmentId: 'seg-back', segmentLabel: 'Back Segment' }}
      />,
    );

    const chip = screen.getByTestId('dais-draft-back-chip');
    expect(chip).toHaveAttribute('data-segment-id', 'seg-back');
    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      }),
    );
  });
});
