/**
 * TerraFusion OS Desktop Icons Tests
 *
 * Priority 3: Desktop icons for quick module access.
 *
 * SUCCESS CRITERIA:
 * SC-8.1: Desktop icons render in grid layout
 * SC-8.2: Double-click launches module via navigate()
 * SC-8.3: Icons have hover state
 * SC-8.4: Icons have selection state (single click)
 * SC-8.5: Constitutional suites have icons
 * SC-8.6: Source tracking: navigate to route
 *
 * @module shell/desktop/__tests__/DesktopIcons.test
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Mock Setup
// ============================================================================

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockActivateModule = jest.fn();
jest.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// ============================================================================
// Constants — derived from canonical desktopManifest (Phase 22)
// ============================================================================

import { getDesktopIcons } from '../../../config/desktopManifest';

const DESKTOP_ICONS = getDesktopIcons();

// ============================================================================
// Test Utilities
// ============================================================================

function resetAllMocks() {
  mockNavigate.mockClear();
  mockActivateModule.mockClear();
}

// Suite IDs that now use activateModule instead of navigate
const SUITE_IDS = new Set(['forge', 'atlas', 'dais', 'dossier', 'gpt']);

// ============================================================================
// Tests
// ============================================================================

describe('Desktop Icons (Priority 3)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DesktopIconGrid } = require('../DesktopIconGrid');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DesktopIcon } = require('../DesktopIcon');

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // SC-8.1: Desktop icons render in grid layout
  // --------------------------------------------------------------------------

  describe('grid layout (SC-8.1)', () => {
    it('renders DesktopIconGrid component', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('desktop-icon-grid')).toBeInTheDocument();
    });

    it('renders all desktop icons', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      DESKTOP_ICONS.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });

    it('icons are arranged in a grid', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const grid = screen.getByTestId('desktop-icon-grid');
      // Grid should have CSS grid or flex layout
      expect(grid).toHaveClass('grid');
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.2: Double-click launches module via navigate()
  // --------------------------------------------------------------------------

  describe('double-click launch (SC-8.2)', () => {
    it('double-click on suite icon activates module', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.doubleClick(forgeIcon);

      // Suite icons open windowed modules via activateModule
      if (SUITE_IDS.has(DESKTOP_ICONS[0].id)) {
        expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_ICONS[0].id, { source: 'desktop' });
      } else {
        expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[0].route);
      }
    });

    it('double-click on second icon activates module or navigates', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[1].id}`);
      fireEvent.doubleClick(icon);

      if (SUITE_IDS.has(DESKTOP_ICONS[1].id)) {
        expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_ICONS[1].id, { source: 'desktop' });
      } else {
        expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[1].route);
      }
    });

    it('single click does NOT navigate or activate', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.click(forgeIcon);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockActivateModule).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.3: Icons have hover state
  // --------------------------------------------------------------------------

  describe('hover state (SC-8.3)', () => {
    it('icon has hover class on mouse enter', async () => {
      const user = userEvent.setup();
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      await user.hover(icon);

      // Hover state is typically handled by Tailwind :hover pseudo-class
      // macOS Tahoe dock uses bg-white/8 for unselected hover
      expect(icon).toHaveClass('hover:bg-white/8');
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.4: Icons have selection state (single click)
  // --------------------------------------------------------------------------

  describe('selection state (SC-8.4)', () => {
    it('single click selects the icon', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.click(forgeIcon);

      expect(forgeIcon).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking another icon deselects previous', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      const atlasIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[1].id}`);

      fireEvent.click(forgeIcon);
      expect(forgeIcon).toHaveAttribute('aria-selected', 'true');

      fireEvent.click(atlasIcon);
      expect(forgeIcon).toHaveAttribute('aria-selected', 'false');
      expect(atlasIcon).toHaveAttribute('aria-selected', 'true');
    });

    it('selected icon has visual indicator', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.click(forgeIcon);

      // Selected state: macOS Tahoe uses bg-white/20 with inset shadow (not ring-2)
      expect(forgeIcon).toHaveClass('bg-white/20');
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.5: Constitutional suites have icons
  // --------------------------------------------------------------------------

  describe('module coverage (SC-8.5)', () => {
    it.each(DESKTOP_ICONS)('has icon for $name module', ({ id, name }) => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId(`desktop-icon-${id}`)).toBeInTheDocument();
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.6: Source tracking — navigate to suite route
  // --------------------------------------------------------------------------

  describe('source tracking (SC-8.6)', () => {
    it('double-click launches suite icon', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.doubleClick(icon);

      // Suite icons activate module; OS features navigate
      if (SUITE_IDS.has(DESKTOP_ICONS[0].id)) {
        expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_ICONS[0].id, { source: 'desktop' });
      } else {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/'));
      }
    });
  });

  // --------------------------------------------------------------------------
  // DesktopIcon Component
  // --------------------------------------------------------------------------

  describe('DesktopIcon component', () => {
    it('renders module name', () => {
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
        />
      );

      expect(screen.getByText(DESKTOP_ICONS[0].name)).toBeInTheDocument();
    });

    it('has accessible role', () => {
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      expect(icon).toHaveAttribute('role', 'button');
    });

    it('has accessible label', () => {
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      expect(icon).toHaveAttribute('aria-label', `Open ${DESKTOP_ICONS[0].name}`);
    });

    it('calls onSelect when clicked', () => {
      const onSelect = jest.fn();
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
          onSelect={onSelect}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.click(icon);

      expect(onSelect).toHaveBeenCalledWith(DESKTOP_ICONS[0].id);
    });

    it('calls onLaunch when double-clicked', () => {
      const onLaunch = jest.fn();
      render(
        <DesktopIcon
          id={DESKTOP_ICONS[0].id}
          name={DESKTOP_ICONS[0].name}
          iconName={DESKTOP_ICONS[0].iconName}
          onLaunch={onLaunch}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.doubleClick(icon);

      expect(onLaunch).toHaveBeenCalledWith(DESKTOP_ICONS[0].id);
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard Navigation
  // --------------------------------------------------------------------------

  describe('keyboard navigation', () => {
    it('Enter key launches icon', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);

      // Select the icon first
      fireEvent.click(forgeIcon);

      // Press Enter
      fireEvent.keyDown(forgeIcon, { key: 'Enter' });

      // Suite icons activate module; OS features navigate
      if (SUITE_IDS.has(DESKTOP_ICONS[0].id)) {
        expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_ICONS[0].id, { source: 'desktop' });
      } else {
        expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[0].route);
      }
    });

    it('icons are focusable', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      expect(forgeIcon).toHaveAttribute('tabIndex', '0');
    });
  });
});
