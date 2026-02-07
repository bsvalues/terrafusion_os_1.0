/**
 * TerraFusion OS Desktop Icons Tests
 *
 * Priority 3: Desktop icons for quick module access.
 *
 * SUCCESS CRITERIA:
 * SC-8.1: Desktop icons render in grid layout
 * SC-8.2: Double-click launches module via activateModule()
 * SC-8.3: Icons have hover state
 * SC-8.4: Icons have selection state (single click)
 * SC-8.5: 7 working modules have icons
 * SC-8.6: Source tracking: activateModule({ source: 'desktop' })
 *
 * @module shell/desktop/__tests__/DesktopIcons.test
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock activateModule - THE canonical entry point
const mockActivateModule = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// ============================================================================
// Test Utilities
// ============================================================================

function resetAllMocks() {
  mockActivateModule.mockClear();
}

// Use pinned/core modules for desktop icons
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MODULES } = require('../../../config/modules');
const DESKTOP_MODULES = MODULES.filter((m: { isCore: boolean }) => m.isCore);

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

      DESKTOP_MODULES.forEach(({ displayName }: { displayName: string }) => {
        expect(screen.getByText(displayName)).toBeInTheDocument();
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
  // SC-8.2: Double-click launches module via activateModule()
  // --------------------------------------------------------------------------

  describe('double-click launch (SC-8.2)', () => {
    it('double-click on icon calls activateModule', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.doubleClick(costforgeIcon);

      expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_MODULES[0].id, {
        source: 'desktop',
        focusIfOpen: true,
      });
    });

    it('double-click on second icon launches module', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[1].id}`);
      fireEvent.doubleClick(icon);

      expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_MODULES[1].id, {
        source: 'desktop',
        focusIfOpen: true,
      });
    });

    it('single click does NOT launch module', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.click(costforgeIcon);

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
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      await user.hover(icon);

      // Hover state is typically handled by Tailwind :hover pseudo-class
      // We verify the hover classes are present
      expect(icon).toHaveClass('hover:bg-white/10');
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.4: Icons have selection state (single click)
  // --------------------------------------------------------------------------

  describe('selection state (SC-8.4)', () => {
    it('single click selects the icon', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.click(costforgeIcon);

      expect(costforgeIcon).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking another icon deselects previous', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      const atlasIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[1].id}`);

      fireEvent.click(costforgeIcon);
      expect(costforgeIcon).toHaveAttribute('aria-selected', 'true');

      fireEvent.click(atlasIcon);
      expect(costforgeIcon).toHaveAttribute('aria-selected', 'false');
      expect(atlasIcon).toHaveAttribute('aria-selected', 'true');
    });

    it('selected icon has visual indicator', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.click(costforgeIcon);

      // Selected state should have a ring or background
      expect(costforgeIcon).toHaveClass('ring-2');
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.5: 7 working modules have icons
  // --------------------------------------------------------------------------

  describe('module coverage (SC-8.5)', () => {
    it.each(DESKTOP_MODULES)('has icon for $displayName module', ({ id, displayName }: { id: string; displayName: string }) => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId(`desktop-icon-${id}`)).toBeInTheDocument();
      expect(screen.getByText(displayName)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SC-8.6: Source tracking
  // --------------------------------------------------------------------------

  describe('source tracking (SC-8.6)', () => {
    it('activateModule called with source: desktop', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.doubleClick(icon);

      expect(mockActivateModule).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ source: 'desktop' })
      );
    });
  });

  // --------------------------------------------------------------------------
  // DesktopIcon Component
  // --------------------------------------------------------------------------

  describe('DesktopIcon component', () => {
    it('renders icon svg', () => {
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      expect(icon.querySelector('svg')).toBeInTheDocument();
    });

    it('renders module name', () => {
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
        />
      );

      expect(screen.getByText(DESKTOP_MODULES[0].displayName)).toBeInTheDocument();
    });

    it('has accessible role', () => {
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      expect(icon).toHaveAttribute('role', 'button');
    });

    it('has accessible label', () => {
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      expect(icon).toHaveAttribute('aria-label', `Open ${DESKTOP_MODULES[0].displayName}`);
    });

    it('calls onSelect when clicked', () => {
      const onSelect = jest.fn();
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].iconName ?? DESKTOP_MODULES[0].icon}
          onSelect={onSelect}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.click(icon);

      expect(onSelect).toHaveBeenCalledWith(DESKTOP_MODULES[0].id);
    });

    it('calls onLaunch when double-clicked', () => {
      const onLaunch = jest.fn();
      render(
        <DesktopIcon
          id={DESKTOP_MODULES[0].id}
          name={DESKTOP_MODULES[0].displayName}
          iconName={DESKTOP_MODULES[0].icon}
          onLaunch={onLaunch}
        />
      );

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      fireEvent.doubleClick(icon);

      expect(onLaunch).toHaveBeenCalledWith(DESKTOP_MODULES[0].id);
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard Navigation
  // --------------------------------------------------------------------------

  describe('keyboard navigation', () => {
    it('Enter key launches selected icon', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);

      // Select the icon first
      fireEvent.click(costforgeIcon);

      // Press Enter
      fireEvent.keyDown(costforgeIcon, { key: 'Enter' });

      expect(mockActivateModule).toHaveBeenCalledWith(DESKTOP_MODULES[0].id, {
        source: 'desktop',
        focusIfOpen: true,
      });
    });

    it('icons are focusable', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const costforgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_MODULES[0].id}`);
      expect(costforgeIcon).toHaveAttribute('tabIndex', '0');
    });
  });
});
