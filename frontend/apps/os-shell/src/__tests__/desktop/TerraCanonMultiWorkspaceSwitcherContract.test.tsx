/**
 * Phase 35 — TerraCanon Multi-Workspace Switcher Contract
 *
 * Contract: TerraCanon supports multiple in-session workspaces and a
 * deterministic switcher that swaps active context safely.
 *
 * Phase 34 proved: rename is session-only per loaded workspace.
 * Phase 35 proves: multiple workspaces can coexist in memory with
 * independent identities, per-workspace rename, and a switcher UI.
 *
 * Success criteria:
 *   1) Cold start: no switcher, no identity
 *   2) After open: identity + new-workspace + switcher controls appear
 *   3) Creating second workspace yields new id and makes it active
 *   4) Switcher items exist; switching changes active identity
 *   5) Rename is per-workspace (switch restores each name)
 *   6) filetree + editor remain mounted; no crash
 *
 * Prevents:
 * - Switcher leaking into cold-start state
 * - Second workspace reusing the same id
 * - Switch not updating active identity
 * - Rename cross-contaminating workspaces
 * - Layout crash during multi-workspace operations
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–34
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent for user intent simulation
 *
 * Scope: Session-only multi-workspace; no persistence, no filesystem, no Monaco.
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
// Tests
// ============================================================================

describe('Phase 35 contract: TerraCanon supports multiple session workspaces and a safe switcher', () => {
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
      { timeout: 15000 }
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
  // S1: Cold start — no switcher, no identity
  // --------------------------------------------------------------------------
  it('S1: cold start has no switcher and no identity', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-workspace-switcher')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
    expect(screen.queryByText(/reset application/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // S2: After open, identity landmarks + controls appear
  // --------------------------------------------------------------------------
  it('S2: after open, identity landmarks exist and controls appear', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.getByTestId('terracanon-workspace-name')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace-id')).toBeInTheDocument();

    expect(screen.getByTestId('terracanon-new-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace-switcher')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S3: Creating second workspace yields new id, makes it active
  // --------------------------------------------------------------------------
  it('S3: creating a second workspace yields a new id and makes it active', async () => {
    await renderCanonAndOpenWorkspace();

    const id1 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));

    const id2 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    expect(id1.length).toBeGreaterThan(0);
    expect(id2.length).toBeGreaterThan(0);
    expect(id2).not.toBe(id1);
  });

  // --------------------------------------------------------------------------
  // S4: Switcher items exist; switching changes active identity
  // --------------------------------------------------------------------------
  it('S4: switcher items exist and switching changes the active identity', async () => {
    await renderCanonAndOpenWorkspace();

    const idA = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));

    const idB = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idB).not.toBe(idA);

    // Items must exist
    expect(screen.getByTestId('terracanon-workspace-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-workspace-item-1')).toBeInTheDocument();

    // Switch back to item 0 → id becomes idA
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-0'));
    const idBack = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idBack).toBe(idA);

    // Switch to item 1 → id becomes idB
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-1'));
    const idForward = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idForward).toBe(idB);
  });

  // --------------------------------------------------------------------------
  // S5: Rename is per-workspace (switch away and back restores each name)
  // --------------------------------------------------------------------------
  it('S5: rename is per-workspace (switch away and back restores each name)', async () => {
    await renderCanonAndOpenWorkspace();

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    const commit = screen.getByTestId('terracanon-rename-workspace-commit');

    // Rename workspace 0
    fireEvent.change(input, { target: { value: 'Workspace Alpha' } });
    fireEvent.click(commit);

    const nameA = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameA).toBe('Workspace Alpha');

    // Create workspace 1 (active)
    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));
    const nameBInitial = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBInitial.length).toBeGreaterThan(0);
    expect(nameBInitial).not.toBe('Workspace Alpha');

    // Rename workspace 1
    const input2 = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    fireEvent.change(input2, { target: { value: 'Workspace Beta' } });
    fireEvent.click(screen.getByTestId('terracanon-rename-workspace-commit'));

    const nameB = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameB).toBe('Workspace Beta');

    // Switch back to workspace 0 → name must restore to Alpha
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-0'));
    const nameBackA = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBackA).toBe('Workspace Alpha');

    // Switch to workspace 1 → name must restore to Beta
    fireEvent.click(screen.getByTestId('terracanon-workspace-item-1'));
    const nameBackB = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameBackB).toBe('Workspace Beta');
  });

  // --------------------------------------------------------------------------
  // S6: filetree + editor remain mounted; no crash
  // --------------------------------------------------------------------------
  it('S6: filetree + editor remain mounted; no crash', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('terracanon-new-workspace'));
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();

    expect(screen.queryByText(/reset application/i)).toBeNull();
  });
});
