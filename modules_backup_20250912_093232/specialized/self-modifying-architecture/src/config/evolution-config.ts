/**
 * ⚙️ Evolution Config - Self-Modifying Architecture Component
 * Configuration management for evolutionary architecture parameters
 */

export class EvolutionConfig {
  private config: EvolutionConfiguration;

  constructor(initialConfig?: Partial<EvolutionConfiguration>) {
    this.config = this.createDefaultConfig();
    if (initialConfig) {
      this.updateConfig(initialConfig);
    }
    console.log('⚙️ Evolution Config initialized');
  }

  private createDefaultConfig(): EvolutionConfiguration {
    return {
      evolution: {
        populationSize: 50,
        generations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        eliteSize: 10,
      },
      performance: {
        targetImprovement: 0.2,
        maxOptimizationTime: 3600,
        benchmarkEnabled: true,
      },
      safety: {
        requireValidation: true,
        automaticRollback: true,
        maxRiskLevel: 'moderate',
      },
      monitoring: {
        realTimeTracking: true,
        logLevel: 'info',
        metricsCollection: true,
      },
    };
  }

  public getConfig(): EvolutionConfiguration {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<EvolutionConfiguration>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Evolution configuration updated');
  }

  public resetToDefaults(): void {
    this.config = this.createDefaultConfig();
    console.log('⚙️ Evolution configuration reset to defaults');
  }
}

interface EvolutionConfiguration {
  evolution: EvolutionParams;
  performance: PerformanceParams;
  safety: SafetyParams;
  monitoring: MonitoringParams;
}

interface EvolutionParams {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
}

interface PerformanceParams {
  targetImprovement: number;
  maxOptimizationTime: number;
  benchmarkEnabled: boolean;
}

interface SafetyParams {
  requireValidation: boolean;
  automaticRollback: boolean;
  maxRiskLevel: 'low' | 'moderate' | 'high';
}

interface MonitoringParams {
  realTimeTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsCollection: boolean;
}
