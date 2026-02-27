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

import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';

import { AIStatusIndicator, AIStatusPanel } from '../AIStatusPanel';



// Mock AI status data
const mockAIStatus = {
  totalAgents: 1008,
  activeAgents: 987,
  categories: [
    { name: 'Data Analysis', count: 245, status: 'active' },
    { name: 'Document Processing', count: 312, status: 'active' },
    { name: 'GIS Operations', count: 189, status: 'active' },
    { name: 'Cost Estimation', count: 156, status: 'active' },
    { name: 'Tax Assessment', count: 105, status: 'idle' },
  ],
  lastActivity: new Date().toISOString(),
  systemLoad: 0.72,
};

beforeEach(() => {
  jest.clearAllMocks();
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

      expect(screen.getByText('1,008')).toBeInTheDocument();
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
      render(<AIStatusIndicator status={mockAIStatus} />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('ai-status-indicator'));
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

      expect(screen.getByText(/AI Swarm Status/i)).toBeInTheDocument();
    });

    it('displays total agent count prominently', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('1,008')).toBeInTheDocument();
      expect(screen.getByText(/Total Agents/i)).toBeInTheDocument();
    });

    it('displays active agent count', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('987')).toBeInTheDocument();
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });

    it('lists all agent categories', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('Data Analysis')).toBeInTheDocument();
      expect(screen.getByText('Document Processing')).toBeInTheDocument();
      expect(screen.getByText('GIS Operations')).toBeInTheDocument();
      expect(screen.getByText('Cost Estimation')).toBeInTheDocument();
      expect(screen.getByText('Tax Assessment')).toBeInTheDocument();
    });

    it('shows count for each category', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText('245')).toBeInTheDocument();
      expect(screen.getByText('312')).toBeInTheDocument();
    });

    it('shows system load indicator', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      expect(screen.getByText(/72%/i)).toBeInTheDocument();
    });

    it('has visual status indicators for categories', () => {
      render(<AIStatusPanel status={mockAIStatus} onClose={() => {}} />);

      const activeIndicators = screen.getAllByTestId('category-status-active');
      const idleIndicators = screen.getAllByTestId('category-status-idle');

      expect(activeIndicators.length).toBe(4);
      expect(idleIndicators.length).toBe(1);
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = jest.fn();
      render(<AIStatusPanel status={mockAIStatus} onClose={onClose} />);

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', async () => {
      const onClose = jest.fn();
      render(<AIStatusPanel status={mockAIStatus} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking outside', async () => {
      const onClose = jest.fn();
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

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'AI Swarm Status');
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
