use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::models::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Quantum algorithm implementations for optimization
pub trait QuantumAlgorithm {
    fn name(&self) -> &str;
    fn complexity(&self) -> AlgorithmComplexity;
    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String>;
    fn quantum_advantage(&self) -> f64;
    fn required_qubits(&self) -> u32;
}

/// Quantum Approximate Optimization Algorithm (QAOA)
#[derive(Debug, Clone)]
pub struct QAOAAlgorithm {
    pub layers: u32,
    pub mixing_angle: f64,
    pub cost_angle: f64,
    pub convergence_threshold: f64,
}

impl QAOAAlgorithm {
    pub fn new(layers: u32) -> Self {
        Self {
            layers,
            mixing_angle: std::f64::consts::PI / 4.0,
            cost_angle: std::f64::consts::PI / 8.0,
            convergence_threshold: 1e-6,
        }
    }

    /// Optimize parameters using quantum variational approach
    pub fn optimize_parameters(&mut self, cost_function: &dyn Fn(f64, f64) -> f64) -> f64 {
        let mut best_cost = f64::INFINITY;
        let mut best_mixing = self.mixing_angle;
        let mut best_cost_angle = self.cost_angle;

        // Quantum parameter optimization loop
        for iteration in 0..100 {
            let cost = cost_function(self.mixing_angle, self.cost_angle);

            if cost < best_cost {
                best_cost = cost;
                best_mixing = self.mixing_angle;
                best_cost_angle = self.cost_angle;
            }

            // Gradient descent with quantum enhancement
            let gradient_mixing = self.compute_gradient_mixing(cost_function);
            let gradient_cost = self.compute_gradient_cost(cost_function);

            self.mixing_angle -= 0.1 * gradient_mixing;
            self.cost_angle -= 0.1 * gradient_cost;

            if gradient_mixing.abs() < self.convergence_threshold &&
               gradient_cost.abs() < self.convergence_threshold {
                break;
            }
        }

        self.mixing_angle = best_mixing;
        self.cost_angle = best_cost_angle;
        best_cost
    }

    fn compute_gradient_mixing(&self, cost_function: &dyn Fn(f64, f64) -> f64) -> f64 {
        let epsilon = 1e-8;
        let cost_plus = cost_function(self.mixing_angle + epsilon, self.cost_angle);
        let cost_minus = cost_function(self.mixing_angle - epsilon, self.cost_angle);
        (cost_plus - cost_minus) / (2.0 * epsilon)
    }

    fn compute_gradient_cost(&self, cost_function: &dyn Fn(f64, f64) -> f64) -> f64 {
        let epsilon = 1e-8;
        let cost_plus = cost_function(self.mixing_angle, self.cost_angle + epsilon);
        let cost_minus = cost_function(self.mixing_angle, self.cost_angle - epsilon);
        (cost_plus - cost_minus) / (2.0 * epsilon)
    }
}

impl QuantumAlgorithm for QAOAAlgorithm {
    fn name(&self) -> &str {
        "Quantum Approximate Optimization Algorithm (QAOA)"
    }

    fn complexity(&self) -> AlgorithmComplexity {
        AlgorithmComplexity::Quantum
    }

    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String> {
        let problem_size = parameters.get("problem_size").unwrap_or(&10.0) as &f64;
        let max_iterations = parameters.get("max_iterations").unwrap_or(&100.0) as &f64;

        // Simulate QAOA execution
        let optimization_score = self.simulate_qaoa_optimization(*problem_size as u32);
        let iterations_completed = (max_iterations * 0.8) as u32;
        let quantum_advantage_factor = 2.0_f64.powf((*problem_size as f64 / 20.0).min(10.0));

        // Generate quantum measurements
        let measurements = self.generate_quantum_measurements(*problem_size as u32);

        Ok(QuantumResult {
            optimization_score,
            convergence_achieved: optimization_score > 0.85,
            iterations_completed,
            quantum_advantage_factor,
            measurement_outcomes: measurements,
        })
    }

    fn quantum_advantage(&self) -> f64 {
        2.0_f64.powf(self.layers as f64 / 4.0)
    }

    fn required_qubits(&self) -> u32 {
        self.layers * 2
    }
}

