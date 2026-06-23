import '@testing-library/jest-dom';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PropertyWorkbench from '../../pages/workbench/PropertyWorkbench';

const selectParcelMock = vi.fn();
const navigateMock = vi.fn();

const storeState: {
  activeParcel: unknown;
  activeParcelLoading: boolean;
  activeParcelLoadingParcelId: string | null;
  activeParcelError: { status?: number; message: string; path?: string } | null;
} = {
  activeParcel: null,
  activeParcelLoading: false,
  activeParcelLoadingParcelId: null,
  activeParcelError: null,
};

const authState = {
  isAuthenticated: true,
  countyId: 'benton',
  userId: 'u-smoke',
  roles: ['Assessor'],
  token: 'jwt' as string | null,
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: unknown) => {
    const state = {
      ...storeState,
      selectParcel: selectParcelMock,
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ countyId: 'benton', userId: 'u-smoke', role: 'assessor' }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => authState,
  toOsActor: () => ({ countyId: 'benton', userId: 'u-smoke', roles: ['Assessor'] }),
}));

vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'],
  }),
}));

vi.mock('../../services/badges', () => ({ BADGE_PROVIDERS: [] }));
vi.mock('../../services/quickActions', () => ({ QUICK_ACTION_PROVIDERS: [] }));
vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false }),
}));

vi.mock('../../components/workbench/ContextRibbon', () => ({
  ContextRibbon: ({ parcelId }: { parcelId: string }) => (
    <div data-testid="context-ribbon">Ribbon {parcelId}</div>
  ),
}));

vi.mock('../../components/workbench/WorkbenchRail', () => ({
  WorkbenchRail: () => <nav data-testid="workbench-rail">Workbench Rail</nav>,
}));

vi.mock('../../components/workbench/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

function renderWorkbench(path = '/property/GATE-TEST-001/forge') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/property/:parcelId/*" element={<PropertyWorkbench />}>
          <Route path="forge" element={<div data-testid="property-forge-tab">Forge tab content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PropertyWorkbench production smoke blockers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(storeState, {
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelLoadingParcelId: null,
      activeParcelError: null,
    });
    Object.assign(authState, {
      isAuthenticated: true,
      countyId: 'benton',
      userId: 'u-smoke',
      roles: ['Assessor'],
      token: 'jwt',
    });
  });

  it('loads the route parcel through the store without requiring a Workbench bootstrap token', () => {
    authState.token = null;

    renderWorkbench();

    expect(screen.queryByTestId('workbench-auth-bootstrap')).not.toBeInTheDocument();
    expect(selectParcelMock).toHaveBeenCalledTimes(1);
    expect(selectParcelMock).toHaveBeenCalledWith('GATE-TEST-001');
  });

  it('does not duplicate the same parcel load while it is already in flight', () => {
    storeState.activeParcelLoading = true;
    storeState.activeParcelLoadingParcelId = 'GATE-TEST-001';

    renderWorkbench();

    expect(screen.getByText(/Loading property GATE-TEST-001/i)).toBeInTheDocument();
    expect(selectParcelMock).not.toHaveBeenCalled();
  });

  it('renders a hard property evidence blocker when authenticated parcel load returns 401', () => {
    storeState.activeParcelError = {
      status: 401,
      path: '/api/properties/parcel/GATE-TEST-001',
      message: 'Authenticated property evidence is required before this parcel can be reviewed.',
    };

    renderWorkbench();

    expect(screen.getByTestId('workbench-property-evidence-blocker')).toHaveTextContent(
      'Review blocked for parcel GATE-TEST-001',
    );
    expect(screen.getByText(/Authenticated property evidence is required/i)).toBeInTheDocument();
    expect(screen.getByTestId('workbench-property-evidence-status')).toHaveTextContent(
      'API status: 401',
    );
    expect(screen.queryByTestId('property-forge-tab')).not.toBeInTheDocument();
    expect(selectParcelMock).not.toHaveBeenCalled();
  });

  it('allows staff to retry the same parcel load from the blocker', () => {
    storeState.activeParcelError = {
      status: 401,
      message: 'Authenticated property evidence is required before this parcel can be reviewed.',
    };

    renderWorkbench();
    fireEvent.click(screen.getByRole('button', { name: /retry parcel load/i }));

    expect(selectParcelMock).toHaveBeenCalledWith('GATE-TEST-001');
  });

  it('renders normal Workbench tab content when parcel evidence is loaded', () => {
    storeState.activeParcel = {
      parcelId: 'GATE-TEST-001',
      address: '100 Gate Test Ave',
      ownerName: 'Gate Tester',
      totalAssessedValue: 250000,
      marketValue: 260000,
      landValue: 80000,
      improvementValue: 170000,
      propertyType: 'Residential',
      legalDescription: 'LOT 1 BLK 1',
      dataSource: 'live',
    };

    renderWorkbench();

    expect(screen.getByTestId('property-workbench-root')).toBeInTheDocument();
    expect(screen.getByTestId('context-ribbon')).toHaveTextContent('GATE-TEST-001');
    expect(screen.getByTestId('workbench-rail')).toBeInTheDocument();
    expect(screen.getByTestId('property-forge-tab')).toHaveTextContent('Forge tab content');
    expect(screen.queryByTestId('workbench-property-evidence-blocker')).not.toBeInTheDocument();
  });
});
