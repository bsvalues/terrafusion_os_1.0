/**
 * Tests for SystemActivityWorkspace component.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemWorkspaceActivityItem } from '../../core/activity/types';
import { SystemActivityWorkspace } from '../SystemActivityWorkspace';

// Mock useSystemActivity hook
vi.mock('../../core/activity/useSystemActivity', () => ({
  useSystemActivity: vi.fn(),
}));

// Mock useOmniIntent
const mockEmitIntent = vi.fn();
vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({ emitIntent: mockEmitIntent }),
  OmniIntentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import { useSystemActivity } from '../../core/activity/useSystemActivity';

const mockUseSystemActivity = vi.mocked(useSystemActivity);

describe('SystemActivityWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders loading indicator when loading', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [],
        loading: true,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading system activity…')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when error occurs', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [],
        loading: false,
        error: new Error('Provider error'),
      });

      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-error')).toBeInTheDocument();
      expect(screen.getByText('Unable to load system activity.')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty message when no activity items', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-empty')).toBeInTheDocument();
      expect(screen.getByText('No activity for the current filters.')).toBeInTheDocument();
    });
  });

  describe('glass panel structure', () => {
    beforeEach(() => {
      mockUseSystemActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });
    });

    it('renders header glass panel', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-header')).toBeInTheDocument();
    });

    it('renders activity glass panel', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-glass')).toBeInTheDocument();
    });

    it('renders TerraSphere in header', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-terrasphere')).toBeInTheDocument();
    });

    it('renders total events counter', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-total')).toHaveTextContent('Total events: 0');
    });

    it('renders incidents counter', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-incidents')).toHaveTextContent('Incidents: 0');
    });
  });

  describe('TerraSphere health levels', () => {
    it('shows nominal level when no incidents or warnings', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [
          {
            workspaceId: 'home',
            item: { id: '1', timestamp: '2025-01-01T10:00:00Z', summary: 'Info', type: 'info' },
          },
        ],
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      const sphere = screen.getByTestId('system-terrasphere');
      expect(sphere).toHaveAttribute('data-level', 'nominal');
    });

    it('shows degraded level when warnings but no incidents', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [
          {
            workspaceId: 'home',
            item: { id: '1', timestamp: '2025-01-01T10:00:00Z', summary: 'Warn', type: 'warning' },
          },
        ],
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      const sphere = screen.getByTestId('system-terrasphere');
      expect(sphere).toHaveAttribute('data-level', 'degraded');
    });

    it('shows critical level when incidents exist', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [
          {
            workspaceId: 'home',
            item: {
              id: '1',
              timestamp: '2025-01-01T10:00:00Z',
              summary: 'Critical',
              type: 'incident',
            },
          },
        ],
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      const sphere = screen.getByTestId('system-terrasphere');
      expect(sphere).toHaveAttribute('data-level', 'critical');
    });

    it('updates TerraSphere level based on filtered results', () => {
      mockUseSystemActivity.mockReturnValue({
        items: [
          {
            workspaceId: 'home',
            item: { id: '1', timestamp: '2025-01-01T10:00:00Z', summary: 'Info', type: 'info' },
          },
          {
            workspaceId: 'lab',
            item: {
              id: '2',
              timestamp: '2025-01-01T10:00:00Z',
              summary: 'Critical',
              type: 'incident',
            },
          },
        ],
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      // Initially critical (has incident)
      expect(screen.getByTestId('system-terrasphere')).toHaveAttribute('data-level', 'critical');

      // Filter to only info
      fireEvent.click(screen.getByTestId('system-activity-filter-info'));

      // Now nominal (filtered out the incident)
      expect(screen.getByTestId('system-terrasphere')).toHaveAttribute('data-level', 'nominal');
    });
  });

  describe('activity table', () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'home',
        item: {
          id: 'act-1',
          timestamp: '2025-01-01T10:00:00Z',
          summary: 'Home workspace ready',
          type: 'info',
          source: 'OS Core',
        },
      },
      {
        workspaceId: 'quantumLab',
        item: {
          id: 'act-2',
          timestamp: '2025-01-01T10:05:00Z',
          summary: 'Warning: High drift detected',
          type: 'warning',
          source: 'Drift Monitor',
        },
      },
      {
        workspaceId: 'home',
        item: {
          id: 'act-3',
          timestamp: '2025-01-01T10:10:00Z',
          summary: 'Critical incident',
          type: 'incident',
        },
      },
    ];

    beforeEach(() => {
      mockUseSystemActivity.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
      });
    });

    it('renders activity table with rows', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-workspace')).toBeInTheDocument();
      expect(screen.getByTestId('system-activity-table')).toBeInTheDocument();
      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(3);
    });

    it('renders table headers', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
    });

    it('renders activity data in rows', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByText('Home workspace ready')).toBeInTheDocument();
      expect(screen.getByText('Warning: High drift detected')).toBeInTheDocument();
      expect(screen.getByText('Critical incident')).toBeInTheDocument();
      expect(screen.getByText('OS Core')).toBeInTheDocument();
      expect(screen.getByText('Drift Monitor')).toBeInTheDocument();
    });

    it('displays dash for missing source', () => {
      render(<SystemActivityWorkspace />);

      // The third item has no source
      const rows = screen.getAllByTestId('system-activity-row');
      expect(rows[2]).toHaveTextContent('—');
    });

    it('sets data-type attribute on rows', () => {
      render(<SystemActivityWorkspace />);

      const rows = screen.getAllByTestId('system-activity-row');
      expect(rows[0]).toHaveAttribute('data-type', 'info');
      expect(rows[1]).toHaveAttribute('data-type', 'warning');
      expect(rows[2]).toHaveAttribute('data-type', 'incident');
    });

    it('updates counters based on data', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-total')).toHaveTextContent('Total events: 3');
      expect(screen.getByTestId('system-activity-incidents')).toHaveTextContent('Incidents: 1');
    });
  });

  describe('severity filtering', () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'ws-1',
        item: {
          id: '1',
          timestamp: '2025-01-01T10:00:00Z',
          summary: 'Info event summary',
          type: 'info',
        },
      },
      {
        workspaceId: 'ws-2',
        item: {
          id: '2',
          timestamp: '2025-01-01T10:01:00Z',
          summary: 'Warning event summary',
          type: 'warning',
        },
      },
      {
        workspaceId: 'ws-3',
        item: {
          id: '3',
          timestamp: '2025-01-01T10:02:00Z',
          summary: 'Incident event summary',
          type: 'incident',
        },
      },
    ];

    beforeEach(() => {
      mockUseSystemActivity.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
      });
    });

    it('renders all filter buttons', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('system-activity-filter-info')).toBeInTheDocument();
      expect(screen.getByTestId('system-activity-filter-warning')).toBeInTheDocument();
      expect(screen.getByTestId('system-activity-filter-incident')).toBeInTheDocument();
    });

    it('defaults to All filter with aria-pressed true', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-filter-all')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByTestId('system-activity-filter-info')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('filters by info when Info button clicked', () => {
      render(<SystemActivityWorkspace />);

      fireEvent.click(screen.getByTestId('system-activity-filter-info'));

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);
      expect(screen.getByText('Info event summary')).toBeInTheDocument();
    });

    it('filters by warning when Warnings button clicked', () => {
      render(<SystemActivityWorkspace />);

      fireEvent.click(screen.getByTestId('system-activity-filter-warning'));

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);
      expect(screen.getByText('Warning event summary')).toBeInTheDocument();
    });

    it('filters by incident when Incidents button clicked', () => {
      render(<SystemActivityWorkspace />);

      fireEvent.click(screen.getByTestId('system-activity-filter-incident'));

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);
      expect(screen.getByText('Incident event summary')).toBeInTheDocument();
    });

    it('shows all when All button clicked after filtering', () => {
      render(<SystemActivityWorkspace />);

      fireEvent.click(screen.getByTestId('system-activity-filter-warning'));
      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);

      fireEvent.click(screen.getByTestId('system-activity-filter-all'));
      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(3);
    });

    it('updates counters when filtering', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-total')).toHaveTextContent('Total events: 3');

      fireEvent.click(screen.getByTestId('system-activity-filter-info'));

      expect(screen.getByTestId('system-activity-total')).toHaveTextContent('Total events: 1');
      expect(screen.getByTestId('system-activity-incidents')).toHaveTextContent('Incidents: 0');
    });
  });

  describe('workspace filtering', () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'home',
        item: { id: '1', timestamp: '2025-01-01T10:00:00Z', summary: 'Home event', type: 'info' },
      },
      {
        workspaceId: 'quantumLab',
        item: { id: '2', timestamp: '2025-01-01T10:01:00Z', summary: 'Lab event', type: 'info' },
      },
      {
        workspaceId: 'home',
        item: { id: '3', timestamp: '2025-01-01T10:02:00Z', summary: 'Another home', type: 'info' },
      },
    ];

    beforeEach(() => {
      mockUseSystemActivity.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
      });
    });

    it('renders workspace filter input', () => {
      render(<SystemActivityWorkspace />);

      expect(screen.getByTestId('system-activity-workspace-filter')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by workspace…')).toBeInTheDocument();
    });

    it('filters by workspace name', () => {
      render(<SystemActivityWorkspace />);

      const input = screen.getByTestId('system-activity-workspace-filter');
      fireEvent.change(input, { target: { value: 'quantum' } });

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);
      expect(screen.getByText('Lab event')).toBeInTheDocument();
    });

    it('workspace filter is case-insensitive', () => {
      render(<SystemActivityWorkspace />);

      const input = screen.getByTestId('system-activity-workspace-filter');
      fireEvent.change(input, { target: { value: 'HOME' } });

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(2);
    });

    it('shows empty state when workspace filter matches nothing', () => {
      render(<SystemActivityWorkspace />);

      const input = screen.getByTestId('system-activity-workspace-filter');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      expect(screen.getByTestId('system-activity-empty')).toBeInTheDocument();
    });
  });

  describe('combined filtering', () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'home',
        item: { id: '1', timestamp: '2025-01-01T10:00:00Z', summary: 'Home info', type: 'info' },
      },
      {
        workspaceId: 'home',
        item: {
          id: '2',
          timestamp: '2025-01-01T10:01:00Z',
          summary: 'Home warning',
          type: 'warning',
        },
      },
      {
        workspaceId: 'quantumLab',
        item: {
          id: '3',
          timestamp: '2025-01-01T10:02:00Z',
          summary: 'Lab warning',
          type: 'warning',
        },
      },
    ];

    it('applies both severity and workspace filters', () => {
      mockUseSystemActivity.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      // Filter by warning
      fireEvent.click(screen.getByTestId('system-activity-filter-warning'));
      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(2);

      // Also filter by workspace
      const input = screen.getByTestId('system-activity-workspace-filter');
      fireEvent.change(input, { target: { value: 'home' } });

      expect(screen.getAllByTestId('system-activity-row')).toHaveLength(1);
      expect(screen.getByText('Home warning')).toBeInTheDocument();
    });
  });

  describe('intent emission', () => {
    const mockItems: SystemWorkspaceActivityItem[] = [
      {
        workspaceId: 'test-workspace',
        item: {
          id: 'test-activity-id',
          timestamp: '2025-01-01T10:00:00Z',
          summary: 'Test activity',
          type: 'warning',
        },
      },
    ];

    it('emits workspace_activity_selected intent on row click', () => {
      mockUseSystemActivity.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
      });

      render(<SystemActivityWorkspace />);

      const row = screen.getByTestId('system-activity-row');
      fireEvent.click(row);

      expect(mockEmitIntent).toHaveBeenCalledWith('workspace_activity_selected', {
        workspaceId: 'test-workspace',
        activityId: 'test-activity-id',
        type: 'warning',
      });
    });
  });
});
