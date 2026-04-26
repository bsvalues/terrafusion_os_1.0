/**
 * Consciousness backend truth contract
 *
 * @vitest-environment jsdom
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

describe('Consciousness backend truth contract', () => {
  it('ConsciousnessController no longer reports synthetic healthy status', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/ConsciousnessController.cs');

    expect(src).not.toContain('agentsActive = 1008');
    expect(src).not.toContain('quantumEnabled = true');
    expect(src).toContain('status = "unavailable"');
    expect(src).toContain('Governed consciousness surface unavailable');
  });

  it('QuantumConsciousnessController no longer exposes fake live parameter tuning', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/QuantumConsciousnessController.cs');

    expect(src).not.toContain('1008');
    expect(src).not.toContain('OptimizationFactor');
    expect(src).not.toContain('PredictiveImpactService');
    expect(src).toContain('Governed quantum-consciousness surface unavailable');
    expect(src).toContain('StatusCodes.Status501NotImplemented');
  });

  it('AI-side ConsciousnessService no longer returns mock consciousness data', () => {
    const src = readRepoFile('backend/src/TerraFusion.AI/Services/ConsciousnessService.cs');

    expect(src).not.toContain('mockData');
    expect(src).not.toContain('Random');
    expect(src).not.toContain('1008');
    expect(src).toContain('Task.FromException');
    expect(src).toContain('synthetic AI-side ConsciousnessService has been retired');
  });

  it('LegacyConsciousnessService reports fallback mode instead of operational success defaults', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/LegacyConsciousnessService.cs');

    expect(src).toContain('legacy_fallback');
    expect(src).toContain('governed_contract_available');
    expect(src).toContain('Legacy fallback does not execute governed consciousness operations');
    expect(src).toContain('IsOperational = false');
  });

  it('ConsciousnessService no longer reports disabled quantum health as healthy', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/ConsciousnessService.cs');

    expect(src).toContain('{ "QuantumConsciousness", 0.0 }');
    expect(src).toContain('QuantumConsciousness unavailable: circular dependency unresolved.');
    expect(src).toContain('{ "SystemCapacity", "Mesh-only" }');
  });

  it('ConsciousnessTelemetryService reports unavailable telemetry instead of synthetic metrics', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/ConsciousnessTelemetryService.cs');

    expect(src).not.toContain('OptimizationFactor = 949');
    expect(src).not.toContain('ActiveAgents = 1008');
    expect(src).not.toContain('UptimePercentage = 99.99');
    expect(src).toContain('Governed consciousness telemetry unavailable');
    expect(src).toContain('["GovernedContractAvailable"] = false');
  });

  it('HybridConsciousnessManager no longer claims fake quantum readiness or Benton stub counts', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/HybridConsciousnessManager.cs');

    expect(src).not.toContain('LegacyAgentsActive = 1008');
    expect(src).not.toContain('QuantumAgentsActive = 89_247');
    expect(src).not.toContain('Benton County Hybrid consciousness management initialized at championship level');
    expect(src).toContain('Governed quantum-consciousness lane unavailable; hybrid manager remains session-backed only.');
    expect(src).toContain('SwarmInitialized = false');
    expect(src).toContain('GovernedQuantumLaneAvailable');
  });

  it('ConsciousnessOrchestrationController no longer exposes synthetic core-consciousness endpoints', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Controllers/ConsciousnessOrchestrationController.cs');

    expect(src).toContain('Governed core-consciousness surface unavailable');
    expect(src).not.toContain('Supports 50,000+ AI agents with real-time monitoring');
    expect(src).not.toContain('OptimizationCompleted');
  });

  it('Legacy consciousness host controllers report unavailable quantum/Benton demo lanes honestly', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Controllers/ConsciousnessControllers.cs');

    expect(src).toContain('Governed quantum-consciousness surface unavailable');
    expect(src).toContain('Governed Benton citizen-services lane unavailable');
    expect(src).toContain('Only the Benton property-assessment lane is currently governed.');
    expect(src).not.toContain('Message = "TerraFusion OS - Government. Transcended."');
    expect(src).toContain('Governed quantum-security surface unavailable');
  });

  it('Consciousness DTO defaults no longer seed fake healthy or 1008-agent state', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/DTOs/ConsciousnessDTOs.cs');

    expect(src).not.toContain('ActiveAgents { get; set; } = 1008');
    expect(src).toContain('public bool IsHealthy { get; set; } = false;');
    expect(src).toContain('public required string Status { get; set; } = "Unavailable";');
    expect(src).toContain('public required int MaxCapacity { get; set; } = 0;');
  });

  it('AILayerMeshController no longer exposes synthetic mesh success routes', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Controllers/AILayerMeshController.cs');

    expect(src).toContain('Governed AI Layer Mesh surface unavailable');
    expect(src).not.toContain('Validation rings achieved consensus');
    expect(src).not.toContain('Government. Transcended.');
    expect(src).not.toContain('counties federated!');
  });

  it('TerraFusion.Consciousness host no longer advertises operational million-agent capability', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Program.cs');

    expect(src).toContain('Status = "Partial"');
    expect(src).toContain('BentonPropertyAssessment = true');
    expect(src).toContain('QuantumConsciousness = false');
    expect(src).toContain('compatibility host started');
    expect(src).not.toContain('Description = "Million-Agent Quantum Consciousness Orchestration"');
  });

  it('QuantumConsciousnessOrchestrator is now a degraded compatibility implementation, not a synthetic runtime', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/QuantumConsciousnessOrchestrator.cs');

    expect(src).toContain('Governed quantum-consciousness lane unavailable; compatibility orchestrator returning degraded status only.');
    expect(src).not.toContain('CurrentAgentCount = 1008');
    expect(src).not.toContain('Million-agent system initialization');
    expect(src).not.toContain('ActiveAgents = 1008');
  });

  it('QuantumConsciousnessServices shim no longer manufactures random agents or mock research artifacts', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/QuantumConsciousnessServices.cs');

    expect(src).not.toContain('var rng = new Random()');
    expect(src).not.toContain('Math.Min(limit, 1008)');
    expect(src).not.toContain('Mock visualization data');
    expect(src).not.toContain('ChampionshipLatency = 8.5m');
    expect(src).not.toContain('System load will increase by 12% in next hour');
    expect(src).not.toContain('Strong quantum coherence observed');
    expect(src).not.toContain('Synchronized consciousness patterns detected across workspaces');
    expect(src).toContain('Governed core quantum-consciousness shim unavailable; compatibility data only.');
    expect(src).toContain('Governed statistical analysis unavailable');
    expect(src).toContain('Governed elite-performance shim unavailable; no measured optimization telemetry exists.');
    expect(src).toContain('Governed cross-workspace research bridge unavailable; compatibility payload only.');
  });

  it('MultiCountyDataService no longer invents federated counties, health, or sync metrics', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/MultiCountyDataService.cs');

    expect(src).not.toContain('counties federated! Government. Transcended!');
    expect(src).not.toContain('Random.Shared.Next(10000, 50000)');
    expect(src).not.toContain('PrivacyCompliance:1.0');
    expect(src).not.toContain('Status = "Operational"');
    expect(src).toContain('Governed multi-county federation unavailable; compatibility surface only.');
    expect(src).toContain('MeshStatus = "Unavailable"');
    expect(src).toContain('HealthStatus = "Unavailable"');
    expect(src).toContain('Success = false');
  });

  it('AILayerMeshOrchestrator operator-facing contract no longer reports fake consensus or excellent health', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/AILayerMeshOrchestrator.cs');

    expect(src).not.toContain('Validation rings achieved consensus! Government. Transcended!');
    expect(src).not.toContain('ValidationRingConsensus = 0.95, // Mock consensus');
    expect(src).not.toContain('HealthStatus = overallHealth >= 0.95m ? "Excellent"');
    expect(src).not.toContain('Status = layerStatuses.Values.All(s => s == "Operational") ? "Fully Operational" : "Partially Operational"');
    expect(src).not.toContain('return 50000; // Default for now');
    expect(src).not.toContain('ValidationsPerMinute = 120');
    expect(src).not.toContain('TotalExecutionTime", Random.Shared.Next(200, 1000)');
    expect(src).not.toContain('OverallScore", 0.95m');
    expect(src).toContain('Governed AI Layer Mesh orchestration unavailable; compatibility surface only.');
    expect(src).toContain('HealthStatus = "Unavailable"');
    expect(src).toContain('Status = "Unavailable"');
    expect(src).toContain('ConsensusLevel = 0.0');
  });

  it('BentonCountyDataService keeps property reads but no longer invents citizen/emergency data or sync counts', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/BentonCountyDataService.cs');

    expect(src).not.toContain('Mock citizen service request');
    expect(src).not.toContain('Mock emergency response record');
    expect(src).not.toContain('return ("CitizenServices", 3247, 198, 45);');
    expect(src).not.toContain('return ("EmergencyResponse", 142, 23, 8);');
    expect(src).not.toContain('Connected to all Benton County data sources');
    expect(src).toContain('Governed Benton County service is partial: property assessment read lane available; citizen services, emergency response, and cross-source sync unavailable.');
    expect(src).toContain('Governed Benton citizen-services lane unavailable; no backed entity or source pipeline exists.');
    expect(src).toContain('Governed Benton emergency-response lane unavailable; no backed entity or source pipeline exists.');
    expect(src).toContain('Governed Benton cross-source sync unavailable; no end-to-end source pipeline exists.');
  });

  it('TerraFusionTranscendenceEngine no longer reports championship or infinite-scale success states', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/TerraFusionTranscendenceEngine.cs');

    expect(src).not.toContain('Government. Transcended. - Infinite scalability activated with quantum precision.');
    expect(src).not.toContain('TranscendenceLevel = "CHAMPIONSHIP"');
    expect(src).not.toContain('["QuantumOptimization"] = "FACTOR_949_APPLIED"');
    expect(src).not.toContain('["BrandCompliance"] = "GOVERNMENT_TRANSCENDED"');
    expect(src).not.toContain('AUTONOMOUS_HEALING_ACTIVE');
    expect(src).not.toContain('InfiniteScaleActive"] = true');
    expect(src).toContain('Governed transcendence engine unavailable; compatibility surface only.');
    expect(src).toContain('TranscendenceLevel = "Unavailable"');
    expect(src).toContain('InfiniteScaleReady = false');
    expect(src).toContain('TotalActiveAgents = 0');
  });

  it('UltimateEliteMonitoringService no longer claims transcendent monitoring, optimization, or healing success', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/UltimateEliteMonitoringService.cs');

    expect(src).not.toContain('Government. Transcended. - Infinite scalability with autonomous healing protocols');
    expect(src).not.toContain('ChampionshipCompliance = true');
    expect(src).not.toContain('GovernmentTranscended = true');
    expect(src).not.toContain('SuccessScore = 0.995m');
    expect(src).not.toContain('PerformanceScore = 0.997m');
    expect(src).not.toContain('InfiniteScaleReady = true');
    expect(src).toContain('Governed ultimate monitoring surface unavailable; compatibility surface only.');
    expect(src).toContain('Success = false');
    expect(src).toContain('ChampionshipCompliant = false');
    expect(src).toContain('AutonomousSuccess = false');
  });
});
