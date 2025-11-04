import OpenAI from 'openai';
import type { InfrastructureAsset, ThreatAssessment, SimulationRequest } from '@shared/schema';

let openai: OpenAI | null = null;

// Initialize OpenAI client only if API key is available
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✓ OpenAI ICSF simulation client initialized successfully');
  } catch (error) {
    console.warn('⚠️  OpenAI ICSF simulation client initialization failed:', error);
  }
} else {
  console.log('ℹ️  OpenAI API key not found for ICSF simulation - using fallback mode');
}

interface SimulationResult {
  simulationId: string;
  scenarioName: string;
  status: 'completed' | 'failed' | 'partial';
  executionTime: number;
  results: {
    threatAnalysis: ThreatAssessment[];
    cascadeEffects: {
      assetId: string;
      impactLevel: 'low' | 'medium' | 'high' | 'critical';
      affectedSystems: string[];
      recoveryTime: number;
    }[];
    mitigationRecommendations: string[];
    riskScore: number;
    confidenceLevel: number;
  };
  metadata: {
    assetsAnalyzed: number;
    threatsIdentified: number;
    simulationComplexity: 'simple' | 'moderate' | 'complex';
  };
}

interface RealTimeMetrics {
  assetId: string;
  timestamp: string;
  operationalStatus: 'operational' | 'degraded' | 'offline' | 'maintenance';
  performanceMetrics: {
    efficiency: number;
    loadCapacity: number;
    responseTime: number;
    errorRate: number;
  };
  environmentalFactors: {
    weather: string;
    temperature: number;
    seismicActivity: number;
  };
  alerts: string[];
}

class ICSFSimulationEngine {
  private activeSimulations = new Map<string, SimulationRequest>();
  private realTimeData = new Map<string, RealTimeMetrics>();

  async executeSimulation(request: SimulationRequest, assets: InfrastructureAsset[]): Promise<SimulationResult> {
    const startTime = Date.now();
    this.activeSimulations.set(request.simulationId, request);

    try {
      // Initialize simulation environment
      const simulationEnvironment = await this.initializeSimulationEnvironment(request, assets);
      
      // Run threat detection analysis
      const threatAnalysis = await this.performThreatAnalysis(assets, request.simulationParameters);
      
      // Analyze cascade effects
      const cascadeEffects = await this.analyzeCascadeEffects(assets, threatAnalysis);
      
      // Generate mitigation recommendations
      const mitigationRecommendations = await this.generateMitigationRecommendations(threatAnalysis, cascadeEffects);
      
      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(threatAnalysis, cascadeEffects);
      
      const executionTime = Date.now() - startTime;
      
      return {
        simulationId: request.simulationId,
        scenarioName: request.scenarioName,
        status: 'completed',
        executionTime,
        results: {
          threatAnalysis,
          cascadeEffects,
          mitigationRecommendations,
          riskScore,
          confidenceLevel: 0.87
        },
        metadata: {
          assetsAnalyzed: assets.length,
          threatsIdentified: threatAnalysis.length,
          simulationComplexity: this.determineComplexity(assets, request)
        }
      };
    } catch (error) {
      console.error('Simulation execution failed:', error);
      return this.generateFailedSimulation(request, error);
    } finally {
      this.activeSimulations.delete(request.simulationId);
    }
  }

  private async initializeSimulationEnvironment(request: SimulationRequest, assets: InfrastructureAsset[]) {
    // Set up simulation parameters and constraints
    const parameters = request.simulationParameters as any || {};
    const environment = {
      timeHorizon: request.durationHours,
      weatherConditions: parameters.weather || 'normal',
      operationalConstraints: parameters.constraints || {},
      emergencyProtocols: parameters.protocols || []
    };

    // Initialize real-time monitoring for simulation
    for (const asset of assets) {
      await this.initializeAssetMonitoring(asset);
    }

    return environment;
  }

