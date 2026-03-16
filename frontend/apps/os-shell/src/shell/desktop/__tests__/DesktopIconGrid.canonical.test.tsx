/**
 * Phase 22 — DesktopIconGrid Canonical Behavior Test
 *
 * Verifies that the desktop icon grid renders icons derived from
 * the canonical suite registry (not hardcoded). Tests the component
 * consumes getDesktopIcons() and activates modules correctly on interaction.
 *
 * Updated: Suite icons now call activateModule() to open windows,
 * OS feature icons still use navigate() for standalone pages.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { getDesktopIcons } from '../../../config/desktopManifest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockActivateModule = vi.fn();
vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DesktopIconGrid } = require('../DesktopIconGrid');

const DESKTOP_ICONS = getDesktopIcons();

describe('DesktopIconGrid canonical behavior (Phase 22)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockActivateModule.mockClear();
  });

  it('renders the correct number of icons from manifest', () => {
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    const icons = DESKTOP_ICONS.map((d) => screen.getByTestId(`desktop-icon-${d.id}`));
    expect(icons).toHaveLength(DESKTOP_ICONS.length);
  });

  it('renders display names from manifest', () => {
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    for (const icon of DESKTOP_ICONS) {
      expect(screen.getByText(icon.name)).toBeInTheDocument();
    }
  });

  it('suite icons call activateModule on double-click', () => {
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    // Find a suite icon (forge, atlas, dais, dossier, or gpt)
    const suiteIcon = DESKTOP_ICONS.find((d) =>
      ['forge', 'atlas', 'dais', 'dossier', 'gpt'].includes(d.id)
    );
    if (!suiteIcon) return;

    const el = screen.getByTestId(`desktop-icon-${suiteIcon.id}`);
    fireEvent.doubleClick(el);

    // Suite icons activate module (opens window), not navigate
    expect(mockActivateModule).toHaveBeenCalledWith(suiteIcon.id, { source: 'desktop' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('OS feature icons navigate on double-click', () => {
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    // Find an OS feature icon (pilot, trace, canon)
    const osIcon = DESKTOP_ICONS.find((d) =>
      ['pilot', 'trace', 'canon'].includes(d.id)
    );
    if (!osIcon) return;

    const el = screen.getByTestId(`desktop-icon-${osIcon.id}`);
    fireEvent.doubleClick(el);

    // OS features navigate to standalone routes
    expect(mockNavigate).toHaveBeenCalledWith(osIcon.route);
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  it('no hardcoded IDs outside desktopManifest', () => {
    // This test verifies that the number of rendered icons equals
    // the manifest count — if someone adds a hardcoded icon, this breaks.
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    const grid = screen.getByTestId('desktop-icon-grid');
    const renderedIcons = grid.querySelectorAll('[data-testid^="desktop-icon-"]');
    expect(renderedIcons).toHaveLength(DESKTOP_ICONS.length);
  });
});
