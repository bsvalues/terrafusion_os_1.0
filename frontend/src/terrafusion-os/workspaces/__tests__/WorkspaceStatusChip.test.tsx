import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceStatusChip } from '../WorkspaceStatusChip';

const mockSetIntent = vi.fn();

vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({
    setIntent: mockSetIntent,
  }),
}));

// Mock useWorkspaceActivity
const mockActivityItems: any[] = [];
vi.mock('../../core/activity/useWorkspaceActivity', () => ({
  useWorkspaceActivity: () => ({
    items: mockActivityItems,
    loading: false,
    error: null,
  }),
}));

describe('WorkspaceStatusChip', () => {
  beforeEach(() => {
    mockSetIntent.mockReset();
    mockActivityItems.length = 0;
  });

  describe('basic rendering', () => {
    it('renders with label and nominal status by default', () => {
      render(<WorkspaceStatusChip workspaceId='test-ws' label='Test Workspace' />);

      const chip = screen.getByTestId('workspace-status-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('Test Workspace');
      expect(chip.className).toContain('emerald');
    });

    it('applies warning status styling', () => {
      render(<WorkspaceStatusChip workspaceId='ws' label='Warn' status='warning' />);
      const chip = screen.getByTestId('workspace-status-chip');
      expect(chip.className).toContain('amber');
    });

    it('applies critical status styling', () => {
      render(<WorkspaceStatusChip workspaceId='ws' label='Critical' status='critical' />);
      const chip = screen.getByTestId('workspace-status-chip');
      expect(chip.className).toContain('rose');
    });

    it('sets data-status attribute for styling hooks', () => {
      render(<WorkspaceStatusChip workspaceId='ws' label='Test' status='warning' />);
      const chip = screen.getByTestId('workspace-status-chip');
      expect(chip).toHaveAttribute('data-status', 'warning');
    });
  });

  describe('workspace_status_selected intent', () => {
    it('fires workspace_status_selected intent with workspaceId and status when clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkspaceStatusChip workspaceId='quantum-lab' label='Quantum Lab' status='nominal' />
      );

      const chip = screen.getByTestId('workspace-status-chip');
      await user.click(chip);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_status_selected', {
        workspaceId: 'quantum-lab',
        status: 'nominal',
      });
    });
  });

  describe('workspace_status_changed intent', () => {
    it('emits workspace_status_changed when status transitions', () => {
      const { rerender } = render(
        <WorkspaceStatusChip workspaceId='home' label='Home' status='nominal' />
      );

      // Clear initial render calls
      mockSetIntent.mockClear();

      // Rerender with new status
      rerender(<WorkspaceStatusChip workspaceId='home' label='Home' status='critical' />);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_status_changed', {
        workspaceId: 'home',
        previousStatus: 'nominal',
        currentStatus: 'critical',
      });
    });

    it('does NOT emit workspace_status_changed when status stays the same', () => {
      const { rerender } = render(
        <WorkspaceStatusChip workspaceId='home' label='Home' status='nominal' />
      );

      mockSetIntent.mockClear();

      // Rerender with same status
      rerender(<WorkspaceStatusChip workspaceId='home' label='Home' status='nominal' />);

      expect(mockSetIntent).not.toHaveBeenCalledWith('workspace_status_changed', expect.anything());
    });

    it('does NOT emit workspace_status_changed on initial render', () => {
      render(<WorkspaceStatusChip workspaceId='home' label='Home' status='warning' />);

      expect(mockSetIntent).not.toHaveBeenCalledWith('workspace_status_changed', expect.anything());
    });

    it('emits workspace_status_changed for multiple transitions', () => {
      const { rerender } = render(
        <WorkspaceStatusChip workspaceId='ws' label='Test' status='nominal' />
      );

      mockSetIntent.mockClear();

      // First transition: nominal → warning
      rerender(<WorkspaceStatusChip workspaceId='ws' label='Test' status='warning' />);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_status_changed', {
        workspaceId: 'ws',
        previousStatus: 'nominal',
        currentStatus: 'warning',
      });

      mockSetIntent.mockClear();

      // Second transition: warning → critical
      rerender(<WorkspaceStatusChip workspaceId='ws' label='Test' status='critical' />);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_status_changed', {
        workspaceId: 'ws',
        previousStatus: 'warning',
        currentStatus: 'critical',
      });
    });
  });

  describe('latest incident display', () => {
    it('does NOT show latest incident by default', () => {
      mockActivityItems.push({
        id: 'inc-1',
        type: 'incident',
        summary: 'Service outage',
        timestamp: new Date().toISOString(),
      });

      render(<WorkspaceStatusChip workspaceId='ws' label='Test' />);

      expect(screen.queryByTestId('workspace-status-latest-incident')).not.toBeInTheDocument();
    });

    it('shows latest incident when showLatestIncident=true', () => {
      mockActivityItems.push({
        id: 'inc-1',
        type: 'incident',
        summary: 'Service outage detected',
        timestamp: new Date().toISOString(),
      });

      render(<WorkspaceStatusChip workspaceId='ws' label='Test' showLatestIncident={true} />);

      const incidentDisplay = screen.getByTestId('workspace-status-latest-incident');
      expect(incidentDisplay).toBeInTheDocument();
      expect(incidentDisplay).toHaveTextContent('Last incident: Service outage detected');
    });

    it('does NOT show incident display when no incidents exist', () => {
      mockActivityItems.push({
        id: 'info-1',
        type: 'info',
        summary: 'Some info event',
        timestamp: new Date().toISOString(),
      });

      render(<WorkspaceStatusChip workspaceId='ws' label='Test' showLatestIncident={true} />);

      expect(screen.queryByTestId('workspace-status-latest-incident')).not.toBeInTheDocument();
    });
  });

  describe('View full timeline link', () => {
    it('renders View full timeline link', () => {
      render(<WorkspaceStatusChip workspaceId='ws' label='Test' />);

      const timelineLink = screen.getByTestId('workspace-status-view-timeline');
      expect(timelineLink).toBeInTheDocument();
      expect(timelineLink).toHaveTextContent('View full timeline');
    });

    it('emits workspace_status_selected when View full timeline is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkspaceStatusChip workspaceId='home' label='Home' status='warning' />);

      mockSetIntent.mockClear();

      const timelineLink = screen.getByTestId('workspace-status-view-timeline');
      await user.click(timelineLink);

      expect(mockSetIntent).toHaveBeenCalledWith('workspace_status_selected', {
        workspaceId: 'home',
        status: 'warning',
      });
    });

    it('stops event propagation when clicking View full timeline', async () => {
      const user = userEvent.setup();
      render(<WorkspaceStatusChip workspaceId='ws' label='Test' status='nominal' />);

      mockSetIntent.mockClear();

      // Click the timeline link
      const timelineLink = screen.getByTestId('workspace-status-view-timeline');
      await user.click(timelineLink);

      // Should only emit once (from the link click), not twice (from button click)
      expect(mockSetIntent).toHaveBeenCalledTimes(1);
    });
  });
});