  private async performThreatAnalysis(assets: InfrastructureAsset[], parameters: any): Promise<ThreatAssessment[]> {
    const threatAnalysis = [];

    for (const asset of assets) {
      const threats = await this.analyzeAssetThreats(asset, parameters);
      threatAnalysis.push(...threats);
    }

    // Use AI to enhance threat detection
    const enhancedThreats = await this.enhanceThreatAnalysisWithAI(threatAnalysis, assets);
    
    return enhancedThreats;
  }

  private async analyzeAssetThreats(asset: InfrastructureAsset, parameters: any): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];
    const currentMetrics = asset.realTimeMetrics as any || {};

    // Analyze operational threats
    if (currentMetrics.efficiency < 0.7) {
      threats.push({
        id: `threat-${asset.id}-efficiency`,
        threatId: `efficiency-degradation-${Date.now()}`,
        assetId: asset.assetId,
        threatType: 'Operational Degradation',
        severity: 'moderate',
        probability: '0.75',
        impactAssessment: {
          economicImpact: 'Reduced operational efficiency leading to service disruption',
          publicSafety: 'Minimal immediate risk',
          environmentalImpact: 'None expected',
          estimatedDowntime: 4,
          affectedPopulation: 1500
        },
        mitigationStrategies: ['Preventive maintenance', 'Load redistribution', 'Backup activation'],
        detectedAt: new Date(),
        requiresImmediateAction: false,
        automatedResponseTriggered: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Analyze environmental threats
    if (parameters.weather === 'severe' || parameters.seismicRisk > 0.3) {
      threats.push({
        id: `threat-${asset.id}-environmental`,
        threatId: `environmental-risk-${Date.now()}`,
        assetId: asset.assetId,
        threatType: 'Environmental Hazard',
        severity: parameters.seismicRisk > 0.6 ? 'critical' : 'high',
        probability: String(parameters.seismicRisk || 0.4),
        impactAssessment: {
          economicImpact: 'Potential infrastructure damage and service interruption',
          publicSafety: 'High risk to public safety',
          environmentalImpact: 'Possible contamination or resource damage',
          estimatedDowntime: 24,
          affectedPopulation: 5000
        },
        mitigationStrategies: ['Emergency protocols activation', 'Structural reinforcement', 'Evacuation procedures'],
        detectedAt: new Date(),
        requiresImmediateAction: parameters.seismicRisk > 0.6,
        automatedResponseTriggered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Analyze security threats
    if (currentMetrics.unauthorizedAccess || parameters.securityLevel === 'elevated') {
      threats.push({
        id: `threat-${asset.id}-security`,
        threatId: `security-breach-${Date.now()}`,
        assetId: asset.assetId,
        threatType: 'Security Breach',
        severity: 'high',
        probability: '0.3',
        impactAssessment: {
          economicImpact: 'Data compromise and system disruption',
          publicSafety: 'Potential service disruption',
          environmentalImpact: 'None expected',
          estimatedDowntime: 8,
          affectedPopulation: 2500
        },
        mitigationStrategies: ['Security protocols activation', 'System isolation', 'Forensic analysis'],
        detectedAt: new Date(),
        requiresImmediateAction: true,
        automatedResponseTriggered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return threats;
  }

  private async enhanceThreatAnalysisWithAI(threats: ThreatAssessment[], assets: InfrastructureAsset[]): Promise<ThreatAssessment[]> {
    if (threats.length === 0) return threats;

    const prompt = `
    Analyze these infrastructure threats for comprehensive risk assessment:
    
    Assets: ${assets.map(a => `${a.name} (${a.assetType})`).join(', ')}
    Detected Threats: ${threats.map(t => `${t.threatType} - ${t.severity}`).join(', ')}
    
    Enhance the threat analysis by:
    1. Identifying potential cascade effects between systems
    2. Suggesting additional threat vectors that may not be immediately obvious
    3. Recommending priority response actions
    4. Assessing overall system resilience
    
    Focus on realistic infrastructure interdependencies and failure modes.
    `;

    try {
      // If OpenAI client is not available, use fallback mode
      if (!openai) {
        console.log('Using fallback threat analysis - OpenAI not available');
        return threats;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert infrastructure security analyst specializing in critical system threat assessment and emergency response planning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      // Parse AI insights and enhance existing threats
      const aiAnalysis = response.choices[0]?.message?.content || '';
      
      // Add AI insights to threat assessments
      threats.forEach(threat => {
        const impactData = threat.impactAssessment as any || {};
        if (!impactData.aiEnhancement) {
          threat.impactAssessment = {
            ...impactData,
            aiEnhancement: aiAnalysis.substring(0, 200) // Add relevant portion
          };
        }
      });

      return threats;
    } catch (error) {
      console.error('AI threat enhancement failed:', error);
      return threats;
    }
  }

  private async analyzeCascadeEffects(assets: InfrastructureAsset[], threats: ThreatAssessment[]) {
    const cascadeEffects = [];

    for (const threat of threats) {
      const sourceAsset = assets.find(a => a.assetId === threat.assetId);
      if (!sourceAsset) continue;

      // Find dependent assets
      const sourceDeps = Array.isArray(sourceAsset.dependencies) ? sourceAsset.dependencies : [];
      const dependentAssets = assets.filter(a => {
        const assetDeps = Array.isArray(a.dependencies) ? a.dependencies : [];
        return sourceDeps.includes(a.assetId) || assetDeps.includes(sourceAsset.assetId);
      });

      for (const dependent of dependentAssets) {
        const impactLevel = this.calculateCascadeImpact(threat, sourceAsset, dependent);
        const recoveryTime = this.estimateRecoveryTime(impactLevel, dependent.assetType);

        cascadeEffects.push({
          assetId: dependent.assetId,
          impactLevel,
          affectedSystems: this.identifyAffectedSystems(dependent, impactLevel),
          recoveryTime
        });
      }
    }

    return cascadeEffects;
  }

  private calculateCascadeImpact(threat: ThreatAssessment, source: InfrastructureAsset, target: InfrastructureAsset): 'low' | 'medium' | 'high' | 'critical' {
    let impactScore = 0;

    // Base impact from threat severity
    const severityScore = {
      'minimal': 1, 'low': 2, 'moderate': 3, 'high': 4, 'critical': 5, 'catastrophic': 6
    }[threat.severity] || 3;

    impactScore += severityScore;

    // Add criticality factor
    if (target.criticalityScore) {
      impactScore += parseFloat(target.criticalityScore) / 2;
    }

    // Add dependency factor
    const sourceDeps = Array.isArray(source.dependencies) ? source.dependencies : [];
    const isDirect = sourceDeps.includes(target.assetId);
    if (isDirect) impactScore += 2;

    // Convert to impact level
    if (impactScore >= 8) return 'critical';
    if (impactScore >= 6) return 'high';
    if (impactScore >= 4) return 'medium';
    return 'low';
  }

  private estimateRecoveryTime(impactLevel: string, assetType: string): number {
    const baseRecoveryTimes = {
      'transportation': { low: 2, medium: 8, high: 24, critical: 72 },
      'utilities': { low: 1, medium: 4, high: 12, critical: 48 },
      'communications': { low: 0.5, medium: 2, high: 8, critical: 24 },
      'default': { low: 1, medium: 4, high: 16, critical: 48 }
    };

    const times = baseRecoveryTimes[assetType as keyof typeof baseRecoveryTimes] || baseRecoveryTimes.default;
    return times[impactLevel as keyof typeof times] || 4;
  }

  private identifyAffectedSystems(asset: InfrastructureAsset, impactLevel: string): string[] {
    const systems = ['Primary Operations'];
    
    if (impactLevel === 'medium' || impactLevel === 'high' || impactLevel === 'critical') {
      systems.push('Backup Systems');
    }
    
    if (impactLevel === 'high' || impactLevel === 'critical') {
      systems.push('Communication Networks', 'Monitoring Systems');
    }
    
    if (impactLevel === 'critical') {
      systems.push('Emergency Protocols', 'External Dependencies');
    }

    return systems;
  }

  private async generateMitigationRecommendations(threats: ThreatAssessment[], cascadeEffects: any[]): Promise<string[]> {
    const recommendations = new Set<string>();

    // Add immediate response recommendations
    threats.filter(t => t.requiresImmediateAction).forEach(threat => {
      recommendations.add(`Immediate: Address ${threat.threatType} for asset ${threat.assetId}`);
    });

    // Add preventive recommendations
    const criticalAssets = cascadeEffects.filter(e => e.impactLevel === 'critical');
    if (criticalAssets.length > 0) {
      recommendations.add('Implement enhanced monitoring for critical cascade points');
      recommendations.add('Establish emergency response protocols for critical asset failures');
    }

    // Add system-wide recommendations
    if (threats.length > 3) {
      recommendations.add('Consider system-wide resilience assessment');
      recommendations.add('Update emergency response procedures');
    }

    return Array.from(recommendations);
  }

  private calculateRiskScore(threats: ThreatAssessment[], cascadeEffects: any[]): number {
    let riskScore = 0;

    // Base risk from threats
    threats.forEach(threat => {
      const severityWeight = {
        'minimal': 1, 'low': 2, 'moderate': 3, 'high': 4, 'critical': 5, 'catastrophic': 6
      }[threat.severity] || 3;
      
      riskScore += severityWeight * parseFloat(threat.probability);
    });

    // Add cascade risk
    const criticalCascades = cascadeEffects.filter(e => e.impactLevel === 'critical').length;
    riskScore += criticalCascades * 2;

    // Normalize to 0-100 scale
    return Math.min(riskScore * 10, 100);
  }

  private determineComplexity(assets: InfrastructureAsset[], request: SimulationRequest): 'simple' | 'moderate' | 'complex' {
    const assetCount = assets.length;
    const parameters = request.simulationParameters as any || {};
    const parameterCount = typeof parameters === 'object' ? Object.keys(parameters).length : 0;
    
    if (assetCount <= 5 && parameterCount <= 3) return 'simple';
    if (assetCount <= 15 && parameterCount <= 8) return 'moderate';
    return 'complex';
  }

  private async initializeAssetMonitoring(asset: InfrastructureAsset) {
    const metrics: RealTimeMetrics = {
      assetId: asset.assetId,
      timestamp: new Date().toISOString(),
      operationalStatus: 'operational',
      performanceMetrics: {
        efficiency: 0.85 + Math.random() * 0.1,
        loadCapacity: 0.7 + Math.random() * 0.2,
        responseTime: 100 + Math.random() * 50,
        errorRate: Math.random() * 0.05
      },
      environmentalFactors: {
        weather: 'normal',
        temperature: 20 + Math.random() * 10,
        seismicActivity: Math.random() * 0.1
      },
      alerts: []
    };

    this.realTimeData.set(asset.assetId, metrics);
  }

  private generateFailedSimulation(request: SimulationRequest, error: any): SimulationResult {
    return {
      simulationId: request.simulationId,
      scenarioName: request.scenarioName,
      status: 'failed',
      executionTime: 0,
      results: {
        threatAnalysis: [],
        cascadeEffects: [],
        mitigationRecommendations: [`Simulation failed: ${error.message}`],
        riskScore: 0,
        confidenceLevel: 0
      },
      metadata: {
        assetsAnalyzed: 0,
        threatsIdentified: 0,
        simulationComplexity: 'simple'
      }
    };
  }

  async getActiveSimulations(): Promise<SimulationRequest[]> {
    return Array.from(this.activeSimulations.values());
  }

  async getRealTimeMetrics(assetId: string): Promise<RealTimeMetrics | null> {
    return this.realTimeData.get(assetId) || null;
  }

  async updateRealTimeMetrics(assetId: string, metrics: Partial<RealTimeMetrics>) {
    const existing = this.realTimeData.get(assetId);
    if (existing) {
      this.realTimeData.set(assetId, { ...existing, ...metrics, timestamp: new Date().toISOString() });
    }
  }
}

export const icsf = new ICSFSimulationEngine();