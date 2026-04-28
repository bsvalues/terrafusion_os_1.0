import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CorrectionDefensePanel } from '../components/CorrectionDefensePanel';
import { adjustmentSetApi, exceptionApi, scenarioApi } from '../countyStudyApi';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  adjustmentSetApi: { list: vi.fn() },
  exceptionApi: { list: vi.fn() },
  scenarioApi: { promote: vi.fn() },
}));

vi.mock('../components/ExportPacketModal', () => ({
  ExportPacketModal: ({ studyId, scenarioId }: { studyId: string; scenarioId?: string }) => (
    <div data-testid="mock-export-packet">{studyId}:{scenarioId ?? 'none'}</div>
  ),
}));

const mockAdjustmentList = adjustmentSetApi.list as ReturnType<typeof vi.fn>;
const mockExceptionList = exceptionApi.list as ReturnType<typeof vi.fn>;
const mockPromote = scenarioApi.promote as ReturnType<typeof vi.fn>;

function renderPanel() {
  return render(
    <CorrectionDefensePanel
      onOpenScenario={vi.fn()}
      onOpenCompare={vi.fn()}
      onOpenGovernance={vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAdjustmentList.mockResolvedValue([
    {
      adjustmentSetId: 'adj-1',
      studyId: 'study-1',
      scenarioId: 'scenario-1',
      effectiveScope: '{}',
      approvalState: 'ReadyForApproval',
      approvedBy: null,
      publishedAt: null,
      rollbackReason: null,
    },
  ]);
  mockExceptionList.mockResolvedValue([
    {
      exceptionSetId: 'exception-1',
      studyId: 'study-1',
      sourceScenarioId: 'scenario-1',
      reasonCode: 'LowSample',
      parcelCount: 12,
      destination: 'Dais',
      status: 'Created',
      assignedTo: null,
      notes: null,
      createdAt: '2026-04-28T12:00:00Z',
      createdBy: 'test',
    },
  ]);
  mockPromote.mockResolvedValue({
    adjustmentSetId: 'adj-2',
    studyId: 'study-1',
    scenarioId: 'scenario-1',
    effectiveScope: '{"cohortId":"cohort-1"}',
    approvalState: 'Proposed',
    approvedBy: null,
    publishedAt: null,
    rollbackReason: null,
  });

  act(() => {
    useCountyStudioStore.setState({
      activeStudy: {
        studyId: 'study-1',
        countyId: 'county-1',
        countyName: 'Benton County',
        taxYear: 2026,
        studyType: 'MassAppraisal',
        status: 'Active',
        baselineVersion: null,
        activeSegmentSetId: 'set-1',
        createdAt: '2026-04-28T00:00:00Z',
        createdBy: 'test',
      },
      activeScenario: {
        scenarioId: 'scenario-1',
        studyId: 'study-1',
        cohortId: 'cohort-1',
        adjustmentType: 'PercentageIncrease',
        parameters: { magnitude: 3 },
        rationale: 'Market correction',
        status: 'Saved',
        createdAt: '2026-04-28T00:00:00Z',
      },
      cohorts: [
        {
          cohortId: 'cohort-1',
          studyId: 'study-1',
          name: 'Hood 101 Reval 3 cohort',
          selectionType: 'Segment',
          parcelCount: 884,
          isHybrid: false,
          createdAt: '2026-04-28T00:00:00Z',
        },
      ],
      scenarios: [
        {
          scenarioId: 'scenario-1',
          studyId: 'study-1',
          cohortId: 'cohort-1',
          adjustmentType: 'PercentageIncrease',
          parameters: { magnitude: 3 },
          rationale: 'Market correction',
          status: 'Saved',
          createdAt: '2026-04-28T00:00:00Z',
        },
      ],
      healthSummary: {
        studyId: 'study-1',
        countyId: 'county-1',
        taxYear: 2026,
        parcelCount: 1000,
        ratioCount: 525,
        medianRatio: 0.927,
        cod: 41.3,
        prd: 1.399,
        stabilityScore: 52,
        riskScore: 72,
        exceptionCount: 83,
        complianceStatus: 'NonCompliant',
        topAlerts: [],
        criticalCount: 122,
        warningCount: 83,
        healthyCount: 10,
        derivedAt: '2026-04-28T00:00:00Z',
      },
      segments: [
        {
          segmentId: 'segment-1',
          segmentSetId: 'set-1',
          name: 'Neighborhood 101 · Reval 3 · Residential',
          segmentType: 'Residential',
          geographyRef: '101',
          revalArea: 3,
          buildingType: 'Residential',
          qualityGrade: null,
          parcelCount: 884,
          medianRatio: 0.798,
          cod: 30.1,
          prd: 1.22,
          stabilityScore: 51,
          riskScore: 70,
          exceptionCount: 11,
          salesCount: 48,
          ratioCount: 48,
          prb: -2.236,
          weightedMeanRatio: 0.822,
          yoyMedianRatioDelta: null,
        },
      ],
      selectedSegmentId: 'segment-1',
      scenarioPreview: null,
    });
  });
});

describe('CorrectionDefensePanel', () => {
  test('renders no-study state honestly', () => {
    act(() => {
      useCountyStudioStore.setState({ activeStudy: null });
    });
    renderPanel();
    expect(screen.getByTestId('defense-panel-no-study')).toHaveTextContent(/Open a study/i);
  });

  test('renders correction readiness chain from real store and backend workflow state', async () => {
    renderPanel();
    await screen.findByTestId('defense-readiness-chain');
    await waitFor(() => expect(mockAdjustmentList).toHaveBeenCalledWith('study-1'));
    expect(screen.getByTestId('defense-current-anchors')).toHaveTextContent('Benton County');
    await waitFor(() => {
      expect(screen.getByTestId('defense-current-anchors')).toHaveTextContent('1 adjustment set');
      expect(screen.getByTestId('defense-current-anchors')).toHaveTextContent('1 open exception');
      expect(screen.getByTestId('defense-readiness-approval')).toHaveTextContent(/promoted/i);
    });
  });

  test('opens evidence packet with active scenario context', async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(mockExceptionList).toHaveBeenCalledWith('study-1'));
    await user.click(screen.getByRole('button', { name: /Export Evidence Packet/i }));
    expect(screen.getByTestId('mock-export-packet')).toHaveTextContent('study-1:scenario-1');
  });

  test('promotes a saved scenario into the governed approval workflow', async () => {
    const user = userEvent.setup();
    mockAdjustmentList.mockResolvedValue([]);
    renderPanel();
    await waitFor(() => expect(mockAdjustmentList).toHaveBeenCalledWith('study-1'));

    await user.click(screen.getByRole('button', { name: /Promote Saved Scenario/i }));

    await waitFor(() => expect(mockPromote).toHaveBeenCalledWith({
      scenarioId: 'scenario-1',
      effectiveScope: '{"cohortId":"cohort-1"}',
    }));
    expect(await screen.findByTestId('defense-promotion-success')).toHaveTextContent(/promoted/i);
    expect(screen.getByTestId('defense-current-anchors')).toHaveTextContent('1 adjustment set');
  });
});
