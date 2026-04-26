/**
 * TerraFusion OS AI Status Panel Tests
 *
 * Tests for the AI Status indicator and dropdown panel:
 * - Click to open/close
 * - Agent counts and categories
 * - Visual indicators
 * - Accessibility
 *
 * @module shell/desktop/__tests__/AIStatusPanel.test
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AIStatusIndicator, AIStatusPanel } from '../AIStatusPanel';



// Mock AI status data
const mockAIStatus = {
  totalAgents: 17,
  activeAgents: 12,
  categories: [
    { name: 'Event Buffer', count: 7, status: 'active' },
    { name: 'County Assistant', count: 5, status: 'active' },
    { name: 'Governed Modules', count: 4, status: 'idle' },
    { name: 'Unavailable Routes', count: 1, status: 'error' },
  ],
  lastActivity: new Date().toISOString(),
  systemLoad: 0.72,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers(); // prevent 100ms click-outside timer leaks from prior tests
});

afterEach(() => {
  cleanup();
});

describe('AIStatusIndicator', () => {
  describe('Rendering', () => {
    it('renders AI status indicator', () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      expect(screen.getByTestId('ai-status-indicator')).toBeInTheDocument();
    });

    it('displays agent count', () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      expect(screen.getByText('17')).toBeInTheDocument();
    });

    it('shows brain emoji icon', () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      expect(screen.getByText('🧠')).toBeInTheDocument();
    });

    it('shows pulse animation when active', () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      const pulse = screen.getByTestId('ai-pulse');
      expect(pulse).toHaveClass('animate-pulse');
    });

    it('has accessible button role', () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      const button = screen.getByRole('button', { name: /ai status/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('opens panel on click', async () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));

      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();
    });

    it('closes panel on second click', async () => {
      // Use delay:null so both clicks are instantaneous — prevents the
      // AIStatusPanel 100ms click-outside debounce timer from firing
      // between clicks when running under shouldAdvanceTime fake timers.
      const user = userEvent.setup({ delay: null });
      render(<AIStatusIndicator status={mockAIStatus} />);

      await user.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();

      await user.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.queryByTestId('ai-status-panel')).not.toBeInTheDocument();
    });

    it('sets aria-expanded when panel is open', async () => {
      render(<AIStatusIndicator status={mockAIStatus} />);

      const button = screen.getByRole('button', { name: /ai status/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

describe('AIStatusPanel', () => {
  describe('Rendering', () => {
    it('renders panel with header', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText(/^AI Status$/i)).toBeInTheDocument();
    });

    it('displays total agent count prominently', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText(/Observed Agents/i)).toBeInTheDocument();
    });

    it('displays active agent count', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText(/Reported Active/i)).toBeInTheDocument();
    });

    it('lists all agent categories', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('Event Buffer')).toBeInTheDocument();
      expect(screen.getByText('County Assistant')).toBeInTheDocument();
      expect(screen.getByText('Governed Modules')).toBeInTheDocument();
      expect(screen.getByText('Unavailable Routes')).toBeInTheDocument();
    });

    it('shows count for each category', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows system load indicator', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText(/72%/i)).toBeInTheDocument();
    });

    it('has visual status indicators for categories', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      const activeIndicators = screen.getAllByTestId('category-status-active');
      const idleIndicators = screen.getAllByTestId('category-status-idle');

      const errorIndicators = screen.getAllByTestId('category-status-error');

      expect(activeIndicators.length).toBe(2);
      expect(idleIndicators.length).toBe(1);
      expect(errorIndicators.length).toBe(1);
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();
      render(<AIStatusPanel status={mockAIStatus} onClose={onClose} />);

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', async () => {
      const onClose = vi.fn();
      render(<AIStatusPanel status={mockAIStatus} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking outside', async () => {
      const onClose = vi.fn();
      render(
        <div data-testid='outside' style={{ padding: '100px' }}>
          <AIStatusPanel status={mockAIStatus} onClose={onClose} />
        </div>
      );

      // Wait for the click-outside handler to be registered (100ms delay in component)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate mousedown outside the panel (not on the panel itself)
      const outsideElement = screen.getByTestId('outside');
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
      outsideElement.dispatchEvent(mouseDownEvent);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'AI Status');
    });

    it('close button has aria-label', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('panel is keyboard navigable', async () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();

      // Focus should be settable on interactive elements
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Loading/Error States', () => {
    it('shows loading state when data is undefined', () => {
      render(<AIStatusPanel status={undefined} onClose={() => {}} />);

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('shows error state when status indicates error', () => {
      const errorStatus = { ...mockAIStatus, error: 'Connection failed' };
      render(<AIStatusPanel status={errorStatus} onClose={() => {}} />);

      expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
    });
  });
});
