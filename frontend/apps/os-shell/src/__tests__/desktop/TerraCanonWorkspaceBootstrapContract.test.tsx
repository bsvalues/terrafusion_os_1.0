/**
 * Phase 31 — TerraCanon Workspace Bootstrap Contract
 *
 * Contract: navigating to /canon renders a consistent IDE layout skeleton
 * with workspace shell, file tree pane, and editor pane — even when no
 * workspace is loaded.
 *
 * Phase 30 proved: TerraCanon has a desktop icon, route, and root landmark.
 * Phase 31 proves: TerraCanon opens into a stable IDE interior layout.
 *
 * Success criteria:
 *   1) /canon renders data-testid="terracanon-root" (Phase 30 baseline)
 *   2) /canon renders data-testid="terracanon-workspace" (workspace shell)
 *   3) /canon renders data-testid="terracanon-filetree" (file tree pane)
 *   4) /canon renders data-testid="terracanon-editor" (editor pane)
 *   5) /canon renders data-testid="terracanon-no-workspace" (no-workspace state)
 *   6) No crash ("Reset Application" never appears)
 *
 * Prevents:
 * - Blank IDE interior after launch (shell opens but nothing inside)
 * - Missing layout panes that downstream features depend on
 * - Crash on cold start with no workspace loaded
 * - Regression if layout components are refactored
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–30
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - Assert all landmark testids after Suspense resolves
 *
 * Production change:
 * - Workspace skeleton placeholders + testids in CanonHome.tsx
 *
 * Scope: Mechanical layout landmark only; no persistence, no real files.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

let memoryRouterEntries: string[] = ['/'];

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

jest.mock('../../auth/authStorage', () => ({
  getToken: () => 'smoke-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 31 contract: TerraCanon workspace bootstrap — IDE interior renders on cold start', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Helper: render Router at /canon and wait for Suspense to resolve.
   * Returns nothing — assertions use screen queries.
   */
  async function renderCanonAndWait() {
    memoryRouterEntries = ['/canon'];
    render(<Router />);

    // Wait for Suspense fallback to clear
    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Must not crash
    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  }

  // --------------------------------------------------------------------------
  // S1: Phase 30 baseline — root landmark still present
  // --------------------------------------------------------------------------
  it('/canon renders terracanon-root landmark (Phase 30 baseline)', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-root')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S2: Workspace shell landmark
  // --------------------------------------------------------------------------
  it('/canon renders terracanon-workspace shell', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S3: File tree pane landmark
  // --------------------------------------------------------------------------
  it('/canon renders terracanon-filetree pane', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S4: Editor pane landmark
  // --------------------------------------------------------------------------
  it('/canon renders terracanon-editor pane', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S5: No-workspace state landmark (explicit empty state)
  // --------------------------------------------------------------------------
  it('/canon renders terracanon-no-workspace when no workspace is loaded', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S6: All landmarks co-exist in one render
  // --------------------------------------------------------------------------
  it('/canon renders all workspace landmarks simultaneously', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-root')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-workspace')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S7: Layout hierarchy — workspace contains filetree and editor
  // --------------------------------------------------------------------------
  it('terracanon-workspace contains filetree and editor panes', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        const workspace = screen.getByTestId('terracanon-workspace');
        expect(workspace).toBeInTheDocument();

        // File tree and editor should be nested inside workspace
        const filetree = screen.getByTestId('terracanon-filetree');
        const editor = screen.getByTestId('terracanon-editor');
        expect(workspace.contains(filetree)).toBe(true);
        expect(workspace.contains(editor)).toBe(true);
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S8: No crash guard — standard regression sentinel
  // --------------------------------------------------------------------------
  it('/canon deep-link does not crash (no Reset Application)', async () => {
    await renderCanonAndWait();

    // Redundant but explicit: the crash sentinel must never appear
    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });
});
