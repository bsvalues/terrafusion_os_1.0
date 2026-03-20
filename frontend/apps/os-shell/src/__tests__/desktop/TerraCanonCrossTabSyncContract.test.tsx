/**
 * Phase 40 — TerraCanon Cross-Tab Sync Contract
 *
 * Contract: when another tab changes TerraCanon workspace state in
 * localStorage, this tab reloads deterministically without crash.
 *
 * Phase 39 proved: lastClosed persists to localStorage.
 * Phase 40 proves: storage events from other tabs trigger safe reload
 * of workspaces, activeIndex, and lastClosed — schema-guarded, fail-closed.
 *
 * Success criteria:
 *   1) External workspace write → this tab reflects new state
 *   2) External activeIndex write → this tab reflects new active
 *   3) External lastClosed write → reopen control appears
 *   4) External lastClosed clear → reopen control disappears
 *   5) Malformed external data → ignored, current state preserved, no crash
 *   6) Layout stable throughout all sync events
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–39
 * - window.dispatchEvent(new StorageEvent('storage', {...})) simulates
 *   cross-tab writes (JSDOM supports StorageEvent construction)
 * - Direct localStorage mutation before event dispatch (simulating
 *   what the browser does when another tab writes)
 *
 * Scope: Cross-tab sync via storage events. No BroadcastChannel, no SharedWorker.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="mock-monaco-editor" />,
  loader: { config: vi.fn() },
}));

vi.mock('monaco-editor', () => ({}));
vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/css/css.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/html/html.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/json/json.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/language/typescript/ts.worker?worker', () => ({ default: class {} }));

import Router from '../../Router';

// ============================================================================
// Storage keys (must match production)
// ============================================================================

const KEY_WORKSPACES = 'tf.canon.workspaces.v1';
const KEY_ACTIVE = 'tf.canon.activeIndex.v1';
const KEY_LAST_CLOSED = 'tf.canon.lastClosed.v1';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simulate a cross-tab storage write by:
 *   1. Writing the new value to localStorage (as if another tab wrote it)
 *   2. Dispatching a StorageEvent (which the browser fires on OTHER tabs)
 *
 * Note: JSDOM does NOT auto-fire storage events on setItem, so we must
 * dispatch manually. The `oldValue` param mirrors the browser behavior.
 */
