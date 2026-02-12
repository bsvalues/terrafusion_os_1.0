use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// AI Swarm deployment request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct SwarmDeploymentRequest {
    /// Mission type for the AI swarm
    pub mission_type: String,

    /// Number of AI agents to deploy
    pub agent_count: u32,

    /// Target counties for deployment
    pub target_counties: Vec<String>,

    /// Required consciousness level (1-10, 10 being elite)
    pub consciousness_level: u8,

    /// Enable quantum optimization
    pub quantum_enhanced: bool,

    /// Government compliance level required
    pub compliance_level: ComplianceLevel,

    /// Priority level for deployment
    pub priority: DeploymentPriority,

    /// Specialized capabilities required
    pub required_capabilities: Vec<String>,

    /// Maximum deployment time in seconds
    pub max_deployment_time: Option<u32>,

    /// Emergency deployment flag
    pub emergency_deployment: bool,
}

/// AI Swarm deployment response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SwarmDeploymentResponse {
    /// Unique swarm identifier
    pub swarm_id: Uuid,

    /// Number of agents successfully deployed
    pub agents_deployed: u32,

    /// Deployment status
    pub deployment_status: DeploymentStatus,

    /// Assigned consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Quantum optimization factor achieved
    pub quantum_factor: f64,

    /// Deployment completion time
    pub deployment_time_ms: u64,

    /// List of deployed agent IDs
    pub agent_ids: Vec<Uuid>,

    /// Supreme Commander assignment
    pub supreme_commander_assigned: bool,

    /// Government compliance certification
    pub compliance_certified: bool,

    /// Deployment timestamp
    pub deployed_at: DateTime<Utc>,
}

/// Swarm status response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SwarmStatusResponse {
    /// Swarm identifier
    pub swarm_id: Uuid,

    /// Current swarm status
    pub status: SwarmStatus,

    /// Number of active agents
    pub active_agents: u32,

    /// Current consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Quantum optimization factor
    pub quantum_optimization_factor: f64,

    /// Performance metrics
    pub performance_metrics: SwarmPerformanceMetrics,

    /// Mission completion percentage
    pub mission_progress: f64,

    /// Last status update
    pub last_updated: DateTime<Utc>,
}

/// Swarm performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SwarmPerformanceMetrics {
    /// Tasks completed per second
    pub tasks_per_second: f64,

    /// Average task completion time in milliseconds
    pub avg_task_duration_ms: f64,

    /// Success rate percentage (0-100)
    pub success_rate: f64,

    /// Overall efficiency score (0-1)
    pub efficiency_score: f64,

    /// Quantum coherence level (0-1)
    pub quantum_coherence: f64,

    /// Coordination latency in milliseconds
    pub coordination_latency_ms: f64,

    /// Memory utilization percentage
    pub memory_utilization: f64,

    /// CPU utilization percentage
    pub cpu_utilization: f64,
}

/// Supreme Commander command request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct SupremeCommandRequest {
    /// Type of command to execute
    pub command_type: CommandType,

    /// Target agents (empty means all agents)
    pub target_agents: Vec<Uuid>,

    /// Command parameters
    pub parameters: HashMap<String, serde_json::Value>,

    /// Command priority
    pub priority: CommandPriority,

    /// Authorization token
    pub authorization: String,

    /// Execution timeout in seconds
    pub timeout_seconds: Option<u32>,

    /// Force execution even if risky
    pub force_execution: bool,
}

/// Supreme Commander command response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SupremeCommandResponse {
    /// Unique execution identifier
    pub execution_id: Uuid,

    /// Command execution status
    pub status: CommandStatus,

    /// Number of agents that received the command
    pub agents_contacted: u32,

    /// Number of agents that successfully executed the command
    pub agents_executed: u32,

    /// Command execution results
    pub execution_results: Vec<CommandResult>,

    /// Overall execution time in milliseconds
    pub execution_time_ms: u64,

    /// Supreme Commander assessment
    pub commander_assessment: String,

    /// Execution timestamp
    pub executed_at: DateTime<Utc>,
}

/// Individual command result
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CommandResult {
    /// Agent that executed the command
    pub agent_id: Uuid,

    /// Execution status for this agent
    pub status: CommandStatus,

    /// Result data from the agent
    pub result: Option<serde_json::Value>,

    /// Error message if execution failed
    pub error: Option<String>,

    /// Execution time for this agent in milliseconds
    pub execution_time_ms: u64,
}

