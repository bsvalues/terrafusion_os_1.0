/**
 * Phase 33 — TerraCanon Workspace Identity Contract
 *
 * Contract: when TerraCanon enters loaded workspace state, it exposes a
 * stable workspace identity (name + id) via testable landmarks. The identity
 * is session-only — no persistence, no filesystem.
 *
 * Phase 32 proved: TerraCanon can transition from empty → loaded state.
 * Phase 33 proves: The loaded state carries a stable session identity.
 *
 * Success criteria:
 *   1) Cold start: no-workspace present, identity landmarks absent
 *   2) After open: workspace-loaded + name + id landmarks with non-empty values
 *   3) After open: no-workspace disappears
 *   4) Re-click is idempotent: identity does not change
 *   5) Filetree + editor survive alongside identity
 *   6) No crash ("Reset Application" never appears)
 *
 * Prevents:
 * - Loaded workspace with no identity (downstream features need something to hang off)
 * - Identity that changes on every re-render or re-click
 * - Identity leaking into cold-start state
 * - Layout panes disappearing after identity renders
 *
 * Technique:
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–32
 * - Deep-link entry to /canon (cold start, no prior navigation)
 * - fireEvent.click for user intent simulation
 * - Assert identity landmarks after state transition
 *
 * Production change:
 * - useRef + useState identity in CanonHome.tsx (idempotent, session-only)
 *
 * Scope: Session identity only; no persistence, no filesystem, no Monaco.
 */

import { vi, describe, it, expect, beforeAll, afterEach } from 'vitest';
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

describe('Phase 33 contract: TerraCanon loaded workspace exposes stable session identity (no persistence)', () => {
  beforeAll(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

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
      { timeout: 15000 }
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
  // S1: Cold start — no-workspace present, identity landmarks absent
  // --------------------------------------------------------------------------
  it('S1: cold start shows no-workspace and does not expose workspace identity', async () => {
    await renderCanonAndWait();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-root')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-no-workspace')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByTestId('terracanon-workspace-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terracanon-workspace-id')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S2: After opening empty workspace, identity landmarks render with non-empty values
  // --------------------------------------------------------------------------
  it('S2: after opening empty workspace, identity landmarks render with non-empty values', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-loaded')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const name = screen.getByTestId('terracanon-workspace-name');
    const id = screen.getByTestId('terracanon-workspace-id');

    expect((name.textContent ?? '').trim().length).toBeGreaterThan(0);
    expect((id.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // S3: Opening workspace hides no-workspace state
  // --------------------------------------------------------------------------
  it('S3: opening workspace hides no-workspace state', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.queryByTestId('terracanon-no-workspace')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S4: Identity stable across repeated clicks (idempotent)
  // --------------------------------------------------------------------------
  it('S4: identity is stable across repeated open-empty-workspace clicks', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-workspace-id')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const id1 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const name1 = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();

    // Click button again (still visible, idempotent)
    fireEvent.click(screen.getByTestId('terracanon-open-empty-workspace'));

    const id2 = (screen.getByTestId('terracanon-workspace-id').textContent ?? '').trim();
    const name2 = (screen.getByTestId('terracanon-workspace-name').textContent ?? '').trim();

    expect(id1).toBe(id2);
    expect(name1).toBe(name2);
  });

  // --------------------------------------------------------------------------
  // S5: Filetree + editor survive in loaded state alongside identity
  // --------------------------------------------------------------------------
  it('S5: filetree + editor survive in loaded state alongside identity', async () => {
    await renderCanonAndOpenWorkspace();

    await waitFor(
      () => {
        expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-workspace-name')).toBeInTheDocument();
        expect(screen.getByTestId('terracanon-workspace-id')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // --------------------------------------------------------------------------
  // S6: No crash guard — standard regression sentinel
  // --------------------------------------------------------------------------
  it('S6: no crash guard after identity renders', async () => {
    await renderCanonAndOpenWorkspace();

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });
});
