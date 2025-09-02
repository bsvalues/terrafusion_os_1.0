export interface FeatureSet {
  monacoEditor: boolean;
  countyAwareness: boolean;
  governmentCompliance: boolean;
  aiSwarm?: boolean;
  agentCount?: number;
  quantumOptimization?: boolean;
  harrisPacsIntegration?: boolean;
  neuralConsciousness?: boolean;
  advancedAnalytics?: boolean;
  realTimeCollaboration?: boolean;
  multiCountySupport?: boolean;
  federalCompliance?: boolean;
}

export interface PerformanceTargets {
  apiResponse: number;
  aiResponse: number;
  dbImprovement: number;
  uiResponsiveness: number;
  memoryBaseline: number;
  quantumCoherence: number;
}

export class TerraFusionConfiguration {
  private static instance: TerraFusionConfiguration;
  private readonly variant: 'basic' | 'ultimate' | 'enterprise';
  private readonly performanceTargets: PerformanceTargets;
  
  private constructor(variant: 'basic' | 'ultimate' | 'enterprise') {
    this.variant = variant;
    this.performanceTargets = this.initializePerformanceTargets();
  }
  
  static initialize(variant: string): TerraFusionConfiguration {
    if (!this.instance) {
      const validVariant = ['basic', 'ultimate', 'enterprise'].includes(variant) 
        ? variant as 'basic' | 'ultimate' | 'enterprise' 
        : 'basic';
      this.instance = new TerraFusionConfiguration(validVariant);
    }
    return this.instance;
  }
  
  static getInstance(): TerraFusionConfiguration {
    if (!this.instance) {
      throw new Error('TerraFusionConfiguration must be initialized first');
    }
    return this.instance;
  }
  
  getVariant(): string {
    return this.variant;
  }
  
  getFeatures(): FeatureSet {
    const baseFeatures = {
      monacoEditor: true,
      countyAwareness: true,
      governmentCompliance: true,
      advancedAnalytics: false,
      realTimeCollaboration: false,
      multiCountySupport: false,
      federalCompliance: false
    };
    
    if (this.variant === 'ultimate' || this.variant === 'enterprise') {
      return {
        ...baseFeatures,
        aiSwarm: true,
        agentCount: 1008,
        quantumOptimization: true,
        harrisPacsIntegration: true,
        neuralConsciousness: true,
        advancedAnalytics: true,
        realTimeCollaboration: true,
        multiCountySupport: true
      };
    }
    
    if (this.variant === 'enterprise') {
      return {
        ...baseFeatures,
        aiSwarm: true,
        agentCount: 1008,
        quantumOptimization: true,
        harrisPacsIntegration: true,
        neuralConsciousness: true,
        advancedAnalytics: true,
        realTimeCollaboration: true,
        multiCountySupport: true,
        federalCompliance: true
      };
    }
    
    return baseFeatures;
  }
  
  getPerformanceTargets(): PerformanceTargets {
    return this.performanceTargets;
  }
  
  private initializePerformanceTargets(): PerformanceTargets {
    const baseTargets = {
      apiResponse: 20,
      aiResponse: 100,
      dbImprovement: 2.0,
      uiResponsiveness: 100,
      memoryBaseline: 2048,
      quantumCoherence: 0.85
    };
    
    if (this.variant === 'ultimate') {
      return {
        ...baseTargets,
        apiResponse: 10,
        aiResponse: 50,
        dbImprovement: 3.0,
        quantumCoherence: 0.90
      };
    }
    
    if (this.variant === 'enterprise') {
      return {
        ...baseTargets,
        apiResponse: 5,
        aiResponse: 25,
        dbImprovement: 4.0,
        quantumCoherence: 0.95
      };
    }
    
    return baseTargets;
  }
  
  getCountyConfiguration(countyName: string): any {
    const baseConfig = {
      name: countyName,
      variant: this.variant,
      features: this.getFeatures(),
      performance: this.getPerformanceTargets(),
      aiSwarm: {
        enabled: this.getFeatures().aiSwarm || false,
        agentCount: this.getFeatures().agentCount || 0,
        quantumOptimization: this.getFeatures().quantumOptimization || false
      },
      harrisPacs: {
        enabled: this.getFeatures().harrisPacsIntegration || false,
        version: '12.4.7',
        parcelCount: 0
      },
      compliance: {
        fisma: this.getFeatures().governmentCompliance,
        nist: this.getFeatures().governmentCompliance,
        section508: this.getFeatures().governmentCompliance,
        federal: this.getFeatures().federalCompliance || false
      }
    };
    
    if (countyName.toLowerCase() === 'benton') {
      return {
        ...baseConfig,
        harrisPacs: {
          ...baseConfig.harrisPacs,
          parcelCount: 89247,
          operational: true
        },
        aiSwarm: {
          ...baseConfig.aiSwarm,
          operational: true,
          agentCount: 1008
        }
      };
    }
    
    return baseConfig;
  }
  
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const features = this.getFeatures();
    
    if (!features.monacoEditor) {
      errors.push('Monaco Editor is required for all variants');
    }
    
    if (!features.countyAwareness) {
      errors.push('County awareness is required for all variants');
    }
    
    if (!features.governmentCompliance) {
      errors.push('Government compliance is required for all variants');
    }
    
    if (features.aiSwarm && (!features.agentCount || features.agentCount < 1)) {
      errors.push('AI Swarm requires at least 1 agent');
    }
    
    if (features.quantumOptimization && !features.aiSwarm) {
      errors.push('Quantum optimization requires AI Swarm');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