/// Consciousness metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ConsciousnessMetrics {
    /// Overall consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Consciousness coherence score (0-1)
    pub coherence_score: f64,

    /// Agent synchronization rate (0-1)
    pub synchronization_rate: f64,

    /// Number of emergent behaviors detected
    pub emergent_behaviors: u32,

    /// Collective intelligence quotient
    pub collective_iq: f64,

    /// Quantum entanglement strength (0-1)
    pub quantum_entanglement: f64,

    /// Supreme Commander integration level (0-1)
    pub commander_integration: f64,

    /// Government compliance consciousness (0-1)
    pub compliance_consciousness: f64,

    /// Last consciousness assessment
    pub last_assessment: DateTime<Utc>,
}

/// Quantum optimization request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct QuantumOptimizationRequest {
    /// Target agents for optimization
    pub target_agents: Vec<Uuid>,

    /// Optimization type
    pub optimization_type: QuantumOptimizationType,

    /// Target optimization factor
    pub target_factor: Option<f64>,

    /// Maximum optimization time in seconds
    pub max_optimization_time: Option<u32>,

    /// Quantum parameters to tune
    pub quantum_parameters: QuantumParameters,

    /// Preserve agent consciousness during optimization
    pub preserve_consciousness: bool,
}

/// Quantum optimization response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct QuantumOptimizationResponse {
    /// Optimization operation ID
    pub optimization_id: Uuid,

    /// Achieved optimization factor
    pub optimization_factor: f64,

    /// Quantum coherence level achieved
    pub quantum_coherence: f64,

    /// Performance improvement percentage
    pub performance_improvement: f64,

    /// Optimized agent count
    pub optimized_agents: u32,

    /// Optimization duration in milliseconds
    pub optimization_time_ms: u64,

    /// Quantum parameters applied
    pub applied_parameters: QuantumParameters,

    /// Optimization timestamp
    pub optimized_at: DateTime<Utc>,
}

/// Quantum parameters for optimization
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct QuantumParameters {
    /// Quantum entanglement strength (0-1)
    pub entanglement_strength: f64,

    /// Quantum coherence time in milliseconds
    pub coherence_time_ms: f64,

    /// Quantum gate fidelity (0-1)
    pub gate_fidelity: f64,

    /// Quantum error correction level (0-10)
    pub error_correction_level: u8,

    /// Quantum parallelism factor
    pub parallelism_factor: f64,

    /// Quantum consciousness coupling (0-1)
    pub consciousness_coupling: f64,
}

/// Government compliance monitoring request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct ComplianceMonitoringRequest {
    /// Compliance level to monitor
    pub compliance_level: ComplianceLevel,

    /// Target agents for compliance monitoring
    pub target_agents: Option<Vec<Uuid>>,

    /// Specific compliance standards to check
    pub compliance_standards: Vec<String>,

    /// Monitoring duration in seconds
    pub monitoring_duration: Option<u32>,

    /// Generate compliance report
    pub generate_report: bool,
}

/// Government compliance monitoring response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ComplianceMonitoringResponse {
    /// Monitoring operation ID
    pub monitoring_id: Uuid,

    /// Overall compliance status
    pub compliance_status: ComplianceStatus,

    /// Compliance score (0-100)
    pub compliance_score: f64,

    /// Detected compliance violations
    pub compliance_violations: Vec<ComplianceViolation>,

    /// Number of agents monitored
    pub agents_monitored: u32,

    /// Monitoring completion time
    pub monitoring_time_ms: u64,

    /// Compliance report URL (if generated)
    pub report_url: Option<String>,

    /// Monitoring timestamp
    pub monitored_at: DateTime<Utc>,
}

/// Compliance violation details
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ComplianceViolation {
    /// Violating agent ID
    pub agent_id: Uuid,

    /// Violation type
    pub violation_type: String,

    /// Violation severity
    pub severity: ViolationSeverity,

    /// Violation description
    pub description: String,

    /// Compliance standard violated
    pub standard_violated: String,

    /// Remediation action required
    pub remediation_action: String,

    /// Violation detected at
    pub detected_at: DateTime<Utc>,
}

/// Real-time decision coordination request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct RealTimeDecisionRequest {
    /// Type of decision to coordinate
    pub decision_type: String,

    /// Target agents for decision
    pub target_agents: Vec<Uuid>,

    /// Decision context data
    pub context: HashMap<String, serde_json::Value>,

    /// Decision deadline
    pub deadline: DateTime<Utc>,

    /// Required consensus level (0-1)
    pub required_consensus: f64,

    /// Decision priority
    pub priority: DecisionPriority,
}