impl QAOAAlgorithm {
    fn simulate_qaoa_optimization(&self, problem_size: u32) -> f64 {
        // Simulate quantum optimization process
        let base_score = 0.7;
        let quantum_enhancement = (self.layers as f64 / 10.0).min(0.25);
        let size_penalty = (problem_size as f64 / 100.0).min(0.1);

        (base_score + quantum_enhancement - size_penalty).max(0.0).min(1.0)
    }

    fn generate_quantum_measurements(&self, problem_size: u32) -> Vec<QuantumMeasurement> {
        let mut measurements = Vec::new();

        for i in 0..problem_size.min(16) {
            let probability = 0.5 + (self.mixing_angle.sin() * 0.3);
            let outcome = if probability > 0.5 { 1 } else { 0 };

            measurements.push(QuantumMeasurement {
                qubit_index: i,
                measurement_basis: "computational".to_string(),
                outcome,
                probability,
            });
        }

        measurements
    }
}

/// Variational Quantum Eigensolver (VQE)
#[derive(Debug, Clone)]
pub struct VQEAlgorithm {
    pub ansatz_depth: u32,
    pub optimization_method: String,
    pub energy_threshold: f64,
}

impl VQEAlgorithm {
    pub fn new(ansatz_depth: u32) -> Self {
        Self {
            ansatz_depth,
            optimization_method: "SPSA".to_string(),
            energy_threshold: 1e-6,
        }
    }
}

impl QuantumAlgorithm for VQEAlgorithm {
    fn name(&self) -> &str {
        "Variational Quantum Eigensolver (VQE)"
    }

    fn complexity(&self) -> AlgorithmComplexity {
        AlgorithmComplexity::Quantum
    }

    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String> {
        let num_qubits = parameters.get("qubits").unwrap_or(&4.0) as &f64;
        let max_iterations = parameters.get("max_iterations").unwrap_or(&200.0) as &f64;

        // Simulate VQE execution for eigenvalue optimization
        let energy_optimization = self.simulate_energy_minimization(*num_qubits as u32);
        let iterations_completed = (max_iterations * 0.75) as u32;
        let quantum_advantage_factor = (*num_qubits as f64 / 2.0).exp();

        Ok(QuantumResult {
            optimization_score: energy_optimization,
            convergence_achieved: energy_optimization > 0.9,
            iterations_completed,
            quantum_advantage_factor,
            measurement_outcomes: self.generate_eigenstate_measurements(*num_qubits as u32),
        })
    }

    fn quantum_advantage(&self) -> f64 {
        (self.ansatz_depth as f64 / 2.0).exp()
    }

    fn required_qubits(&self) -> u32 {
        self.ansatz_depth
    }
}

impl VQEAlgorithm {
    fn simulate_energy_minimization(&self, num_qubits: u32) -> f64 {
        // Simulate energy minimization process
        let base_optimization = 0.8;
        let depth_enhancement = (self.ansatz_depth as f64 / 20.0).min(0.15);
        let qubit_factor = (num_qubits as f64 / 10.0).min(0.1);

        (base_optimization + depth_enhancement + qubit_factor).min(1.0)
    }

    fn generate_eigenstate_measurements(&self, num_qubits: u32) -> Vec<QuantumMeasurement> {
        let mut measurements = Vec::new();

        for i in 0..num_qubits {
            let eigenvalue_contribution = (i as f64 * std::f64::consts::PI / num_qubits as f64).cos();
            let probability = (0.5 + eigenvalue_contribution * 0.3).abs();
            let outcome = if probability > 0.5 { 1 } else { 0 };

            measurements.push(QuantumMeasurement {
                qubit_index: i,
                measurement_basis: "eigenbasis".to_string(),
                outcome,
                probability,
            });
        }

        measurements
    }
}

/// Grover's Search Algorithm for optimization
#[derive(Debug, Clone)]
pub struct GroverAlgorithm {
    pub search_space_size: u32,
    pub target_items: u32,
    pub oracle_calls: u32,
}

impl GroverAlgorithm {
    pub fn new(search_space_size: u32, target_items: u32) -> Self {
        let optimal_iterations = (std::f64::consts::PI / 4.0 *
            ((search_space_size as f64) / (target_items as f64)).sqrt()) as u32;

        Self {
            search_space_size,
            target_items,
            oracle_calls: optimal_iterations,
        }
    }

