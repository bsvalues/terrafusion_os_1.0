/**
 * Wave 3 — Placeholder Integrity Contract
 *
 * Proves that the 3 tested suite homes (Forge, Atlas, Dossier) render
 * real content, not placeholder stubs. No "Coming Soon", "TODO",
 * or "Under Construction" text should appear.
 *
 * Dais is covered by its own extensive routing contract suite (9 tests).
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock common hooks to avoid network/store dependencies
// Keep loading=true so the stats strip never tries to render (different suites use
// different stat field shapes — this avoids fragile mock maintenance while still
// proving the component mounts and has its root testid).
vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({ stats: null, loading: true, error: null }),
}));

vi.mock('../../hooks/useTodaysWork', () => ({
  useTodaysWork: () => ({ items: [], loading: false }),
}));

vi.mock('../../context/parcelContext', () => ({
  useParcelContextStore: (selector: (s: { context: null }) => null) => selector({ context: null }),
}));

vi.mock('../../stores/desktopStore', () => ({
  useDesktopStore: () => ({ launchModule: vi.fn(), modules: [] }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
  toOsActor: vi.fn((auth: any) => ({
    userId: auth.userId ?? 'u-test',
    countyId: auth.countyId ?? 'benton',
    roles: auth.roles ?? [],
  })),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
}));

const PLACEHOLDER_PATTERNS = [
  /coming soon/i,
  /under construction/i,
  /\bTODO\b/,
  /placeholder/i,
  /not yet implemented/i,
  /stub/i,
];

function hasPlaceholderText(container: HTMLElement): string | null {
  const text = container.textContent ?? '';
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

describe('Wave 3 — Placeholder Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ForgeSuiteHome renders real content (no placeholder text)', async () => {
    const { default: ForgeSuiteHome } = await import('../../pages/suites/ForgeSuiteHome');
    const { container } = render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );
    const match = hasPlaceholderText(container);
    expect(match, `ForgeSuiteHome contains placeholder text matching /${match}/`).toBeNull();
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
  });

  it('AtlasSuiteHome renders real content (no placeholder text)', async () => {
    const { default: AtlasSuiteHome } = await import('../../pages/suites/AtlasSuiteHome');
    const { container } = render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>,
    );
    const match = hasPlaceholderText(container);
    expect(match, `AtlasSuiteHome contains placeholder text matching /${match}/`).toBeNull();
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
  });

  it('DossierSuiteHome renders real content (no placeholder text)', async () => {
    const { default: DossierSuiteHome } = await import('../../pages/suites/DossierSuiteHome');
    const { container } = render(
      <MemoryRouter>
        <DossierSuiteHome />
      </MemoryRouter>,
    );
    const match = hasPlaceholderText(container);
    expect(match, `DossierSuiteHome contains placeholder text matching /${match}/`).toBeNull();
    expect(screen.getByTestId('suite-dossier-root')).toBeDefined();
  });
});
