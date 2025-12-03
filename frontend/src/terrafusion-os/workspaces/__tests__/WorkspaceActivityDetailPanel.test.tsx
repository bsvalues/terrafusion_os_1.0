/**
 * @file WorkspaceActivityDetailPanel.test.tsx
 * @description Tests for WorkspaceActivityDetailPanel component.
 *
 * Tests loading, error, missing activity, and data display states.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceActivityDetailPanel } from '../WorkspaceActivityDetailPanel';

// Mock useWorkspaceActivity hook - note: returns { items, loading, error }
const mockUseWorkspaceActivity = vi.fn();
vi.mock('../../core/activity/useWorkspaceActivity', () => ({
  useWorkspaceActivity: () => mockUseWorkspaceActivity(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('WorkspaceActivityDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading indicator when loading', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: true,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-456' />);

      expect(screen.getByTestId('workspace-activity-detail-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading activity/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when error occurs', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: new Error('Network error'),
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-456' />);

      expect(screen.getByTestId('workspace-activity-detail-error')).toBeInTheDocument();
      expect(screen.getByText(/unable to load activity/i)).toBeInTheDocument();
    });
  });

  describe('Activity Not Found State', () => {
    it('renders not found message when activity does not exist', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          { id: 'other-act', type: 'info', timestamp: Date.now(), summary: 'Other activity' },
        ],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='missing-act' />);

      expect(screen.getByTestId('workspace-activity-detail-missing')).toBeInTheDocument();
      expect(screen.getByText(/activity not found/i)).toBeInTheDocument();
    });

    it('renders not found when items array is empty', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='any-act' />);

      expect(screen.getByTestId('workspace-activity-detail-missing')).toBeInTheDocument();
    });
  });

  describe('Activity Display', () => {
    it('renders activity details when activity is found', () => {
      const testActivity = {
        id: 'act-123',
        type: 'info',
        timestamp: 1700000000000,
        summary: 'Test activity summary',
        source: 'TestSource',
      };

      mockUseWorkspaceActivity.mockReturnValue({
        items: [testActivity],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-123' />);

      expect(screen.getByTestId('workspace-activity-detail-panel')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-activity-detail-type')).toHaveTextContent('info');
      expect(screen.getByTestId('workspace-activity-detail-summary')).toHaveTextContent(
        'Test activity summary'
      );
    });

    it('renders timestamp in readable format', () => {
      const testTimestamp = Date.now();
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          {
            id: 'act-time',
            type: 'warning',
            timestamp: testTimestamp,
            summary: 'Timestamp test',
          },
        ],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-time' />);

      expect(screen.getByTestId('workspace-activity-detail-timestamp')).toBeInTheDocument();
    });

    it('renders source when present', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          {
            id: 'act-src',
            type: 'incident',
            timestamp: Date.now(),
            summary: 'With source',
            source: 'HealthMonitor',
          },
        ],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-src' />);

      expect(screen.getByTestId('workspace-activity-detail-source')).toHaveTextContent(
        'HealthMonitor'
      );
    });

    it('handles missing source gracefully', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          {
            id: 'act-no-src',
            type: 'info',
            timestamp: Date.now(),
            summary: 'No source',
          },
        ],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-no-src' />);

      expect(screen.getByTestId('workspace-activity-detail-panel')).toBeInTheDocument();
      // Source element should not be present
      expect(screen.queryByTestId('workspace-activity-detail-source')).not.toBeInTheDocument();
    });
  });

  describe('Activity Type Variants', () => {
    it.each(['info', 'warning', 'incident'] as const)(
      'renders %s activity type correctly',
      (activityType) => {
        mockUseWorkspaceActivity.mockReturnValue({
          items: [
            {
              id: `act-${activityType}`,
              type: activityType,
              timestamp: Date.now(),
              summary: `${activityType} activity`,
            },
          ],
          loading: false,
          error: null,
        });

        render(
          <WorkspaceActivityDetailPanel workspaceId='ws-123' activityId={`act-${activityType}`} />
        );

        expect(screen.getByTestId('workspace-activity-detail-type')).toHaveTextContent(
          activityType
        );
      }
    );
  });

  describe('Props Handling', () => {
    it('finds activity by activityId from items list', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          { id: 'act-1', type: 'info', timestamp: Date.now(), summary: 'First' },
          { id: 'act-2', type: 'warning', timestamp: Date.now(), summary: 'Second' },
          { id: 'act-3', type: 'incident', timestamp: Date.now(), summary: 'Third' },
        ],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId='act-2' />);

      expect(screen.getByTestId('workspace-activity-detail-summary')).toHaveTextContent('Second');
    });

    it('handles undefined activityId', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [{ id: 'act-1', type: 'info', timestamp: Date.now(), summary: 'Activity' }],
        loading: false,
        error: null,
      });

      render(<WorkspaceActivityDetailPanel workspaceId='ws-123' activityId={undefined as any} />);

      expect(screen.getByTestId('workspace-activity-detail-missing')).toBeInTheDocument();
    });
  });
});
