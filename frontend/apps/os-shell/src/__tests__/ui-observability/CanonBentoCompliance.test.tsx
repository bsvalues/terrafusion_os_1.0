/**
 * CanonIDEShellCompliance – P17/P20 regression test
 *
 * Invariants:
 *   1. Root element uses P20 shell class (`.canon-shell`) and IDE grid exists inside.
 *   2. Command palette is present with search input.
 *   3. Explorer sidebar exists with workspace list.
 *   4. Agents panel exists with task input.
 *   5. Tasks panel exists with safety dashboard.
 *   6. Material hierarchy wrappers applied (shell + infrastructure).
 *   7. No idle-pulse CSS classes on any element.
 *
 * P20 update: Root changed from `.canon-ide` to `.canon-shell` wrapper.
 * The IDE grid (`.canon-ide`) now lives inside `.canon-devCockpit__inner`.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — same pattern as existing phase tests
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

// StandaloneHomeShell — pass-through wrapper (no shell chrome in tests)
vi.mock('../../components/standalone', () => ({
  StandaloneHomeShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// CanonModuleHost — invisible in layout tests
vi.mock('../../canon/CanonModuleHost', () => ({
  CanonModuleHost: () => <div data-testid='canon-module-host-stub' />,
}));

// useCanonLayout — default layout
vi.mock('../../canon/useCanonLayout', () => ({
  useCanonLayout: () => [
    { leftPaneWidth: 250, rightPaneWidth: 750, inspectorOpen: false },
    vi.fn(),
  ],
}));

// invokeWithPreflight — stub
vi.mock('../../canon/invokeWithPreflight', () => ({
  invokeWithPreflight: vi.fn(),
}));

// Canon API calls — stubs
vi.mock('../../api/canonDoctor', () => ({
  runCanonDoctor: vi.fn(),
}));
vi.mock('../../api/canonGateFast', () => ({
  runCanonGateFast: vi.fn(),
}));
vi.mock('../../api/canonPing', () => ({
  runCanonPing: vi.fn(),
}));

// useCanonConnection — stub (avoids real WebSocket setup)
vi.mock('../../canon/useCanonConnection', () => ({
  useCanonConnection: () => ({ status: 'disconnected', lastPingMs: null }),
}));

// CanonNotification — stub
vi.mock('../../canon/CanonNotification', () => ({
  CanonNotificationHost: () => null,
  useCanonNotifications: () => ({ notifications: [], addNotification: vi.fn(), dismissNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------
import CanonHome from '../../pages/CanonHome';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P17 – Canon IDE Shell Compliance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('root element has P20 shell class and IDE grid exists inside', () => {
    render(<CanonHome />);
    const root = screen.getByTestId('terracanon-root');
    expect(root.className).toContain('canon-shell');
    // IDE grid now lives inside devCockpit (P20 hierarchy)
    const ideGrid = root.querySelector('.canon-ide');
    expect(ideGrid).not.toBeNull();
  });

  it('command palette is present with search input', () => {
    render(<CanonHome />);
    expect(screen.getByTestId('terracanon-command-palette')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-palette-input')).toBeInTheDocument();
  });

  it('explorer sidebar contains workspace controls', () => {
    render(<CanonHome />);
    expect(screen.getByTestId('terracanon-open-empty-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-filetree')).toBeInTheDocument();
  });

  it('agents panel is present with tool registry header', () => {
    render(<CanonHome />);
    expect(screen.getByTestId('terracanon-agents-panel')).toBeInTheDocument();
    // P-A: panel now shows tool registry, not a task input
    expect(screen.getByLabelText('Agents panel')).toBeInTheDocument();
  });

  it('tasks panel has safety dashboard', () => {
    render(<CanonHome />);
    expect(screen.getByTestId('terracanon-safety-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-run-all')).toBeInTheDocument();
    // Gate cards have duplicate testids (card wrapper + run button) — use getAllByTestId
    expect(screen.getAllByTestId('terracanon-run-canon-doctor').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('terracanon-run-canon-gatefast').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('terracanon-run-canon-ping').length).toBeGreaterThan(0);
  });

  it('material hierarchy is applied (shell + infrastructure)', () => {
    render(<CanonHome />);
    const shells = document.querySelectorAll('.liquid-panel--shell');
    const infra = document.querySelectorAll('.liquid-panel--infrastructure');
    // At least 2 shell panels (palette + explorer), at least 1 infrastructure (tasks)
    expect(shells.length).toBeGreaterThanOrEqual(2);
    expect(infra.length).toBeGreaterThanOrEqual(1);
  });

  it('no idle-pulse CSS classes exist inside canon root', () => {
    render(<CanonHome />);
    const root = screen.getByTestId('terracanon-root');
    const forbidden = [
      'ultimate-system-pulse',
      'quantum-background-phase',
      'animate-pulse',
      'breathing',
    ];
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
      for (const cls of forbidden) {
        expect(el.className).not.toContain(cls);
      }
    }
  });

  it('workspace landmark preserved for phase 30-47 compat', () => {
    render(<CanonHome />);
    expect(screen.getByTestId('terracanon-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('terracanon-editor')).toBeInTheDocument();
  });
});