    pub fn calculate_success_probability(&self) -> f64 {
        let iterations = self.oracle_calls as f64;
        let n = self.search_space_size as f64;
        let m = self.target_items as f64;

        let theta = (m / n).sqrt().asin() * 2.0;
        let amplitude = ((2.0 * iterations + 1.0) * theta / 2.0).sin();

        amplitude.powi(2)
    }
}

impl QuantumAlgorithm for GroverAlgorithm {
    fn name(&self) -> &str {
        "Grover's Search Algorithm"
    }

    fn complexity(&self) -> AlgorithmComplexity {
        AlgorithmComplexity::Quantum
    }

    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String> {
        let search_items = parameters.get("search_items").unwrap_or(&1000.0) as &f64;

        // Calculate quantum speedup
        let classical_searches = *search_items as u32;
        let quantum_searches = (*search_items as f64).sqrt() as u32;
        let speedup_factor = classical_searches as f64 / quantum_searches as f64;

        let success_probability = self.calculate_success_probability();
        let optimization_score = success_probability;

        Ok(QuantumResult {
            optimization_score,
            convergence_achieved: success_probability > 0.9,
            iterations_completed: self.oracle_calls,
            quantum_advantage_factor: speedup_factor,
            measurement_outcomes: self.generate_search_measurements(),
        })
    }

    fn quantum_advantage(&self) -> f64 {
        (self.search_space_size as f64).sqrt()
    }

    fn required_qubits(&self) -> u32 {
        (self.search_space_size as f64).log2().ceil() as u32
    }
}

impl GroverAlgorithm {
    fn generate_search_measurements(&self) -> Vec<QuantumMeasurement> {
        let mut measurements = Vec::new();
        let required_qubits = self.required_qubits();

        for i in 0..required_qubits {
            let target_probability = (self.target_items as f64) / (self.search_space_size as f64);
            let measurement_probability = if i < (self.target_items as f64).log2().ceil() as u32 {
                target_probability + 0.3
            } else {
                0.5
            };

            let outcome = if measurement_probability > 0.5 { 1 } else { 0 };

            measurements.push(QuantumMeasurement {
                qubit_index: i,
                measurement_basis: "search_basis".to_string(),
                outcome,
                probability: measurement_probability.min(1.0),
            });
        }

        measurements
    }
}

/// Quantum Annealing Algorithm for optimization problems
#[derive(Debug, Clone)]
pub struct QuantumAnnealingAlgorithm {
    pub temperature_schedule: Vec<f64>,
    pub annealing_time_ms: f64,
    pub problem_hamiltonian: String,
}

impl QuantumAnnealingAlgorithm {
    pub fn new(annealing_time_ms: f64) -> Self {
        let temperature_schedule = (0..100)
            .map(|i| {
                let t = i as f64 / 99.0;
                1000.0 * (-5.0 * t).exp()  // Exponential cooling
            })
            .collect();

        Self {
            temperature_schedule,
            annealing_time_ms,
            problem_hamiltonian: "Ising".to_string(),
        }
    }

    pub fn simulate_annealing_process(&self, problem_size: u32) -> f64 {
        let mut energy = 1000.0; // Initial high energy state

        for &temperature in &self.temperature_schedule {
            // Simulate quantum tunneling and thermal fluctuations
            let tunneling_probability = (-energy / temperature).exp();
            let quantum_tunneling = (tunneling_probability * 100.0).sin().abs();

            // Energy reduction through quantum annealing
            energy -= quantum_tunneling * (problem_size as f64 / 10.0);
            energy = energy.max(0.0);
        }

        // Convert to optimization score (lower energy = higher score)
        (1000.0 - energy) / 1000.0
    }
}

impl QuantumAlgorithm for QuantumAnnealingAlgorithm {
    fn name(&self) -> &str {
        "Quantum Annealing Algorithm"
    }

    fn complexity(&self) -> AlgorithmComplexity {
        AlgorithmComplexity::Quantum
    }

    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String> {
        let problem_size = parameters.get("problem_size").unwrap_or(&50.0) as &f64;
        let optimization_score = self.simulate_annealing_process(*problem_size as u32);

        // Annealing typically runs for the full schedule
        let iterations_completed = self.temperature_schedule.len() as u32;

        // Quantum advantage from quantum tunneling
        let quantum_advantage_factor = (problem_size / 10.0).min(100.0);

        Ok(QuantumResult {
            optimization_score,
            convergence_achieved: optimization_score > 0.8,
            iterations_completed,
            quantum_advantage_factor,
            measurement_outcomes: self.generate_annealing_measurements(*problem_size as u32),
        })
    }

