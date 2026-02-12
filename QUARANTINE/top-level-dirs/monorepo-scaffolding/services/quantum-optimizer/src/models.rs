use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Quantum optimization request
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct QuantumOptimizationRequest {
    pub target_system: String,
    pub optimization_type: OptimizationType,
    pub parameters: OptimizationParameters,
    pub constraints: Vec<OptimizationConstraint>,
    pub priority: OptimizationPriority,
}

/// Types of optimization available
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema, PartialEq, Eq)]
pub enum OptimizationType {
    Performance,
    ResourceUtilization,
    ResponseTime,
    Throughput,
    EnergyEfficiency,
    CostOptimization,
    AISwarmCoordination,
}

/// Optimization parameters
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct OptimizationParameters {
    pub target_improvement: f64,
    pub max_iterations: u32,
    pub convergence_threshold: f64,
    pub quantum_annealing_enabled: bool,
    pub ml_assisted: bool,
}

/// Optimization constraint
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct OptimizationConstraint {
    pub parameter: String,
    pub min_value: f64,
    pub max_value: f64,
    pub weight: f64,
}

/// Optimization priority levels
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema, PartialEq, Eq, PartialOrd, Ord)]
pub enum OptimizationPriority {
    Low,
    Normal,
    High,
    Critical,
    Quantum,
}

/// Quantum optimization response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumOptimizationResponse {
    pub optimization_id: Uuid,
    pub status: OptimizationStatus,
    pub quantum_factor: f64,
    pub performance_improvement: f64,
    pub convergence_score: f64,
    pub iterations_completed: u32,
    pub energy_efficiency_gain: f64,
    pub recommendations: Vec<OptimizationRecommendation>,
    pub quantum_coherence: f64,
}

/// Optimization status
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum OptimizationStatus {
    Queued,
    Running,
    Converged,
    Failed,
    Paused,
    QuantumEnhanced,
}

/// Optimization recommendation
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct OptimizationRecommendation {
    pub parameter: String,
    pub current_value: f64,
    pub recommended_value: f64,
    pub expected_improvement: f64,
    pub confidence: f64,
    pub quantum_enhanced: bool,
}

/// Quantum performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumPerformanceMetrics {
    pub quantum_coherence: f64,
    pub entanglement_strength: f64,
    pub decoherence_time_ms: f64,
    pub quantum_speedup: f64,
    pub error_rate: f64,
    pub fidelity: f64,
}

/// System performance analysis request
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct PerformanceAnalysisRequest {
    pub target_system: String,
    pub metrics: SystemMetrics,
    pub time_window_hours: u32,
    pub include_quantum_analysis: bool,
}

/// System metrics for analysis
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct SystemMetrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub response_time_ms: f64,
    pub throughput_rps: f64,
    pub error_rate: f64,
    pub active_connections: u32,
    pub queue_length: u32,
}

/// Performance analysis response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PerformanceAnalysisResponse {
    pub analysis_id: Uuid,
    pub system_health_score: f64,
    pub optimization_potential: f64,
    pub bottlenecks: Vec<PerformanceBottleneck>,
    pub recommendations: Vec<PerformanceRecommendation>,
    pub predicted_improvements: PredictedImprovements,
    pub quantum_opportunities: Vec<QuantumOpportunity>,
}

/// Performance bottleneck identification
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PerformanceBottleneck {
    pub component: String,
    pub severity: BottleneckSeverity,
    pub impact_score: f64,
    pub description: String,
    pub recommended_action: String,
}

/// Severity of performance bottlenecks
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum BottleneckSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Performance improvement recommendation
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PerformanceRecommendation {
    pub category: RecommendationCategory,
    pub priority: RecommendationPriority,
    pub title: String,
    pub description: String,
    pub implementation_effort: ImplementationEffort,
    pub expected_benefit: f64,
    pub quantum_enhanced: bool,
}

/// Categories of performance recommendations
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum RecommendationCategory {
    Infrastructure,
    Algorithm,
    Database,
    Caching,
    Networking,
    QuantumOptimization,
    AIOptimization,
}

/// Priority levels for recommendations
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq, PartialOrd, Ord)]
pub enum RecommendationPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// Implementation effort estimation
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum ImplementationEffort {
    Minimal,   // < 1 day
    Low,       // 1-3 days
    Medium,    // 1-2 weeks
    High,      // 2-6 weeks
    Extensive, // > 6 weeks
}

/// Predicted performance improvements
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PredictedImprovements {
    pub response_time_reduction_percent: f64,
    pub throughput_increase_percent: f64,
    pub resource_efficiency_gain_percent: f64,
    pub cost_reduction_percent: f64,
    pub energy_savings_percent: f64,
}

/// Quantum computing optimization opportunity
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumOpportunity {
    pub algorithm: String,
    pub use_case: String,
    pub expected_speedup: f64,
    pub quantum_advantage: bool,
    pub implementation_complexity: QuantumComplexity,
    pub description: String,
}

/// Quantum implementation complexity levels
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum QuantumComplexity {
    Basic,       // Basic quantum algorithms
    Intermediate, // Variational algorithms
    Advanced,    // Complex quantum circuits
    Research,    // Cutting-edge quantum methods
}

/// Quantum algorithm execution request
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct QuantumAlgorithmRequest {
    pub algorithm_id: String,
    pub parameters: HashMap<String, f64>,
    pub target_qubits: u32,
    pub max_iterations: u32,
    pub error_correction: bool,
}

