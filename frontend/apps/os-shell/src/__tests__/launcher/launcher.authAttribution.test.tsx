/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  activateModuleMock,
  mockNavigate,
  mockRecordRecent,
  mockUseAuthContextOptional,
} = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  mockNavigate: vi.fn(),
  mockRecordRecent: vi.fn(),
  mockUseAuthContextOptional: vi.fn(),
}));

vi.mock('@/auth/useAuthContext', () => ({
  useAuthContextOptional: mockUseAuthContextOptional,
  toOsActor: (auth: {
    isAuthenticated: boolean;
    userId: string | null;
    countyId: string | null;
    roles: readonly string[];
  }) =>
    auth.isAuthenticated && auth.userId && auth.countyId
      ? { userId: auth.userId, countyId: auth.countyId, roles: auth.roles }
      : null,
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: activateModuleMock,
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../stores/startMenuStore', () => ({
  useStartMenuStore: vi.fn(),
}));

vi.mock('../../components/launcher/pinsStore', () => ({
  usePinsStore: vi.fn(
    (selector: (state: {
      pinnedIds: Set<string>;
      isPinned: () => boolean;
      togglePin: () => void;
    }) => unknown) =>
      selector({ pinnedIds: new Set<string>(), isPinned: () => false, togglePin: vi.fn() }),
  ),
  initPinsStore: vi.fn(),
}));

vi.mock('../../components/launcher/recentsStore', () => ({
  useRecentsStore: vi.fn(
    (selector: (state: { recentIds: string[]; record: () => void }) => unknown) =>
      selector({ recentIds: [], record: mockRecordRecent }),
  ),
  initRecentsStore: vi.fn(),
}));

vi.mock('../../ui/materials/materialQualityGate', () => ({
  useMaterialQuality: () => ({
    tier: 'high',
    enableBackdropBlur: true,
    enableSprings: true,
    prefersReducedMotion: false,
  }),
  MaterialQuality: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
}));

import { Launcher } from '../../components/launcher';
import type { LauncherItem } from '../../components/launcher/launcherModel';
import { useStartMenuStore } from '../../stores/startMenuStore';

const COUNTIES_HUB_ITEM: LauncherItem = {
  id: 'counties',
  label: 'Counties HUB',
  description: 'Washington assessor county workspace',
  iconName: 'Map',
  icon: 'Map',
  intent: 'standalone',
  route: '/counties',
  moduleId: 'counties',
  keywords: ['counties', 'washington', 'assessor'],
  a11yLabel: 'Counties HUB - Open the Washington assessor county workspace',
};

const mockStore = {
  isOpen: true,
  close: vi.fn(),
  toggle: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
};

function renderLauncher() {
  (useStartMenuStore as unknown as vi.Mock).mockImplementation((selector) =>
    selector ? selector(mockStore) : mockStore,
  );

  return render(
    <MemoryRouter>
      <Launcher testItems={[COUNTIES_HUB_ITEM]} />
    </MemoryRouter>,
  );
}

describe('Launcher actor attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activateModuleMock.mockResolvedValue(undefined);
    mockStore.isOpen = true;
  });

  it('activates Counties HUB with the latest user and county after auth rerenders', async () => {
    const user = userEvent.setup();
    mockUseAuthContextOptional.mockReturnValue({
      isAuthenticated: true,
      userId: 'assessor-before',
      countyId: 'wa-005',
      roles: ['assessor'],
      token: null,
    });
    const { rerender } = renderLauncher();

    mockUseAuthContextOptional.mockReturnValue({
      isAuthenticated: true,
      userId: 'assessor-current',
      countyId: 'wa-063',
      roles: ['assessor'],
      token: null,
    });
    rerender(
      <MemoryRouter>
        <Launcher testItems={[COUNTIES_HUB_ITEM]} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: COUNTIES_HUB_ITEM.a11yLabel }),
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledOnce();
      expect(activateModuleMock).toHaveBeenCalledWith('counties', {
        source: 'start_menu',
        actor: {
          userId: 'assessor-current',
          countyId: 'wa-063',
          roles: ['assessor'],
        },
      });
    });
  });
});
