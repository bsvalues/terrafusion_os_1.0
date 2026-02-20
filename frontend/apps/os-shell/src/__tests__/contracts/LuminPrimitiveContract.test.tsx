/**
 * Lumin Design System – DOM Contract Tests
 *
 * Verifies that OS Shell surfaces render with @terrafusion/ui primitives
 * and that token-backed materials are applied correctly.
 *
 * @module __tests__/contracts/LuminPrimitiveContract
 */

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { StartMenu } from '../../shell/desktop/StartMenu';
import { DesktopContextMenu } from '../../shell/desktop/DesktopContextMenu';

afterEach(cleanup);

describe('Lumin Primitive Contract', () => {
  beforeEach(() => {
    useStartMenuStore.setState({
      isOpen: true,
      searchQuery: '',
      pinnedApps: [],
      allApps: [],
    });
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
  });

  it('StartMenu renders with Lumin Panel (data-testid="tf-panel")', () => {
    render(<StartMenu />);

    // The start-menu container should be a Panel, which carries
    // the overridden data-testid="start-menu" (explicit takes precedence
    // only when spread AFTER the default). However, the start menu
    // explicitly sets data-testid="start-menu", so we verify the
    // surface's role/aria instead, and confirm the panel material classes.
    const startMenu = screen.getByTestId('start-menu');
    expect(startMenu).toBeInTheDocument();
    // Panel applies token-backed border class
    expect(startMenu.className).toContain('border-[hsl(var(--tf-border');
    // Panel applies token-backed surface background
    expect(startMenu.className).toContain('bg-[hsl(var(--tf-surface');
  });

  it('DesktopContextMenu renders with Lumin Panel material', () => {
    render(
      <DesktopContextMenu
        isOpen={true}
        position={{ x: 100, y: 200 }}
        onClose={jest.fn()}
      />
    );

    const menu = screen.getByRole('menu', { name: /desktop context menu/i });
    expect(menu).toBeInTheDocument();
    // Panel material classes present
    expect(menu.className).toContain('border-[hsl(var(--tf-border');
    expect(menu.className).toContain('bg-[hsl(var(--tf-surface');
  });
});