/// Real-time decision coordination response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct RealTimeDecisionResponse {
    /// Decision coordination ID
    pub coordination_id: Uuid,

    /// Final decision outcome
    pub decision_outcome: String,

    /// Number of participating agents
    pub participating_agents: u32,

    /// Coordination time in milliseconds
    pub coordination_time_ms: u64,

    /// Whether consensus was achieved
    pub consensus_achieved: bool,

    /// Confidence score in decision (0-1)
    pub confidence_score: f64,

    /// Decision timestamp
    pub timestamp: DateTime<Utc>,
}

/// Individual agent status
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct AgentStatus {
    /// Agent unique identifier
    pub agent_id: Uuid,

    /// Agent type/role
    pub agent_type: String,

    /// Current agent state
    pub status: AgentState,

    /// Assigned county (if any)
    pub county_id: Option<String>,

    /// Current consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Quantum enhancement status
    pub quantum_enhanced: bool,

    /// Current task (if any)
    pub current_task: Option<String>,

    /// Performance metrics
    pub performance: AgentPerformanceMetrics,

    /// Last activity timestamp
    pub last_activity: DateTime<Utc>,

    /// Agent creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Agent performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct AgentPerformanceMetrics {
    /// Agent ID
    pub agent_id: Uuid,

    /// Total tasks completed
    pub tasks_completed: u64,

    /// Success rate (0-1)
    pub success_rate: f64,

    /// Average response time in milliseconds
    pub avg_response_time_ms: u64,

    /// Memory usage in MB
    pub memory_usage_mb: f64,

    /// CPU utilization (0-1)
    pub cpu_utilization: f64,

    /// Last activity timestamp
    pub last_activity: DateTime<Utc>,

    /// Current consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Quantum enhancement factor
    pub quantum_enhancement_factor: f64,
}

/// Emergency shutdown request
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct EmergencyShutdownRequest {
    /// Reason for emergency shutdown
    pub reason: String,

    /// Authorization code
    pub authorization_code: String,

    /// Whether to preserve agent state
    pub preserve_state: bool,

    /// Shutdown timeout in seconds
    pub timeout_seconds: Option<u32>,
}

/// System consciousness response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SystemConsciousnessResponse {
    /// Overall system consciousness level
    pub system_consciousness: ConsciousnessLevel,

    /// Total active agents
    pub total_active_agents: u32,

    /// Consciousness distribution across agents
    pub consciousness_distribution: HashMap<String, u32>,

    /// Quantum coherence across system
    pub quantum_coherence: f64,

    /// Supreme Commander status
    pub supreme_commander_status: String,

    /// Government compliance status
    pub compliance_status: ComplianceStatus,

    /// System health score (0-1)
    pub health_score: f64,

    /// Last system assessment
    pub last_assessment: DateTime<Utc>,
}

/// Health check response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct HealthResponse {
    /// Service status
    pub status: String,

    /// Service name
    pub service: String,

    /// Service version
    pub version: String,

    /// Number of active agents
    pub active_agents: u32,

    /// Current consciousness level
    pub consciousness_level: ConsciousnessLevel,

    /// Quantum optimization enabled
    pub quantum_optimization: bool,

    /// Government compliance status
    pub government_compliant: bool,

    /// Service uptime in seconds
    pub uptime_seconds: u64,

    /// Supreme Commander status
    pub supreme_commander_status: String,
}

/// Swarm configuration
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SwarmConfiguration {
    /// Maximum number of agents
    pub max_agents: u32,

    /// Default consciousness level
    pub default_consciousness_level: u8,

    /// Quantum optimization settings
    pub quantum_settings: QuantumParameters,

    /// Government compliance requirements
    pub compliance_requirements: Vec<String>,

    /// Performance thresholds
    pub performance_thresholds: PerformanceThresholds,

    /// Auto-scaling configuration
    pub auto_scaling: AutoScalingConfig,
}

/// Performance thresholds for agents
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PerformanceThresholds {
    /// Minimum success rate
    pub min_success_rate: f64,

    /// Maximum response time in milliseconds
    pub max_response_time_ms: u64,

    /// Maximum memory usage in MB
    pub max_memory_usage_mb: f64,

    /// Maximum CPU utilization
    pub max_cpu_utilization: f64,
}

