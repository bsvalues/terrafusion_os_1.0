import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyWorkbench } from '../../pages/workbench/PropertyWorkbench';

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

function renderWorkbench() {
  return render(
    <MemoryRouter initialEntries={['/property/101040000000000']}>
      <Routes>
        <Route path="/property/:parcelId/*" element={<PropertyWorkbench />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PropertyWorkbench auth contract', () => {
  beforeEach(() => {
    authToken = null;
    selectParcel.mockClear();
  });

  it('does not request parcel data before a usable auth token exists', () => {
    renderWorkbench();

    expect(screen.getByTestId('workbench-auth-bootstrap')).toBeInTheDocument();
    expect(selectParcel).not.toHaveBeenCalled();
  });

  it('requests the route parcel after a usable auth token is available', async () => {
    authToken = makeJwt();

    renderWorkbench();

    await waitFor(() => {
      expect(selectParcel).toHaveBeenCalledWith('101040000000000');
    });
  });
});
