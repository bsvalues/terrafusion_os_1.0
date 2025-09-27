/**
 * 🎛️ Evolution Config Manager - Self-Modifying Architecture Component
 * Manages runtime configuration for evolutionary architecture systems
 */

export class EvolutionConfigManager {
  private configurations: Map<string, EvolutionConfig> = new Map();
  private activeProfile: string = 'default';

  constructor() {
    this.initializeDefaultProfiles();
    console.log('🎛️ Evolution Config Manager initialized with default profiles');
  }

  private initializeDefaultProfiles(): void {
    // Conservative profile for production
    this.configurations.set('conservative', {
      evolution: {
        populationSize: 20,
        generations: 50,
        mutationRate: 0.05,
        crossoverRate: 0.7,
        eliteSize: 5,
        convergenceThreshold: 0.01,
      },
      optimization: {
        targetImprovement: 0.1,
        maxExecutionTime: 1800,
        enableCaching: true,
        parallelProcessing: false,
      },
      safety: {
        requireValidation: true,
        automaticRollback: true,
        maxRiskLevel: 'low',
        backupFrequency: 'high',
      },
      monitoring: {
        realTimeTracking: true,
        logLevel: 'info',
        metricsCollection: true,
        alertThresholds: 'strict',
      },
    });

    // Aggressive profile for development
    this.configurations.set('aggressive', {
      evolution: {
        populationSize: 100,
        generations: 200,
        mutationRate: 0.2,
        crossoverRate: 0.9,
        eliteSize: 20,
        convergenceThreshold: 0.05,
      },
      optimization: {
        targetImprovement: 0.3,
        maxExecutionTime: 7200,
        enableCaching: true,
        parallelProcessing: true,
      },
      safety: {
        requireValidation: true,
        automaticRollback: true,
        maxRiskLevel: 'moderate',
        backupFrequency: 'medium',
      },
      monitoring: {
        realTimeTracking: true,
        logLevel: 'debug',
        metricsCollection: true,
        alertThresholds: 'relaxed',
      },
    });

    // Balanced default profile
    this.configurations.set('default', {
      evolution: {
        populationSize: 50,
        generations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        eliteSize: 10,
        convergenceThreshold: 0.02,
      },
      optimization: {
        targetImprovement: 0.2,
        maxExecutionTime: 3600,
        enableCaching: true,
        parallelProcessing: true,
      },
      safety: {
        requireValidation: true,
        automaticRollback: true,
        maxRiskLevel: 'moderate',
        backupFrequency: 'medium',
      },
      monitoring: {
        realTimeTracking: true,
        logLevel: 'info',
        metricsCollection: true,
        alertThresholds: 'balanced',
      },
    });
  }

  public getActiveConfiguration(): EvolutionConfig {
    const config = this.configurations.get(this.activeProfile);
    if (!config) {
      throw new Error(`Configuration profile '${this.activeProfile}' not found`);
    }
    return { ...config };
  }

  public setActiveProfile(profile: string): void {
    if (!this.configurations.has(profile)) {
      throw new Error(`Configuration profile '${profile}' does not exist`);
    }
    this.activeProfile = profile;
    console.log(`🎛️ Switched to configuration profile: ${profile}`);
  }

  public createProfile(name: string, config: EvolutionConfig): void {
    this.configurations.set(name, { ...config });
    console.log(`🎛️ Created new configuration profile: ${name}`);
  }

  public updateProfile(name: string, updates: Partial<EvolutionConfig>): void {
    const existing = this.configurations.get(name);
    if (!existing) {
      throw new Error(`Configuration profile '${name}' not found`);
    }

    this.configurations.set(name, { ...existing, ...updates });
    console.log(`🎛️ Updated configuration profile: ${name}`);
  }

  public listProfiles(): string[] {
    return Array.from(this.configurations.keys());
  }

  public exportProfile(name: string): string {
    const config = this.configurations.get(name);
    if (!config) {
      throw new Error(`Configuration profile '${name}' not found`);
    }
    return JSON.stringify(config, null, 2);
  }

  public importProfile(name: string, configJson: string): void {
    try {
      const config = JSON.parse(configJson) as EvolutionConfig;
      this.validateConfiguration(config);
      this.configurations.set(name, config);
      console.log(`🎛️ Imported configuration profile: ${name}`);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  private validateConfiguration(config: EvolutionConfig): void {
    // Validate evolution parameters
    if (config.evolution.populationSize <= 0 || config.evolution.generations <= 0) {
      throw new Error('Population size and generations must be positive');
    }

    if (config.evolution.mutationRate < 0 || config.evolution.mutationRate > 1) {
      throw new Error('Mutation rate must be between 0 and 1');
    }

    if (config.evolution.crossoverRate < 0 || config.evolution.crossoverRate > 1) {
      throw new Error('Crossover rate must be between 0 and 1');
    }

    // Validate optimization parameters
    if (config.optimization.targetImprovement <= 0) {
      throw new Error('Target improvement must be positive');
    }

    if (config.optimization.maxExecutionTime <= 0) {
      throw new Error('Max execution time must be positive');
    }
  }
}

interface EvolutionConfig {
  evolution: EvolutionParameters;
  optimization: OptimizationParameters;
  safety: SafetyParameters;
  monitoring: MonitoringParameters;
}

interface EvolutionParameters {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  convergenceThreshold: number;
}

interface OptimizationParameters {
  targetImprovement: number;
  maxExecutionTime: number;
  enableCaching: boolean;
  parallelProcessing: boolean;
}

interface SafetyParameters {
  requireValidation: boolean;
  automaticRollback: boolean;
  maxRiskLevel: 'low' | 'moderate' | 'high';
  backupFrequency: 'low' | 'medium' | 'high';
}

interface MonitoringParameters {
  realTimeTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsCollection: boolean;
  alertThresholds: 'strict' | 'balanced' | 'relaxed';
}
