/**
 * Parcel Search Tests for TerraFusion OS Command Palette
 *
 * Slice 7.3: Validates that typing a numeric string into the Command Palette
 * shows a "Go to Parcel {number}" result and navigating to it routes to
 * /property/{parcelId}.
 *
 * Acceptance Criteria:
 * - Typing "1234567890" shows "Go to Parcel 1234567890" as first result
 * - Selecting it navigates to /property/1234567890
 * - Non-numeric input does not show parcel result
 * - Partial numeric input (e.g., "123abc") does not show parcel result
 *
 * @module shell/command-palette/__tests__/ParcelSearch.test
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCommandPaletteStore } from '../../../stores/commandPaletteStore';
import { CommandPalette } from '../CommandPalette';

// ============================================================================
// Mocks
// ============================================================================

const mockActivateModule = jest.fn();
jest.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

jest.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    keyboardShortcuts: [],
  })),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockOpenWorkbenchWindow = jest.fn();
jest.mock('../../../context/parcelContext', () => ({
  openWorkbenchWindow: (...args: unknown[]) => mockOpenWorkbenchWindow(...args),
  useParcelContextStore: {
    getState: () => ({
      context: null,
      setContext: jest.fn(),
      recordRecent: jest.fn(),
    }),
  },
  useRecentParcels: () => [],
}));

jest.mock('../useParcelSearch', () => ({
  useParcelSearch: () => ({ results: [], isLoading: false, error: null }),
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useCommandPaletteStore.setState({
      isOpen: false,
      searchQuery: '',
      recentCommands: [],
    });
  });
});

afterEach(() => {
  cleanup();
});

function openPalette() {
  act(() => {
    useCommandPaletteStore.getState().open();
  });
}

// ============================================================================
// Tests: Parcel Search
// ============================================================================

describe('CommandPalette — Parcel Search (Slice 7.3)', () => {
  // ==========================================================================
  // Numeric input shows parcel command
  // ==========================================================================

  describe('numeric input detection', () => {
    it('shows "Go to Parcel" when query is all digits', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '1234567890');

      // Use toHaveTextContent because HighlightedText wraps matches in <mark>
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent(/Go to Parcel 1234567890/);
    });

    it('shows parcel command as first result (navigation group)', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '12345');

      // The navigation group should be present
      expect(screen.getByTestId('command-palette-group-navigation')).toBeInTheDocument();

      // The first option should be the parcel command
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent(/Go to Parcel 12345/);
    });

    it('shows parcel description text', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '99999');

      expect(screen.getByText('Open property workbench for this parcel')).toBeInTheDocument();
    });

    it('auto-selects parcel command (first item)', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '54321');

      // The parcel command should be aria-selected (selectedIndex resets to 0)
      const selectedOptions = screen.getAllByRole('option', { selected: true });
      expect(selectedOptions).toHaveLength(1);
      expect(selectedOptions[0]).toHaveTextContent(/Go to Parcel 54321/);
    });
  });

  // ==========================================================================
  // Navigating via parcel command
  // ==========================================================================

  describe('navigation behavior', () => {
    it('opens workbench window for parcelId on Enter', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '12345');
      await user.keyboard('{Enter}');

      expect(mockOpenWorkbenchWindow).toHaveBeenCalledWith('12345');
    });

    it('closes palette after navigation', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '12345');
      await user.keyboard('{Enter}');

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });

    it('opens workbench window for parcelId on click', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '99999');

      // Use getAllByRole because HighlightedText wraps matches in <mark>
      const options = screen.getAllByRole('option');
      const parcelOption = options[0];
      expect(parcelOption).toHaveTextContent(/Go to Parcel 99999/);
      await user.click(parcelOption);

      expect(mockOpenWorkbenchWindow).toHaveBeenCalledWith('99999');
    });
  });

  // ==========================================================================
  // Non-numeric input hides parcel command
  // ==========================================================================

  describe('non-numeric input rejection', () => {
    it('does not show parcel command for alphabetic input', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'abc');

      expect(screen.queryByText(/Go to Parcel/)).not.toBeInTheDocument();
    });

    it('does not show parcel command for mixed alphanumeric input', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '123abc');

      expect(screen.queryByText(/Go to Parcel/)).not.toBeInTheDocument();
    });

    it('does not show navigation group for empty query', () => {
      openPalette();
      render(<CommandPalette />);

      expect(screen.queryByTestId('command-palette-group-navigation')).not.toBeInTheDocument();
    });

    it('does not show parcel command for special characters with digits', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, '123-456');

      expect(screen.queryByText(/Go to Parcel/)).not.toBeInTheDocument();
    });
  });
});