function simulateCrossTabWrite(key: string, newValue: string | null, oldValue: string | null = null) {
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
  } else {
    localStorage.removeItem(key);
  }
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key,
        newValue,
        oldValue,
        storageArea: localStorage,
        url: window.location.href,
      }),
    );
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 40 contract: cross-tab sync reloads workspace state from storage events', () => {
  // Pre-warm the lazy CanonHome import before S1 runs.
  // CanonHome is a 2100+ line lazy-loaded module; first cold import can exceed
  // the 5 s waitFor window on Windows/forks pool. With retry: 2 the module
  // loads during S1's three attempts (≥ 15 s), so S2–S6 always pass from cache.
  // Real timers are needed here because the global setupTests.ts installs fake
  // timers which interfere with React Suspense resolution in a beforeAll context.
  beforeAll(async () => {
    vi.useRealTimers();
    memoryRouterEntries = ['/canon'];
    render(<Router />);
    await waitFor(
      () => expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument(),
      { timeout: 15000 },
    );
    cleanup();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  }, 20000);

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
      { timeout: 15000 },
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
  // S1: External workspace write → this tab reflects new state
  // --------------------------------------------------------------------------
  it('S1: external workspace write updates this tab to loaded state', async () => {
    await renderCanonAndWait();

    // Start in empty state
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Flush all pending React effects (including lazy-load useEffects)
    // before dispatching storage events
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Another tab creates a workspace — write BOTH keys before dispatching
    // (simulates atomic write by other tab; our handler reads both on either event)
    const externalWorkspaces = [{ id: 'canon-workspace-99', name: 'External WS' }];
    localStorage.setItem(KEY_WORKSPACES, JSON.stringify(externalWorkspaces));
    localStorage.setItem(KEY_ACTIVE, '0');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: KEY_WORKSPACES,
          newValue: JSON.stringify(externalWorkspaces),
          oldValue: null,
          storageArea: localStorage,
          url: window.location.href,
        }),
      );
    });

    // This tab should now show the workspace
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const name = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(name).toBe('External WS');
  });

  // --------------------------------------------------------------------------
  // S2: External activeIndex write → this tab reflects new active
  // --------------------------------------------------------------------------
  it('S2: external activeIndex change switches the active workspace', async () => {
    await renderCanonAndOpenWorkspace();

    // Create a second workspace locally
    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));
    const id1 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    // Switch back to 0 locally
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-0'));
    const id0 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(id0).not.toBe(id1);

    // Another tab switches to index 1 — update localStorage then dispatch
    localStorage.setItem(KEY_ACTIVE, '1');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: KEY_ACTIVE,
          newValue: '1',
          oldValue: '0',
          storageArea: localStorage,
          url: window.location.href,
        }),
      );
    });

    // This tab should reflect index 1
    await waitFor(
      () => {
        const currentId = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
        expect(currentId).toBe(id1);
      },
      { timeout: 5000 },
    );
  });

  // --------------------------------------------------------------------------
  // S3: External lastClosed write → reopen control appears
  // --------------------------------------------------------------------------
  it('S3: external lastClosed write makes reopen control appear', async () => {
    await renderCanonAndOpenWorkspace();

    // No reopen control initially (nothing closed)
    expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();

    // Another tab closes a workspace (writes lastClosed as v2 envelope)
    const closedWs = { id: 'canon-workspace-77', name: 'Closed Elsewhere' };
    const envelope = { v: 2, workspace: closedWs, ts: Date.now() };
    simulateCrossTabWrite(KEY_LAST_CLOSED, JSON.stringify(envelope));

    // Reopen control should appear
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-reopen-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  // --------------------------------------------------------------------------
  // S4: External lastClosed clear → reopen control disappears
  // --------------------------------------------------------------------------
  it('S4: external lastClosed clear removes reopen control', async () => {
    await renderCanonAndOpenWorkspace();

    // Set lastClosed from another tab (v2 envelope)
    const closedWs = { id: 'canon-workspace-88', name: 'Will Clear' };
    const envelope = { v: 2, workspace: closedWs, ts: Date.now() };
    simulateCrossTabWrite(KEY_LAST_CLOSED, JSON.stringify(envelope));

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-reopen-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Another tab clears lastClosed
    simulateCrossTabWrite(KEY_LAST_CLOSED, null, JSON.stringify(envelope));

    await waitFor(
      () => {
        expect(screen.queryByTestId('terracanon-reopen-workspace')).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  // --------------------------------------------------------------------------
  // S5: Malformed external data → ignored, no crash
  // --------------------------------------------------------------------------
  it('S5: malformed external storage data is ignored without crash', async () => {
    await renderCanonAndOpenWorkspace();

    const nameBefore = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    // Fire malformed workspace data from another tab
    simulateCrossTabWrite(KEY_WORKSPACES, '{{{not-json');
    simulateCrossTabWrite(KEY_ACTIVE, 'garbage');
    simulateCrossTabWrite(KEY_LAST_CLOSED, '!!!invalid');

    // Current state must be preserved — no crash, no change
    expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
    const nameAfter = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(nameAfter).toBe(nameBefore);
    expect(idAfter).toBe(idBefore);

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S6: Layout stable throughout sync events
  // --------------------------------------------------------------------------
  it('S6: layout remains stable through cross-tab sync events', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();

    // Fire valid external update — write both keys atomically, then dispatch
    const externalWorkspaces = [
      { id: 'canon-workspace-50', name: 'Synced A' },
      { id: 'canon-workspace-51', name: 'Synced B' },
    ];
    localStorage.setItem(KEY_WORKSPACES, JSON.stringify(externalWorkspaces));
    localStorage.setItem(KEY_ACTIVE, '1');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: KEY_WORKSPACES,
          newValue: JSON.stringify(externalWorkspaces),
          oldValue: null,
          storageArea: localStorage,
          url: window.location.href,
        }),
      );
    });

    await waitFor(
      () => {
        const name = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
        expect(name).toBe('Synced B');
      },
      { timeout: 5000 },
    );

    // Layout still intact
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace')).toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
