/**
 * Dormant consciousness surface honesty contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EliteConsciousnessDashboard } from '../../components/consciousness/EliteConsciousnessDashboard';
import { TerraFusionCrossServiceCoordination } from '../../components/coordination/TerraFusionCrossServiceCoordination';
import { TerraFusionEliteRealtimeDashboard } from '../../components/dashboard/TerraFusionEliteRealtimeDashboard';
import { TerraFusionAutomatedDeploymentOrchestrator } from '../../components/deployment/TerraFusionAutomatedDeploymentOrchestrator';
import { SystemHealthSentinel } from '../../components/health/SystemHealthSentinel';
import { TerraFusionEliteServiceOrchestrator } from '../../components/orchestrator/TerraFusionEliteServiceOrchestrator';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Dormant consciousness surface static honesty contract', () => {
  const cases = [
    {
      relPath: 'components/consciousness/EliteConsciousnessDashboard.tsx',
      testId: 'elite-consciousness-dashboard-unavailable',
    },
    {
      relPath: 'components/coordination/TerraFusionCrossServiceCoordination.tsx',
      testId: 'cross-service-coordination-unavailable',
    },
    {
      relPath: 'components/dashboard/TerraFusionEliteRealtimeDashboard.tsx',
      testId: 'elite-realtime-dashboard-unavailable',
    },
    {
      relPath: 'components/deployment/TerraFusionAutomatedDeploymentOrchestrator.tsx',
      testId: 'deployment-orchestrator-unavailable',
    },
    {
      relPath: 'components/health/SystemHealthSentinel.tsx',
      testId: 'system-health-sentinel-unavailable',
    },
    {
      relPath: 'components/orchestrator/TerraFusionEliteServiceOrchestrator.tsx',
      testId: 'elite-service-orchestrator-unavailable',
    },
  ];

  for (const testCase of cases) {
    it(`${testCase.relPath} removes retired consciousness provider usage`, () => {
      const src = readSrc(testCase.relPath);
      expect(src).not.toContain('VITE_CONSCIOUSNESS_URL');
      expect(src).not.toContain('localhost:3004');
      expect(src).not.toContain('/hubs/consciousness');
      expect(src).toContain(testCase.testId);
      expect(src).toContain('Unavailable');
    });
  }
});

describe('Dormant consciousness surface rendered honesty behavior', () => {
  it('renders all dormant surfaces as governed unavailable cards', () => {
    render(
      <>
        <EliteConsciousnessDashboard />
        <TerraFusionCrossServiceCoordination />
        <TerraFusionEliteRealtimeDashboard />
        <TerraFusionAutomatedDeploymentOrchestrator />
        <SystemHealthSentinel />
        <TerraFusionEliteServiceOrchestrator />
      </>,
    );

    expect(screen.getByTestId('elite-consciousness-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('cross-service-coordination-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('elite-realtime-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('deployment-orchestrator-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('system-health-sentinel-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('elite-service-orchestrator-unavailable')).toBeInTheDocument();
  });
});