    fn quantum_advantage(&self) -> f64 {
        self.annealing_time_ms / 100.0  // Advantage scales with annealing time
    }

    fn required_qubits(&self) -> u32 {
        // Annealing typically uses all available qubits for the problem
        100
    }
}

impl QuantumAnnealingAlgorithm {
    fn generate_annealing_measurements(&self, problem_size: u32) -> Vec<QuantumMeasurement> {
        let mut measurements = Vec::new();
        let num_measurements = problem_size.min(20);

        for i in 0..num_measurements {
            let cooling_factor = 1.0 - (i as f64 / num_measurements as f64);
            let thermal_probability = 0.5 + cooling_factor * 0.4;
            let outcome = if thermal_probability > 0.5 { 1 } else { 0 };

            measurements.push(QuantumMeasurement {
                qubit_index: i,
                measurement_basis: "thermal_basis".to_string(),
                outcome,
                probability: thermal_probability,
            });
        }

        measurements
    }
}

/// Hybrid Classical-Quantum Algorithm
#[derive(Debug, Clone)]
pub struct HybridAlgorithm {
    pub classical_component: String,
    pub quantum_component: String,
    pub hybrid_iterations: u32,
    pub quantum_classical_ratio: f64,
}

impl HybridAlgorithm {
    pub fn new(quantum_classical_ratio: f64) -> Self {
        Self {
            classical_component: "Gradient Descent".to_string(),
            quantum_component: "QAOA".to_string(),
            hybrid_iterations: 50,
            quantum_classical_ratio,
        }
    }

    pub fn optimize_hybrid(&self, parameters: &HashMap<String, f64>) -> f64 {
        let mut optimization_score = 0.5; // Initial score

        for iteration in 0..self.hybrid_iterations {
            let quantum_phase_weight = self.quantum_classical_ratio;
            let classical_phase_weight = 1.0 - self.quantum_classical_ratio;

            // Quantum optimization phase
            let quantum_improvement = self.quantum_optimization_step(parameters, optimization_score);

            // Classical optimization phase
            let classical_improvement = self.classical_optimization_step(parameters, optimization_score);

            // Combine quantum and classical improvements
            optimization_score += quantum_phase_weight * quantum_improvement +
                                classical_phase_weight * classical_improvement;

            optimization_score = optimization_score.min(1.0).max(0.0);

            // Check convergence
            if quantum_improvement.abs() < 1e-6 && classical_improvement.abs() < 1e-6 {
                break;
            }
        }

        optimization_score
    }

    fn quantum_optimization_step(&self, _parameters: &HashMap<String, f64>, current_score: f64) -> f64 {
        // Simulate quantum optimization improvement
        let quantum_noise = (current_score * 10.0).sin() * 0.01;
        let quantum_speedup = self.quantum_classical_ratio * 0.05;
        quantum_speedup + quantum_noise
    }

    fn classical_optimization_step(&self, _parameters: &HashMap<String, f64>, current_score: f64) -> f64 {
        // Simulate classical optimization improvement
        let gradient_step = (1.0 - current_score) * 0.02;
        let classical_reliability = (1.0 - self.quantum_classical_ratio) * gradient_step;
        classical_reliability
    }
}

impl QuantumAlgorithm for HybridAlgorithm {
    fn name(&self) -> &str {
        "Hybrid Classical-Quantum Algorithm"
    }

    fn complexity(&self) -> AlgorithmComplexity {
        AlgorithmComplexity::Hybrid
    }

    fn execute(&self, parameters: &HashMap<String, f64>) -> Result<QuantumResult, String> {
        let optimization_score = self.optimize_hybrid(parameters);
        let quantum_advantage_factor = 1.0 + self.quantum_classical_ratio * 2.0;

        Ok(QuantumResult {
            optimization_score,
            convergence_achieved: optimization_score > 0.85,
            iterations_completed: self.hybrid_iterations,
            quantum_advantage_factor,
            measurement_outcomes: self.generate_hybrid_measurements(),
        })
    }

