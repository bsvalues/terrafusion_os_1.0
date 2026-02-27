/**
 * Phase 22 — DesktopIconGrid Canonical Behavior Test
 *
 * Verifies that the desktop icon grid renders icons derived from
 * the canonical suite registry (not hardcoded). Tests the component
 * consumes getDesktopIcons() and navigates correctly on interaction.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { getDesktopIcons } from '../../../config/desktopManifest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DesktopIconGrid } = require('../DesktopIconGrid');

const DESKTOP_ICONS = getDesktopIcons();

describe('DesktopIconGrid canonical behavior (Phase 22)', () => {
  beforeEach(() => mockNavigate.mockClear());

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

  it('navigates to manifest route on double-click', () => {
    render(<DesktopIconGrid />, {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    const first = DESKTOP_ICONS[0];
    const el = screen.getByTestId(`desktop-icon-${first.id}`);
    fireEvent.doubleClick(el);

    expect(mockNavigate).toHaveBeenCalledWith(first.route);
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
