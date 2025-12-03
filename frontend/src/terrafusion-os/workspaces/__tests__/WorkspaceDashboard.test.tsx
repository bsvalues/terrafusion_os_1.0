/**
 * @file WorkspaceDashboard.test.tsx
 * @description Tests for WorkspaceDashboard component.
 *
 * Tests layout, RightRailShell integration, and OmniIntent context usage.
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceDashboard } from '../WorkspaceDashboard';

// Mock HomeWorkspace
vi.mock('../HomeWorkspace', () => ({
  HomeWorkspace: () => <div data-testid='mock-home-workspace'>HomeWorkspace Content</div>,
}));

// Mock RightRailShell
vi.mock('../RightRailShell', () => ({
  RightRailShell: ({
    panelId,
    props,
  }: {
    panelId: string | null;
    props: Record<string, unknown>;
  }) => (
    <div data-testid='mock-right-rail-shell'>
      RightRailShell: {panelId ?? 'no-panel'} | {JSON.stringify(props)}
    </div>
  ),
}));

// Mock OmniIntentContext
const mockUseOmniIntent = vi.fn();
vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => mockUseOmniIntent(),
}));

describe('WorkspaceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: no right rail open
    mockUseOmniIntent.mockReturnValue({
      rightRail: null,
    });
  });

  describe('Layout', () => {
    it('renders dashboard container', () => {
      render(<WorkspaceDashboard />);

      expect(screen.getByTestId('workspace-dashboard')).toBeInTheDocument();
    });

    it('renders main workspace area', () => {
      render(<WorkspaceDashboard />);

      expect(screen.getByTestId('workspace-dashboard-main')).toBeInTheDocument();
    });

    it('renders HomeWorkspace in main area', () => {
      render(<WorkspaceDashboard />);

      expect(screen.getByTestId('mock-home-workspace')).toBeInTheDocument();
    });

    it('renders RightRailShell', () => {
      render(<WorkspaceDashboard />);

      expect(screen.getByTestId('mock-right-rail-shell')).toBeInTheDocument();
    });
  });

  describe('RightRail State Integration', () => {
    it('passes null panelId when rightRail is null', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: null,
      });

      render(<WorkspaceDashboard />);

      expect(screen.getByTestId('mock-right-rail-shell')).toHaveTextContent('no-panel');
    });

    it('passes panel and props to RightRailShell when rightRail is set', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: { workspaceId: 'ws-test-123' },
        },
      });

      render(<WorkspaceDashboard />);

      const rightRail = screen.getByTestId('mock-right-rail-shell');
      expect(rightRail).toHaveTextContent('workspace-health');
      expect(rightRail).toHaveTextContent('ws-test-123');
    });

    it('passes workspace-activity-detail panel with activityId', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-activity-detail',
          props: { workspaceId: 'ws-456', activityId: 'act-789' },
        },
      });

      render(<WorkspaceDashboard />);

      const rightRail = screen.getByTestId('mock-right-rail-shell');
      expect(rightRail).toHaveTextContent('workspace-activity-detail');
      expect(rightRail).toHaveTextContent('ws-456');
      expect(rightRail).toHaveTextContent('act-789');
    });

    it('handles rightRail with empty props', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: {},
        },
      });

      render(<WorkspaceDashboard />);

      const rightRail = screen.getByTestId('mock-right-rail-shell');
      expect(rightRail).toHaveTextContent('workspace-health');
      expect(rightRail).toHaveTextContent('{}');
    });

    it('handles rightRail with undefined props', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: undefined,
        },
      });

      render(<WorkspaceDashboard />);

      // Should use empty object fallback
      expect(screen.getByTestId('mock-right-rail-shell')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('applies flex layout to dashboard container', () => {
      render(<WorkspaceDashboard />);

      const dashboard = screen.getByTestId('workspace-dashboard');
      expect(dashboard).toHaveStyle({ display: 'flex' });
    });

    it('applies flex-1 to main area', () => {
      render(<WorkspaceDashboard />);

      const mainArea = screen.getByTestId('workspace-dashboard-main');
      expect(mainArea).toHaveStyle({ flex: '1' });
    });
  });

  describe('Context Usage', () => {
    it('reads rightRail from OmniIntentContext', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: { workspaceId: 'context-test' },
        },
      });

      render(<WorkspaceDashboard />);

      expect(mockUseOmniIntent).toHaveBeenCalled();
      expect(screen.getByTestId('mock-right-rail-shell')).toHaveTextContent('context-test');
    });
  });
});
