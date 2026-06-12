import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyWorkbenchSurface } from '../../pages/workbench/PropertyWorkbenchSurface';
import PropertyWorkbench from '../../pages/workbench/PropertyWorkbench';

const { activateModuleMock } = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
}));

const selectParcel = vi.fn();

let authToken: string | null = null;

const propertyState = {
  activeParcel: null,
  activeParcelLoading: false,
  activeParcelError: null,
  selectParcel,
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: typeof propertyState) => unknown) => selector(propertyState),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({
    countyId: 'benton',
    userId: 'assessor',
    role: 'assessor',
  }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => ({
    token: authToken,
    countyId: 'benton',
    userId: 'assessor',
    roles: ['assessor'],
  }),
  toOsActor: () => ({
    type: 'user',
    id: 'assessor',
  }),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => activateModuleMock(...args),
}));

vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'],
  }),
}));

vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({
    entries: [],
    loading: false,
  }),
}));

vi.mock('../../services/badges', () => ({
  BADGE_PROVIDERS: [],
}));

vi.mock('../../services/quickActions', () => ({
  QUICK_ACTION_PROVIDERS: [],
}));

function makeJwt(expSecondsFromNow = 3600): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  };
  return [
    'test-header',
    btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, ''),
    'test-signature',
  ].join('.');
}

function renderWorkbenchSurface(parcelId = '101040000000000') {
  return render(
    <PropertyWorkbenchSurface
      parcelId={parcelId}
      currentTabId="summary"
      onBack={vi.fn()}
      onSearch={vi.fn()}
      renderNavigation={() => null}
      renderContent={() => null}
    />
  );
}

const RouteProbe: React.FC = () => {
  const location = useLocation();
  return <div data-testid="route-probe">{location.pathname}</div>;
};

describe('PropertyWorkbench auth contract', () => {
  beforeEach(() => {
    authToken = null;
    selectParcel.mockClear();
    activateModuleMock.mockReset();
  });

  it('does not request parcel data before a usable auth token exists', () => {
    renderWorkbenchSurface();

    expect(screen.getByTestId('workbench-auth-bootstrap')).toBeInTheDocument();
    expect(selectParcel).not.toHaveBeenCalled();
  });

  it('requests the route parcel after a usable auth token is available', async () => {
    authToken = makeJwt();

    renderWorkbenchSurface();

    await waitFor(() => {
      expect(selectParcel).toHaveBeenCalledWith('101040000000000');
    });
  });

  it('no-parcel Workbench state opens a selected parcel in the same Workbench window', async () => {
    const onSearch = vi.fn();
    const onBack = vi.fn();
    const onParcelSelected = vi.fn();

    render(
      <PropertyWorkbenchSurface
        parcelId={null}
        currentTabId="summary"
        onBack={onBack}
        onSearch={onSearch}
        onParcelSelected={onParcelSelected}
        renderNavigation={() => null}
        renderContent={() => null}
      />
    );

    expect(screen.getByTestId('workbench-no-parcel')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/parcel id/i), {
      target: { value: '101040000000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /open parcel/i }));

    expect(onParcelSelected).toHaveBeenCalledWith('101040000000000');
    expect(onSearch).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('keeps the route bridge mounted until Cortex activation finishes', async () => {
    let resolveActivation: (() => void) | undefined;
    activateModuleMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveActivation = resolve;
      }),
    );

    render(
      <MemoryRouter initialEntries={['/property/101040000000000/forge']}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <RouteProbe />
                <div data-testid="os-home">TerraFusion OS</div>
              </>
            }
          />
          <Route
            path="/property/:parcelId/*"
            element={
              <>
                <RouteProbe />
                <PropertyWorkbench />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('property-workbench', {
        source: 'route',
        metadata: { parcelId: '101040000000000', tabId: 'forge' },
        showNotification: false,
      });
    });

    expect(screen.getByTestId('property-workbench-route-bridge')).toBeInTheDocument();
    expect(screen.getByTestId('route-probe')).toHaveTextContent('/property/101040000000000/forge');
    expect(screen.queryByTestId('os-home')).not.toBeInTheDocument();

    resolveActivation?.();

    await waitFor(() => {
      expect(screen.getByTestId('os-home')).toBeInTheDocument();
    });
    expect(screen.getByTestId('route-probe')).toHaveTextContent('/');
  });
});
