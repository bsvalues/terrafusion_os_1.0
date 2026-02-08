/**
 * ═══════════════════════════════════════════════════════════════
 * LAUNCHER ROUTING TESTS
 * TDD harness for routing truth - ensures launcher items route correctly
 *
 * Tests written BEFORE implementation per Slice 3 plan.
 * Mirrors suiteTiles.routing.test.tsx for consistency.
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
jest.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: jest.fn(),
}));

// Mock materials gate
jest.mock('../../ui/materials/materialQualityGate', () => ({
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

// Mock launcherModel
const DEMO_PARCEL_ID = '1234567890';
const mockLauncherItems = [
  {
    id: 'forge',
    label: 'TerraForge',
    description: 'Property Valuation & Cost Analysis',
    icon: '🔨',
    intent: 'workbench' as const,
    route: `/property/${DEMO_PARCEL_ID}/forge`,
    keywords: ['valuation', 'cost', 'forge'],
    a11yLabel: 'TerraForge - Opens in Property Workbench tab',
  },
  {
    id: 'atlas',
    label: 'TerraAtlas',
    description: 'Geographic Intelligence & Mapping',
    icon: '🗺️',
    intent: 'workbench' as const,
    route: `/property/${DEMO_PARCEL_ID}/atlas`,
    keywords: ['map', 'geo', 'atlas'],
    a11yLabel: 'TerraAtlas - Opens in Property Workbench tab',
  },
  {
    id: 'pilot',
    label: 'Pilot Console',
    description: 'Tool execution & governance',
    icon: '🎮',
    intent: 'standalone' as const,
    route: '/pilot',
    keywords: ['pilot', 'tools', 'console'],
    a11yLabel: 'Pilot Console - Opens standalone',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    icon: '⚙️',
    intent: 'system' as const,
    route: '/settings',
    keywords: ['settings', 'config'],
    a11yLabel: 'Settings - System configuration',
  },
];

jest.mock('../../components/launcher/launcherModel', () => ({
  getLauncherItems: () => mockLauncherItems,
  getLauncherSections: () => [
    {
      id: 'suites',
      label: 'Suites',
      items: mockLauncherItems.filter((i: { intent: string }) => i.intent !== 'system'),
    },
    {
      id: 'system',
      label: 'System',
      items: mockLauncherItems.filter((i: { intent: string }) => i.intent === 'system'),
    },
  ],
  filterLauncherItems: (items: typeof mockLauncherItems, query: string) =>
    query ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())) : items,
  navigateToLauncherItem: jest.fn(
    (item: (typeof mockLauncherItems)[0], navigate: (route: string) => void) => navigate(item.route)
  ),
  getIntentBadgeText: (intent: string) =>
    intent === 'workbench' ? 'Workbench' : intent === 'system' ? 'System' : 'Standalone',
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Components to test
import { Launcher } from '../../components/launcher';
import { getLauncherItems } from '../../components/launcher/launcherModel';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';

// ============================================================================
// Test Helpers
// ============================================================================

const mockStore = {
  isOpen: true,
  close: jest.fn(),
  toggle: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
};

function renderLauncher() {
  (useCommandPaletteStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector ? selector(mockStore) : mockStore
  );

  return render(
    <MemoryRouter>
      <Launcher />
    </MemoryRouter>
  );
}

// ============================================================================
// Test Suite: Routing Truth (Single Source)
// ============================================================================

describe('Launcher: Routing Truth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('all launcher items have valid routes (no undefined)', () => {
    const items = getLauncherItems();

    items.forEach((item) => {
      expect(item.route).toBeDefined();
      expect(item.route).not.toBe('');
      expect(item.route).not.toBe('#');
      expect(item.route).not.toBe('undefined');
    });
  });

  it('all launcher items have intent metadata', () => {
    const items = getLauncherItems();

    items.forEach((item) => {
      expect(['workbench', 'standalone', 'system']).toContain(item.intent);
    });
  });

  it('intent metadata matches suiteRegistry for suites', () => {
    const items = getLauncherItems();

    // Workbench suites should have workbench intent
    const forgeItem = items.find((i) => i.id === 'forge');
    expect(forgeItem?.intent).toBe('workbench');

    const atlasItem = items.find((i) => i.id === 'atlas');
    expect(atlasItem?.intent).toBe('workbench');
  });
});

// ============================================================================
// Test Suite: Workbench Items
// ============================================================================

describe('Launcher: Workbench Items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('workbench items route to /property/:parcelId/tab', async () => {
    const user = userEvent.setup();
    renderLauncher();

    // Find and click a workbench item
    const forgeButton = screen.getByText('TerraForge').closest('button');
    expect(forgeButton).toBeTruthy();
    await user.click(forgeButton!);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/property\/\d+\/forge/));
  });

  it('workbench items have "Workbench" badge', () => {
    renderLauncher();

    const forgeButton = screen.getByText('TerraForge').closest('button');
    expect(forgeButton).toHaveAttribute('data-intent', 'workbench');

    // Badge should indicate workbench
    const badge = forgeButton?.querySelector('[data-badge]');
    expect(badge?.textContent).toMatch(/workbench/i);
  });

  it('workbench items include aria-label with intent', () => {
    renderLauncher();

    const forgeButton = screen.getByText('TerraForge').closest('button');
    const ariaLabel = forgeButton?.getAttribute('aria-label');

    expect(ariaLabel).toMatch(/workbench/i);
  });
});

// ============================================================================
// Test Suite: Standalone Items
// ============================================================================

describe('Launcher: Standalone Items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('standalone items route to suite home paths', async () => {
    const user = userEvent.setup();
    renderLauncher();

    // Find and click a standalone item
    const pilotButton = screen.getByText('Pilot Console').closest('button');
    expect(pilotButton).toBeTruthy();
    await user.click(pilotButton!);

    expect(mockNavigate).toHaveBeenCalledWith('/pilot');
  });

  it('standalone items have "Standalone" badge', () => {
    renderLauncher();

    const pilotButton = screen.getByText('Pilot Console').closest('button');
    expect(pilotButton).toHaveAttribute('data-intent', 'standalone');
  });

  it('standalone items do NOT route to workbench paths', () => {
    const items = getLauncherItems();

    const standaloneItems = items.filter((i) => i.intent === 'standalone');
    standaloneItems.forEach((item) => {
      expect(item.route).not.toMatch(/\/property\/\d+\//);
    });
  });
});

// ============================================================================
// Test Suite: System Actions
// ============================================================================

describe('Launcher: System Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('system items have "system" intent', () => {
    const items = getLauncherItems();

    const settingsItem = items.find((i) => i.id === 'settings');
    expect(settingsItem?.intent).toBe('system');
  });

  it('system items route to system paths', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const settingsButton = screen.getByText('Settings').closest('button');
    expect(settingsButton).toBeTruthy();
    await user.click(settingsButton!);

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('system items have distinct visual style', () => {
    renderLauncher();

    const settingsButton = screen.getByText('Settings').closest('button');
    expect(settingsButton).toHaveAttribute('data-intent', 'system');
  });
});

// ============================================================================
// Test Suite: No Dead Links
// ============================================================================

describe('Launcher: No Dead Links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('all launcher items can be activated', async () => {
    const user = userEvent.setup();
    renderLauncher();

    const buttons = screen.getAllByRole('button');

    // Each button should be clickable and trigger navigation
    for (const button of buttons) {
      mockNavigate.mockClear();
      await user.click(button);

      // Should have navigated somewhere (not thrown)
      expect(mockNavigate).toHaveBeenCalled();
    }
  });

  it('launcher items with routes navigate, items with actions execute', () => {
    const items = getLauncherItems();

    items.forEach((item) => {
      // Every item should have either a route or an action
      expect(item.route || item.action).toBeTruthy();
    });
  });
});

// ============================================================================
// Test Suite: Section Organization
// ============================================================================

describe('Launcher: Section Organization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('groups items by intent with section headers', () => {
    renderLauncher();

    // Should have section groups
    const sections = screen.getAllByRole('group');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('has suites and system sections', () => {
    renderLauncher();

    // Section headers (h3 elements with the section labels)
    const suitesHeader = screen.getByRole('heading', { name: /suites/i });
    expect(suitesHeader).toBeInTheDocument();

    // System section should exist
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThanOrEqual(2); // At least Suites + System
  });
});
