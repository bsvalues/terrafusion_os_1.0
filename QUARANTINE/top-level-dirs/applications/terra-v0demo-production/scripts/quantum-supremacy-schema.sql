-- TerraFusion Quantum Supremacy Database Schema
-- Supporting next-generation quantum algorithms and processors

-- Quantum Processors Table
CREATE TABLE IF NOT EXISTS quantum_processors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    generation ENUM('Gen-1', 'Gen-2', 'Gen-3', 'Quantum-Supreme') NOT NULL,
    qubits INT NOT NULL,
    coherence_time_microseconds DECIMAL(10,3) NOT NULL,
    gate_time_nanoseconds DECIMAL(8,3) NOT NULL,
    error_rate DECIMAL(10,8) NOT NULL,
    quantum_volume BIGINT NOT NULL,
    status ENUM('online', 'offline', 'calibrating', 'upgrading', 'maintenance') DEFAULT 'offline',
    utilization_percent DECIMAL(5,2) DEFAULT 0.00,
    temperature_kelvin DECIMAL(8,6) NOT NULL,
    location VARCHAR(100),
    installed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_calibration TIMESTAMP,
    next_maintenance TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Quantum Algorithms Table
CREATE TABLE IF NOT EXISTS quantum_algorithms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    algorithm_type ENUM('valuation', 'optimization', 'prediction', 'simulation', 'neural') NOT NULL,
    complexity_class ENUM('polynomial', 'exponential', 'quantum_advantage') NOT NULL,
    qubits_required INT NOT NULL,
    quantum_advantage_factor BIGINT NOT NULL,
    accuracy_percent DECIMAL(5,3) NOT NULL,
    status ENUM('development', 'testing', 'production', 'optimizing', 'deprecated') DEFAULT 'development',
    description TEXT,
    applications JSON,
    circuit_depth INT,
    gate_count INT,
    entanglement_measure DECIMAL(8,4),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Quantum Executions Table
CREATE TABLE IF NOT EXISTS quantum_executions (
    id VARCHAR(50) PRIMARY KEY,
    algorithm_id VARCHAR(50) NOT NULL,
    processor_id VARCHAR(50) NOT NULL,
    execution_type ENUM('valuation', 'optimization', 'prediction', 'simulation') NOT NULL,
    input_parameters JSON,
    qubits_used INT NOT NULL,
    execution_time_ms BIGINT NOT NULL,
    quantum_advantage_achieved BIGINT,
    accuracy_achieved DECIMAL(5,3),
    coherence_time_used DECIMAL(10,3),
    error_rate_observed DECIMAL(10,8),
    results JSON,
    status ENUM('queued', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (algorithm_id) REFERENCES quantum_algorithms(id),
    FOREIGN KEY (processor_id) REFERENCES quantum_processors(id)
);

-- Quantum Performance Metrics Table
CREATE TABLE IF NOT EXISTS quantum_performance_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    processor_id VARCHAR(50) NOT NULL,
    algorithm_id VARCHAR(50),
    metric_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qubits_active INT,
    coherence_time_measured DECIMAL(10,3),
    gate_fidelity DECIMAL(8,6),
    error_rate_measured DECIMAL(10,8),
    quantum_volume_achieved BIGINT,
    throughput_operations_per_second DECIMAL(12,2),
    utilization_percent DECIMAL(5,2),
    temperature_kelvin DECIMAL(8,6),
    power_consumption_watts DECIMAL(10,2),
    FOREIGN KEY (processor_id) REFERENCES quantum_processors(id),
    FOREIGN KEY (algorithm_id) REFERENCES quantum_algorithms(id)
);

