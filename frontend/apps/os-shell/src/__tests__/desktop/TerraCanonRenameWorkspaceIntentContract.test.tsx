/**
 * Phase 34 — TerraCanon Rename Workspace Intent Contract
 *
 * Contract: a loaded workspace can be renamed via a text input + commit button.
 * The rename is session-only — no persistence, no filesystem.
 *
 * Phase 33 proved: loaded workspace exposes stable session identity.
 * Phase 34 proves: the identity name can be updated via user intent.
 *
 * Success criteria:
 *   1) Cold start: no identity, no rename controls
 *   2) After open: rename input + commit button appear
 *   3) Typing + committing updates workspace-name landmark
 *   4) Rename does not change workspace-id
 *   5) Empty/whitespace rename is rejected (name unchanged)
 *   6) No crash ("Reset Application" never appears)
 *
 * Prevents:
 * - Rename controls leaking into cold-start state
 * - Identity ID mutation on rename
 * - Empty/whitespace name acceptance
 * - Crash during rename flow
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–33
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent for user intent simulation
 * - Assert landmark value changes after rename commit
 *
 * Production change:
 * - renameDraft state + commitRename handler + rename controls in EditorPane
 *
 * Scope: Session rename only; no persistence, no filesystem, no Monaco.
 */

import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

let memoryRouterEntries: string[] = ['/'];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
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
// Tests
// ============================================================================

describe('Phase 34 contract: loaded workspace can be renamed (session-only, no persistence)', () => {
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
  // S1: Cold start — no identity, no rename controls
  // --------------------------------------------------------------------------
  it('S1: cold start has no identity and no rename controls', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-rename-workspace-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-rename-workspace-commit')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S2: Loaded workspace exposes rename controls
  // --------------------------------------------------------------------------
  it('S2: loaded workspace exposes rename controls', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-workspace-name')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-workspace-id')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-rename-workspace-input')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-rename-workspace-commit')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S3: Renaming updates the workspace name landmark
  // --------------------------------------------------------------------------
  it('S3: renaming updates the workspace name landmark', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-rename-workspace-input')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    const commit = screen.getByTestId('terracanon-rename-workspace-commit');

    fireEvent.change(input, { target: { value: 'My First Workspace' } });
    fireEvent.click(commit);

    expect(screen.getByTestId('terracanon-workspace-name').textContent).toContain(
      'My First Workspace'
    );
  });

  // --------------------------------------------------------------------------
  // S4: Renaming does not change the workspace id
  // --------------------------------------------------------------------------
  it('S4: renaming does not change the workspace id', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-id')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const idBefore = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    const commit = screen.getByTestId('terracanon-rename-workspace-commit');

    fireEvent.change(input, { target: { value: 'Renamed Workspace' } });
    fireEvent.click(commit);

    const idAfter = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    expect(idAfter).toBe(idBefore);
  });

  // --------------------------------------------------------------------------
  // S5: Empty/whitespace rename is rejected (name stays the same)
  // --------------------------------------------------------------------------
  it('S5: empty/whitespace rename is rejected (name stays the same)', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-name')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const nameBefore = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    const commit = screen.getByTestId('terracanon-rename-workspace-commit');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(commit);

    const nameAfter = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();
    expect(nameAfter).toBe(nameBefore);
  });

  // --------------------------------------------------------------------------
  // S6: No crash guard throughout rename flow
  // --------------------------------------------------------------------------
  it('S6: no crash guard throughout rename flow', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-rename-workspace-input')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const input = screen.getByTestId('terracanon-rename-workspace-input') as HTMLInputElement;
    const commit = screen.getByTestId('terracanon-rename-workspace-commit');

    fireEvent.change(input, { target: { value: 'Safe Rename' } });
    fireEvent.click(commit);

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });
});
