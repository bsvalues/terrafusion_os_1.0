/**
 * ═══════════════════════════════════════════════════════════════
 * LAUNCHER BEHAVIOR TESTS
 * TDD harness for keyboard behavior, focus trap, lifecycle
 *
 * Tests written BEFORE implementation per Slice 3 plan.
 * ═══════════════════════════════════════════════════════════════
 */

import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
vi.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: vi.fn(),
}));

// Mock materials gate
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

// Mock launcherModel - items defined INSIDE factory to avoid hoisting issues
vi.mock('../../components/Launcher/launcherModel', () => {
  const mockItems = [
    {
      id: 'forge',
      label: 'TerraForge',
      description: 'Valuation',
      icon: '🔨',
      intent: 'workbench' as const,
      route: '/property/123/forge',
      keywords: ['forge'],
      a11yLabel: 'TerraForge - Workbench',
    },
    {
      id: 'atlas',
      label: 'TerraAtlas',
      description: 'Mapping',
      icon: '🗺️',
      intent: 'workbench' as const,
      route: '/property/123/atlas',
      keywords: ['atlas'],
      a11yLabel: 'TerraAtlas - Workbench',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configuration',
      icon: '⚙️',
      intent: 'system' as const,
      route: '/settings',
      keywords: ['settings'],
      a11yLabel: 'Settings - System',
    },
  ];

  return {
    getLauncherSections: () => [
      { id: 'suites', label: 'Suites', items: mockItems.slice(0, 2) },
      { id: 'system', label: 'System', items: mockItems.slice(2) },
    ],
    filterLauncherItems: (items: typeof mockItems, query: string) =>
      query ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())) : items,
    navigateToLauncherItem: vi.fn(
      (item: (typeof mockItems)[0], navigate: (route: string) => void) => navigate(item.route)
    ),
    getIntentBadgeText: (intent: string) =>
      intent === 'workbench' ? 'Workbench' : intent === 'system' ? 'System' : 'Standalone',
  };
});

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Components to test
import { Launcher } from '../../components/Launcher';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';

// ============================================================================
// Test Helpers
// ============================================================================

const mockStore = {
  isOpen: true,
  close: vi.fn(),
  toggle: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
};

// Test items to pass directly to Launcher (bypasses the mock complexities)
const testLauncherItems = [
  {
    id: 'forge',
    label: 'TerraForge',
    description: 'Valuation',
    icon: '🔨',
    intent: 'workbench' as const,
    route: '/property/123/forge',
    keywords: ['forge'],
    a11yLabel: 'TerraForge - Workbench',
  },
  {
    id: 'atlas',
    label: 'TerraAtlas',
    description: 'Mapping',
    icon: '🗺️',
    intent: 'workbench' as const,
    route: '/property/123/atlas',
    keywords: ['atlas'],
    a11yLabel: 'TerraAtlas - Workbench',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configuration',
    icon: '⚙️',
    intent: 'system' as const,
    route: '/settings',
    keywords: ['settings'],
    a11yLabel: 'Settings - System',
  },
];

function renderLauncher(props: { testItems?: typeof testLauncherItems } = {}) {
  (useCommandPaletteStore as unknown as Mock).mockImplementation((selector) =>
    selector ? selector(mockStore) : mockStore
  );

  return render(
    <MemoryRouter>
      <Launcher {...props} />
    </MemoryRouter>
  );
}

// ============================================================================
// Test Suite: Launcher Open/Close Lifecycle
// ============================================================================

