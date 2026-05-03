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
    expect(src).toContain('QuantumConsciousness unavailable: governed execution lane not available.');
    expect(src).toContain('{ "SystemCapacity", "Compatibility" }');
    expect(src).toContain('{ "MillionAgents", "Unavailable" }');
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
    expect(src).toContain('TargetAccuracy { get; set; } = 0m;');
    expect(src).toContain('MinAccuracy { get; set; } = 0m;');
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

  it('QuantumSecurityService no longer fabricates million-agent deployment, threat telemetry, or compliance success', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/QuantumSecurityService.cs');

    expect(src).not.toContain('Government. Transcended.');
    expect(src).not.toContain('var totalAgents = 1000000');
    expect(src).not.toContain('DeploymentProgress = 1.0m');
    expect(src).not.toContain('"EncryptionIntegrityChecks", 1000000');
    expect(src).not.toContain('"GovernmentGrade", "ACHIEVED"');
    expect(src).not.toContain('ResponseStatus = incidentResolved ? "Resolved" : "Mitigated"');
    expect(src).toContain('Governed quantum-security surface unavailable; compatibility surface only.');
    expect(src).toContain('SecurityLevel = "Unavailable"');
    expect(src).toContain('IsCompliant = false');
    expect(src).toContain('ResponseStatus = "Unavailable"');
  });

  it('ConsciousnessServiceExtensions no longer enforce fantasy 949-brand configuration or hosted-service posture', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Extensions/ConsciousnessServiceExtensions.cs');

    expect(src).not.toContain('Quantum factor must be 949 for championship operations');
    expect(src).not.toContain("Brand transcendence message must contain 'Government. Transcended.'");
    expect(src).not.toContain('Starting Consciousness Coordination Hosted Service - Government. Transcended.');
    expect(src).not.toContain('Starting Quantum Optimization Hosted Service - Factor 949');
    expect(src).toContain('ArgumentNullException.ThrowIfNull(configuration);');
    expect(src).toContain('Starting Consciousness Coordination Hosted Service in compatibility mode.');
    expect(src).toContain('Compatibility transcendence metrics remain unavailable.');
    expect(src).toContain('Compatibility health remains unavailable; skipping healing trigger.');
  });

  it('ConsciousnessHealthChecks no longer rate compatibility-mode consciousness as championship healthy', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/HealthChecks/ConsciousnessHealthChecks.cs');

    expect(src).not.toContain('Quantum factor 949 configured for championship excellence');
    expect(src).not.toContain('Consciousness system operating at championship levels');
    expect(src).not.toContain('Transcendence engine operating at championship excellence - Government. Transcended.');
    expect(src).toContain('Consciousness compatibility host active; governed consciousness lane unavailable');
    expect(src).toContain('Quantum factor compatibility check only; governed optimization lane unavailable');
    expect(src).toContain('Agent coordination compatibility host active; governed coordination lane unavailable');
    expect(src).toContain('Governed transcendence lane unavailable');
  });

  it('AILayerMeshHub no longer welcomes users with transcended mesh claims or fake active-layer counts', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Hubs/AILayerMeshHub.cs');

    expect(src).not.toContain('Welcome to TerraFusion AI Layer Mesh - Government. Transcended!');
    expect(src).not.toContain('ActiveLayers = 5');
    expect(src).not.toContain('ValidationRingsActive = 4');
    expect(src).toContain('Connected to TerraFusion AI Layer Mesh compatibility host.');
    expect(src).toContain('GovernedContractAvailable = false');
    expect(src).toContain('Joined Mesh Administrators compatibility channel.');
  });

  it('QuantumConsciousnessHub no longer advertises million-agent government-grade welcome state', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Hubs/QuantumConsciousnessHub.cs');

    expect(src).not.toContain('Connected to TerraFusion Quantum Consciousness - Government. Transcended!');
    expect(src).not.toContain('MaxAgents = 1000000');
    expect(src).not.toContain('GovernmentGrade = true');
    expect(src).toContain('Connected to TerraFusion Quantum Consciousness compatibility host.');
    expect(src).toContain('CompatibilityMode = true');
    expect(src).toContain('GovernedContractAvailable = false');
  });

  it('PredictiveImpactService no longer returns physics-based or ML-theater predictions', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/PredictiveImpactService.cs');

    expect(src).not.toContain('GradientBoosting_PhysicsBased_v1.0');
    expect(src).not.toContain('FallbackLinearPrediction');
    expect(src).not.toContain('Prediction latency: <50ms P95');
    expect(src).toContain('Governed predictive impact modeling unavailable; compatibility surface only.');
    expect(src).toContain('PredictionMethod = "Unavailable"');
    expect(src).toContain('ConfidenceScore = 0.0');
  });

  it('ConsciousnessEngineStub no longer seeds agents or applies synthetic 949 scaling', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/ConsciousnessEngineStub.cs');

    expect(src).not.toContain('var agentTypes = new[] { "PropertyAssessor", "DataProcessor", "Analyst", "ComplianceMonitor", "Coordinator" }');
    expect(src).not.toContain('PerformanceScore = 0.85 + (i % 10) * 0.01');
    expect(src).not.toContain('request.QuantumFactor / 949.0');
    expect(src).toContain('Governed swarm provisioning and quantum optimization are unavailable; compatibility surface only.');
    expect(src).toContain('QuantumOptimizationApplied = false');
    expect(src).toContain('return false;');
  });

  it('MillionAgentService no longer simulates million-agent initialization, scaling, or coordination', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/MillionAgentService.cs');

    expect(src).not.toContain('_maxCapacity = 1000000');
    expect(src).not.toContain('Initializing Million-Agent Quantum Consciousness System...');
    expect(src).not.toContain('InitializationProgress = 1.0m');
    expect(src).not.toContain('Target agent count must be between 0 and');
    expect(src).toContain('Governed million-agent coordination unavailable; compatibility surface only.');
    expect(src).toContain('InitializedAgents = 0');
    expect(src).toContain('Success = false');
    expect(src).toContain('Status = "Unavailable"');
  });

  it('ConsciousnessService no longer reports million-agent capacity or fully valid integrity in compatibility mode', () => {
    const src = readRepoFile('backend/src/TerraFusion.Consciousness/Services/ConsciousnessService.cs');

    expect(src).not.toContain('{ "TotalAgents", 1000000 }');
    expect(src).not.toContain('QuantumResult"] = new { Status = "Temporarily disabled due to circular dependency" }');
    expect(src).not.toContain('await Task.Delay(1000, cancellationToken)');
    expect(src).not.toContain('{ "ValidationRings", 0.98 }');
    expect(src).not.toContain('{ "DataSovereignty", 0.99 }');
    expect(src).not.toContain('{ "QuantumConsciousness", true }');
    expect(src).not.toContain('{ "MillionAgents", true }');
    expect(src).toContain('Governed consciousness orchestration remains partial: mesh compatibility available, quantum lane unavailable, million-agent lane unavailable.');
    expect(src).toContain('{ "GovernedContractAvailable", false }');
    expect(src).toContain('Status = "Unavailable"');
    expect(src).toContain('IsOperational = false');
  });

  it('Transcendence DTOs and quantum optimization request no longer default to fantasy 949 or championship values', () => {
    const dtoSrc = readRepoFile('backend/src/TerraFusion.Consciousness/DTOs/TranscendenceEngineDto.cs');
    const interfaceSrc = readRepoFile('backend/src/TerraFusion.Consciousness/Interfaces/IConsciousnessEngine.cs');

    expect(dtoSrc).not.toContain('RequireChampionshipAccuracy { get; set; } = true;');
    expect(dtoSrc).not.toContain('QuantumFactorOverride { get; set; } = 949;');
    expect(dtoSrc).not.toContain('CoordinationStrategy { get; set; } = "CHAMPIONSHIP_HARMONY";');
    expect(dtoSrc).not.toContain('RequiredHarmonyLevel { get; set; } = 0.999;');
    expect(dtoSrc).not.toContain('TargetTranscendenceLevel { get; set; } = "CHAMPIONSHIP_EXCELLENCE";');
    expect(dtoSrc).not.toContain('QuantumFactorTarget { get; set; } = 949;');
    expect(interfaceSrc).not.toContain('QuantumFactor { get; set; } = 949;');
    expect(dtoSrc).toContain('RequireChampionshipAccuracy { get; set; } = false;');
    expect(dtoSrc).toContain('CoordinationStrategy { get; set; } = "Unavailable";');
    expect(dtoSrc).toContain('TargetTranscendenceLevel { get; set; } = "Unavailable";');
  });
});