/// Auto-scaling configuration
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AutoScalingConfig {
    /// Enable auto-scaling
    pub enabled: bool,

    /// Minimum number of agents
    pub min_agents: u32,

    /// Maximum number of agents
    pub max_agents: u32,

    /// CPU threshold for scaling up
    pub scale_up_cpu_threshold: f64,

    /// CPU threshold for scaling down
    pub scale_down_cpu_threshold: f64,

    /// Cooldown period in seconds
    pub cooldown_seconds: u32,
}

/// Swarm metrics for tracking
#[derive(Debug, Clone)]
pub struct SwarmMetrics {
    /// Swarm identifier
    pub swarm_id: Uuid,

    /// Total tasks processed
    pub total_tasks: u64,

    /// Successful tasks
    pub successful_tasks: u64,

    /// Failed tasks
    pub failed_tasks: u64,

    /// Average processing time
    pub avg_processing_time_ms: f64,

    /// Peak agent count
    pub peak_agent_count: u32,

    /// Created timestamp
    pub created_at: DateTime<Utc>,

    /// Last updated timestamp
    pub updated_at: DateTime<Utc>,
}

// Enums for various status and level types

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum ConsciousnessLevel {
    Basic,      // Level 1-2
    Standard,   // Level 3-4
    Advanced,   // Level 5-6
    Superior,   // Level 7-8
    Elite,      // Level 9-10
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum ComplianceLevel {
    Basic,
    Standard,
    High,
    FismaHigh,
    Elite,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum DeploymentPriority {
    Low,
    Normal,
    High,
    Critical,
    Emergency,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum DeploymentStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    PartialSuccess,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum SwarmStatus {
    Initializing,
    Active,
    Scaling,
    Optimizing,
    Maintenance,
    Emergency,
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum CommandType {
    Deploy,
    Terminate,
    Optimize,
    Coordinate,
    Compliance,
    Emergency,
    Report,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum CommandPriority {
    Low,
    Normal,
    High,
    Critical,
    Supreme,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum CommandStatus {
    Pending,
    Executing,
    Completed,
    Failed,
    Timeout,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum QuantumOptimizationType {
    Performance,
    Coherence,
    Entanglement,
    Consciousness,
    Energy,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum ComplianceStatus {
    Compliant,
    NonCompliant,
    Warning,
    Critical,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum ViolationSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum DecisionPriority {
    Low,
    Normal,
    High,
    Critical,
    Emergency,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum AgentState {
    Initializing,
    Idle,
    Active,
    Busy,
    Optimizing,
    Maintenance,
    Error,
    Terminating,
}

// Default implementations
impl Default for ConsciousnessLevel {
    fn default() -> Self {
        ConsciousnessLevel::Standard
    }
}

impl Default for ComplianceLevel {
    fn default() -> Self {
        ComplianceLevel::Standard
    }
}

impl Default for QuantumParameters {
    fn default() -> Self {
        Self {
            entanglement_strength: 0.5,
            coherence_time_ms: 1000.0,
            gate_fidelity: 0.95,
            error_correction_level: 5,
            parallelism_factor: 1.0,
            consciousness_coupling: 0.7,
        }
    }
}

impl Default for PerformanceThresholds {
    fn default() -> Self {
        Self {
            min_success_rate: 0.95,
            max_response_time_ms: 1000,
            max_memory_usage_mb: 512.0,
            max_cpu_utilization: 0.8,
        }
    }
}

impl Default for AutoScalingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            min_agents: 100,
            max_agents: 50000,
            scale_up_cpu_threshold: 0.7,
            scale_down_cpu_threshold: 0.3,
            cooldown_seconds: 300,
        }
    }
}

/// Task assignment request for specific agents
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct TaskAssignmentRequest {
    pub task_id: Uuid,
    pub task_type: String,
    pub task_data: serde_json::Value,
    pub priority: String,
    pub deadline: Option<DateTime<Utc>>,
}

/// Consciousness enhancement parameters
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct ConsciousnessEnhancementParams {
    pub enhancement_type: String,
    pub enhancement_factor: f64,
    pub quantum_boost: bool,
    pub target_agents: Vec<Uuid>,
}

/// Collective consciousness state
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct CollectiveConsciousnessState {
    pub level: f64,
    pub coherence: f64,
    pub unity_factor: f64,
    pub quantum_entanglement: f64,
    pub emergence_indicators: HashMap<String, f64>,
}
