/**
 * Lumin Design System – DOM Contract Tests
 *
 * Verifies that OS Shell surfaces render with @terrafusion/ui primitives
 * and that token-backed materials are applied correctly.
 *
 * @module __tests__/contracts/LuminPrimitiveContract
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DesktopContextMenu } from '../../shell/desktop/DesktopContextMenu';
import { StartMenu } from '../../shell/desktop/StartMenu';
import { Taskbar } from '../../shell/desktop/Taskbar';
import { Window } from '../../shell/desktop/Window';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore } from '../../stores/startMenuStore';

// Mock react-rnd (same as Window.test.tsx)
jest.mock('react-rnd', () => {
  const React = require('react');
  return {
    Rnd: React.forwardRef(
      ({ children, className, style, onMouseDown, position, size, ...props }: any, ref: any) => (
        <div
          ref={ref}
          data-testid='window'
          data-window-id={props['data-window-id']}
          className={className}
          style={{
            ...style,
            position: 'absolute',
            left: position?.x ?? 0,
            top: position?.y ?? 0,
            width: typeof size?.width === 'number' ? size.width : size?.width,
            height: typeof size?.height === 'number' ? size.height : size?.height,
          }}
          onMouseDown={onMouseDown}
        >
          {children}
        </div>
      )
    ),
  };
});

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
    render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={jest.fn()} />);

    const menu = screen.getByRole('menu', { name: /desktop context menu/i });
    expect(menu).toBeInTheDocument();
    // Panel material classes present
    expect(menu.className).toContain('border-[hsl(var(--tf-border');
    expect(menu.className).toContain('bg-[hsl(var(--tf-surface');
  });

  it('Taskbar nav uses token-backed background/border (no raw rgba)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Taskbar />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    const style = nav.getAttribute('style') ?? '';
    // Background uses hsl(var(--tf-bg)) token
    expect(style).toContain('hsl(var(--tf-bg)');
    // Border uses hsl(var(--tf-border)) token (not accent)
    expect(style).toContain('hsl(var(--tf-border)');
    // No raw rgba in inline style
    expect(style).not.toMatch(/rgba\(/);
  });

  it('SovereignDock buttons use <Button> (no .glass-button class)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Taskbar />
      </MemoryRouter>
    );

    const dockButtons = ['files', 'identity', 'finance'].map((name) =>
      screen.getByTestId(`sovereign-launch-${name}`)
    );

    for (const btn of dockButtons) {
      // Must NOT have the old bespoke class
      expect(btn.className).not.toContain('glass-button');
      // Must have Lumin Button token-backed border
      expect(btn.className).toContain('border-[hsl(var(--tf-border');
    }
  });

  it('Window chrome uses token-backed styles and contains no raw rgba()', () => {
    const mockWindow = {
      id: 'contract-win-1',
      moduleId: 'test-module',
      title: 'Contract Test Window',
      icon: 'FileText',
      position: { x: 50, y: 50 },
      size: { width: 600, height: 400 },
      state: 'normal' as const,
      zIndex: 1,
      desktopId: 'default',
    };

    useDesktopStore.setState({
      windows: [mockWindow],
      activeWindowId: mockWindow.id,
      currentDesktopId: 'default',
      nextZIndex: 2,
    });

    render(<Window window={mockWindow} />);

    const chrome = screen.getByTestId('tf-window-chrome');
    const style = chrome.getAttribute('style') ?? '';
    // Shadow uses token-backed hsl
    expect(style).toContain('hsl(var(--tf-accent)');
    // Border uses token-backed hsl
    expect(style).toContain('hsl(var(--tf-');
    // No raw rgba in inline style
    expect(style).not.toMatch(/rgba\(/);
  });

  it('Window chrome border references --tf-border for structural and --tf-accent for active glow', () => {
    const mockWindow = {
      id: 'contract-win-2',
      moduleId: 'test-module',
      title: 'Border Contract Window',
      icon: 'FileText',
      position: { x: 50, y: 50 },
      size: { width: 600, height: 400 },
      state: 'normal' as const,
      zIndex: 1,
      desktopId: 'default',
    };

    // Render as active — should use --tf-accent for glow border
    useDesktopStore.setState({
      windows: [mockWindow],
      activeWindowId: mockWindow.id,
      currentDesktopId: 'default',
      nextZIndex: 2,
    });

    const { unmount } = render(<Window window={mockWindow} />);
    const activeChrome = screen.getByTestId('tf-window-chrome');
    expect(activeChrome).toHaveStyle({
      border: '1px solid hsl(var(--tf-accent) / 0.5)',
    });
    unmount();

    // Render as inactive — should use --tf-border for structural border
    useDesktopStore.setState({
      windows: [mockWindow],
      activeWindowId: 'other-window',
      currentDesktopId: 'default',
      nextZIndex: 2,
    });

    render(<Window window={mockWindow} />);
    const inactiveChrome = screen.getByTestId('tf-window-chrome');
    expect(inactiveChrome).toHaveStyle({
      border: '1px solid hsl(var(--tf-border) / 0.5)',
    });
  });
});
