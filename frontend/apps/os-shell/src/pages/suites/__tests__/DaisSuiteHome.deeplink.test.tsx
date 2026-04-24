// frontend/apps/os-shell/src/pages/suites/__tests__/DaisSuiteHome.deeplink.test.tsx
//
// Task D3 — DaisSuiteHome deeplink consumption.
// Verifies the mount-time handler for County Studio Inspector metadata:
//   - workflowTemplate=SegmentReview + segmentId → createDraft → panel renders
//   - deeplinkQuery-only fallback parsing still creates the draft
//   - Dismiss draft clears the panel
//   - Back-chip click → activateModule('county-studio', { metadata: { segmentId } })
//   - no-metadata mount leaves draft store empty

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import DaisSuiteHome from '../DaisSuiteHome';
import { useSegmentWorkflowDraftStore } from '../segmentWorkflowDraftStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

// Stub the stats hook + sub-panels so we don't need a full shell.
vi.mock('../useDaisSuiteStats', () => ({
  useDaisSuiteStats: () => ({
    stats:   { activeAppeals: 0, totalLevyRevenue: 0, pendingAssessments: 0, assessmentCompletionPercent: 0 },
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
vi.mock('../../../components/dais/NoticeBatchQueuePanel', () => ({ default: () => <div /> }));
vi.mock('../../../components/dais/CertRollPanel', () => ({ default: () => <div /> }));
vi.mock('../../../components/dais/ManagementDashboardPanel', () => ({ default: () => <div /> }));
vi.mock('../../../components/dais/SupervisorFlagQueue', () => ({ default: () => <div /> }));

vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));

function resetStore() {
  act(() => {
    useSegmentWorkflowDraftStore.getState().clearDraft();
  });
}

describe('DaisSuiteHome — County Studio deeplink consumption (Task D3)', () => {
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
          segmentId:        'seg-42',
          segmentLabel:     'Kennewick NBHD-K1',
        }}
      />,
    );
    const draft = useSegmentWorkflowDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.template).toBe('SegmentReview');
    expect(draft!.segmentId).toBe('seg-42');
    expect(draft!.segmentLabel).toBe('Kennewick NBHD-K1');

    expect(screen.getByTestId('dais-workflow-draft-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dais-draft-segment-label').textContent).toBe('Kennewick NBHD-K1');
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    render(
      <DaisSuiteHome
        metadata={{ deeplinkQuery: '?template=SegmentReview&segmentId=seg-csv' }}
      />,
    );
    const draft = useSegmentWorkflowDraftStore.getState().activeDraft;
    expect(draft).not.toBeNull();
    expect(draft!.segmentId).toBe('seg-csv');
    expect(draft!.segmentLabel).toBe('seg-csv');  // falls back to id when no label
    expect(screen.getByTestId('dais-workflow-draft-panel')).toBeInTheDocument();
  });

  it('does not create a draft for an unrecognized template', () => {
    render(
      <DaisSuiteHome
        metadata={{ workflowTemplate: 'BogusTemplate', segmentId: 'seg-1' }}
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
        source:   'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      }),
    );
  });
});
