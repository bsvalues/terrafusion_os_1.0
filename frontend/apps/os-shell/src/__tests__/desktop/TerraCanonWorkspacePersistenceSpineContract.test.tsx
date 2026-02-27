/**
 * Phase 38 — TerraCanon Workspace Persistence Spine Contract
 *
 * Contract: workspace state (list + activeIndex) persists to localStorage
 * and restores correctly on remount. Malformed data fails closed.
 *
 * Phase 37 proved: reopen last closed (session-only).
 * Phase 38 proves: workspace state survives refresh via localStorage.
 *
 * Success criteria:
 *   1) Cold start with no persisted data → empty state, no identity
 *   2) After workspace changes, localStorage contains serialized state
 *   3) Unmount + remount restores loaded state with correct identity
 *   4) Malformed persisted data → fail closed to empty state, no crash
 *
 * Prevents:
 * - Refresh losing all workspace state
 * - Corrupted localStorage crashing the app
 * - Stale/phantom workspaces appearing after clear
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–37
 * - localStorage spy for persistence verification
 * - unmount() + re-render() for remount simulation
 *
 * Scope: localStorage persistence only. No backend, no API, no IndexedDB.
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
// Storage keys (must match production)
// ============================================================================

const WORKSPACES_KEY = 'tf.canon.workspaces.v1';
const ACTIVE_INDEX_KEY = 'tf.canon.activeIndex.v1';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 38 contract: TerraCanon persists workspace state to localStorage', () => {
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
    const result = render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
    return result;
  }

  /**
   * Helper: render + open the first workspace.
   */
  async function renderCanonAndOpenWorkspace() {
    const result = await renderCanonAndWait();

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

    return result;
  }

  // --------------------------------------------------------------------------
  // S1: Cold start with no persisted data → empty state
  // --------------------------------------------------------------------------
  it('S1: cold start with no persisted data shows empty state', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S2: After workspace changes, localStorage contains serialized state
  // --------------------------------------------------------------------------
  it('S2: workspace changes persist to localStorage', async () => {
    await renderCanonAndOpenWorkspace();

    // Rename workspace 0
    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Alpha' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    // Create workspace 1
    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));

    // Rename workspace 1
    const input2 = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input2, { target: { value: 'Beta' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    // Switch to workspace 0
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-0'));

    // Verify localStorage was written
    const rawWorkspaces = localStorage.getItem(WORKSPACES_KEY);
    const rawIndex = localStorage.getItem(ACTIVE_INDEX_KEY);

    expect(rawWorkspaces).not.toBeNull();
    expect(rawIndex).not.toBeNull();

    const parsed = JSON.parse(rawWorkspaces!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Alpha');
    expect(parsed[1].name).toBe('Beta');
    expect(parsed[0].id).toBeTruthy();
    expect(parsed[1].id).toBeTruthy();
    expect(Number(rawIndex)).toBe(0);
  });

  // --------------------------------------------------------------------------
  // S3: Unmount + remount restores loaded state with correct identity
  // --------------------------------------------------------------------------
  it('S3: unmount + remount restores workspace state from localStorage', async () => {
    const { unmount } = await renderCanonAndOpenWorkspace();

    // Rename to make identity distinctive
    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Persisted WS' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    // Capture identity before unmount
    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameBefore = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBefore).toBe('Persisted WS');

    // Unmount (simulates leaving page)
    unmount();

    // Remount (simulates returning / refreshing)
    await renderCanonAndWait();

    // Should restore to loaded state
    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const nameAfter = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();

    expect(idAfter).toBe(idBefore);
    expect(nameAfter).toBe(nameBefore);

    // Layout stable
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S4: Malformed persisted data → fail closed to empty state
  // --------------------------------------------------------------------------
  it('S4: malformed persisted data fails closed to empty state without crash', async () => {
    // Write garbage to localStorage before mount
    localStorage.setItem(WORKSPACES_KEY, 'not-valid-json{{{');
    localStorage.setItem(ACTIVE_INDEX_KEY, 'garbage');

    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
