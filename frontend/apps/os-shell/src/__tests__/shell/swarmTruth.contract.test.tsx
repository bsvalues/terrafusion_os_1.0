/**
 * Swarm truth contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AIOrchestrationDashboard } from '../../components/ai-orchestration/AIOrchestrationDashboard';

const SRC_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(SRC_ROOT, '../../../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function readRepo(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

describe('Swarm static truth contract', () => {
  it('AISwarmManagementPanel uses the assistant swarm status route instead of synthetic orchestration routes', () => {
    const src = readSrc('components/research/AISwarmManagementPanel.tsx');
    expect(src).toContain('/AIAssistant/swarm-status/');
    expect(src).toContain("source: 'AIAssistant/swarm-status'");
    expect(src).not.toContain('/api/ai-orchestration/');
    expect(src).not.toContain('50,000+ government AI agents');
  });

  it('ResearchPortal does not seed fake swarm counts in session state', () => {
    const src = readSrc('components/research/ResearchPortal.tsx');
    expect(src).not.toContain('activeAgents: 50000');
    expect(src).not.toContain('50K+ AI agent orchestration');
    expect(src).not.toContain('optimizationFactor: 949');
    expect(src).not.toContain('quantumCoherence: 0.995');
    expect(src).toContain("availability: 'unavailable'");
    expect(src).toContain('County-scoped swarm health and evidence status');
    expect(src).not.toContain('Real-time AI consciousness parameter control');
    expect(src).toContain('Operator-managed parameter review with no implied live AI execution');
  });

  it('ResearchContext defaults do not fabricate swarm scale or quantum factors', () => {
    const src = readSrc('context/ResearchContext.tsx');
    expect(src).not.toContain('optimizationFactor: 949');
    expect(src).not.toContain('totalAgents: 50000');
    expect(src).not.toContain('Math.random()');
    expect(src).toContain('quantumCoherence: 0');
    expect(src).toContain("coordinationMode: 'network'");
    expect(src).toContain("selectedVariables: ['AssessedValue', 'SalePrice']");
  });

  it('AIAssistantController health route no longer advertises port or 949 factor claims', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/AIAssistantController.cs');
    expect(src).not.toContain('consciousness_engine_port');
    expect(src).not.toContain('quantum_optimization_factor');
    expect(src).toContain("mode = \"compatibility\"");
  });

  it('AIAssistantPanel no longer claims live consciousness-engine connectivity', () => {
    const src = readSrc('components/ai/AIAssistantPanel.tsx');
    expect(src).toContain('AI Assistant Compatibility Mode');
    expect(src).not.toContain('Connected to TerraFusion Consciousness Engine');
    expect(src).not.toContain('Port 3004');
  });

  it('AIAssistantService no longer carries fabricated analysis or workflow completion prose', () => {
    const src = readRepo('backend/src/TerraFusion.AI/Services/AIAssistantService.cs');
    expect(src).not.toContain('Property Analysis Complete');
    expect(src).not.toContain('Workflow Optimization Ready');
    expect(src).not.toContain('Compliance Check Complete');
    expect(src).toContain('no governed AI execution or evidence-backed analysis is available');
    expect(src).toContain('Governed property analysis is unavailable on api/AIAssistant/analyze-property.');
  });

  it('AIOrchestrationDashboard no longer fetches synthetic orchestration endpoints', () => {
    const src = readSrc('components/ai-orchestration/AIOrchestrationDashboard.tsx');
    expect(src).toContain('ai-orchestration-dashboard-unavailable');
    expect(src).toContain('/api/ai/orchestration/*');
    expect(src).not.toContain("fetch('/api/ai/orchestration/status')");
    expect(src).not.toContain("fetch('/api/ai/orchestration/agents/performance')");
  });

  it('FederationDashboard uses governed county status instead of synthetic swarm topology', () => {
    const src = readSrc('applications/federation-dashboard/FederationDashboard.tsx');
    expect(src).toContain('federation-dashboard-guardrail');
    expect(src).toContain('/AIAssistant/swarm-status/');
    expect(src).toContain('No governed multi-county federation registry is connected');
    expect(src).not.toContain("fetch('/api/swarm/status')");
    expect(src).not.toContain('Planned multi-county deployment topology');
  });

  it('useAgentSwarmStatus no longer depends on the retired consciousness swarm route', () => {
    const src = readSrc('hooks/useAgentSwarmStatus.ts');
    expect(src).toContain('/AIAssistant/swarm-status/');
    expect(src).not.toContain('VITE_CONSCIOUSNESS_URL');
    expect(src).not.toContain('/api/swarm/status');
  });

  it('useSwarmLive now polls governed county assistant status instead of the retired swarm hub', () => {
    const src = readSrc('hooks/useSwarmLive.ts');
    expect(src).toContain('/AIAssistant/swarm-status/');
    expect(src).not.toContain('VITE_CONSCIOUSNESS_URL');
    expect(src).not.toContain('@microsoft/signalr');
    expect(src).toContain("source: 'polled'");
  });

  it('backend validation and startup banners no longer advertise legacy swarm endpoints', () => {
    const validatorSrc = readRepo('backend/src/TerraFusion.API/Services/EliteEndpointValidationService.cs');
    const programSrc = readRepo('backend/src/TerraFusion.API/Program.cs');

    expect(validatorSrc).toContain('/api/AIAssistant/health');
    expect(validatorSrc).not.toContain('/api/swarm/status');
    expect(validatorSrc).not.toContain('/api/swarm/modules');
    expect(programSrc).toContain('/api/AIAssistant/health');
    expect(programSrc).toContain('/api/AIAssistant/swarm-status/{countyId}');
    expect(programSrc).not.toContain('/api/swarm/status');
    expect(programSrc).not.toContain('1,008 agents');
  });

  it('AISwarmOrchestrator no longer points at localhost demo services', () => {
    const src = readRepo('backend/src/TerraFusion.AI/Services/AISwarmOrchestrator.cs');
    expect(src).toContain('not a governed runtime dependency');
    expect(src).not.toContain('http://localhost:8001');
    expect(src).not.toContain('http://localhost:8002');
    expect(src).not.toContain('Supreme Commander Claude');
  });
});

describe('Swarm rendered truth behavior', () => {
  it('renders AIOrchestrationDashboard as unavailable instead of operational', () => {
    render(<AIOrchestrationDashboard />);

    expect(screen.getByTestId('ai-orchestration-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/AI Orchestration Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Telemetry withheld/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimization disabled/i)).toBeInTheDocument();
    expect(screen.queryByText(/Advanced swarm intelligence and optimization/i)).not.toBeInTheDocument();
  });
});
