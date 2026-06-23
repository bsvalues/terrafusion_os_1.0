import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyWorkbench } from '../../pages/workbench/PropertyWorkbench';

/**
 * Contract: the Property Workbench must NEVER silently suppress the first
 * parcel-load attempt based on a client-side token heuristic. The API/auth
 * layer is the authority. A frontend preflight may show a transient
 * auth-pending state, but it must not produce: 0 parcel API calls +
 * Loading-forever + no 401/403 + no visible error.
 *
 * Fix C (+ narrow B guard) — regression introduced by 6e4c1ee17.
 */

const selectParcel = vi.fn();

let authToken: string | null = null;

interface MockPropertyState {
  activeParcel: { parcelId: string } | null;
  activeParcelLoading: boolean;
  activeParcelLoadingParcelId: string | null;
  activeParcelError: { parcelId?: string; status: number; message: string } | null;
  selectParcel: typeof selectParcel;
}

let propertyState: MockPropertyState = {
  activeParcel: null,
  activeParcelLoading: false,
  activeParcelLoadingParcelId: null,
  activeParcelError: null,
  selectParcel,
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: MockPropertyState) => unknown) => selector(propertyState),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ countyId: 'benton', userId: 'assessor', role: 'assessor' }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => ({
    token: authToken,
    isAuthenticated: !!authToken,
    countyId: 'benton',
    userId: 'assessor',
    roles: ['assessor'],
  }),
  toOsActor: () => ({ type: 'user', id: 'assessor' }),
}));

vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'],
  }),
}));

vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false }),
}));
vi.mock('../../services/badges', () => ({ BADGE_PROVIDERS: [] }));
vi.mock('../../services/quickActions', () => ({ QUICK_ACTION_PROVIDERS: [] }));

const PARCEL = '101040000000000';

function makeJwt(expSecondsFromNow = 3600): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + expSecondsFromNow };
  return [
    'test-header',
    btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, ''),
    'test-signature',
  ].join('.');
}

function renderWorkbench() {
  return render(
    <MemoryRouter initialEntries={[`/property/${PARCEL}`]}>
      <Routes>
        <Route path="/property/:parcelId/*" element={<PropertyWorkbench />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PropertyWorkbench parcel-load contract (Fix C)', () => {
  beforeEach(() => {
    authToken = null;
    selectParcel.mockClear();
    propertyState = {
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelLoadingParcelId: null,
      activeParcelError: null,
      selectParcel,
    };
  });

  it('1. attempts the parcel load even with NO usable token (no silent suppression)', async () => {
    authToken = null;
    renderWorkbench();
    await waitFor(() => expect(selectParcel).toHaveBeenCalledWith(PARCEL));
  });

  it('2. dev-preview-token does NOT suppress the parcel load', async () => {
    authToken = 'dev-preview-token';
    renderWorkbench();
    await waitFor(() => expect(selectParcel).toHaveBeenCalledWith(PARCEL));
  });

  it('3. does not duplicate selectParcel when the target parcel is already loading', () => {
    propertyState.activeParcelLoading = true;
    propertyState.activeParcelLoadingParcelId = PARCEL;
    renderWorkbench();
    expect(selectParcel).not.toHaveBeenCalled();
  });

  it('4. does not retry when the target parcel is blocked by an error', () => {
    propertyState.activeParcelError = { parcelId: PARCEL, status: 401, message: 'unauthorized' };
    renderWorkbench();
    expect(selectParcel).not.toHaveBeenCalled();
  });

  it('5. surfaces an explicit error state on 401 (no infinite Loading)', () => {
    propertyState.activeParcelError = { parcelId: PARCEL, status: 401, message: 'unauthorized' };
    renderWorkbench();
    expect(screen.getByTestId('workbench-parcel-load-error')).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`Loading property ${PARCEL}`))).not.toBeInTheDocument();
  });

  it('6. requests the route parcel when a usable token is present', async () => {
    authToken = makeJwt();
    renderWorkbench();
    await waitFor(() => expect(selectParcel).toHaveBeenCalledWith(PARCEL));
  });
});
