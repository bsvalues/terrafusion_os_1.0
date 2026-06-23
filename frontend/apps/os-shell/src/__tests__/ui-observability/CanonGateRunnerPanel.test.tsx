/**
 * CanonGateRunnerPanel — read-only Canon gate runner panel (os-canon).
 *
 * Lists the gates configured in the Canon gate registry and their latest KNOWN
 * status. HONEST by construction:
 *   - It does NOT run gates, trigger CI, or mutate anything.
 *   - Status is "not run here" by default; real statuses (from tf canon gates /
 *     CI / the trace layer) may be passed in via the `statuses` prop.
 *   - The current execution rail is the `tf canon gates` CLI.
 *
 * Configured gates mirror os-platform/core/canon/gate-registry.json. No invented
 * values.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { CanonGateRunnerPanel } from '../../canon/CanonGateRunnerPanel';

describe('CanonGateRunnerPanel', () => {
  it('renders the gate runner landmark', () => {
    render(<CanonGateRunnerPanel />);
    expect(screen.getByTestId('terracanon-gate-runner')).toBeInTheDocument();
  });

  it('lists every configured gate by label (mirrors gate-registry.json)', () => {
    render(<CanonGateRunnerPanel />);
    const txt = screen.getByTestId('terracanon-gate-runner').textContent ?? '';
    expect(txt).toMatch(/TypeScript Type Check/);
    expect(txt).toMatch(/Launch Surface Contract/);
    expect(txt).toMatch(/Canon Runtime Query Self-Test/);
  });

  it('shows the real command for each gate without inventing values', () => {
    render(<CanonGateRunnerPanel />);
    const txt = screen.getByTestId('terracanon-gate-runner').textContent ?? '';
    expect(txt).toMatch(/pnpm run type-check/);
    expect(txt).toMatch(/launch-surface-contract\.test\.mjs/);
    expect(txt).toMatch(/canon-query\.test\.mjs/);
  });

  it('is honest that it does not run gates, trigger CI, or mutate, and points to tf canon', () => {
    render(<CanonGateRunnerPanel />);
    const txt = screen.getByTestId('terracanon-gate-runner').textContent ?? '';
    expect(txt).toMatch(/does not run|not run here|read-only/i);
    expect(txt).toMatch(/tf canon/);
  });

  it('shows status as not-run by default (no invented pass/fail)', () => {
    render(<CanonGateRunnerPanel />);
    const status = screen.getByTestId('terracanon-gate-status-typecheck');
    expect(status.textContent ?? '').toMatch(/not run|unknown|—/i);
  });

  it('renders externally-known statuses when provided', () => {
    render(
      <CanonGateRunnerPanel
        statuses={[
          { gateId: 'typecheck', status: 'pass' },
          { gateId: 'canon-query', status: 'fail' },
        ]}
      />,
    );
    expect(
      within(screen.getByTestId('terracanon-gate-status-typecheck')).getByText(/pass/i),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('terracanon-gate-status-canon-query')).getByText(/fail/i),
    ).toBeInTheDocument();
    // A gate with no supplied status stays not-run (not silently passed).
    expect(
      screen.getByTestId('terracanon-gate-status-launch-surface-contract').textContent ?? '',
    ).toMatch(/not run|unknown|—/i);
  });

  it('is read-only: no buttons or inputs', () => {
    const { container } = render(
      <CanonGateRunnerPanel statuses={[{ gateId: 'typecheck', status: 'pass' }]} />,
    );
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('input, textarea, select').length).toBe(0);
  });
});