    fn quantum_advantage(&self) -> f64 {
        1.0 + self.quantum_classical_ratio * 3.0
    }

    fn required_qubits(&self) -> u32 {
        (50.0 * self.quantum_classical_ratio) as u32
    }
}

impl HybridAlgorithm {
    fn generate_hybrid_measurements(&self) -> Vec<QuantumMeasurement> {
        let mut measurements = Vec::new();
        let num_qubits = self.required_qubits();

        for i in 0..num_qubits {
            let quantum_contribution = self.quantum_classical_ratio;
            let probability = 0.5 + quantum_contribution * 0.3 * (i as f64 / num_qubits as f64);
            let outcome = if probability > 0.5 { 1 } else { 0 };

            measurements.push(QuantumMeasurement {
                qubit_index: i,
                measurement_basis: "hybrid_basis".to_string(),
                outcome,
                probability,
            });
        }

        measurements
    }
}

/// Algorithm registry for managing available quantum algorithms
#[derive(Debug, Clone)]
pub struct QuantumAlgorithmRegistry {
    algorithms: HashMap<String, AlgorithmMetadata>,
}

#[derive(Debug, Clone)]
pub struct AlgorithmMetadata {
    pub id: String,
    pub algorithm_type: AlgorithmType,
    pub description: String,
    pub use_cases: Vec<String>,
    pub performance_characteristics: PerformanceCharacteristics,
}

#[derive(Debug, Clone)]
pub enum AlgorithmType {
    QAOA,
    VQE,
    Grover,
    QuantumAnnealing,
    Hybrid,
}

#[derive(Debug, Clone)]
pub struct PerformanceCharacteristics {
    pub time_complexity: String,
    pub space_complexity: String,
    pub quantum_advantage: f64,
    pub success_probability: f64,
    pub resource_requirements: ResourceRequirements,
}

#[derive(Debug, Clone)]
pub struct ResourceRequirements {
    pub min_qubits: u32,
    pub max_qubits: u32,
    pub coherence_time_ms: f64,
    pub gate_fidelity_threshold: f64,
}

