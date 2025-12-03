/**
 * @file WorkspaceHealthPanel.test.tsx
 * @description Tests for WorkspaceHealthPanel component.
 *
 * Tests loading, error, and data display states.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceHealthPanel } from '../WorkspaceHealthPanel';

// Mock useWorkspaceActivity hook - note: returns { items, loading, error }
const mockUseWorkspaceActivity = vi.fn();
vi.mock('../../core/activity/useWorkspaceActivity', () => ({
  useWorkspaceActivity: () => mockUseWorkspaceActivity(),
}));

// Mock computeWorkspaceHealthSummary
const mockComputeHealthSummary = vi.fn();
vi.mock('../../core/activity/healthSummary', () => ({
  computeWorkspaceHealthSummary: (items: unknown[]) => mockComputeHealthSummary(items),
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

describe('WorkspaceHealthPanel', () => {
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

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading health/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when error occurs', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: new Error('Failed to fetch'),
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-error')).toBeInTheDocument();
      expect(screen.getByText(/unable to load health/i)).toBeInTheDocument();
    });
  });

  describe('Nominal Health Display', () => {
    it('renders nominal health status correctly', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [{ id: 'act-1', type: 'info', timestamp: Date.now(), summary: 'System OK' }],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'nominal',
        incidents24h: 0,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-health-panel-summary')).toHaveTextContent(/nominal/i);
    });

    it('renders zero incident count for nominal health', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'nominal',
        incidents24h: 0,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-summary')).toHaveTextContent(
        /Incidents.*0/i
      );
    });
  });

  describe('Degraded Health Display', () => {
    it('renders degraded health status with incident count', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          { id: 'act-1', type: 'warning', timestamp: Date.now() - 1000, summary: 'High CPU' },
          { id: 'act-2', type: 'warning', timestamp: Date.now(), summary: 'Memory pressure' },
        ],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'degraded',
        incidents24h: 2,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-summary')).toHaveTextContent(/degraded/i);
      expect(screen.getByTestId('workspace-health-panel-summary')).toHaveTextContent(
        /Incidents.*2/i
      );
    });
  });

  describe('Critical Health Display', () => {
    it('renders critical health status with last incident info', () => {
      const lastIncident = Date.now() - 60000; // 1 minute ago
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          { id: 'act-1', type: 'incident', timestamp: lastIncident, summary: 'Service down' },
        ],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'critical',
        incidents24h: 1,
        lastIncident: { summary: 'Service down', timestamp: lastIncident },
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-summary')).toHaveTextContent(/critical/i);
      expect(screen.getByText(/Last incident/i)).toBeInTheDocument();
    });
  });

  describe('Recent Events List', () => {
    it('renders recent events section when items exist', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [
          { id: 'act-1', type: 'info', timestamp: Date.now(), summary: 'Event 1' },
          { id: 'act-2', type: 'warning', timestamp: Date.now() - 1000, summary: 'Event 2' },
        ],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'nominal',
        incidents24h: 0,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByTestId('workspace-health-panel-events')).toBeInTheDocument();
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    it('renders empty state when no items', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'nominal',
        incidents24h: 0,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='ws-123' />);

      expect(screen.getByText(/no recent events/i)).toBeInTheDocument();
    });
  });

  describe('WorkspaceId Handling', () => {
    it('uses provided workspaceId', () => {
      mockUseWorkspaceActivity.mockReturnValue({
        items: [],
        loading: false,
        error: null,
      });

      mockComputeHealthSummary.mockReturnValue({
        level: 'nominal',
        incidents24h: 0,
        lastIncident: null,
      });

      render(<WorkspaceHealthPanel workspaceId='custom-workspace-id' />);

      expect(mockUseWorkspaceActivity).toHaveBeenCalled();
      expect(screen.getByTestId('workspace-health-panel')).toBeInTheDocument();
    });
  });
});
