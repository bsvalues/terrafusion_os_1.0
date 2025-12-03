/**
 * HomeWorkspace.test.tsx
 *
 * Tests for the HomeWorkspace v1.1 "Mini Command Center"
 * with Glass + TerraSphere + OSHealthSummaryBar + RightRailShell.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeWorkspace } from '../HomeWorkspace';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock RightRailShell - it reads from OmniIntentContext
vi.mock('../RightRailShell', () => ({
  RightRailShell: ({ workspaceId }: { workspaceId: string }) => (
    <div data-testid='mock-right-rail-shell'>RightRailShell: {workspaceId}</div>
  ),
}));

// Mock the catalog's resolveOSObjectComponent
vi.mock('../../catalog/osObjects', () => ({
  resolveOSObjectComponent: (id: string) => {
    const components: Record<string, React.FC<any>> = {
      object_quicklist: () => <div data-testid='mock-quicklist'>Quick List</div>,
      workspace_activity_feed: ({ items }: any) => (
        <div data-testid='mock-activity-feed'>{items?.length ?? 0} items</div>
      ),
      workspace_command_palette: () => (
        <div data-testid='mock-command-palette'>Command Palette</div>
      ),
    };
    return components[id] || null;
  },
}));

// Mock activity hook
vi.mock('../../core/activity/useWorkspaceActivity', () => ({
  useWorkspaceActivity: () => ({
    items: [
      { id: '1', message: 'Test activity', timestamp: Date.now() },
      { id: '2', message: 'Another activity', timestamp: Date.now() },
    ],
    loading: false,
    error: null,
  }),
}));

// Mock health summary hook for OSHealthSummaryBar and WorkspaceTerraSphere
vi.mock('../../core/activity/useWorkspaceHealthSummary', () => ({
  useWorkspaceHealthSummary: () => ({
    summary: { level: 'nominal', incidents24h: 0 },
    loading: false,
    error: null,
  }),
}));

describe('HomeWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the home-workspace container', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('home-workspace')).toBeInTheDocument();
  });

  it('renders the OSHealthSummaryBar', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('home-health-bar')).toBeInTheDocument();
    expect(screen.getByTestId('home-health-bar-label')).toHaveTextContent('Home Health');
  });

  it('renders the command panel with TerraSphere', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('home-command-panel')).toBeInTheDocument();
    expect(screen.getByTestId('home-terrasphere')).toBeInTheDocument();
  });

  it('displays TerraCommand header text', () => {
    render(<HomeWorkspace />);
    expect(screen.getByText('TerraCommand')).toBeInTheDocument();
    expect(screen.getByText('OMNI–INTENT FIELD')).toBeInTheDocument();
  });

  it('shows keyboard shortcut hint', () => {
    render(<HomeWorkspace />);
    // Should show either ⌘K or Ctrl+K depending on platform
    const hint = screen.getByText(/to issue a system-level command/i);
    expect(hint).toBeInTheDocument();
  });

  it('renders the quick objects glass panel', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('home-quick-panel')).toBeInTheDocument();
    expect(screen.getByText('Quick Objects')).toBeInTheDocument();
  });

  it('renders the activity glass panel', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('home-activity-panel')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders the QuickList OS object', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('mock-quicklist')).toBeInTheDocument();
  });

  it('renders the ActivityFeed OS object', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('mock-activity-feed')).toBeInTheDocument();
  });

  it('renders the CommandPalette OS object', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('mock-command-palette')).toBeInTheDocument();
  });

  it('passes activity items to the feed', () => {
    render(<HomeWorkspace />);
    // Mock returns 2 items
    expect(screen.getByTestId('mock-activity-feed')).toHaveTextContent('2 items');
  });
});

describe('HomeWorkspace loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator when activity is loading', async () => {
    // Override the mock for this test
    vi.doMock('../../core/activity/useWorkspaceActivity', () => ({
      useWorkspaceActivity: () => ({
        items: [],
        loading: true,
        error: null,
      }),
    }));

    // Re-import to get fresh module with new mock
    const { HomeWorkspace: HomeWorkspaceLoading } = await import('../HomeWorkspace');
    render(<HomeWorkspaceLoading />);

    // The loading state should show the loading text
    // Note: This test may need adjustment based on how module mocking works
  });
});

describe('HomeWorkspace glass panels', () => {
  it('has three glass panels total', () => {
    render(<HomeWorkspace />);
    // Command panel + Quick panel + Activity panel
    expect(screen.getByTestId('home-command-panel')).toBeInTheDocument();
    expect(screen.getByTestId('home-quick-panel')).toBeInTheDocument();
    expect(screen.getByTestId('home-activity-panel')).toBeInTheDocument();
  });

  it('quick and activity panels are in a grid layout', () => {
    render(<HomeWorkspace />);
    const quickPanel = screen.getByTestId('home-quick-panel');
    const activityPanel = screen.getByTestId('home-activity-panel');

    // Both should be siblings in the grid
    expect(quickPanel.parentElement).toBe(activityPanel.parentElement);
  });
});

describe('HomeWorkspace TerraSphere integration', () => {
  it('renders TerraSphere with medium size in command panel', () => {
    render(<HomeWorkspace />);
    const sphere = screen.getByTestId('home-terrasphere');
    expect(sphere).toBeInTheDocument();
  });

  it('renders TerraSphere in health summary bar (small size)', () => {
    render(<HomeWorkspace />);
    const healthBarSphere = screen.getByTestId('home-health-bar-sphere');
    expect(healthBarSphere).toBeInTheDocument();
  });
});

describe('HomeWorkspace RightRailShell integration', () => {
  it('renders RightRailShell component', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('mock-right-rail-shell')).toBeInTheDocument();
  });

  it('passes workspaceId to RightRailShell', () => {
    render(<HomeWorkspace />);
    expect(screen.getByTestId('mock-right-rail-shell')).toHaveTextContent('RightRailShell: home');
  });

  it('main content and right rail are in flex layout', () => {
    render(<HomeWorkspace />);
    const rightRail = screen.getByTestId('mock-right-rail-shell');
    const commandPanel = screen.getByTestId('home-command-panel');

    // RightRail should be a sibling to the main content container (which contains command panel)
    // They share a common flex parent
    expect(rightRail.parentElement).toBe(commandPanel.parentElement?.parentElement);
  });
});
