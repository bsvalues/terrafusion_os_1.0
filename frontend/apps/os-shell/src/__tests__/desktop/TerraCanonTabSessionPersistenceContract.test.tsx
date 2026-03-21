/**
 * Phase 51 — TerraCanon Tab Session Persistence Contract
 *
 * Contract: per-workspace open tab lists and active file IDs are saved and
 * restored across workspace switches (hot-switch) and page reloads (remount).
 *
 * Phase 38 proved: workspace list + activeIndex survive remount.
 * Phase 39 proved: lastClosed survives remount.
 * Phase 51 proves: open tabs + active file survive workspace hot-switch
 *                  and page reload.
 *
 * Storage key (new): tf.canon.tabs.v1
 *   Shape: Record<wsId, { tabs: string[]; activeFileId: string | null }>
 *
 * DOM structure note:
 *   - The main workspace control panel (terracanon-workspace-loaded) is
 *     visible only when NO file is actively open in the editor. When a file
 *     is open, the editor surface replaces it.
 *   - The sidebar explorer workspace switcher (terracanon-explorer-ws-N) is
 *     ALWAYS present and is the correct control for switching workspaces
 *     while a file is open in the editor.
 *
 * Success criteria:
 *   S1) Hot-switch: open file in WS-A, switch to WS-B (via sidebar),
 *       switch back — tab is restored (not cleared)
 *   S2) Reload resume: open file in WS-A, unmount, remount — tab is
 *       restored from tf.canon.tabs.v1 on mount
 *   S3) No cross-contamination: after switching to WS-B, WS-A tabs are
 *       absent (no orphaned tab-bar in WS-B)
 *   S4) Tab session persisted to localStorage: after opening a file and
 *       switching workspaces, tf.canon.tabs.v1 contains the correct
 *       per-workspace shape
 *   S5) Malformed tf.canon.tabs.v1 fails closed — no crash, empty tabs
 *
 * Prevents:
 * - Open file list vanishing on workspace hot-switch
 * - Reload losing the tab session for the active workspace
 * - Tab state leaking across workspace contexts
 *
 * Technique:
 * - Pre-populate localStorage before mount to seed workspaces + files
 * - BrowserRouter → MemoryRouter swap (same pattern as Phases 31–50)
 * - Use terracanon-explorer-ws-N (sidebar) to switch when file is open
 *
 * Scope: localStorage persistence only. No backend, no API, no real FS.
 */

