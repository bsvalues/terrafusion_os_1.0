/**
 * Sovereign Dashboard Window Tests
 *
 * Phase C3: Tests for the central command interface.
 *
 * @module modules/dashboard/__tests__/SovereignDashboardWindow.test
 */

import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SovereignDashboardWindow } from '../SovereignDashboardWindow';

// ============================================================================
// Mocks
// ============================================================================

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    path: (props: any) => <path {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the CostforgeAnalysisWidget to isolate dashboard tests
vi.mock('../components/CostforgeAnalysisWidget', () => ({
  CostforgeAnalysisWidget: () => <div data-testid='costforge-widget'>CostForge Widget Mock</div>,
}));

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps = {
  metadata: {
    objectId: 'PARCEL-2024-001',
    objectType: 'Parcel',
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('SovereignDashboardWindow', () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByTestId('sovereign-dashboard')).toBeInTheDocument();
    });

    it('displays object ID in canvas toolbar', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('PARCEL-2024-001')).toBeInTheDocument();
    });

    it('handles missing metadata gracefully', () => {
      render(<SovereignDashboardWindow />);
      expect(screen.getByText('Benton County Assessment Area')).toBeInTheDocument();
    });

    it('shows CANVAS: ACTIVE indicator', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('CANVAS: ACTIVE')).toBeInTheDocument();
    });

    it('shows ONLINE status', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('ONLINE')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Layout Structure (Golden Ratio)
  // ==========================================================================

  describe('layout structure', () => {
    it('has canvas area (62%)', () => {
      const { container } = render(<SovereignDashboardWindow {...defaultProps} />);
      const canvasArea = container.querySelector('.w-\\[62\\%\\]');
      expect(canvasArea).toBeInTheDocument();
    });

    it('has context area (38%)', () => {
      const { container } = render(<SovereignDashboardWindow {...defaultProps} />);
      const contextArea = container.querySelector('.w-\\[38\\%\\]');
      expect(contextArea).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Mode Switching
  // ==========================================================================

  describe('mode switching', () => {
    it('starts in analyze mode by default', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      // The analyze button should be active (has cyan styling)
      const analyzeButton = screen.getByText('Deep Analysis').closest('button');
      expect(analyzeButton).toHaveClass('text-[var(--tf-transcend-highlight)]');
    });

    it('renders Monitor mode button', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('Monitor')).toBeInTheDocument();
    });

    it('renders Deep Analysis mode button', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('Deep Analysis')).toBeInTheDocument();
    });

    it('renders Simulate Impact mode button', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('Simulate Impact')).toBeInTheDocument();
    });

    it('switches to Monitor mode when clicked', async () => {
      const user = userEvent.setup();
      render(<SovereignDashboardWindow {...defaultProps} />);

      await user.click(screen.getByText('Monitor'));

      const monitorButton = screen.getByText('Monitor').closest('button');
      expect(monitorButton).toHaveClass('text-[var(--tf-transcend-highlight)]');
    });

    it('shows CostForge widget in analyze mode', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByTestId('costforge-widget')).toBeInTheDocument();
    });

    it('shows initializing message in non-analyze modes', async () => {
      const user = userEvent.setup();
      render(<SovereignDashboardWindow {...defaultProps} />);

      await user.click(screen.getByText('Monitor'));

      expect(screen.getByText(/Module 'monitor' is initializing/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Context Sidebar
  // ==========================================================================

  describe('context sidebar', () => {
    it('displays Governance Context header', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('Governance Context')).toBeInTheDocument();
    });

    it('displays System Logs section', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('System Logs')).toBeInTheDocument();
    });

    it('shows CostForge Model Loaded log', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('CostForge Model Loaded')).toBeInTheDocument();
    });

    it('shows confidence log', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      expect(screen.getByText('97% confidence achieved.')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Visual Design
  // ==========================================================================

  describe('visual design', () => {
    it('uses TerraFusion dark substrate background', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      const dashboard = screen.getByTestId('sovereign-dashboard');
      expect(dashboard).toHaveClass('bg-[var(--tf-void-black)]');
    });

    it('uses white text color', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      const dashboard = screen.getByTestId('sovereign-dashboard');
      expect(dashboard).toHaveClass('text-white');
    });

    it('has flex layout', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);
      const dashboard = screen.getByTestId('sovereign-dashboard');
      expect(dashboard).toHaveClass('flex');
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility', () => {
    it('mode buttons are keyboard focusable', () => {
      render(<SovereignDashboardWindow {...defaultProps} />);

      const monitorButton = screen.getByText('Monitor').closest('button');
      expect(monitorButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('all mode buttons are clickable', async () => {
      const user = userEvent.setup();
      render(<SovereignDashboardWindow {...defaultProps} />);

      // Should be able to click all mode buttons without error
      await user.click(screen.getByText('Monitor'));
      await user.click(screen.getByText('Deep Analysis'));
      await user.click(screen.getByText('Simulate Impact'));

      // No errors thrown means test passes
    });
  });
});
