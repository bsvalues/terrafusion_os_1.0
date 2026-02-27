/**
 * Phase 37 — TerraCanon Reopen Last Closed Workspace Intent Contract
 *
 * Contract: after closing a workspace, a "reopen" control appears that
 * restores the most recently closed workspace with the same id + name.
 *
 * Phase 36 proved: close intent is safe across all edge cases.
 * Phase 37 proves: the most recently closed workspace can be reopened
 * with identity fully restored, from any state (multi or empty).
 *
 * Success criteria:
 *   1) Cold start has no reopen control (no close history)
 *   2) Close then reopen restores same id + name
 *   3) With 2 workspaces, close active then reopen restores it as active
 *   4) Reopen works from empty state (after closing last workspace)
 *   5) Rename draft cleared on reopen; layout stable; no crash
 *
 * Prevents:
 * - Reopen control leaking into cold-start state (no history)
 * - Reopened workspace getting a new id (must restore exact identity)
 * - Rename draft leaking into reopened workspace
 * - Layout unmount during reopen
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–36
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent for user intent simulation
 *
 * Scope: Session-only reopen; no persistence, no filesystem, no Monaco.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('Phase 37 contract: TerraCanon can reopen the last closed workspace (session-only)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
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
   * Helper: render + open the first workspace.
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

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }

  // --------------------------------------------------------------------------
  // S1: Cold start has no reopen control
  // --------------------------------------------------------------------------
  it('S1: cold start has no reopen control', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S2: Close then reopen restores same id + name
  // --------------------------------------------------------------------------
  it('S2: close then reopen restores same id + name', async () => {
    await renderCanonAndOpenWorkspace();

    // Rename to ensure name restoration is real
    const renameInput = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(renameInput, { target: { value: 'Reopen Me' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameBefore = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBefore).toBe('Reopen Me');

    // Close
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    // Reopen control must appear
    expect(screen.getByTestId('terracanon-reopen-workspace')).toBeInTheDocument();

    // Reopen
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));

    expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameAfter = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();

    expect(idAfter).toBe(idBefore);
    expect(nameAfter).toBe(nameBefore);
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S3: With 2 workspaces, closing active then reopening restores it as active
  // --------------------------------------------------------------------------
  it('S3: with 2 workspaces, closing active then reopening restores it and makes it active', async () => {
    await renderCanonAndOpenWorkspace();

    const id0 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));
    const id1 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(id1).not.toBe(id0);

    // Close active (workspace 1)
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));
    const activeAfterClose = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(activeAfterClose).toBe(id0);

    // Reopen → id1 returns as active
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));
    const activeAfterReopen = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(activeAfterReopen).toBe(id1);

    // Switcher shows both
    expect(screen.getByTestId('terracanon-workspace-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace-item-1')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S4: Reopen works from empty state after closing last workspace
  // --------------------------------------------------------------------------
  it('S4: reopen works from empty state after closing last workspace', async () => {
    await renderCanonAndOpenWorkspace();

    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    // Close last workspace → empty state
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));
    expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();

    // Reopen must be visible even in empty state
    expect(screen.getByTestId('terracanon-reopen-workspace')).toBeInTheDocument();

    // Reopen
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));
    expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();

    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idAfter).toBe(idBefore);
  });

  // --------------------------------------------------------------------------
  // S5: Rename draft cleared on reopen; layout stable; no crash
  // --------------------------------------------------------------------------
  it('S5: rename draft is cleared on reopen; layout stable; no crash', async () => {
    await renderCanonAndOpenWorkspace();

    // Create second workspace
    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));

    // Type into rename draft
    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Draft Text' } });

    // Close active
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    // Reopen
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));

    // Draft must be cleared
    const inputAfter = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    expect((inputAfter.value ?? '').trim()).toBe('');

    // Layout stable
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
