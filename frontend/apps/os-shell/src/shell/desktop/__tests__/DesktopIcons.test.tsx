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

// ============================================================================
// Constants — must match DesktopIconGrid's hardcoded DESKTOP_ICONS
// ============================================================================

const DESKTOP_ICONS = [
  { id: 'forge', name: 'TerraForge', iconName: 'Hammer', route: '/property/1234567890/forge' },
  { id: 'atlas', name: 'TerraAtlas', iconName: 'Globe', route: '/property/1234567890/atlas' },
  { id: 'dais', name: 'TerraDais', iconName: 'LayoutDashboard', route: '/property/1234567890/dais' },
  { id: 'dossier', name: 'TerraDossier', iconName: 'FileStack', route: '/property/1234567890/dossier' },
  { id: 'gpt', name: 'TerraGPT', iconName: 'Bot', route: '/property/1234567890/pilot' },
  { id: 'pilot', name: 'TerraPilot', iconName: 'Compass', route: '/pilot' },
];

// ============================================================================
// Test Utilities
// ============================================================================

function resetAllMocks() {
  mockNavigate.mockClear();
}

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
    it('double-click on icon navigates to route', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.doubleClick(forgeIcon);

      expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[0].route);
    });

    it('double-click on second icon navigates to its route', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[1].id}`);
      fireEvent.doubleClick(icon);

      expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[1].route);
    });

    it('single click does NOT navigate', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.click(forgeIcon);

      expect(mockNavigate).not.toHaveBeenCalled();
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

      // Selected state should have a ring or background
      expect(forgeIcon).toHaveClass('ring-2');
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
    it('double-click navigates to suite route', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const icon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      fireEvent.doubleClick(icon);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/'));
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
    it('Enter key launches via navigate', async () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);

      // Select the icon first
      fireEvent.click(forgeIcon);

      // Press Enter
      fireEvent.keyDown(forgeIcon, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith(DESKTOP_ICONS[0].route);
    });

    it('icons are focusable', () => {
      render(<DesktopIconGrid />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const forgeIcon = screen.getByTestId(`desktop-icon-${DESKTOP_ICONS[0].id}`);
      expect(forgeIcon).toHaveAttribute('tabIndex', '0');
    });
  });
});
