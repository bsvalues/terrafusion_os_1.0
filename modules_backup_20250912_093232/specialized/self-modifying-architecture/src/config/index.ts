/**
 * 🗂️ Evolution Configuration Index - Self-Modifying Architecture
 * Central export point for all evolution configuration components
 */

// Configuration Manager
export { EvolutionConfigManager } from './EvolutionConfig';

// Configuration Types
export interface EvolutionConfig {
  evolution: EvolutionParameters;
  optimization: OptimizationParameters;
  safety: SafetyParameters;
  monitoring: MonitoringParameters;
}

export interface EvolutionParameters {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  convergenceThreshold: number;
}

export interface OptimizationParameters {
  targetImprovement: number;
  maxExecutionTime: number;
  enableCaching: boolean;
  parallelProcessing: boolean;
}

export interface SafetyParameters {
  requireValidation: boolean;
  automaticRollback: boolean;
  maxRiskLevel: 'low' | 'moderate' | 'high';
  backupFrequency: 'low' | 'medium' | 'high';
}

export interface MonitoringParameters {
  realTimeTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsCollection: boolean;
  alertThresholds: 'strict' | 'balanced' | 'relaxed';
}

// Configuration Presets
export const EVOLUTION_PRESETS = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'default',
  AGGRESSIVE: 'aggressive',
} as const;

export type EvolutionPreset = (typeof EVOLUTION_PRESETS)[keyof typeof EVOLUTION_PRESETS];
