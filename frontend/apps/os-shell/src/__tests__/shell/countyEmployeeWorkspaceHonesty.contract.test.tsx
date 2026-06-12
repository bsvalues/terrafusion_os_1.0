import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { CountyEmployeeWorkspace } from '../../pages/CountyEmployeeWorkspace';
import {
  WASHINGTON_COUNTY_RUNTIME_POSTURES,
  getCountyRuntimePosture,
} from '../../config/countyRuntimePosture';

const invokeToolMock = vi.fn();
const activateModuleMock = vi.fn();

vi.mock('../../components/ai/AIInsightsPanel', () => ({
  AIInsightsPanel: () => <div data-testid='ai-insights-panel'>AI Insights Panel</div>,
}));

vi.mock('../../components/ai/AIWorkflowAutomation', () => ({
  AIWorkflowAutomation: () => <div data-testid='ai-workflows-panel'>AI Workflow Automation</div>,
}));

vi.mock('../../components/dashboards/CountyEmployeeDashboard', () => ({
  CountyEmployeeDashboard: () => <div data-testid='county-employee-dashboard'>County Employee Dashboard</div>,
}));

vi.mock('../../components/workbench/ExecutiveKpiCards', () => ({
  ExecutiveKpiCards: () => <div data-testid='executive-kpi-cards'>Executive KPI Cards</div>,
}));

vi.mock('../../components/workbench/SwarmActivityBar', () => ({
  SwarmActivityBar: () => <div data-testid='swarm-activity-bar'>Swarm Activity Bar</div>,
}));

vi.mock('../../components/terrafusion-design-system', () => ({
  Badge: ({ children, className, ...rest }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <span className={className} {...rest}>{children}</span>
  ),
  Button: ({ children, onClick, className, disabled, ...rest }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean; [key: string]: unknown }) => (
    <button type='button' onClick={onClick} className={className} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
  Card: ({ children, className, ...rest }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div className={className} {...rest}>{children}</div>
  ),
  CardContent: ({ children, className, ...rest }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div className={className} {...rest}>{children}</div>
  ),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => invokeToolMock(...args),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => activateModuleMock(...args),
}));

