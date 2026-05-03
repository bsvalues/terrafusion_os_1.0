/**
 * Operator chrome honesty contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import ProfessionalHeader from '../../components/layout/ProfessionalHeader';
import CoreModuleLauncher from '../../components/core/ModuleLauncher';
import PropertyAssessmentDashboard from '../../components/government/PropertyAssessmentDashboard';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Operator chrome static honesty contract', () => {
  it('ProfessionalHeader removes fabricated runtime and compliance claims', () => {
    const src = readSrc('components/layout/ProfessionalHeader.tsx');
    expect(src).not.toContain('1,008 AI Agents Active');
    expect(src).not.toContain('County System Online');
    expect(src).not.toContain('FISMA Compliant');
    expect(src).toContain('Runtime status unavailable');
    expect(src).toContain('County connectivity unverified');
    expect(src).toContain('Compliance state unavailable');
  });

  it('core ModuleLauncher removes sample modules and fake performance metrics', () => {
    const src = readSrc('components/core/ModuleLauncher.tsx');
    expect(src).not.toContain('SAMPLE_MODULES');
    expect(src).not.toContain('379M× faster');
    expect(src).not.toContain('/api/launch-tauri');
    expect(src).toContain('core-module-launcher-unavailable');
    expect(src).toContain('Legacy launcher surface retained only');
  });

  it('PropertyAssessmentDashboard removes seeded assessment metrics and AI superlatives', () => {
    const src = readSrc('components/government/PropertyAssessmentDashboard.tsx');
    expect(src).not.toContain('SAMPLE_PROPERTIES');
    expect(src).not.toContain('1,008 AI agents');
    expect(src).not.toContain('379M× faster');
    expect(src).toContain('property-assessment-dashboard-unavailable');
    expect(src).toContain('Synthetic assessment claims are intentionally');
  });
});

describe('Operator chrome rendered honesty behavior', () => {
  it('renders unavailable status chips in ProfessionalHeader', () => {
    render(<ProfessionalHeader />);

    expect(screen.getByTestId('professional-header-runtime-status')).toHaveTextContent(
      'Runtime status unavailable',
    );
    expect(screen.getByTestId('professional-header-county-status')).toHaveTextContent(
      'County connectivity unverified',
    );
    expect(screen.getByTestId('professional-header-compliance-status')).toHaveTextContent(
      'Compliance state unavailable',
    );
    expect(screen.queryByText('1,008 AI Agents Active')).not.toBeInTheDocument();
  });

  it('renders governed unavailable state in the core ModuleLauncher', () => {
    render(<CoreModuleLauncher />);

    expect(screen.getByTestId('core-module-launcher-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Module registry unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch actions blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/Telemetry unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/379M× faster/i)).not.toBeInTheDocument();
  });

  it('renders governed unavailable state in PropertyAssessmentDashboard', () => {
    render(<PropertyAssessmentDashboard />);

    expect(screen.getByTestId('property-assessment-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Assessment inventory unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Trend analytics unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Governed action boundary/i)).toBeInTheDocument();
    expect(screen.queryByText(/1,008 AI agents/i)).not.toBeInTheDocument();
  });
});
