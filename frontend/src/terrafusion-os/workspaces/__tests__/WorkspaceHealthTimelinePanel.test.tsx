import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceActivityItem } from '../../core/activity/types';
import { WorkspaceHealthTimelinePanel } from '../WorkspaceHealthTimelinePanel';

// Mock the useWorkspaceActivity hook
vi.mock('../../core/activity/useWorkspaceActivity', () => ({
  useWorkspaceActivity: vi.fn(),
}));

import { useWorkspaceActivity } from '../../core/activity/useWorkspaceActivity';
const mockUseWorkspaceActivity = vi.mocked(useWorkspaceActivity);

describe('WorkspaceHealthTimelinePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('renders loading indicator when loading', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: true,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading health timeline/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders error message when error occurs', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: new Error('Network error'),
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-error')).toBeInTheDocument();
      expect(screen.getByText(/unable to load health timeline/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty message when no health events', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-empty')).toBeInTheDocument();
      expect(screen.getByText(/no health events recorded/i)).toBeInTheDocument();
    });

    it('renders empty message when no items match health filter', () => {
      // Items that don't qualify as health events
      const nonHealthItems: WorkspaceActivityItem[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          summary: 'User navigated to workspace',
          type: 'info',
          kind: 'user_action',
          source: 'ObjectQuickList',
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          summary: 'File opened',
          type: 'info',
          kind: 'system_event',
          source: 'FileSystem',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items: nonHealthItems,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-empty')).toBeInTheDocument();
    });
  });

  describe('Health event filtering', () => {
    it('includes items with kind=health_update', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'health-1',
          timestamp: new Date().toISOString(),
          summary: 'Health check passed',
          type: 'info',
          kind: 'health_update',
          source: 'HealthChecker',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-panel')).toBeInTheDocument();
      expect(screen.getAllByTestId('health-timeline-item')).toHaveLength(1);
      expect(screen.getByText('Health check passed')).toBeInTheDocument();
    });

    it('includes items with source=WorkspaceStatusChip', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'status-1',
          timestamp: new Date().toISOString(),
          summary: 'Status changed: nominal → warning',
          type: 'info',
          kind: 'user_action',
          source: 'WorkspaceStatusChip',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-panel')).toBeInTheDocument();
      expect(screen.getAllByTestId('health-timeline-item')).toHaveLength(1);
    });

    it('includes items with type=warning', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'warn-1',
          timestamp: new Date().toISOString(),
          summary: 'CPU usage high',
          type: 'warning',
          kind: 'system_event',
          source: 'Telemetry',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-panel')).toBeInTheDocument();
      const listItem = screen.getByTestId('health-timeline-item');
      expect(listItem).toHaveAttribute('data-type', 'warning');
    });

    it('includes items with type=incident', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'incident-1',
          timestamp: new Date().toISOString(),
          summary: 'Service down',
          type: 'incident',
          kind: 'system_event',
          source: 'AlertManager',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByTestId('health-timeline-panel')).toBeInTheDocument();
      const listItem = screen.getByTestId('health-timeline-item');
      expect(listItem).toHaveAttribute('data-type', 'incident');
    });

    it('filters out non-health items', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'health-1',
          timestamp: new Date().toISOString(),
          summary: 'Health event',
          type: 'incident',
          kind: 'health_update',
          source: 'HealthChecker',
        },
        {
          id: 'non-health-1',
          timestamp: new Date().toISOString(),
          summary: 'User clicked button',
          type: 'info',
          kind: 'user_action',
          source: 'UI',
        },
        {
          id: 'non-health-2',
          timestamp: new Date().toISOString(),
          summary: 'File saved',
          type: 'info',
          kind: 'system_event',
          source: 'FileSystem',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      // Only the health event should appear
      expect(screen.getAllByTestId('health-timeline-item')).toHaveLength(1);
      expect(screen.getByText('Health event')).toBeInTheDocument();
      expect(screen.queryByText('User clicked button')).not.toBeInTheDocument();
      expect(screen.queryByText('File saved')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts events by timestamp descending (newest first)', () => {
      const oldDate = new Date('2025-01-01T10:00:00Z');
      const newDate = new Date('2025-01-02T10:00:00Z');

      const items: WorkspaceActivityItem[] = [
        {
          id: 'old',
          timestamp: oldDate.toISOString(),
          summary: 'Old event',
          type: 'warning',
          kind: 'health_update',
        },
        {
          id: 'new',
          timestamp: newDate.toISOString(),
          summary: 'New event',
          type: 'incident',
          kind: 'health_update',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      const listItems = screen.getAllByTestId('health-timeline-item');
      expect(listItems).toHaveLength(2);
      // First item should be the newer one
      expect(listItems[0]).toHaveTextContent('New event');
      expect(listItems[1]).toHaveTextContent('Old event');
    });
  });

  describe('Focus activity', () => {
    it('marks focused activity with data-focused attribute', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'focus-me',
          timestamp: new Date().toISOString(),
          summary: 'Focused event',
          type: 'incident',
          kind: 'health_update',
        },
        {
          id: 'not-focused',
          timestamp: new Date().toISOString(),
          summary: 'Other event',
          type: 'warning',
          kind: 'health_update',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' focusActivityId='focus-me' />);

      const listItems = screen.getAllByTestId('health-timeline-item');
      const focusedItem = listItems.find((item) => item.textContent?.includes('Focused event'));
      const unfocusedItem = listItems.find((item) => item.textContent?.includes('Other event'));

      expect(focusedItem).toHaveAttribute('data-focused', 'true');
      expect(unfocusedItem).not.toHaveAttribute('data-focused');
    });

    it('renders without focusActivityId prop', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          summary: 'Event',
          type: 'incident',
          kind: 'health_update',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      const listItem = screen.getByTestId('health-timeline-item');
      expect(listItem).not.toHaveAttribute('data-focused');
    });
  });

  describe('Event details', () => {
    it('displays timestamp for each event', () => {
      const timestamp = new Date('2025-12-03T14:30:00Z');
      const items: WorkspaceActivityItem[] = [
        {
          id: 'event-1',
          timestamp: timestamp.toISOString(),
          summary: 'Test event',
          type: 'incident',
          kind: 'health_update',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      // Timestamp should be displayed (format depends on locale)
      const listItem = screen.getByTestId('health-timeline-item');
      expect(listItem.textContent).toContain('2025');
    });

    it('displays source when present', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          summary: 'Test event',
          type: 'incident',
          kind: 'health_update',
          source: 'HealthMonitor',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByText(/Source: HealthMonitor/)).toBeInTheDocument();
    });

    it('renders without source when not provided', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          summary: 'Test event',
          type: 'incident',
          kind: 'health_update',
          // No source
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();
    });

    it('renders header with title', () => {
      const items: WorkspaceActivityItem[] = [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          summary: 'Test event',
          type: 'incident',
          kind: 'health_update',
        },
      ];

      mockUseWorkspaceActivity.mockReturnValue({
        items,
        loading: false,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='test-ws' />);

      expect(screen.getByText('Workspace Health Timeline')).toBeInTheDocument();
    });
  });

  describe('workspaceId prop', () => {
    it('passes workspaceId to useWorkspaceActivity hook', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: true,
        error: null,
      });

      render(<WorkspaceHealthTimelinePanel workspaceId='my-workspace' />);

      expect(mockUseWorkspaceActivity).toHaveBeenCalledWith(
        'my-workspace',
        expect.objectContaining({ limit: 100 })
      );
    });
  });
});
