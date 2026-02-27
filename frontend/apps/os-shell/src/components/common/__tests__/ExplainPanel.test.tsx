/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION EXPLAIN PANEL TESTS
 * Phase 13.4: Lock ExplainGPT UI affordance with RTL tests
 * Constellation: Sentinel (testing) + Radiant (UX)
 * ═══════════════════════════════════════════════════════════════
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { ExplainPanel, ExplainPanelState } from '../ExplainPanel';

describe('ExplainPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  // ═══════════════════════════════════════════════════════════════
  // IDLE STATE
  // ═══════════════════════════════════════════════════════════════

  describe('idle state', () => {
    it('renders nothing when status is idle', () => {
      const state: ExplainPanelState = { status: 'idle' };

      const { container } = render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════

  describe('loading state', () => {
    it('renders loading indicator with text', () => {
      const state: ExplainPanelState = { status: 'loading' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByText('Generating explanation…')).toBeInTheDocument();
    });

    it('renders panel container in loading state', () => {
      const state: ExplainPanelState = { status: 'loading' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('renders close button in loading state', () => {
      const state: ExplainPanelState = { status: 'loading' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByLabelText('Close explanation')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════

  describe('error state', () => {
    it('renders error message', () => {
      const state: ExplainPanelState = {
        status: 'error',
        message: 'Network timeout',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByText('Unable to explain')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      const state: ExplainPanelState = {
        status: 'error',
        message: 'API error',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      const errorBody = screen.getByText('API error').closest('div');
      expect(errorBody).toHaveClass('tf-explain-panel__body--error');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // READY STATE
  // ═══════════════════════════════════════════════════════════════

  describe('ready state', () => {
    it('renders explanation text', () => {
      const state: ExplainPanelState = {
        status: 'ready',
        text: 'This is the GPT Studio explanation.',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByText('This is the GPT Studio explanation.')).toBeInTheDocument();
    });

    it('renders summary when provided', () => {
      const state: ExplainPanelState = {
        status: 'ready',
        text: 'Full explanation here.',
        summary: 'TL;DR: AI workbench',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByText('TL;DR: AI workbench')).toBeInTheDocument();
      expect(screen.getByText('Full explanation here.')).toBeInTheDocument();
    });

    it('renders key points when provided', () => {
      const state: ExplainPanelState = {
        status: 'ready',
        text: 'Explanation',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByText('Key Points')).toBeInTheDocument();
      expect(screen.getByText('Point 1')).toBeInTheDocument();
      expect(screen.getByText('Point 2')).toBeInTheDocument();
      expect(screen.getByText('Point 3')).toBeInTheDocument();
    });

    it('does not render key points section when empty', () => {
      const state: ExplainPanelState = {
        status: 'ready',
        text: 'Explanation only',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.queryByText('Key Points')).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERACTIONS
  // ═══════════════════════════════════════════════════════════════

  describe('interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const state: ExplainPanelState = {
        status: 'ready',
        text: 'Test explanation',
      };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      fireEvent.click(screen.getByLabelText('Close explanation'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose from loading state', async () => {
      const state: ExplainPanelState = { status: 'loading' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      fireEvent.click(screen.getByLabelText('Close explanation'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('accepts custom title prop', () => {
      const state: ExplainPanelState = { status: 'loading' };

      render(<ExplainPanel state={state} onClose={mockOnClose} title='Explain RAG Sources' />);

      expect(screen.getByText('Explain RAG Sources')).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════

  describe('accessibility', () => {
    it('has complementary role for aside element', () => {
      const state: ExplainPanelState = { status: 'ready', text: 'Test' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Explanation panel');
    });

    it('close button has accessible label', () => {
      const state: ExplainPanelState = { status: 'ready', text: 'Test' };

      render(<ExplainPanel state={state} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: 'Close explanation' })).toBeInTheDocument();
    });
  });
});