vi.mock('../../hooks/useAIAssistant', () => ({
  useAIAssistant: () => ({
    messages: [],
    isProcessing: false,
    swarmStatus: {
      countyId: 'benton',
      activeAgents: 17,
      swarmActivity: 'monitoring-only',
      quantumOptimizationFactor: 0,
      responseTime: 184,
      accuracyScore: 0.995,
      consciousnessLevel: 0,
      lastUpdate: new Date('2026-03-21T19:00:00.000Z'),
    },
    sendMessage: vi.fn(),
    getRecommendations: vi.fn(),
    analyzeProperty: vi.fn(),
    refreshSwarmStatus: vi.fn().mockResolvedValue(undefined),
    clearMessages: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePropertyAnalysis', () => ({
  usePropertyAnalysis: () => ({
    properties: [],
    isAnalyzing: false,
    error: null,
    analyzeProperty: vi.fn(),
    analyzeBulk: vi.fn(),
    getRecentProperties: vi.fn().mockReturnValue([]),
    clearCache: vi.fn(),
  }),
}));

describe('CountyEmployeeWorkspace honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  invokeToolMock.mockImplementation(({ toolId }: { toolId: string }) => {
    if (toolId === 'generate_morning_brief') {
      return Promise.resolve({
        success: true,
        correlationId: 'corr-brief-001',
        result: {
          output: JSON.stringify({
            role: 'chief_appraiser',
            queueType: 'calibration_review',
            priority: 'high',
            dueWindow: 'today',
            blockingDependencies: ['sales_sync'],
            recommendedTool: 'rerun_ratio_study',
            readyToAct: true,
            findings: [
              {
                findingType: 'RATE_PROBLEM',
                severity: 'high',
                recommendedAction: 'Review residential base rate',
              },
            ],
          }),
        },
      });
    }

    if (toolId === 'explain_spatial_anomaly') {
      return Promise.resolve({
        success: true,
        correlationId: 'corr-atlas-001',
        result: {
          output: JSON.stringify({
            narrative: 'Residual clustering is concentrated in the river corridor and should route to TerraAtlas.',
            hotspotCount: 3,
            recommendedAction: 'Open TerraAtlas for drill-down audit.',
          }),
        },
      });
    }

    if (toolId === 'open_appeal_packet') {
      return Promise.resolve({
        success: true,
        correlationId: 'corr-dossier-001',
        result: {
          output: JSON.stringify({
            packetRef: 'packet-2026-001',
            payloadRef: 'payload-2026-001',
            sections: ['summary', 'evidence', 'valuation'],
          }),
        },
      });
    }

    return Promise.resolve({
      success: false,
      correlationId: 'corr-error-001',
      error: { message: 'Unexpected tool' },
    });
  });

  it('describes workspace swarm metrics as refreshed status reports instead of live activity', () => {
    render(
      <CountyEmployeeWorkspace
        countyId='benton'
        employeeName='Casey Operator'
        employeeRole='assessor'
        department='Assessor'
      />
    );

    expect(screen.getByText(/Swarm status \(30s refresh\):/i)).toBeInTheDocument();
    expect(screen.getAllByText(/17 active agents/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Reported activity:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/monitoring-only/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Factor unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/^Unavailable$/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Status Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Workspace status snapshot/i)).toBeInTheDocument();
    expect(screen.queryByText(/^AI Swarm:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Consciousness/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Agents Active/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Elite Mode Active/i)).not.toBeInTheDocument();
  });

  it('describes the insights view as auto-refresh instead of real-time intelligence', () => {
    render(
      <CountyEmployeeWorkspace
        countyId='benton'
        employeeName='Casey Operator'
        employeeRole='assessor'
        department='Assessor'
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /AI Insights/i }));

    expect(screen.getByTestId('ai-insights-panel')).toBeInTheDocument();
    expect(screen.getByText(/Auto-refresh predictive analytics and AI insight snapshots/i)).toBeInTheDocument();
    expect(screen.queryByText(/Real-time predictive analytics and AI intelligence/i)).not.toBeInTheDocument();
  });

  it('shows a governed staff command surface and routes suite handoffs through canonical modules', async () => {
    render(
      <CountyEmployeeWorkspace
        countyId='benton'
        employeeName='Casey Operator'
        employeeRole='assessor'
        department='Assessor'
      />
    );

    expect(screen.getByTestId('workspace-command-surface')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Governed county posture for the working assessor lane/i)).toBeInTheDocument();
      expect(screen.getByText(/calibration_review \| high priority \| due today/i)).toBeInTheDocument();
      expect(screen.getByText(/Residual clustering is concentrated in the river corridor/i)).toBeInTheDocument();
      expect(screen.getByText(/Packet packet-2026-001 prepared with 3 governed sections./i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Open TerraAtlas/i }));
    expect(activateModuleMock).toHaveBeenCalledWith('suite-atlas', { source: 'desktop' });
  });

  it('keeps the 39-county posture model explicit with only Benton runtime-enabled', () => {
    expect(WASHINGTON_COUNTY_RUNTIME_POSTURES).toHaveLength(39);

    const benton = getCountyRuntimePosture('benton');
    const nonBenton = WASHINGTON_COUNTY_RUNTIME_POSTURES.filter(
      (posture) => posture.countySlug !== 'benton'
    );

    expect(benton.runtimeMode).toBe('runtime-enabled');
    expect(benton.runtimeActionsAllowed).toBe(true);
    expect(benton.canonicalImportAllowed).toBe('not_applicable');
    expect(benton.sourcePosture).toMatch(/already runtime-enabled/i);
    expect(nonBenton).toHaveLength(38);
    expect(nonBenton.every((posture) => posture.runtimeMode === 'source-provenance-onboarding-intake')).toBe(true);
    expect(nonBenton.every((posture) => posture.runtimeActionsAllowed === false)).toBe(true);
    expect(nonBenton.every((posture) => posture.canonicalImportAllowed === false)).toBe(true);
  });

  it('shows County Data Intake boundary and blocks non-Benton runtime actions', async () => {
    render(
      <CountyEmployeeWorkspace
        countyId='yakima'
        employeeName='Casey Operator'
        employeeRole='assessor'
        department='Assessor'
      />
    );

    const boundary = screen.getByTestId('county-runtime-posture-boundary');
    expect(boundary).toHaveAttribute('data-county-slug', 'yakima');
    expect(boundary).toHaveAttribute('data-runtime-mode', 'source-provenance-onboarding-intake');
    expect(boundary).toHaveAttribute('data-runtime-actions-allowed', 'false');
    expect(boundary).toHaveAttribute('data-canonical-import-allowed', 'false');
    expect(within(boundary).getByText(/County Data Intake/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Runtime actions are blocked for this county/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(invokeToolMock).not.toHaveBeenCalled();
    });

    const atlasButton = screen.getByRole('button', { name: /Open TerraAtlas/i });
    expect(atlasButton).toBeDisabled();
    fireEvent.click(atlasButton);
    expect(activateModuleMock).not.toHaveBeenCalled();
  });
});
