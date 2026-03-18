/**
 * TerraFusion OS Command Palette Tests
 *
 * Priority 10: Comprehensive tests for Command Palette / Global Search.
 *
 * SUCCESS CRITERIA:
 * SC-12.1: Ctrl+K opens command palette
 * SC-12.2: Search filters modules, settings, shortcuts
 * SC-12.3: Fuzzy search with result highlighting
 * SC-12.4: Recent commands section (last 5)
 * SC-12.5: Keyboard navigation (Up/Down/Enter/Escape)
 * SC-12.6: Selecting module calls activateModule()
 * SC-12.7: Selecting setting opens settings
 * SC-12.8: TerraFusion glass morphism styling
 * SC-12.9: Categories: Modules, Settings, Shortcuts, Recent
 * SC-12.10: Accessible with proper ARIA
 *
 * @module shell/command-palette/__tests__/CommandPalette.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCommandPaletteStore } from '../../../stores/commandPaletteStore';
import { CommandPalette } from '../CommandPalette';

// ============================================================================
// Mocks
// ============================================================================

const mockActivateModule = vi.fn();
vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

vi.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    keyboardShortcuts: [
      { id: 'open-costforge', action: 'Open CostForge', keys: 'Ctrl+1', category: 'modules' },
      { id: 'open-settings', action: 'Open Settings', keys: 'Ctrl+,', category: 'navigation' },
    ],
  })),
}));

// CommandPalette uses useNavigate() for parcel search navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
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

// ============================================================================
// Helper Functions
// ============================================================================

function openPalette() {
  act(() => {
    useCommandPaletteStore.getState().open();
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('CommandPalette', () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('does not render when closed', () => {
      render(<CommandPalette />);
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    it('renders backdrop when open', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-backdrop')).toBeInTheDocument();
    });

    it('renders search input', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
    });

    it('renders placeholder text', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByPlaceholderText(/search modules, settings, actions/i)).toBeInTheDocument();
    });

    it('renders command count', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-count')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-12.9: Categories
  // ==========================================================================

  describe('categories (SC-12.9)', () => {
    it('renders Modules category', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-group-modules')).toBeInTheDocument();
    });

    it('renders Settings category', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-group-settings')).toBeInTheDocument();
    });

    it('shows Recent category when there are recent commands', () => {
      act(() => {
        useCommandPaletteStore.setState({
          isOpen: true,
          searchQuery: '',
          recentCommands: ['module:costforge'],
        });
      });
      render(<CommandPalette />);
      expect(screen.getByTestId('command-palette-group-recent')).toBeInTheDocument();
    });

    it('does not show Recent category when empty', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.queryByTestId('command-palette-group-recent')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-12.2: Search Filtering
  // ==========================================================================

  describe('search filtering (SC-12.2)', () => {
    it('filters modules by name', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'CostForge');

      // Verify the CostForge module appears in results by checking for the button
      const options = screen.getAllByRole('option');
      const costforgeOption = options.find((option) =>
        /Open.*CostForge/i.test(option.textContent || '')
      );
      expect(costforgeOption).toBeDefined();
    });

    it('filters by keywords', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'property');

      const costforgeItems = screen.getAllByText(/CostForge/i);
      expect(costforgeItems.length).toBeGreaterThan(0);
    });

    it('shows empty state when no results', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'xyznonexistent');

      expect(screen.getByTestId('command-palette-empty')).toBeInTheDocument();
    });

    it('updates results as user types', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');

      // Type partial query
      await user.type(input, 'cost');
      expect(screen.getByText(/CostForge/i)).toBeInTheDocument();

      // Clear and type different query
      await user.clear(input);
      await user.type(input, 'atlas');
      expect(screen.getByText(/ATLAS AI/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-12.3: Fuzzy Search
  // ==========================================================================

  describe('fuzzy search (SC-12.3)', () => {
    it('matches partial text', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'gaia');

      expect(screen.getByText(/TerraGaia/i)).toBeInTheDocument();
    });

    it('matches case insensitive', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'COSTFORGE');

      const costforgeItems = screen.getAllByText(/CostForge/i);
      expect(costforgeItems.length).toBeGreaterThan(0);
    });

    it('highlights matching text', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'Cost');

      const highlights = screen.getAllByText('Cost');
      const markHighlight = highlights.find((el) => el.tagName === 'MARK');
      expect(markHighlight).toBeDefined();
    });
  });

  // ==========================================================================
  // SC-12.4: Recent Commands
  // ==========================================================================

  describe('recent commands (SC-12.4)', () => {
    it('shows recent commands when available', () => {
      act(() => {
        useCommandPaletteStore.setState({
          isOpen: true,
          searchQuery: '',
          recentCommands: ['module:costforge', 'module:atlas-ai'],
        });
      });
      render(<CommandPalette />);

      expect(screen.getByTestId('command-palette-group-recent')).toBeInTheDocument();
    });

    it('hides recent when searching', async () => {
      const user = userEvent.setup();
      act(() => {
        useCommandPaletteStore.setState({
          isOpen: true,
          searchQuery: '',
          recentCommands: ['module:costforge'],
        });
      });
      render(<CommandPalette />);

      expect(screen.getByTestId('command-palette-group-recent')).toBeInTheDocument();

      const input = screen.getByTestId('command-palette-input');
      await user.type(input, 'atlas');

      expect(screen.queryByTestId('command-palette-group-recent')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-12.5: Keyboard Navigation
  // ==========================================================================

  describe('keyboard navigation (SC-12.5)', () => {
    it('focuses input on open', () => {
      openPalette();
      render(<CommandPalette />);

      const input = screen.getByTestId('command-palette-input');
      expect(document.activeElement).toBe(input);
    });

    it('closes on Escape', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      await user.keyboard('{Escape}');

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });

    it('navigates down with ArrowDown', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      await user.keyboard('{ArrowDown}');

      const selectedItems = screen.getAllByRole('option', { selected: true });
      expect(selectedItems.length).toBeGreaterThan(0);
    });

    it('navigates up with ArrowUp', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      // Go down first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      // Then up
      await user.keyboard('{ArrowUp}');

      const selectedItems = screen.getAllByRole('option', { selected: true });
      expect(selectedItems.length).toBe(1);
    });

    it('selects item with Enter', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      await user.keyboard('{Enter}');

      expect(mockActivateModule).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SC-12.6: Module Activation
  // ==========================================================================

  describe('module activation (SC-12.6)', () => {
    it('calls activateModule when clicking module', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const costforgeItem = screen.getByText(/Open CostForge/i);
      await user.click(costforgeItem);

      expect(mockActivateModule).toHaveBeenCalledWith('costforge', {
        source: 'command_palette',
      });
    });

    it('closes palette after selection', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const item = screen.getByText(/Open CostForge/i);
      await user.click(item);

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });

    it('adds to recent after selection', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const item = screen.getByText(/Open CostForge/i);
      await user.click(item);

      expect(useCommandPaletteStore.getState().recentCommands).toContain('module:costforge');
    });
  });

  // ==========================================================================
  // SC-12.7: Settings Activation
  // ==========================================================================

  describe('settings activation (SC-12.7)', () => {
    it('calls activateModule with settings when clicking settings item', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const settingsItems = screen.getAllByText(/General Settings/i);
      await user.click(settingsItems[0]);

      expect(mockActivateModule).toHaveBeenCalledWith(
        'settings',
        expect.objectContaining({
          source: 'command_palette',
        })
      );
    });
  });

  // ==========================================================================
  // SC-12.10: Accessibility
  // ==========================================================================

  describe('accessibility (SC-12.10)', () => {
    it('has role="dialog"', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Command Palette');
    });

    it('has role="listbox" for results', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('items have role="option"', () => {
      openPalette();
      render(<CommandPalette />);
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('selected item has aria-selected="true"', () => {
      openPalette();
      render(<CommandPalette />);
      const selectedOptions = screen.getAllByRole('option', { selected: true });
      expect(selectedOptions.length).toBe(1);
    });

    it('input has aria-label', () => {
      openPalette();
      render(<CommandPalette />);
      const input = screen.getByTestId('command-palette-input');
      expect(input).toHaveAttribute('aria-label', 'Search commands');
    });
  });

  // ==========================================================================
  // Backdrop Interaction
  // ==========================================================================

  describe('backdrop interaction', () => {
    it('closes when clicking backdrop', async () => {
      const user = userEvent.setup();
      openPalette();
      render(<CommandPalette />);

      const backdrop = screen.getByTestId('command-palette-backdrop');
      await user.click(backdrop);

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });
  });

  // ==========================================================================
  // Display Shortcuts
  // ==========================================================================

  describe('keyboard shortcuts display', () => {
    it('shows shortcut for CostForge', () => {
      openPalette();
      render(<CommandPalette />);
      expect(screen.getByText('Ctrl+1')).toBeInTheDocument();
    });
  });
});
