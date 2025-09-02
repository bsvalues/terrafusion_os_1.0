/**
 * Types for Quantum Optimization System
 */

export interface QuantumOptimizationReport {
  timestamp: string;
  master: string;
  agents: {
    algorithmOptimizer: any;
    errorCorrection: any;
    hybridOptimization: any;
    performance: any;
  };
  optimizations: {
    v2QuantumAgentSync: any;
    v3QuantumGovernance: any;
    quantumAlgorithms: any;
  };
  metrics: {
    quantumAdvantage: number;
    errorRates: any;
    hybridEfficiency: number;
    performanceGains: any;
  };
  recommendations: string[];
}

export interface QuantumAlgorithm {
  name: string;
  type: "VQE" | "QAOA" | "Grover" | "Shor" | "HHL" | "Custom";
  qubits: number;
  gates: number;
  depth: number;
  parameters?: number[];
  error_rate?: number;
  precision_required?: number;
  problem_size?: number;
  involves_search?: boolean;
  involves_optimization?: boolean;
  involves_sampling?: boolean;
  involves_simulation?: boolean;
  algorithm_depth?: number;
}

export interface ErrorCorrectionConfig {
  code_type: "surface" | "stabilizer" | "concatenated" | "topological";
  code_distance: number;
  logical_qubits: number;
  error_threshold: number;
}

export interface HybridOptimizationConfig {
  quantum_workload_ratio: number;
  classical_workload_ratio: number;
  interface_latency_target: number;
  optimization_strategy: "performance" | "resource" | "hybrid";
}

export interface PerformanceBenchmark {
  name: string;
  quantum_time: number;
  classical_time: number;
  speedup_factor: number;
  quantum_advantage: boolean;
  resource_requirements: {
    qubits: number;
    gates: number;
    depth: number;
    memory: number;
  };
}

export interface NoiseModel {
  depolarizing_rate: number;
  amplitude_damping_rate: number;
  phase_damping_rate: number;
  readout_error: number;
  gate_error: number;
  crosstalk_error: number;
}

export interface QuantumCircuit {
  qubits: number;
  gates: number;
  depth: number;
  entangling_gates: number;
  single_qubit_gates: number;
  measurement_count: number;
}

export interface ResourceUtilization {
  qubits: number;
  gates: number;
  memory: number;
  connectivity: number;
  time: number;
}

export interface OptimizationMetrics {
  improvement_percentage: number;
  resource_savings: ResourceUtilization;
  performance_gain: number;
  error_reduction: number;
  scalability_factor: number;
}

export interface QuantumBot {
  initialize(): Promise<void>;
  deploy(): Promise<void>;
  getStatus(): Promise<any>;
  shutdown(): Promise<void>;
}

export interface QuantumAgent {
  initialize(): Promise<void>;
  deployBots(): Promise<void>;
  getReport(): Promise<any>;
  getRecommendations(): Promise<string[]>;
  shutdown(): Promise<void>;
}

export interface CompilationResult {
  original_circuit: QuantumCircuit;
  optimized_circuit: QuantumCircuit;
  compilation_time: number;
  optimization_passes: string[];
  resource_reduction: ResourceUtilization;
}

export interface BenchmarkResult {
  benchmark_name: string;
  execution_time: number;
  success_probability: number;
  fidelity: number;
  quantum_volume: number;
  error_rate: number;
}

export interface QuantumState {
  qubits: number;
  amplitudes: Complex[];
  entanglement_entropy: number;
  purity: number;
  fidelity: number;
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface SyndromeData {
  stabilizer_outcomes: number[];
  error_location: number;
  error_type: "X" | "Y" | "Z";
  correction_applied: boolean;
  success_probability: number;
}

export interface HybridWorkload {
  quantum_tasks: string[];
  classical_tasks: string[];
  interface_operations: string[];
  estimated_speedup: number;
  resource_requirements: ResourceUtilization;
}

export interface QuantumAdvantageMetrics {
  speedup_factor: number;
  problem_size_threshold: number;
  computational_complexity_reduction: string;
  practical_advantage: boolean;
  supremacy_achieved: boolean;
}
