/**
 * CanonEvidenceViewer — read-only Canon evidence bundle viewer (os-canon).
 *
 * A read-only surface that renders a Canon evidence bundle (the proof artifact
 * for a completed task) and is HONEST about provenance:
 *   - With no bundle it shows an empty state and names the bundle contract;
 *     bundles are produced by the `tf canon` CLI + trace layer, not in-shell.
 *   - With a bundle it renders the real fields (task header, gate results,
 *     read/changed sets, diff hash, risk score) read-only.
 *   - The cryptographic seal is shown AS REPORTED by the bundle; verification
 *     is the trace layer's job, not re-computed in the browser.
 *
 * Fields mirror os-platform/core/canon/canon-evidence.mjs (EvidenceBundle) and
 * the seal fields from canon-trace-seal.mjs. No invented values.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { CanonEvidenceViewer } from '../../canon/CanonEvidenceViewer';

const SEALED_BUNDLE = {
  taskId: 'TF-CANON-EVID-1',
  intent: 'Add read-only evidence viewer',
  surface: 'os-canon',
  canonRulesLoaded: ['engineering-write-lanes', 'gate-registry'],
  filesRead: ['os-platform/core/canon/canon-evidence.mjs'],
  filesChanged: ['frontend/apps/os-shell/src/canon/CanonEvidenceViewer.tsx'],
  gateResults: [
    { gateId: 'canon-write-lane', status: 'pass' as const },
    { gateId: 'ui-token-ratchet', status: 'warning' as const, summary: 'no new violations' },
  ],
  diffHash: 'sha256-abc123',
  riskScore: 2,
  sealed: true,
  traceHash: 'sha256-deadbeef',
  sealedAt: '2026-06-08T19:00:00Z',
};

describe('CanonEvidenceViewer', () => {
  it('renders the evidence viewer landmark', () => {
    render(<CanonEvidenceViewer />);
    expect(screen.getByTestId('terracanon-evidence-viewer')).toBeInTheDocument();
  });

  it('shows an honest empty state pointing to tf canon when no bundle is loaded', () => {
    render(<CanonEvidenceViewer />);
    const txt = screen.getByTestId('terracanon-evidence-viewer').textContent ?? '';
    expect(txt).toMatch(/no evidence bundle/i);
    expect(txt).toMatch(/tf canon/);
  });

  it('names the bundle contract in the empty state without inventing values', () => {
    render(<CanonEvidenceViewer />);
    const txt = screen.getByTestId('terracanon-evidence-viewer').textContent ?? '';
    expect(txt).toMatch(/gate/i);
    expect(txt).toMatch(/seal/i);
    expect(txt).toMatch(/diff/i);
    expect(txt).toMatch(/risk/i);
  });

  it('renders the task header from a provided bundle', () => {
    render(<CanonEvidenceViewer bundle={SEALED_BUNDLE} />);
    const txt = screen.getByTestId('terracanon-evidence-viewer').textContent ?? '';
    expect(txt).toMatch(/TF-CANON-EVID-1/);
    expect(txt).toMatch(/Add read-only evidence viewer/);
    expect(txt).toMatch(/os-canon/);
  });

  it('renders each gate result with its status', () => {
    render(<CanonEvidenceViewer bundle={SEALED_BUNDLE} />);
    const gates = screen.getByTestId('terracanon-evidence-gates');
    expect(within(gates).getByText('canon-write-lane')).toBeInTheDocument();
    expect(within(gates).getByText('ui-token-ratchet')).toBeInTheDocument();
    expect(within(gates).getByText(/pass/i)).toBeInTheDocument();
    expect(within(gates).getByText(/warning/i)).toBeInTheDocument();
  });

  it('shows the seal as reported (sealed + trace hash) without claiming in-browser verification', () => {
    render(<CanonEvidenceViewer bundle={SEALED_BUNDLE} />);
    const seal = screen.getByTestId('terracanon-evidence-seal');
    const txt = seal.textContent ?? '';
    expect(txt).toMatch(/sealed/i);
    expect(txt).toMatch(/sha256-deadbeef/);
    // Honest: the seal is reported by the trace layer, not re-verified here.
    expect(txt).toMatch(/as reported|trace layer/i);
    expect(txt).not.toMatch(/verified in browser|cryptographically verified here/i);
  });

  it('marks an unsealed bundle honestly', () => {
    const { sealed, traceHash, sealedAt, ...rest } = SEALED_BUNDLE;
    render(<CanonEvidenceViewer bundle={{ ...rest, sealed: false }} />);
    const seal = screen.getByTestId('terracanon-evidence-seal');
    expect(seal.textContent ?? '').toMatch(/not sealed|unsealed/i);
  });

  it('is read-only: no buttons or inputs', () => {
    const { container } = render(<CanonEvidenceViewer bundle={SEALED_BUNDLE} />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('input, textarea, select').length).toBe(0);
  });
});
