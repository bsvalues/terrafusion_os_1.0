import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activateModuleMock, selectParcelMock, openWorkbenchWindowMock } = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  selectParcelMock: vi.fn(),
  openWorkbenchWindowMock: vi.fn(),
}));

vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: any) => {
    const state = {
      activeParcel: null,
      activeParcelLoading: false,
      selectParcel: selectParcelMock,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: () => [],
  useRecentParcelMeta: () => ({}),
  recordRecentParcelMeta: vi.fn(),
  openWorkbenchWindow: openWorkbenchWindowMock,
}));

vi.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: (selector: any) => selector({ open: vi.fn() }),
}));

vi.mock('../../shell/command-palette/useParcelSearch', () => ({
  useParcelSearch: () => ({
    results: [],
    totalCount: 0,
    isLoading: false,
  }),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ countyId: 'benton', userId: 'u-test', role: 'assessor' }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => ({ countyId: 'benton', userId: 'u-test', roles: ['assessor'] }),
}));

vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot', 'trace'],
    hiddenCount: 0,
    showAll: false,
    toggleShowAll: vi.fn(),
  }),
}));

vi.mock('../../services/badges', () => ({ BADGE_PROVIDERS: [] }));
vi.mock('../../services/quickActions', () => ({ QUICK_ACTION_PROVIDERS: [] }));
vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false }),
}));

import PropertyWorkbenchWindow from '../../pages/workbench/PropertyWorkbenchWindow';

describe('PropertyWorkbenchWindow segment context bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps County Studio segment context visible when opened without a parcel', () => {
    render(
      <PropertyWorkbenchWindow
        metadata={{
          tabId: 'dais',
          segmentId: 'seg-42',
          segmentLabel: 'West Richland R1',
          studyId: 'study-2026',
          countyId: 'benton',
          countyStudioHandoff: 'SegmentReview',
          downstreamReceiptId: 'receipt-42',
          downstreamStatus: 'Returned',
        }}
      />,
    );

    const card = screen.getByTestId('workbench-segment-handoff-card');
    expect(card).toHaveTextContent('County Studio Context');
    expect(card).toHaveTextContent('West Richland R1');
    expect(card).toHaveTextContent('SegmentReview');
    expect(card).toHaveTextContent('receipt-42');
    expect(card).toHaveTextContent('Returned');

    fireEvent.click(screen.getByTestId('workbench-segment-back-county-studio'));

    expect(activateModuleMock).toHaveBeenCalledWith('county-studio', {
      source: 'system',
      metadata: expect.objectContaining({
        segmentId: 'seg-42',
        studyId: 'study-2026',
        countyId: 'benton',
        downstreamReceiptId: 'receipt-42',
        downstreamStatus: 'Returned',
      }),
    });
    expect(openWorkbenchWindowMock).not.toHaveBeenCalled();
  });
});
