/**
 * @file RightRailShell.test.tsx
 * @description Tests for RightRailShell components.
 *
 * Tests panel routing and OSGlassPanelRightRail integration for both:
 * - ControlledRightRailShell (explicit props)
 * - RightRailShell (reads from OmniIntentContext)
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlledRightRailShell, RightRailShell } from '../RightRailShell';

// Mock child panel components
vi.mock('../WorkspaceHealthPanel', () => ({
  WorkspaceHealthPanel: ({ workspaceId }: { workspaceId?: string }) => (
    <div data-testid='mock-workspace-health-panel'>
      WorkspaceHealthPanel: {workspaceId ?? 'no-id'}
    </div>
  ),
}));

vi.mock('../WorkspaceActivityDetailPanel', () => ({
  WorkspaceActivityDetailPanel: ({
    workspaceId,
    activityId,
  }: {
    workspaceId?: string;
    activityId?: string;
  }) => (
    <div data-testid='mock-workspace-activity-detail-panel'>
      WorkspaceActivityDetailPanel: {workspaceId ?? 'no-ws'} / {activityId ?? 'no-act'}
    </div>
  ),
}));

// Mock OSGlassPanelRightRail
vi.mock('../../os/ui/OSGlassPanelRightRail', () => ({
  OSGlassPanelRightRail: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='mock-os-glass-panel-right-rail'>{children}</div>
  ),
}));

// Mock useOmniIntent hook
const mockUseOmniIntent = vi.fn();
vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => mockUseOmniIntent(),
}));

describe('ControlledRightRailShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when panel is null', () => {
      const { container } = render(<ControlledRightRailShell panel={null} panelProps={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when panel is undefined', () => {
      const { container } = render(
        <ControlledRightRailShell panel={undefined as any} panelProps={{}} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Panel Routing', () => {
    it('renders WorkspaceHealthPanel for workspace-health panel', () => {
      render(
        <ControlledRightRailShell panel='workspace-health' panelProps={{ workspaceId: 'ws-123' }} />
      );

      expect(screen.getByTestId('mock-os-glass-panel-right-rail')).toBeInTheDocument();
      expect(screen.getByTestId('mock-workspace-health-panel')).toBeInTheDocument();
      expect(screen.getByText(/WorkspaceHealthPanel: ws-123/)).toBeInTheDocument();
    });

    it('renders WorkspaceActivityDetailPanel for workspace-activity-detail panel', () => {
      render(
        <ControlledRightRailShell
          panel='workspace-activity-detail'
          panelProps={{ workspaceId: 'ws-456', activityId: 'act-789' }}
        />
      );

      expect(screen.getByTestId('mock-os-glass-panel-right-rail')).toBeInTheDocument();
      expect(screen.getByTestId('mock-workspace-activity-detail-panel')).toBeInTheDocument();
      expect(
        screen.getByText(/WorkspaceActivityDetailPanel: ws-456 \/ act-789/)
      ).toBeInTheDocument();
    });

    it('renders nothing for unknown panel', () => {
      const { container } = render(
        <ControlledRightRailShell panel={'unknown-panel' as any} panelProps={{}} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards workspaceId to WorkspaceHealthPanel', () => {
      render(
        <ControlledRightRailShell
          panel='workspace-health'
          panelProps={{ workspaceId: 'forwarded-ws-id' }}
        />
      );

      expect(screen.getByText(/WorkspaceHealthPanel: forwarded-ws-id/)).toBeInTheDocument();
    });

    it('forwards workspaceId and activityId to WorkspaceActivityDetailPanel', () => {
      render(
        <ControlledRightRailShell
          panel='workspace-activity-detail'
          panelProps={{ workspaceId: 'ws-forward', activityId: 'act-forward' }}
        />
      );

      expect(screen.getByText(/ws-forward \/ act-forward/)).toBeInTheDocument();
    });

    it('uses default workspaceId when not provided for WorkspaceHealthPanel', () => {
      render(<ControlledRightRailShell panel='workspace-health' panelProps={{}} />);

      expect(screen.getByTestId('mock-workspace-health-panel')).toBeInTheDocument();
      expect(screen.getByText(/WorkspaceHealthPanel: home/)).toBeInTheDocument();
    });

    it('uses default values when panelProps not provided for WorkspaceActivityDetailPanel', () => {
      render(<ControlledRightRailShell panel='workspace-activity-detail' panelProps={{}} />);

      expect(screen.getByTestId('mock-workspace-activity-detail-panel')).toBeInTheDocument();
      expect(screen.getByText(/WorkspaceActivityDetailPanel: home \//)).toBeInTheDocument();
    });
  });

  describe('OSGlassPanelRightRail Integration', () => {
    it('wraps WorkspaceHealthPanel in OSGlassPanelRightRail', () => {
      render(<ControlledRightRailShell panel='workspace-health' panelProps={{}} />);

      const glassPanel = screen.getByTestId('mock-os-glass-panel-right-rail');
      const healthPanel = screen.getByTestId('mock-workspace-health-panel');

      expect(glassPanel).toContainElement(healthPanel);
    });

    it('wraps WorkspaceActivityDetailPanel in OSGlassPanelRightRail', () => {
      render(<ControlledRightRailShell panel='workspace-activity-detail' panelProps={{}} />);

      const glassPanel = screen.getByTestId('mock-os-glass-panel-right-rail');
      const activityPanel = screen.getByTestId('mock-workspace-activity-detail-panel');

      expect(glassPanel).toContainElement(activityPanel);
    });
  });
});

describe('RightRailShell (Context-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering from OmniIntentContext', () => {
    it('renders nothing when rightRail.panel is null', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: { panel: null, props: {} },
      });

      const { container } = render(<RightRailShell workspaceId='home' />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when rightRail is undefined', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: undefined,
      });

      const { container } = render(<RightRailShell workspaceId='home' />);
      expect(container.firstChild).toBeNull();
    });

    it('renders WorkspaceHealthPanel when rightRail.panel is workspace-health', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: { workspaceId: 'context-ws' },
        },
      });

      render(<RightRailShell workspaceId='home' />);

      expect(screen.getByTestId('mock-os-glass-panel-right-rail')).toBeInTheDocument();
      expect(screen.getByTestId('mock-workspace-health-panel')).toBeInTheDocument();
      expect(screen.getByText(/WorkspaceHealthPanel: context-ws/)).toBeInTheDocument();
    });

    it('renders WorkspaceActivityDetailPanel when rightRail.panel is workspace-activity-detail', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-activity-detail',
          props: { workspaceId: 'context-ws', activityId: 'act-123' },
        },
      });

      render(<RightRailShell workspaceId='home' />);

      expect(screen.getByTestId('mock-os-glass-panel-right-rail')).toBeInTheDocument();
      expect(screen.getByTestId('mock-workspace-activity-detail-panel')).toBeInTheDocument();
      expect(
        screen.getByText(/WorkspaceActivityDetailPanel: context-ws \/ act-123/)
      ).toBeInTheDocument();
    });

    it('falls back to prop workspaceId when context workspaceId is missing', () => {
      mockUseOmniIntent.mockReturnValue({
        rightRail: {
          panel: 'workspace-health',
          props: {},
        },
      });

      render(<RightRailShell workspaceId='fallback-ws' />);

      expect(screen.getByText(/WorkspaceHealthPanel: fallback-ws/)).toBeInTheDocument();
    });
  });
});
