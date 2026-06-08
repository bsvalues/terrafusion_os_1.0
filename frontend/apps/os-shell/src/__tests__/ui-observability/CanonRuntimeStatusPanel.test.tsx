/**
 * CanonRuntimeStatusPanel — read-only Canon runtime status surface.
 *
 * Acceptance (operator spec):
 *   1. os-canon can show Canon Runtime status.
 *   2. Panel does NOT execute commands (no buttons / interactive controls).
 *   3. Panel does NOT mutate config.
 *   4. Panel accurately states: strict enforcement is scoped to canon-owned
 *      paths; advisory mode still applies to everything else.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { CanonRuntimeStatusPanel } from '../../canon/CanonRuntimeStatusPanel';

describe('CanonRuntimeStatusPanel', () => {
  it('renders the runtime status landmark', () => {
    render(<CanonRuntimeStatusPanel />);
    expect(screen.getByTestId('terracanon-runtime-status')).toBeInTheDocument();
  });

  it('states strict enforcement is scoped to canon-owned paths', () => {
    render(<CanonRuntimeStatusPanel />);
    const root = screen.getByTestId('terracanon-runtime-status');
    expect(root.textContent).toMatch(/strict/i);
    expect(root.textContent).toMatch(/canon-owned/i);
    expect(root.textContent).toMatch(/os-platform\/core\/canon/);
  });

  it('states advisory mode still applies to everything else', () => {
    render(<CanonRuntimeStatusPanel />);
    const root = screen.getByTestId('terracanon-runtime-status');
    expect(root.textContent).toMatch(/advisory/i);
  });

  it('lists the canon gates and tf canon CLI commands', () => {
    render(<CanonRuntimeStatusPanel />);
    const txt = screen.getByTestId('terracanon-runtime-status').textContent ?? '';
    expect(txt).toMatch(/write-lane/);
    expect(txt).toMatch(/protected-paths/);
    expect(txt).toMatch(/hardcoded-ports/);
    expect(txt).toMatch(/tf canon/);
  });

  it('is read-only: renders no buttons or interactive controls', () => {
    const { container } = render(<CanonRuntimeStatusPanel />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('input, textarea, select').length).toBe(0);
  });
});
