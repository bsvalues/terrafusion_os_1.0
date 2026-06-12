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
import { fireEvent, render, screen } from '@testing-library/react';

import CountiesHub from '../../components/CountiesHub';
import ABTestingFramework from '../../components/ABTestingFramework';
import EnhancedGovernmentDashboard from '../../components/EnhancedGovernmentDashboard';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Legacy dashboard static honesty contract', () => {
  it('CountiesHub removes seeded county readiness claims', () => {
    const src = readSrc('components/CountiesHub.tsx');
    const routerSrc = readSrc('Router.tsx');
    expect(src).not.toContain('12 Washington counties');
    expect(src).not.toContain('92%');
    expect(src).not.toContain('Pierce County');
    expect(src).toContain('counties-hub-unavailable');
    expect(src).toContain('Counties Hub does not display seeded county readiness counts');
    expect(src).toContain('county-runtime-posture-summary');
    expect(src).toContain('county-runtime-posture-boundary');
    expect(routerSrc).toContain("path='counties'");
    expect(routerSrc).toContain('<CountiesHub />');
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
  it('renders CountiesHub as an unavailable control-plane surface', () => {
    render(<CountiesHub />);

    expect(screen.getByTestId('counties-hub-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Phase 4 runtime\/source posture/i)).toBeInTheDocument();
    expect(screen.getByText(/Runtime posture governed/i)).toBeInTheDocument();
    expect(screen.getByText(/Readiness metrics withheld/i)).toBeInTheDocument();
    expect(screen.getByText(/Migration actions blocked/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pierce County/i)).not.toBeInTheDocument();
  });

  it('renders the Phase 4 county posture summary and non-Benton intake boundary', () => {
    render(<CountiesHub />);

    const summary = screen.getByTestId('county-runtime-posture-summary');
    expect(summary).toHaveAttribute('data-total-counties', '39');
    expect(summary).toHaveAttribute('data-runtime-enabled-count', '1');
    expect(summary).toHaveAttribute('data-source-intake-count', '38');
    expect(summary).toHaveAttribute('data-benton-runtime-mode', 'runtime-enabled');
    expect(summary).toHaveAttribute('data-intake-canonical-import-allowed', 'false');

    const boundary = screen.getByTestId('county-runtime-posture-boundary');
    expect(boundary).toHaveAttribute('data-county-slug', 'yakima');
    expect(boundary).toHaveAttribute('data-runtime-mode', 'source-provenance-onboarding-intake');
    expect(boundary).toHaveAttribute('data-runtime-actions-allowed', 'false');
    expect(boundary).toHaveAttribute('data-canonical-import-allowed', 'false');
    expect(screen.getAllByText(/County Data Intake/i).length).toBeGreaterThan(0);
  });

  it('allows Benton runtime posture to be selected without making non-Benton counties live', () => {
    render(<CountiesHub />);

    fireEvent.click(screen.getByTestId('county-posture-option-benton'));

    const boundary = screen.getByTestId('county-runtime-posture-boundary');
    expect(boundary).toHaveAttribute('data-county-slug', 'benton');
    expect(boundary).toHaveAttribute('data-runtime-mode', 'runtime-enabled');
    expect(boundary).toHaveAttribute('data-runtime-actions-allowed', 'true');
    expect(boundary).toHaveAttribute('data-canonical-import-allowed', 'true');
  });

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