/// Quantum algorithm execution response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumAlgorithmResponse {
    pub execution_id: Uuid,
    pub algorithm_id: String,
    pub status: QuantumExecutionStatus,
    pub result: QuantumResult,
    pub performance_metrics: QuantumExecutionMetrics,
    pub quantum_state_info: QuantumStateInfo,
}

/// Quantum execution status
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum QuantumExecutionStatus {
    Initialized,
    Running,
    Completed,
    Failed,
    Timeout,
}

/// Quantum algorithm result
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumResult {
    pub optimization_score: f64,
    pub convergence_achieved: bool,
    pub iterations_completed: u32,
    pub quantum_advantage_factor: f64,
    pub measurement_outcomes: Vec<QuantumMeasurement>,
}

/// Quantum measurement outcome
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumMeasurement {
    pub qubit_index: u32,
    pub measurement_basis: String,
    pub outcome: u8, // 0 or 1
    pub probability: f64,
}

/// Quantum execution performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumExecutionMetrics {
    pub execution_time_ms: f64,
    pub gate_count: u32,
    pub circuit_depth: u32,
    pub fidelity: f64,
    pub error_rate: f64,
    pub decoherence_events: u32,
}

/// Quantum state information
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumStateInfo {
    pub entanglement_measure: f64,
    pub coherence_time_remaining_ms: f64,
    pub quantum_volume_utilized: u32,
    pub error_correction_overhead: f64,
}

/// Quantum processor status
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumProcessorStatus {
    pub processor_id: Uuid,
    pub name: String,
    pub status: ProcessorOperationalStatus,
    pub temperature_mk: f64,
    pub qubit_count: u32,
    pub active_qubits: u32,
    pub coherence_time_ms: f64,
    pub fidelity: f64,
    pub last_calibration: DateTime<Utc>,
    pub utilization_percent: f64,
}

/// Operational status of quantum processors
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum ProcessorOperationalStatus {
    Online,
    Offline,
    Calibrating,
    Maintenance,
    Error,
}

/// Optimization algorithm metadata
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct OptimizationAlgorithm {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: AlgorithmCategory,
    pub complexity: AlgorithmComplexity,
    pub quantum_enhanced: bool,
    pub typical_speedup: f64,
    pub success_rate: f64,
}

/// Categories of optimization algorithms
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum AlgorithmCategory {
    Combinatorial,
    Continuous,
    Discrete,
    Hybrid,
    Quantum,
    MachineLearning,
}

/// Algorithm complexity classification
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum AlgorithmComplexity {
    Linear,
    Polynomial,
    Exponential,
    Quantum,
    Hybrid,
}

/// System health assessment
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SystemHealthAssessment {
    pub overall_health_score: f64,
    pub component_health: Vec<ComponentHealth>,
    pub performance_trends: PerformanceTrends,
    pub optimization_history: OptimizationHistory,
    pub alerts: Vec<SystemAlert>,
}

/// Individual component health status
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ComponentHealth {
    pub component_name: String,
    pub health_score: f64,
    pub status: ComponentStatus,
    pub metrics: HashMap<String, f64>,
    pub last_check: DateTime<Utc>,
}

/// Component operational status
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum ComponentStatus {
    Healthy,
    Warning,
    Critical,
    Failed,
    Unknown,
}

/// Performance trend analysis
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PerformanceTrends {
    pub response_time_trend: TrendDirection,
    pub throughput_trend: TrendDirection,
    pub error_rate_trend: TrendDirection,
    pub resource_usage_trend: TrendDirection,
    pub optimization_effectiveness_trend: TrendDirection,
}

/// Direction of performance trends
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum TrendDirection {
    Improving,
    Stable,
    Degrading,
    Volatile,
    Unknown,
}

/// Historical optimization data
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct OptimizationHistory {
    pub total_optimizations: u32,
    pub successful_optimizations: u32,
    pub average_improvement: f64,
    pub quantum_enhanced_optimizations: u32,
    pub recent_optimizations: Vec<OptimizationSummary>,
}

/// Summary of individual optimization
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct OptimizationSummary {
    pub optimization_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub optimization_type: OptimizationType,
    pub improvement_achieved: f64,
    pub execution_time_ms: f64,
    pub quantum_enhanced: bool,
}

/// System alert information
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SystemAlert {
    pub alert_id: Uuid,
    pub severity: AlertSeverity,
    pub category: AlertCategory,
    pub title: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub acknowledged: bool,
    pub recommended_action: String,
}

/// Alert severity levels
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq, PartialOrd, Ord)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Categories of system alerts
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum AlertCategory {
    Performance,
    Resource,
    Security,
    Quantum,
    Optimization,
    System,
}

/// Government compliance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct GovernmentComplianceMetrics {
    pub fisma_compliance_score: f64,
    pub security_posture: SecurityPosture,
    pub audit_readiness: f64,
    pub data_sovereignty_status: DataSovereigntyStatus,
    pub encryption_coverage: f64,
    pub access_control_effectiveness: f64,
}

/// Security posture assessment
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum SecurityPosture {
    Excellent,
    Good,
    Adequate,
    NeedsImprovement,
    Critical,
}

/// Data sovereignty compliance status
#[derive(Debug, Clone, Serialize, ToSchema, PartialEq, Eq)]
pub enum DataSovereigntyStatus {
    FullyCompliant,
    MostlyCompliant,
    PartiallyCompliant,
    NonCompliant,
    UnderReview,
}
