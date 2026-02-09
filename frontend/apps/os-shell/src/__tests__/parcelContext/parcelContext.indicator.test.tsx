/**
 * TerraFusion OS Parcel Context Indicator Tests
 *
 * Tests for the parcel context UX surface (indicator component).
 * Enforces contract: parcel context is always visible and controllable.
 *
 * Contract requirements:
 * - Renders "No parcel selected" when context is null
 * - Renders parcel summary when context is set
 * - Change action opens parcel selection
 * - Clear action resets context
 *
 * @module __tests__/parcelContext/parcelContext.indicator.test
 * @see Slice 10: Parcel Context UX Surface
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ParcelContextIndicator } from '../../components/ParcelContext/ParcelContextIndicator';
import {
    clearParcelContext,
    setParcelContext,
    useParcelContextStore,
    type ParcelContext,
} from '../../context/parcelContext';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PARCEL: ParcelContext = {
  parcelId: 'P-2024-TEST-001',
  parcelName: '123 Main St',
  source: 'selection',
};

// ============================================================================
// Helper: Reset Store
// ============================================================================

function resetStore() {
  useParcelContextStore.setState({ context: null });
  try {
    sessionStorage.removeItem('tf:parcel-context');
  } catch {
    // Session storage might be unavailable in test env
  }
}

// ============================================================================
// Helper: Render with Router
// ============================================================================

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// ============================================================================
// Tests
// ============================================================================

describe('ParcelContextIndicator', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Empty State
  // ==========================================================================

  describe('when no parcel context', () => {
    it('renders "No parcel selected" label', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByText(/no parcel selected/i)).toBeInTheDocument();
    });

    it('has data-testid="parcel-context-indicator"', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByTestId('parcel-context-indicator')).toBeInTheDocument();
    });

    it('does not render parcel ID badge', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.queryByTestId('parcel-context-id')).not.toBeInTheDocument();
    });

    it('renders "Select Parcel" action button', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByRole('button', { name: /select parcel/i })).toBeInTheDocument();
    });

    it('does not render clear button when no context', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.queryByTestId('parcel-context-clear')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Context Set State
  // ==========================================================================

  describe('when parcel context is set', () => {
    beforeEach(() => {
      setParcelContext(TEST_PARCEL);
    });

    it('renders parcel ID', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByText(/P-2024-TEST-001/)).toBeInTheDocument();
    });

    it('renders parcel name when available', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });

    it('renders parcel ID badge with testid', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByTestId('parcel-context-id')).toBeInTheDocument();
    });

    it('renders "Change" action button', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('renders "Clear" action button', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByTestId('parcel-context-clear')).toBeInTheDocument();
    });

    it('handles parcel without name gracefully', () => {
      clearParcelContext();
      setParcelContext({ parcelId: 'P-NO-NAME', source: 'route' });

      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByText(/P-NO-NAME/)).toBeInTheDocument();
      expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Clear Action
  // ==========================================================================

  describe('clear action', () => {
    beforeEach(() => {
      setParcelContext(TEST_PARCEL);
    });

    it('clears context when clear button clicked', () => {
      renderWithRouter(<ParcelContextIndicator />);

      const clearButton = screen.getByTestId('parcel-context-clear');
      fireEvent.click(clearButton);

      // After clear, should show "No parcel selected"
      expect(screen.getByText(/no parcel selected/i)).toBeInTheDocument();
    });

    it('clears context from store on click', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(useParcelContextStore.getState().context).not.toBeNull();

      const clearButton = screen.getByTestId('parcel-context-clear');
      fireEvent.click(clearButton);

      expect(useParcelContextStore.getState().context).toBeNull();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility', () => {
    it('indicator has accessible role', () => {
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('uses aria-live for dynamic updates', () => {
      renderWithRouter(<ParcelContextIndicator />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('clear button has accessible label', () => {
      setParcelContext(TEST_PARCEL);
      renderWithRouter(<ParcelContextIndicator />);

      const clearButton = screen.getByTestId('parcel-context-clear');
      expect(clearButton).toHaveAccessibleName();
    });
  });

  // ==========================================================================
  // Source Indicator
  // ==========================================================================

  describe('context source indicator', () => {
    it('displays source badge for session-restored context', () => {
      // Use parcel ID that doesn't contain "session" to avoid false match
      setParcelContext({ parcelId: 'P-12345-ABCDE', source: 'session' });
      renderWithRouter(<ParcelContextIndicator showSource />);

      // Should show 'session' as source badge (uppercase tracking-wider style)
      const sourceBadges = screen.getAllByText(/session/i);
      expect(sourceBadges.length).toBe(1);
      expect(sourceBadges[0]).toHaveClass('uppercase');
    });

    it('displays source badge for route-derived context', () => {
      // Use parcel ID that doesn't contain "route" to avoid false match
      setParcelContext({ parcelId: 'P-67890-FGHIJ', source: 'route' });
      renderWithRouter(<ParcelContextIndicator showSource />);

      // Should show 'route' as source badge
      const sourceBadges = screen.getAllByText(/route/i);
      expect(sourceBadges.length).toBe(1);
      expect(sourceBadges[0]).toHaveClass('uppercase');
    });

    it('hides source by default', () => {
      setParcelContext({ parcelId: 'P-SRC', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      expect(screen.queryByText(/selection/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Compact Mode
  // ==========================================================================

  describe('compact mode', () => {
    beforeEach(() => {
      setParcelContext(TEST_PARCEL);
    });

    it('renders abbreviated content in compact mode', () => {
      renderWithRouter(<ParcelContextIndicator compact />);

      // Should show parcel icon but abbreviated text
      expect(screen.getByTestId('parcel-context-indicator')).toHaveAttribute(
        'data-compact',
        'true'
      );
    });

    it('hides parcel name in compact mode', () => {
      renderWithRouter(<ParcelContextIndicator compact />);

      // Should show ID but not full address
      const indicator = screen.getByTestId('parcel-context-indicator');
      // Parcel ID should be visible, but address text hidden
      expect(within(indicator).queryByText(/123 Main St/)).not.toBeInTheDocument();
    });
  });
});