import { vi, describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
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
import '../../App';
import '../../pages/CanonHome';

// ============================================================================
// Storage keys (must match production)
// ============================================================================

const WORKSPACES_KEY = 'tf.canon.workspaces.v1';
const ACTIVE_KEY = 'tf.canon.activeIndex.v1';
const FILES_KEY = 'tf.canon.files.v1';
const TABS_KEY = 'tf.canon.tabs.v1';

// ============================================================================
// Test workspace fixtures
// ============================================================================

const WS_A_ID = 'canon-workspace-1';
const WS_B_ID = 'canon-workspace-2';

const WS_A_FILE = { id: `${WS_A_ID}:file:README.md`, name: 'README.md', content: '# Alpha' };

function seedTwoWorkspacesWithFiles() {
  localStorage.setItem(
    WORKSPACES_KEY,
    JSON.stringify([
      { id: WS_A_ID, name: 'Alpha' },
      { id: WS_B_ID, name: 'Beta' },
    ])
  );
  localStorage.setItem(ACTIVE_KEY, '0');
  localStorage.setItem(
    FILES_KEY,
    JSON.stringify({
      [WS_A_ID]: [WS_A_FILE],
      [WS_B_ID]: [], // Beta has no files
    })
  );
}

// ============================================================================
// Helpers
// ============================================================================

async function renderCanonAndWait() {
  memoryRouterEntries = ['/canon'];
  const result = render(<Router />);
  await waitFor(
    () => {
      expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
    },
    { timeout: 15000 }
  );
  expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  return result;
}

/** Wait for the sidebar explorer workspace list to appear. */
async function waitForSidebarWsItem(index: number) {
  return waitFor(
    () => screen.getByTestId(`terracanon-explorer-ws-${index}`),
    { timeout: 5000 }
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 51 contract: TerraCanon persists tab session per workspace', () => {
  beforeAll(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // S1: Hot-switch — open tab in WS-A is restored when switching back from WS-B
  // --------------------------------------------------------------------------
  it('S1: hot-switch — tab opened in WS-A is restored when switching back from WS-B', async () => {
    seedTwoWorkspacesWithFiles();
    await renderCanonAndWait();

    // Wait for sidebar workspace list to be ready
    await waitForSidebarWsItem(0);
    await waitForSidebarWsItem(1);

    // File tree is in the sidebar explorer — wait for the file item
    const fileItem = await waitFor(
      () => screen.getByTestId('terracanon-file-0'),
      { timeout: 5000 }
    );

    // Open WS-A file → tab appears
    fireEvent.click(fileItem);
    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Switch to WS-B via sidebar (workspace-item-* is hidden when file is open)
    fireEvent.click(screen.getByTestId('terracanon-explorer-ws-1'));

    // WS-B has no files; workspace-loaded panel shows — wait for it
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // WS-A's tab must not be visible in WS-B context
    expect(screen.queryByTestId(`terracanon-tab-${WS_A_FILE.name}`)).not.toBeInTheDocument();

    // Switch back to WS-A via sidebar
    fireEvent.click(screen.getByTestId('terracanon-explorer-ws-0'));

    // WS-A's tab must be restored (the contract — RED before implementation)
    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S2: Reload resume — open tab for active workspace restores on remount
  // --------------------------------------------------------------------------
  it('S2: reload resume — tab in active workspace is restored from localStorage on remount', async () => {
    seedTwoWorkspacesWithFiles();
    const { unmount } = await renderCanonAndWait();

    await waitForSidebarWsItem(0);

    // Open WS-A file tab
    const fileItem = await waitFor(
      () => screen.getByTestId('terracanon-file-0'),
      { timeout: 5000 }
    );
    fireEvent.click(fileItem);

    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // tf.canon.tabs.v1 must be written for the active workspace (S4 verifies shape;
    // here we just confirm the key was written at all before unmounting)
    await waitFor(
      () => {
        const raw = localStorage.getItem(TABS_KEY);
        expect(raw).not.toBeNull();
      },
      { timeout: 3000 }
    );

    // Unmount (simulate navigate away / tab close)
    unmount();

    // Remount (simulate navigate back / refresh)
    await renderCanonAndWait();

    // Tab must be restored from localStorage for the active workspace
    // This is the core S2 contract (RED before implementation)
    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S3: No cross-contamination — WS-B does not show WS-A's tabs after switch
  // --------------------------------------------------------------------------
  it('S3: WS-B does not inherit WS-A tabs after switch (no cross-contamination)', async () => {
    seedTwoWorkspacesWithFiles();
    await renderCanonAndWait();

    await waitForSidebarWsItem(0);
    await waitForSidebarWsItem(1);

    // Open WS-A file
    const fileItem = await waitFor(
      () => screen.getByTestId('terracanon-file-0'),
      { timeout: 5000 }
    );
    fireEvent.click(fileItem);

    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Switch to WS-B via sidebar
    fireEvent.click(screen.getByTestId('terracanon-explorer-ws-1'));

    // WS-B has no files — workspace-loaded panel shows, no tabs
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // WS-A's tab must NOT appear in WS-B
    expect(screen.queryByTestId(`terracanon-tab-${WS_A_FILE.name}`)).not.toBeInTheDocument();

    // No tab bar at all in WS-B (no open files)
    expect(screen.queryByTestId('terracanon-tab-bar')).not.toBeInTheDocument();

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S4: tf.canon.tabs.v1 shape — after switch, departed workspace session is
  //     stored in localStorage with the correct per-workspace shape
  // --------------------------------------------------------------------------
  it('S4: tf.canon.tabs.v1 is written with correct per-workspace shape after switch', async () => {
    seedTwoWorkspacesWithFiles();
    await renderCanonAndWait();

    await waitForSidebarWsItem(0);
    await waitForSidebarWsItem(1);

    // Open WS-A file
    const fileItem = await waitFor(
      () => screen.getByTestId('terracanon-file-0'),
      { timeout: 5000 }
    );
    fireEvent.click(fileItem);

    await waitFor(
      () => {
        expect(screen.getByTestId(`terracanon-tab-${WS_A_FILE.name}`)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Switch to WS-B — this should save WS-A's tab session
    fireEvent.click(screen.getByTestId('terracanon-explorer-ws-1'));

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // tf.canon.tabs.v1 must exist and contain WS-A's session
    // This is RED before implementation (key never written)
    await waitFor(
      () => {
        const raw = localStorage.getItem(TABS_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(typeof parsed).toBe('object');
        expect(parsed[WS_A_ID]).toBeDefined();
        expect(Array.isArray(parsed[WS_A_ID].tabs)).toBe(true);
        expect(parsed[WS_A_ID].tabs).toContain(WS_A_FILE.id);
        // activeFileId must be the opened file
        expect(parsed[WS_A_ID].activeFileId).toBe(WS_A_FILE.id);
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S5: Malformed tf.canon.tabs.v1 fails closed — no crash, empty tabs
  // --------------------------------------------------------------------------
  it('S5: malformed tab session in localStorage fails closed without crash', async () => {
    seedTwoWorkspacesWithFiles();

    // Write garbage to the tabs key before mount
    localStorage.setItem(TABS_KEY, 'not-valid-json{{{');

    await renderCanonAndWait();

    // App must render without error
    await waitForSidebarWsItem(0);

    // No phantom tabs — garbage data is ignored
    expect(screen.queryByTestId('terracanon-tab-bar')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();

    // File tree is operational — app is functional
    await waitFor(
      () => screen.getByTestId('terracanon-file-0'),
      { timeout: 5000 }
    );
  });
});