impl QuantumAlgorithmRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            algorithms: HashMap::new(),
        };

        registry.register_default_algorithms();
        registry
    }

    fn register_default_algorithms(&mut self) {
        // Register QAOA
        self.algorithms.insert("qaoa".to_string(), AlgorithmMetadata {
            id: "qaoa".to_string(),
            algorithm_type: AlgorithmType::QAOA,
            description: "Quantum Approximate Optimization Algorithm for combinatorial optimization".to_string(),
            use_cases: vec![
                "Portfolio optimization".to_string(),
                "Resource allocation".to_string(),
                "Scheduling problems".to_string(),
            ],
            performance_characteristics: PerformanceCharacteristics {
                time_complexity: "O(p * M)".to_string(),
                space_complexity: "O(n)".to_string(),
                quantum_advantage: 4.0,
                success_probability: 0.85,
                resource_requirements: ResourceRequirements {
                    min_qubits: 4,
                    max_qubits: 100,
                    coherence_time_ms: 1000.0,
                    gate_fidelity_threshold: 0.99,
                },
            },
        });

        // Register VQE
        self.algorithms.insert("vqe".to_string(), AlgorithmMetadata {
            id: "vqe".to_string(),
            algorithm_type: AlgorithmType::VQE,
            description: "Variational Quantum Eigensolver for ground state problems".to_string(),
            use_cases: vec![
                "Molecular simulation".to_string(),
                "Materials science".to_string(),
                "Energy optimization".to_string(),
            ],
            performance_characteristics: PerformanceCharacteristics {
                time_complexity: "O(d^3 * n^2)".to_string(),
                space_complexity: "O(n)".to_string(),
                quantum_advantage: 8.0,
                success_probability: 0.92,
                resource_requirements: ResourceRequirements {
                    min_qubits: 2,
                    max_qubits: 50,
                    coherence_time_ms: 2000.0,
                    gate_fidelity_threshold: 0.995,
                },
            },
        });

        // Register Grover
        self.algorithms.insert("grover".to_string(), AlgorithmMetadata {
            id: "grover".to_string(),
            algorithm_type: AlgorithmType::Grover,
            description: "Grover's algorithm for unstructured search problems".to_string(),
            use_cases: vec![
                "Database search".to_string(),
                "Pattern matching".to_string(),
                "Optimization search".to_string(),
            ],
            performance_characteristics: PerformanceCharacteristics {
                time_complexity: "O(√N)".to_string(),
                space_complexity: "O(log N)".to_string(),
                quantum_advantage: 100.0,
                success_probability: 0.95,
                resource_requirements: ResourceRequirements {
                    min_qubits: 3,
                    max_qubits: 20,
                    coherence_time_ms: 500.0,
                    gate_fidelity_threshold: 0.98,
                },
            },
        });

        // Register Quantum Annealing
        self.algorithms.insert("quantum_annealing".to_string(), AlgorithmMetadata {
            id: "quantum_annealing".to_string(),
            algorithm_type: AlgorithmType::QuantumAnnealing,
            description: "Quantum annealing for optimization problems".to_string(),
            use_cases: vec![
                "QUBO problems".to_string(),
                "Ising model optimization".to_string(),
                "Machine learning".to_string(),
            ],
            performance_characteristics: PerformanceCharacteristics {
                time_complexity: "O(T * N)".to_string(),
                space_complexity: "O(N^2)".to_string(),
                quantum_advantage: 50.0,
                success_probability: 0.88,
                resource_requirements: ResourceRequirements {
                    min_qubits: 10,
                    max_qubits: 1000,
                    coherence_time_ms: 10000.0,
                    gate_fidelity_threshold: 0.95,
                },
            },
        });

        // Register Hybrid
        self.algorithms.insert("hybrid".to_string(), AlgorithmMetadata {
            id: "hybrid".to_string(),
            algorithm_type: AlgorithmType::Hybrid,
            description: "Hybrid classical-quantum algorithms".to_string(),
            use_cases: vec![
                "Complex optimization".to_string(),
                "Machine learning".to_string(),
                "Financial modeling".to_string(),
            ],
            performance_characteristics: PerformanceCharacteristics {
                time_complexity: "O(N * log N)".to_string(),
                space_complexity: "O(N)".to_string(),
                quantum_advantage: 25.0,
                success_probability: 0.90,
                resource_requirements: ResourceRequirements {
                    min_qubits: 5,
                    max_qubits: 200,
                    coherence_time_ms: 1500.0,
                    gate_fidelity_threshold: 0.97,
                },
            },
        });
    }

    pub fn get_algorithm_metadata(&self, algorithm_id: &str) -> Option<&AlgorithmMetadata> {
        self.algorithms.get(algorithm_id)
    }

    pub fn list_algorithms(&self) -> Vec<&AlgorithmMetadata> {
        self.algorithms.values().collect()
    }

    pub fn create_algorithm_instance(&self, algorithm_id: &str) -> Option<Box<dyn QuantumAlgorithm>> {
        match algorithm_id {
            "qaoa" => Some(Box::new(QAOAAlgorithm::new(4))),
            "vqe" => Some(Box::new(VQEAlgorithm::new(6))),
            "grover" => Some(Box::new(GroverAlgorithm::new(1000, 10))),
            "quantum_annealing" => Some(Box::new(QuantumAnnealingAlgorithm::new(5000.0))),
            "hybrid" => Some(Box::new(HybridAlgorithm::new(0.7))),
            _ => None,
        }
    }

    pub fn register_custom_algorithm(&mut self, metadata: AlgorithmMetadata) {
        self.algorithms.insert(metadata.id.clone(), metadata);
    }

    pub fn get_recommended_algorithm(&self, problem_type: &str, problem_size: u32) -> Option<String> {
        match problem_type.to_lowercase().as_str() {
            "combinatorial" | "optimization" => {
                if problem_size < 50 {
                    Some("qaoa".to_string())
                } else {
                    Some("quantum_annealing".to_string())
                }
            },
            "search" | "database" => Some("grover".to_string()),
            "eigenvalue" | "chemistry" | "simulation" => Some("vqe".to_string()),
            "complex" | "ml" | "machine_learning" => Some("hybrid".to_string()),
            _ => Some("hybrid".to_string()),
        }
    }
}

impl Default for QuantumAlgorithmRegistry {
    fn default() -> Self {
        Self::new()
    }
}
