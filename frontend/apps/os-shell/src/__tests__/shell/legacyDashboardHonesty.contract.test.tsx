/**
 * Legacy dashboard honesty contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import ABTestingFramework from '../../components/ABTestingFramework';
import EnhancedGovernmentDashboard from '../../components/EnhancedGovernmentDashboard';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Legacy dashboard static honesty contract', () => {
  it('CountiesHub removes seeded county readiness claims', () => {
    const src = readSrc('components/CountiesHub.tsx');
    expect(src).not.toContain('12 Washington counties');
    expect(src).not.toContain('92%');
    expect(src).not.toContain('Pierce County');
    expect(src).toContain("data-testid='counties-hub'");
    expect(src).toContain('fetchWashingtonCountyStatus');
    expect(src).toContain('navigation context only');
    expect(src).toContain('not county-certified valuation truth');
    expect(src).not.toContain('localStorage');
    expect(src).not.toContain('tf.session.dev');
  });

  it('ABTestingFramework removes seeded county persuasion metrics', () => {
    const src = readSrc('components/ABTestingFramework.tsx');
    expect(src).not.toContain('379M×');
    expect(src).not.toContain('Transform Your County');
    expect(src).not.toContain('See Your Projections');
    expect(src).toContain('ab-testing-framework-unavailable');
    expect(src).toContain('No governed experiment registry or analytics pipeline is connected.');
  });

  it('EnhancedGovernmentDashboard removes fabricated ops metrics', () => {
    const src = readSrc('components/EnhancedGovernmentDashboard.tsx');
    expect(src).not.toContain('1,008');
    expect(src).not.toContain('Government. Transcended.');
    expect(src).not.toContain('Operational');
    expect(src).toContain('enhanced-government-dashboard-unavailable');
    expect(src).toContain('Decorative operational claims are intentionally');
  });
});

describe('Legacy dashboard rendered honesty behavior', () => {
  it('renders ABTestingFramework as a governed guardrail', () => {
    render(<ABTestingFramework />);

    expect(screen.getByTestId('ab-testing-framework-unavailable')).toBeInTheDocument();
    expect(screen.getAllByText(/Experiment registry unavailable/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Analytics feed unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Execution boundary/i)).toBeInTheDocument();
    expect(screen.queryByText(/Transform Your County/i)).not.toBeInTheDocument();
  });

  it('renders EnhancedGovernmentDashboard as unavailable instead of operational', () => {
    render(<EnhancedGovernmentDashboard />);

    expect(screen.getByTestId('enhanced-government-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Operations overview unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Security posture unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/1,008/i)).not.toBeInTheDocument();
  });
});
