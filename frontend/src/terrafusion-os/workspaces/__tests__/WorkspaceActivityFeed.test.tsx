import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceActivityFeed, WorkspaceActivityItem } from '../WorkspaceActivityFeed';

// Mock OmniIntentContext
const mockSetIntent = vi.fn();
vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({
    setIntent: mockSetIntent,
    currentIntent: null,
    gravityWell: { activePanels: [] },
    clearIntent: vi.fn(),
  }),
}));

describe('WorkspaceActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleItems: WorkspaceActivityItem[] = [
    {
      id: 'act-001',
      timestamp: '2025-12-02T10:30:00Z',
      summary: 'System health check completed',
      type: 'info',
      source: 'System Monitor',
    },
    {
      id: 'act-002',
      timestamp: '2025-12-02T10:25:00Z',
      summary: 'Resource usage above threshold',
      type: 'warning',
      source: 'AI Swarm',
    },
    {
      id: 'act-003',
      timestamp: '2025-12-02T10:20:00Z',
      summary: 'Service degradation detected',
      type: 'incident',
    },
  ];

  describe('basic rendering', () => {
    it('renders empty state when no items provided', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={[]} />);

      const emptyState = screen.getByTestId('workspace-activity-empty');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No recent activity.');
    });

    it('renders container and items when items provided', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const container = screen.getByTestId('workspace-activity-container');
      expect(container).toBeInTheDocument();

      const items = screen.getAllByTestId('workspace-activity-item');
      expect(items.length).toBeGreaterThan(0);

      expect(screen.getByText('System health check completed')).toBeInTheDocument();
      expect(screen.getByText('Resource usage above threshold')).toBeInTheDocument();
      expect(screen.getByText('Service degradation detected')).toBeInTheDocument();
    });

    it('applies correct data-type attribute for styling hooks', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const items = screen.getAllByTestId('workspace-activity-item');

      // Find items by their type attribute
      const infoItem = items.find((item) => item.getAttribute('data-type') === 'info');
      const warningItem = items.find((item) => item.getAttribute('data-type') === 'warning');
      const incidentItem = items.find((item) => item.getAttribute('data-type') === 'incident');

      expect(infoItem).toBeTruthy();
      expect(warningItem).toBeTruthy();
      expect(incidentItem).toBeTruthy();
    });
  });

  describe('intent emission', () => {
    it('emits workspace_activity_selected intent on item click', () => {
      const mockCallback = vi.fn();

      render(
        <WorkspaceActivityFeed
          workspaceId='quantum-lab'
          items={sampleItems}
          onItemClick={mockCallback}
        />
      );

      const items = screen.getAllByTestId('workspace-activity-item');
      fireEvent.click(items[0]);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_activity_selected', {
        workspaceId: 'quantum-lab',
        activityId: expect.any(String),
        type: expect.any(String),
      });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('filter buttons', () => {
    it('renders all filter buttons', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      expect(screen.getByTestId('workspace-activity-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-filter-warning')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-filter-incident')).toBeInTheDocument();
    });

    it('defaults to "All" filter with aria-pressed true', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const allButton = screen.getByTestId('workspace-activity-filter-all');
      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      const incidentButton = screen.getByTestId('workspace-activity-filter-incident');

      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      expect(warningButton).toHaveAttribute('aria-pressed', 'false');
      expect(incidentButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('respects initialFilter prop', () => {
      render(
        <WorkspaceActivityFeed workspaceId='home' items={sampleItems} initialFilter='warning' />
      );

      const allButton = screen.getByTestId('workspace-activity-filter-all');
      const warningButton = screen.getByTestId('workspace-activity-filter-warning');

      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      expect(warningButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('updates aria-pressed when filter is clicked', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      const allButton = screen.getByTestId('workspace-activity-filter-all');
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      expect(warningButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onFilterChange callback when filter changes', () => {
      const mockFilterChange = vi.fn();

      render(
        <WorkspaceActivityFeed
          workspaceId='home'
          items={sampleItems}
          onFilterChange={mockFilterChange}
        />
      );

      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      expect(mockFilterChange).toHaveBeenCalledWith('warning');
    });
  });

  describe('filtering behavior', () => {
    it('shows only warning items when warning filter is active', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      const items = screen.getAllByTestId('workspace-activity-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveAttribute('data-type', 'warning');
      expect(screen.getByText('Resource usage above threshold')).toBeInTheDocument();
    });

    it('shows only incident items when incident filter is active', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      const incidentButton = screen.getByTestId('workspace-activity-filter-incident');
      fireEvent.click(incidentButton);

      const items = screen.getAllByTestId('workspace-activity-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveAttribute('data-type', 'incident');
      expect(screen.getByText('Service degradation detected')).toBeInTheDocument();
    });

    it('shows all items when all filter is re-selected', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      // First filter to warnings
      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      // Then back to all
      const allButton = screen.getByTestId('workspace-activity-filter-all');
      fireEvent.click(allButton);

      const items = screen.getAllByTestId('workspace-activity-item');
      expect(items).toHaveLength(3);
    });

    it('shows empty filtered state when no items match filter', () => {
      const infoOnlyItems: WorkspaceActivityItem[] = [
        {
          id: 'info-1',
          timestamp: new Date().toISOString(),
          summary: 'Info event',
          type: 'info',
        },
      ];

      render(<WorkspaceActivityFeed workspaceId='home' items={infoOnlyItems} />);

      const incidentButton = screen.getByTestId('workspace-activity-filter-incident');
      fireEvent.click(incidentButton);

      expect(screen.getByTestId('workspace-activity-empty-filtered')).toBeInTheDocument();
      expect(screen.getByText('No activity for this filter.')).toBeInTheDocument();
    });
  });

  describe('date grouping', () => {
    it('renders grouped sections with correct labels', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const mixedDateItems: WorkspaceActivityItem[] = [
        {
          id: 'today-1',
          timestamp: now.toISOString(),
          summary: 'Today event',
          type: 'info',
        },
        {
          id: 'yesterday-1',
          timestamp: yesterday.toISOString(),
          summary: 'Yesterday event',
          type: 'warning',
        },
        {
          id: 'older-1',
          timestamp: threeDaysAgo.toISOString(),
          summary: 'Older event',
          type: 'incident',
        },
      ];

      render(<WorkspaceActivityFeed workspaceId='home' items={mixedDateItems} />);

      // Check that groups are rendered
      expect(screen.getByTestId('workspace-activity-group-today')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-group-yesterday')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-group-older')).toBeInTheDocument();

      // Check group labels
      const labels = screen.getAllByTestId('workspace-activity-group-label');
      expect(labels.map((l) => l.textContent)).toEqual(['Today', 'Yesterday', 'Earlier']);
    });

    it('only renders groups that have items', () => {
      const now = new Date();

      const todayOnlyItems: WorkspaceActivityItem[] = [
        {
          id: 'today-1',
          timestamp: now.toISOString(),
          summary: 'Today event 1',
          type: 'info',
        },
        {
          id: 'today-2',
          timestamp: now.toISOString(),
          summary: 'Today event 2',
          type: 'warning',
        },
      ];

      render(<WorkspaceActivityFeed workspaceId='home' items={todayOnlyItems} />);

      expect(screen.getByTestId('workspace-activity-group-today')).toBeInTheDocument();
      expect(screen.queryByTestId('workspace-activity-group-yesterday')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workspace-activity-group-older')).not.toBeInTheDocument();
    });

    it('applies filter before grouping', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mixedItems: WorkspaceActivityItem[] = [
        {
          id: 'today-info',
          timestamp: now.toISOString(),
          summary: 'Today info',
          type: 'info',
        },
        {
          id: 'today-warning',
          timestamp: now.toISOString(),
          summary: 'Today warning',
          type: 'warning',
        },
        {
          id: 'yesterday-warning',
          timestamp: yesterday.toISOString(),
          summary: 'Yesterday warning',
          type: 'warning',
        },
      ];

      render(<WorkspaceActivityFeed workspaceId='home' items={mixedItems} />);

      // Filter to warnings only
      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      // Should see both today and yesterday groups (only warning items)
      expect(screen.getByTestId('workspace-activity-group-today')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-group-yesterday')).toBeInTheDocument();

      // Verify only warning items are shown
      const items = screen.getAllByTestId('workspace-activity-item');
      expect(items).toHaveLength(2);
      items.forEach((item) => {
        expect(item).toHaveAttribute('data-type', 'warning');
      });
    });
  });

  describe('backwards compatibility', () => {
    it('works without optional props (no initialFilter, no onFilterChange)', () => {
      render(<WorkspaceActivityFeed workspaceId='home' items={sampleItems} />);

      // Should render without errors
      expect(screen.getByTestId('workspace-activity-container')).toBeInTheDocument();

      // Filter should work without callback
      const warningButton = screen.getByTestId('workspace-activity-filter-warning');
      fireEvent.click(warningButton);

      expect(warningButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
