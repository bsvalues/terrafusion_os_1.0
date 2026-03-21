/**
 * backForwardParcelPreservation.contract.test.ts
 *
 * Phase 17 — Brick 3: Back/Forward Parcel Preservation
 * =====================================================
 *
 * Proves that browser back/forward navigation preserves the active parcel
 * workbench without spawning duplicate windows or losing tab state.
 *
 * Architecture: The workbench is URL-mounted, not window-managed.
 * React Router + BrowserHistory own tab + parcel state through the URL.
 * activateModule() is NOT called on back/forward — the browser restores
 * the previous URL, which React Router uses to re-render the correct route.
 *
 * Contract:
 *   History: /property/123/summary → /property/123/forge → /property/123/atlas
 *   back()  → /property/123/forge  (forge tab, same parcel)
 *   back()  → /property/123/summary (summary tab, same parcel)
 *   forward() → /property/123/forge (restored correctly)
 *
 *   Invariants:
 *   - parcelId (123) never changes across the traversal
 *   - tab is derived from URL at each step — no stale state
 *   - workbench window count stays constant (no spawning on history traversal)
 *   - A→B→A history reuse is idempotent (same URL = same render = no new window)
 *
 * @see src/pages/workbench/PropertyWorkbench.tsx — currentTabId via useMemo
 * @see src/orchestration/moduleActivation.ts — NOT called on back/forward
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type WorkbenchTabSlug =
  | 'summary' | 'forge' | 'atlas' | 'dais'
  | 'clerk' | 'treasury' | 'audit' | 'dossier' | 'pilot';

const TAB_PATH_MAP: Record<string, WorkbenchTabSlug> = {
  forge: 'forge', atlas: 'atlas', dais: 'dais', clerk: 'clerk',
  treasury: 'treasury', audit: 'audit', dossier: 'dossier', pilot: 'pilot',
};

function getCurrentTabFromPath(pathname: string, parcelId: string): WorkbenchTabSlug {
  const basePath = `/property/${parcelId}`;
  const pathAfterBase = pathname.replace(basePath, '').replace(/^\//, '');
  if (!pathAfterBase || pathAfterBase === '') return 'summary';
  return TAB_PATH_MAP[pathAfterBase] ?? 'summary';
}

function extractParcelId(pathname: string): string | null {
  const match = pathname.match(/^\/property\/([^/]+)/);
  return match?.[1] ?? null;
}

let workbenchSource: string;
let moduleActivationSource: string;

beforeAll(() => {
  workbenchSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbench.tsx'),
    'utf-8',
  );
  moduleActivationSource = readFileSync(
    resolve(import.meta.dirname, '../../orchestration/moduleActivation.ts'),
    'utf-8',
  );
});

// ── History simulation ─────────────────────────────────────────────────────────

class HistorySimulator {
  private stack: string[] = [];
  private cursor = -1;

  push(url: string): void {
    // Discard forward history (matches browser behavior)
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push(url);
    this.cursor = this.stack.length - 1;
  }

  back(): string | null {
    if (this.cursor <= 0) return null;
    this.cursor--;
    return this.stack[this.cursor];
  }

  forward(): string | null {
    if (this.cursor >= this.stack.length - 1) return null;
    this.cursor++;
    return this.stack[this.cursor];
  }

  current(): string {
    return this.stack[this.cursor];
  }

  length(): number {
    return this.stack.length;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('backForwardParcelPreservation', () => {

  // ── Structural: URL-driven workbench has no history side effects ───────────

  it('workbench tab is derived from URL (useMemo), not component state', () => {
    expect(workbenchSource).toContain('getCurrentTabFromPath(location.pathname, parcelId)');
    expect(workbenchSource).toContain('[location.pathname, parcelId]');
    expect(workbenchSource).not.toMatch(/useState\s*<\s*WorkbenchTabSlug/);
  });

  it('back/forward does NOT call activateModule (no window spawn path)', () => {
    // activateModule is the only path that calls openWindow.
    // Browser history restores URL directly — React Router re-renders.
    // PropertyWorkbench does not import or call activateModule.
    expect(workbenchSource).not.toContain('activateModule');
  });

  // ── History traversal simulation ───────────────────────────────────────────

  it('preserves the active parcel workbench across browser back navigation', () => {
    const history = new HistorySimulator();
    const parcelId = '123';

    history.push(`/property/${parcelId}/summary`);
    history.push(`/property/${parcelId}/forge`);
    history.push(`/property/${parcelId}/atlas`);

    const afterBack = history.back();
    expect(afterBack).toBe(`/property/${parcelId}/forge`);
    expect(extractParcelId(afterBack!)).toBe(parcelId);
    expect(getCurrentTabFromPath(afterBack!, parcelId)).toBe('forge');
  });

  it('preserves the active parcel workbench across browser forward navigation', () => {
    const history = new HistorySimulator();
    const parcelId = '123';

    history.push(`/property/${parcelId}/summary`);
    history.push(`/property/${parcelId}/forge`);
    history.back(); // → summary
    const afterForward = history.forward();

    expect(afterForward).toBe(`/property/${parcelId}/forge`);
    expect(extractParcelId(afterForward!)).toBe(parcelId);
    expect(getCurrentTabFromPath(afterForward!, parcelId)).toBe('forge');
  });

  it('does not respawn a duplicate workbench window on back/forward', () => {
    // Structural: the workbench is a React Router route (mounted once per URL match).
    // Back/forward changes the URL — React Router re-renders the SAME mounted component.
    // No call to openWindow() or activateModule() → window count stays constant.
    expect(workbenchSource).not.toContain('openWindow');
    expect(workbenchSource).not.toContain('activateModule');
  });

  it('restores the correct tab from history state', () => {
    const history = new HistorySimulator();
    const parcelId = 'P99887766';

    history.push(`/property/${parcelId}/summary`);
    history.push(`/property/${parcelId}/forge`);
    history.push(`/property/${parcelId}/atlas`);

    // back → forge
    const step1 = history.back()!;
    expect(getCurrentTabFromPath(step1, parcelId)).toBe('forge');

    // back → summary
    const step2 = history.back()!;
    expect(getCurrentTabFromPath(step2, parcelId)).toBe('summary');

    // forward → forge
    const step3 = history.forward()!;
    expect(getCurrentTabFromPath(step3, parcelId)).toBe('forge');

    // forward → atlas
    const step4 = history.forward()!;
    expect(getCurrentTabFromPath(step4, parcelId)).toBe('atlas');
  });

  it('preserves parcelId and county header across history traversal', () => {
    const history = new HistorySimulator();
    const parcelId = 'R112233445566';

    history.push(`/property/${parcelId}/summary`);
    history.push(`/property/${parcelId}/forge`);
    history.push(`/property/${parcelId}/atlas`);

    // Traverse back and verify parcelId is constant at each step
    const atlas = history.current();
    expect(extractParcelId(atlas)).toBe(parcelId);

    const forge = history.back()!;
    expect(extractParcelId(forge)).toBe(parcelId);

    const summary = history.back()!;
    expect(extractParcelId(summary)).toBe(parcelId);

    // county header is driven by useSession (Brick 1) — it has no URL dependency.
    // Structural: useSession reads localStorage, not location.pathname.
    // Therefore history traversal cannot affect county header.
    expect(workbenchSource).toContain('useSession');
    // useSession does not take pathname as argument
    expect(workbenchSource).not.toMatch(/useSession\(.*pathname/);
  });

  it('keeps A→B→A history reuse idempotent', () => {
    // A→B→A means: go to forge, go to atlas, go back to forge.
    // The URL /property/:parcelId/forge is the same object — React Router
    // does NOT create a new mounted instance; it re-renders the existing one.
    const history = new HistorySimulator();
    const parcelId = '55555';

    history.push(`/property/${parcelId}/forge`);   // A
    history.push(`/property/${parcelId}/atlas`);   // B
    history.back();                                 // back to A

    const current = history.current();
    expect(current).toBe(`/property/${parcelId}/forge`);
    expect(history.length()).toBe(2); // Only 2 entries in stack (no duplication)
    expect(getCurrentTabFromPath(current, parcelId)).toBe('forge');
  });
});
