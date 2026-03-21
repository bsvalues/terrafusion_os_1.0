import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { CountyEmployeeWorkspace } from '../../pages/CountyEmployeeWorkspace';

vi.mock('../../components/ai/AIInsightsPanel', () => ({
  AIInsightsPanel: () => <div data-testid='ai-insights-panel'>AI Insights Panel</div>,
}));

vi.mock('../../components/ai/AIWorkflowAutomation', () => ({
  AIWorkflowAutomation: () => <div data-testid='ai-workflows-panel'>AI Workflow Automation</div>,
}));

vi.mock('../../components/dashboards/CountyEmployeeDashboard', () => ({
  CountyEmployeeDashboard: () => <div data-testid='county-employee-dashboard'>County Employee Dashboard</div>,
}));

vi.mock('../../components/terrafusion-design-system', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
  Button: ({ children, onClick, className, disabled }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) => (
    <button type='button' onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('../../hooks/useAIAssistant', () => ({
  useAIAssistant: () => ({
    messages: [],
    isProcessing: false,
    swarmStatus: {
      countyId: 'benton',
      activeAgents: 1008,
      swarmActivity: 0.72,
      quantumOptimizationFactor: 949,
      responseTime: 184,
      accuracyScore: 0.995,
      consciousnessLevel: 'stable',
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
  expect(screen.getAllByText(/1,008 agents reported/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Reported activity:/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Status Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Workspace status snapshot/i)).toBeInTheDocument();
    expect(screen.queryByText(/^AI Swarm:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Consciousness/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Agents Active/i)).not.toBeInTheDocument();
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
});