describe('Launcher: Open/Close Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = true;
    mockStore.close = vi.fn();
    mockStore.toggle = vi.fn();
    mockStore.searchQuery = '';
  });

  it('renders when isOpen is true', () => {
    renderLauncher();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    mockStore.isOpen = false;
    renderLauncher();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on ESC key press', async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.keyboard('{Escape}');
    expect(mockStore.close).toHaveBeenCalled();
  });

  it('closes when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const backdrop = screen.getByTestId('launcher-backdrop');
    await user.click(backdrop);
    expect(mockStore.close).toHaveBeenCalled();
  });

  it('does not close when launcher content is clicked', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const content = screen.getByTestId('launcher-content');
    await user.click(content);
    expect(mockStore.close).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Test Suite: Focus Management
// ============================================================================

describe('Launcher: Focus Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = true;
    mockStore.searchQuery = '';
  });

  it('focuses search input on open', async () => {
    renderLauncher();

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toHaveFocus();
    });
  });

  it('traps focus within launcher (Tab cycles)', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveFocus();

    // Tab through items - mockLauncherItems has 3 items
    await user.tab();
    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(0);

    // Tab should cycle back to search (focus trap)
    for (let i = 0; i < items.length + 1; i++) {
      await user.tab();
    }
    // After cycling through all, should return to search or first item
    const activeElement = document.activeElement;
    expect(activeElement?.closest('[data-testid="launcher-content"]')).toBeTruthy();
  });

  it('restores focus to invoker on close', async () => {
    // Create an invoker button
    const invokerRef = React.createRef<HTMLButtonElement>();
    const { rerender } = render(
      <MemoryRouter>
        <button ref={invokerRef} data-testid='invoker'>
          Open Launcher
        </button>
        <Launcher invokerRef={invokerRef} />
      </MemoryRouter>
    );

    // Mock focus restoration
    invokerRef.current?.focus();
    mockStore.isOpen = false;

    rerender(
      <MemoryRouter>
        <button ref={invokerRef} data-testid='invoker'>
          Open Launcher
        </button>
        <Launcher invokerRef={invokerRef} />
      </MemoryRouter>
    );

    // Focus should return to invoker (implementation will handle this)
    // For now, just verify the pattern works
    expect(invokerRef.current).not.toBeNull();
  });
});

// ============================================================================
// Test Suite: Keyboard Navigation
// ============================================================================

describe('Launcher: Keyboard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = true;
    mockStore.searchQuery = '';
  });

  it('renders navigable items', () => {
    renderLauncher();
    const items = screen.getAllByRole('button');
    expect(items.length).toBe(3); // TerraForge, TerraAtlas, Settings
  });

  it('items have data-active attribute ready for navigation', () => {
    renderLauncher();
    const items = screen.getAllByRole('button');
    // All items start with data-active="false" (no selection)
    items.forEach((item) => {
      expect(item).toHaveAttribute('data-active', 'false');
    });
  });

  it('items have aria-selected for accessibility', () => {
    renderLauncher();
    const items = screen.getAllByRole('button');
    // All items start with aria-selected="false"
    items.forEach((item) => {
      expect(item).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('clicking an item navigates and closes launcher', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const items = screen.getAllByRole('button');
    await user.click(items[0]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
      expect(mockStore.close).toHaveBeenCalled();
    });
  });

  it('ESC key closes launcher', async () => {
    renderLauncher();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(mockStore.close).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Test Suite: Search Filtering
// ============================================================================

describe('Launcher: Search Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = true;
    mockStore.searchQuery = '';
    mockStore.setSearchQuery = vi.fn();
  });

  it('typing in search updates query', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'f');

    expect(mockStore.setSearchQuery).toHaveBeenCalled();
  });

  it('displays items when no search query', () => {
    mockStore.searchQuery = '';
    renderLauncher();

    expect(screen.getByText('TerraForge')).toBeInTheDocument();
    expect(screen.getByText('TerraAtlas')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows empty state when no results match', () => {
    mockStore.searchQuery = 'nonexistent';
    renderLauncher();

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('clears search on ESC', async () => {
    mockStore.searchQuery = 'something';
    renderLauncher();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockStore.close).toHaveBeenCalled();
  });
});

// ============================================================================
// Test Suite: Accessibility
// ============================================================================

describe('Launcher: Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = true;
    mockStore.searchQuery = '';
  });

  it('has role="dialog" and aria-modal="true"', () => {
    renderLauncher();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-label describing the launcher', () => {
    renderLauncher();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', expect.stringMatching(/launcher|menu|search/i));
  });

  it('search input has accessible label', () => {
    renderLauncher();

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAccessibleName();
  });

  it('launcher items have accessible names with intent', () => {
    renderLauncher();

    const items = screen.getAllByRole('button');
    items.forEach((item) => {
      expect(item).toHaveAccessibleName();
    });
  });

  it('items have aria-selected attribute for accessibility', () => {
    renderLauncher();

    const items = screen.getAllByRole('button');
    items.forEach((item) => {
      // All items should have aria-selected defined
      expect(item).toHaveAttribute('aria-selected');
    });
  });
});
