/**
 * Phase 36 — TerraCanon Close Workspace Intent Contract
 *
 * Contract: a loaded workspace can be closed. If multiple workspaces exist,
 * closing the active one falls back to a remaining workspace. If it's the
 * last workspace, the UI returns to the explicit empty state.
 *
 * Phase 35 proved: multiple workspaces + switcher + per-workspace rename.
 * Phase 36 proves: close intent is safe across all edge cases.
 *
 * Success criteria:
 *   1) Loaded state exposes close-workspace control
 *   2) Closing with 2 workspaces removes active and falls back
 *   3) Closing last workspace returns to empty state
 *   4) Rename draft does not leak across close/switch
 *   5) filetree + editor remain mounted; no crash
 *
 * Prevents:
 * - Close control leaking into cold-start state
 * - Crash on closing last workspace (empty state must restore cleanly)
 * - Rename draft leaking to the next active workspace after close
 * - Layout unmount during close
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–35
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent for user intent simulation
 *
 * Scope: Session-only close; no persistence, no filesystem, no Monaco.
 */

import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks (hoisted before imports by Vitest)
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

vi.mock('../../auth/authStorage', () => ({
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 36 contract: TerraCanon can close the active workspace safely (session-only)', () => {
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
      { timeout: 5000 },
    );

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  }

  /**
   * Helper: render + open the first workspace.
   */
  async function renderCanonAndOpenWorkspace() {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-open-empty-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  }

  // --------------------------------------------------------------------------
  // S1: Loaded state exposes close-workspace control
  // --------------------------------------------------------------------------
  it('S1: loaded state exposes close-workspace control', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.getByTestId('terracanon-close-workspace')).toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S2: Closing with 2 workspaces removes active, falls back to remaining
  // --------------------------------------------------------------------------
  it('S2: closing with 2 workspaces removes active and falls back to remaining workspace', async () => {
    await renderCanonAndOpenWorkspace();

    const id0 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));
    const id1 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(id1).not.toBe(id0);

    // Close active (workspace 1) → should return to workspace 0
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));
    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idAfter).toBe(id0);
  });

  // --------------------------------------------------------------------------
  // S3: Closing last workspace returns to explicit empty state
  // --------------------------------------------------------------------------
  it('S3: closing the last workspace returns to explicit empty state and hides identity/switcher', async () => {
    await renderCanonAndOpenWorkspace();

    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-switcher')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S4: Rename draft does not leak across close/switch
  // --------------------------------------------------------------------------
  it('S4: rename draft does not leak across close/switch (safety)', async () => {
    await renderCanonAndOpenWorkspace();

    // Make a second workspace active
    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Leaky Draft' } });

    // Close active workspace (the one where we typed)
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    // Now we're back on workspace 0; input should be cleared
    const inputAfter = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    expect((inputAfter.value ?? '').trim()).toBe('');
  });

  // --------------------------------------------------------------------------
  // S5: filetree + editor remain mounted; no crash
  // --------------------------------------------------------------------------
  it('S5: filetree + editor remain mounted; no crash', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    // Even in empty state, the panes must still exist (layout stability).
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
