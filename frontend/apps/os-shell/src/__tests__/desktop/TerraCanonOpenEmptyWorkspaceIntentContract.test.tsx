/**
 * Phase 32 — TerraCanon Open Empty Workspace Intent Contract
 *
 * Contract: a user action on /canon transitions from "no workspace loaded"
 * to "workspace loaded" deterministically, without crash, with stable landmarks.
 *
 * Phase 31 proved: TerraCanon opens into a stable IDE interior layout.
 * Phase 32 proves: TerraCanon can transition from empty → loaded state.
 *
 * Success criteria:
 *   1) Cold start renders terracanon-no-workspace (baseline)
 *   2) Button terracanon-open-empty-workspace exists
 *   3) Click → terracanon-workspace-loaded appears
 *   4) Click → terracanon-no-workspace disappears
 *   5) Loaded state still contains filetree + editor
 *   6) No crash ("Reset Application" never appears)
 *
 * Prevents:
 * - State transition that crashes or blanks the IDE
 * - Missing loaded landmark after intent fires
 * - Empty state lingering after open-workspace action
 * - Layout panes disappearing after state change
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–31
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent.click for user intent simulation
 * - Assert landmark transitions after click
 *
 * Production change:
 * - Local boolean state + button + conditional landmarks in CanonHome.tsx
 *
 * Scope: State transition only; no persistence, no filesystem, no Monaco.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

let memoryRouterEntries: string[] = ['/'];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../../auth/authStorage', async () => ({
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', async () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 32 contract: TerraCanon open empty workspace intent — state transition with stable landmarks', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Helper: render Router at /canon and wait for Suspense to resolve.
   */
  async function renderCanonAndWait() {
    memoryRouterEntries = ['/canon'];
    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  }

  /**
   * Helper: render + click the open-empty-workspace button.
   */
  async function renderCanonAndOpenWorkspace() {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-open-empty-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));
  }

  // --------------------------------------------------------------------------
  // S1: Cold start — no-workspace landmark present
  // --------------------------------------------------------------------------
  it('cold start renders terracanon-no-workspace', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S2: Open-empty-workspace button exists on cold start
  // --------------------------------------------------------------------------
  it('button terracanon-open-empty-workspace exists', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-open-empty-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S3: Click → workspace-loaded appears
  // --------------------------------------------------------------------------
  it('click open-empty-workspace → terracanon-workspace-loaded appears', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S4: Click → no-workspace disappears
  // --------------------------------------------------------------------------
  it('click open-empty-workspace → terracanon-no-workspace disappears', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.queryByTestId('terracanon-no-workspace')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S5: Loaded state still contains filetree + editor
  // --------------------------------------------------------------------------
  it('loaded state keeps filetree + editor panes', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S6: No crash guard — standard regression sentinel
  // --------------------------------------------------------------------------
  it('state transition does not crash (no Reset Application)', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });
});
