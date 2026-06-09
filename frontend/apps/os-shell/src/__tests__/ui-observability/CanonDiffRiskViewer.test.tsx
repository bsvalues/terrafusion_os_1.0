/**
 * CanonDiffRiskViewer — read-only Canon diff + risk viewer (os-canon).
 *
 * Shows a proposed change (changed files) and the risk computed for it. HONEST:
 *   - It does NOT compute diffs, score risk, or run anything.
 *   - Empty by default; a proposed change + per-file risk (from `tf canon risk`
 *     / the task lifecycle) may be passed in via the `change` prop.
 *   - Aggregate risk is the max per-file level; manual-review surfaces if any
 *     file requires it.
 *
 * Field shape mirrors os-platform/core/canon/canon-risk.mjs (RiskAssessment).
 * No invented values.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { CanonDiffRiskViewer } from '../../canon/CanonDiffRiskViewer';

const CHANGE = {
  diffHash: 'sha256-abc123',
  files: [
    {
      path: 'frontend/apps/os-shell/src/canon/CanonDiffRiskViewer.tsx',
      level: 'low' as const,
      reasons: ['owned by os-shell (lane risk low)'],
      requiredGates: ['typecheck'],
      manualReviewRequired: false,
    },
    {
      path: 'os-platform/core/canon/canon-risk.mjs',
      level: 'high' as const,
      reasons: ['owned by canon-runtime (lane risk high)', 'rule CANON-1: protected [block]'],
      requiredGates: ['canon-query', 'write-lane'],
      manualReviewRequired: true,
    },
  ],
};

describe('CanonDiffRiskViewer', () => {
  it('renders the diff/risk viewer landmark', () => {
    render(<CanonDiffRiskViewer />);
    expect(screen.getByTestId('terracanon-diff-risk-viewer')).toBeInTheDocument();
  });

  it('shows an honest empty state pointing to tf canon when no change is loaded', () => {
    render(<CanonDiffRiskViewer />);
    const txt = screen.getByTestId('terracanon-diff-risk-viewer').textContent ?? '';
    expect(txt).toMatch(/no diff|no change/i);
    expect(txt).toMatch(/tf canon/);
  });

  it('names the risk contract in the empty state without inventing values', () => {
    render(<CanonDiffRiskViewer />);
    const txt = screen.getByTestId('terracanon-diff-risk-viewer').textContent ?? '';
    expect(txt).toMatch(/risk/i);
    expect(txt).toMatch(/write-lane/i);
    expect(txt).toMatch(/gate/i);
  });

  it('renders the diff hash and every changed file from a provided change', () => {
    render(<CanonDiffRiskViewer change={CHANGE} />);
    const txt = screen.getByTestId('terracanon-diff-risk-viewer').textContent ?? '';
    expect(txt).toMatch(/sha256-abc123/);
    expect(txt).toMatch(/CanonDiffRiskViewer\.tsx/);
    expect(txt).toMatch(/canon-risk\.mjs/);
  });

  it('shows each file risk level and its reasons', () => {
    render(<CanonDiffRiskViewer change={CHANGE} />);
    const txt = screen.getByTestId('terracanon-diff-risk-viewer').textContent ?? '';
    expect(txt).toMatch(/low/i);
    expect(txt).toMatch(/high/i);
    expect(txt).toMatch(/rule CANON-1/);
  });

  it('shows the aggregate risk as the max per-file level', () => {
    render(<CanonDiffRiskViewer change={CHANGE} />);
    const agg = screen.getByTestId('terracanon-diff-risk-aggregate');
    expect(agg.textContent ?? '').toMatch(/high/i);
  });

  it('surfaces manual-review-required when any file needs it', () => {
    render(<CanonDiffRiskViewer change={CHANGE} />);
    const txt = screen.getByTestId('terracanon-diff-risk-viewer').textContent ?? '';
    expect(txt).toMatch(/manual review/i);
  });

  it('is read-only: no buttons or inputs', () => {
    const { container } = render(<CanonDiffRiskViewer change={CHANGE} />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.querySelectorAll('input, textarea, select').length).toBe(0);
  });
});