-- Quantum Research Projects Table
CREATE TABLE IF NOT EXISTS quantum_research_projects (
    id VARCHAR(50) PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    research_area ENUM('consciousness', 'temporal', 'entanglement', 'fusion', 'error_correction') NOT NULL,
    progress_percent DECIMAL(5,2) DEFAULT 0.00,
    estimated_completion DATE,
    target_qubits INT,
    target_advantage BIGINT,
    description TEXT,
    team_lead VARCHAR(100),
    budget_allocated DECIMAL(15,2),
    budget_spent DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('planning', 'active', 'testing', 'completed', 'cancelled') DEFAULT 'planning',
    milestones JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Quantum Supremacy Benchmarks Table
CREATE TABLE IF NOT EXISTS quantum_supremacy_benchmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    benchmark_name VARCHAR(200) NOT NULL,
    problem_type ENUM('valuation', 'optimization', 'prediction', 'simulation') NOT NULL,
    classical_time_seconds DECIMAL(15,6),
    quantum_time_seconds DECIMAL(15,6),
    quantum_advantage_factor BIGINT,
    problem_size INT,
    qubits_used INT,
    accuracy_classical DECIMAL(5,3),
    accuracy_quantum DECIMAL(5,3),
    benchmark_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_quantum_processors_status ON quantum_processors(status);
CREATE INDEX idx_quantum_processors_generation ON quantum_processors(generation);
CREATE INDEX idx_quantum_algorithms_type ON quantum_algorithms(algorithm_type);
CREATE INDEX idx_quantum_algorithms_status ON quantum_algorithms(status);
CREATE INDEX idx_quantum_executions_status ON quantum_executions(status);
CREATE INDEX idx_quantum_executions_created ON quantum_executions(created_at);
CREATE INDEX idx_quantum_performance_timestamp ON quantum_performance_metrics(metric_timestamp);
CREATE INDEX idx_quantum_research_status ON quantum_research_projects(status);
CREATE INDEX idx_quantum_benchmarks_date ON quantum_supremacy_benchmarks(benchmark_date);

-- Insert initial quantum processors
INSERT INTO quantum_processors (
    id, name, generation, qubits, coherence_time_microseconds, gate_time_nanoseconds,
    error_rate, quantum_volume, status, temperature_kelvin, location
) VALUES 
('qpu-supreme-001', 'TerraFusion Quantum Supreme Alpha', 'Quantum-Supreme', 4096, 2000.000, 5.000, 0.0001, 1048576, 'online', 0.015000, 'Seattle Data Center'),
('qpu-supreme-002', 'TerraFusion Quantum Supreme Beta', 'Quantum-Supreme', 8192, 3000.000, 3.000, 0.00005, 2097152, 'calibrating', 0.012000, 'San Francisco Data Center'),
('qpu-supreme-003', 'TerraFusion Quantum Supreme Gamma', 'Quantum-Supreme', 16384, 5000.000, 1.000, 0.00001, 4194304, 'upgrading', 0.008000, 'Los Angeles Data Center');

-- Insert quantum algorithms
INSERT INTO quantum_algorithms (
    id, name, version, algorithm_type, complexity_class, qubits_required,
    quantum_advantage_factor, accuracy_percent, status, description
) VALUES 
('qalg-001', 'Quantum Property Valuation Engine (QPVE)', '3.0', 'valuation', 'quantum_advantage', 512, 15847, 99.700, 'production', 'Revolutionary quantum algorithm for simultaneous multi-property valuation with market correlation analysis'),
('qalg-002', 'Quantum Urban Planning Optimizer (QUPO)', '2.5', 'optimization', 'quantum_advantage', 768, 23456, 98.900, 'testing', 'Advanced quantum optimization for city-wide infrastructure planning and resource allocation'),
('qalg-003', 'Quantum Market Prediction System (QMPS)', '4.1', 'prediction', 'quantum_advantage', 1024, 47892, 97.300, 'production', 'Next-generation quantum machine learning for real estate market prediction and trend analysis'),
('qalg-004', 'Quantum Climate Impact Simulator (QCIS)', '1.8', 'simulation', 'quantum_advantage', 2048, 89234, 96.800, 'development', 'Quantum simulation of climate effects on property values and infrastructure resilience'),
('qalg-005', 'Quantum Neural Property Network (QNPN)', '5.0', 'valuation', 'quantum_advantage', 4096, 156789, 99.900, 'optimizing', 'Breakthrough quantum neural network for property assessment with consciousness-level understanding');

-- Insert quantum research projects
INSERT INTO quantum_research_projects (
    id, project_name, research_area, progress_percent, estimated_completion,
    target_qubits, target_advantage, description, team_lead, budget_allocated, status
) VALUES 
('qres-001', 'Quantum Consciousness Networks', 'consciousness', 23.00, '2025-06-30', 8192, 500000, 'Self-aware quantum algorithms for autonomous property assessment', 'Dr. Sarah Chen', 15000000.00, 'active'),
('qres-002', 'Temporal Quantum Computing', 'temporal', 45.00, '2025-09-30', 4096, 750000, 'Time-based quantum algorithms for historical trend analysis', 'Dr. Michael Rodriguez', 12000000.00, 'active'),
('qres-003', 'Quantum Entanglement Networks', 'entanglement', 67.00, '2025-03-31', 16384, 1000000, 'Instantaneous global property data synchronization', 'Dr. Lisa Wang', 20000000.00, 'testing'),
('qres-004', 'Quantum-AI Fusion Cores', 'fusion', 89.00, '2024-12-31', 32768, 2000000, 'Hybrid quantum-classical AI for ultimate performance', 'Dr. James Thompson', 25000000.00, 'testing');

-- Insert initial performance benchmarks
INSERT INTO quantum_supremacy_benchmarks (
    benchmark_name, problem_type, classical_time_seconds, quantum_time_seconds,
    quantum_advantage_factor, problem_size, qubits_used, accuracy_classical, accuracy_quantum, verified
) VALUES 
('Property Valuation Benchmark', 'valuation', 47.200000, 0.003000, 15733, 50000, 512, 87.300, 99.700, TRUE),
('Market Optimization Benchmark', 'optimization', 281.500000, 0.012000, 23458, 100000, 768, 82.100, 98.900, TRUE),
('Risk Prediction Benchmark', 'prediction', 383.100000, 0.008000, 47888, 75000, 1024, 79.400, 97.300, TRUE),
('Climate Simulation Benchmark', 'simulation', 1873.900000, 0.021000, 89233, 200000, 2048, 84.700, 96.800, TRUE);

-- Create views for monitoring and reporting
CREATE VIEW quantum_system_status AS
SELECT 
    COUNT(*) as total_processors,
    SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_processors,
    SUM(qubits) as total_qubits,
    AVG(utilization_percent) as avg_utilization,
    MIN(error_rate) as best_error_rate,
    MAX(quantum_volume) as max_quantum_volume
FROM quantum_processors;

CREATE VIEW algorithm_performance_summary AS
SELECT 
    algorithm_type,
    COUNT(*) as algorithm_count,
    AVG(quantum_advantage_factor) as avg_quantum_advantage,
    AVG(accuracy_percent) as avg_accuracy,
    SUM(CASE WHEN status = 'production' THEN 1 ELSE 0 END) as production_ready
FROM quantum_algorithms
GROUP BY algorithm_type;

CREATE VIEW quantum_supremacy_status AS
SELECT 
    SUM(qa.quantum_advantage_factor) as total_quantum_advantage,
    COUNT(CASE WHEN qa.status = 'production' THEN 1 END) as production_algorithms,
    AVG(qa.accuracy_percent) as avg_accuracy,
    SUM(qp.qubits) as total_available_qubits,
    COUNT(CASE WHEN qp.status = 'online' THEN 1 END) as active_processors
FROM quantum_algorithms qa
CROSS JOIN quantum_processors qp;

COMMIT;
