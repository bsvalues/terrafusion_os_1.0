/**
 * Phase 39 — TerraCanon Persisted Reopen Contract
 *
 * Contract: lastClosed persists to localStorage and enables reopen-after-refresh.
 * Single-undo, deterministic, schema-safe.
 *
 * Phase 38 proved: workspaces + activeIndex persist across refresh.
 * Phase 39 proves: lastClosed survives refresh via tf.canon.lastClosed.v1.
 *
 * Success criteria:
 *   1) Cold start with no lastClosed → no reopen control
 *   2) Closing a workspace persists lastClosed (schema-valid JSON)
 *   3) Remount restores reopen control; clicking it restores + consumes history
 *   4) Malformed lastClosed → cleared, no crash, no reopen control
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–38
 * - unmount() + re-render() for remount simulation
 *
 * Scope: localStorage persistence for lastClosed only. No backend, no IndexedDB.
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
// Storage keys (must match production)
// ============================================================================

const KEY_LAST_CLOSED = 'tf.canon.lastClosed.v1';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 39 contract: persisted lastClosed enables reopen-after-refresh (schema-safe)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  async function renderCanonAndWait() {
    memoryRouterEntries = ['/canon'];
    const result = render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
    return result;
  }

  async function renderCanonAndOpenWorkspace() {
    const result = await renderCanonAndWait();

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

    return result;
  }

  // --------------------------------------------------------------------------
  // S1: Cold start — no lastClosed → no reopen control
  // --------------------------------------------------------------------------
  it('S1: cold start with no lastClosed has no reopen control', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S2: Closing a workspace persists lastClosed (schema-valid)
  // --------------------------------------------------------------------------
  it('S2: closing a workspace persists lastClosed to localStorage', async () => {
    await renderCanonAndOpenWorkspace();

    // Rename to make identity distinctive
    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Persist Me' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    // Close
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));

    const raw = localStorage.getItem(KEY_LAST_CLOSED);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(typeof parsed).toBe('object');
    // Phase 47: stored as v2 envelope { v: 2, workspace: { id, name }, ts }
    expect(parsed.v).toBe(2);
    expect(typeof parsed.ts).toBe('number');
    expect(typeof parsed.workspace).toBe('object');
    expect(typeof parsed.workspace.id).toBe('string');
    expect(parsed.workspace.id).toBe(idBefore);
    expect(typeof parsed.workspace.name).toBe('string');
    expect(parsed.workspace.name).toBe('Persist Me');
  });

  // --------------------------------------------------------------------------
  // S3+S4: Remount restores reopen; clicking consumes history
  // --------------------------------------------------------------------------
  it('S3+S4: remount restores reopen control; reopen restores and consumes persisted history', async () => {
    const { unmount } = await renderCanonAndOpenWorkspace();

    // Rename for identity
    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Persisted Undo' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameBefore = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBefore).toBe('Persisted Undo');

    // Close → persists lastClosed
    fireEvent.click(screen.getByTestId('terracanon-close-workspace'));
    expect(localStorage.getItem(KEY_LAST_CLOSED)).not.toBeNull();

    // Unmount (simulate leaving)
    unmount();

    // Remount (simulate refresh)
    await renderCanonAndWait();

    // Empty state with reopen visible
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(screen.getByTestId('terracanon-reopen-workspace')).toBeInTheDocument();

    // Click reopen
    fireEvent.click(screen.getByTestId('terracanon-reopen-workspace'));

    // Workspace restored with same identity
    expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameAfter = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(idAfter).toBe(idBefore);
    expect(nameAfter).toBe(nameBefore);

    // History consumed: storage cleared, control gone
    expect(localStorage.getItem(KEY_LAST_CLOSED)).toBeNull();
    expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S5: Malformed lastClosed → cleared, no crash
  // --------------------------------------------------------------------------
  it('S5: malformed lastClosed fails closed with no crash', async () => {
    localStorage.setItem(KEY_LAST_CLOSED, '{not-json');

    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Malformed data cleared
    expect(localStorage.getItem(KEY_LAST_CLOSED)).toBeNull();
    expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
