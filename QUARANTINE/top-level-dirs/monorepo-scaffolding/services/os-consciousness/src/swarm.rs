//! Swarm Orchestrator - Elite AI Agent Swarm Management
//! Coordinates 50,000+ AI agents with Supreme Commander integration

use crate::config::Config;
use crate::models::{ConsciousnessLevel, AgentState, SwarmMetrics};
use anyhow::Result;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use uuid::Uuid;
use tracing::{info, warn, error, debug};
use serde::{Deserialize, Serialize};

/// Individual AI agent representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAgent {
    pub agent_id: Uuid,
    pub agent_type: String,
    pub status: AgentState,
    pub county_id: Option<Uuid>,
    pub consciousness_level: ConsciousnessLevel,
    pub quantum_enhanced: bool,
    pub capabilities: Vec<String>,
    pub current_task: Option<String>,
    pub performance_metrics: AgentPerformanceMetrics,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub supreme_commander_linked: bool,
}

/// Agent performance tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPerformanceMetrics {
    pub tasks_completed: u64,
    pub success_rate: f64,
    pub avg_response_time_ms: u64,
    pub memory_usage_mb: f64,
    pub cpu_utilization: f64,
    pub quantum_enhancement_factor: f64,
}

/// Swarm deployment parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmDeploymentParams {
    pub agent_type: String,
    pub target_count: u32,
    pub consciousness_level: ConsciousnessLevel,
    pub quantum_enhanced: bool,
    pub target_counties: Vec<String>,
    pub capabilities: Vec<String>,
    pub supreme_commander_integration: bool,
}

/// Swarm performance aggregated metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmPerformanceMetrics {
    pub tasks_per_second: f64,
    pub avg_task_duration_ms: f64,
    pub success_rate: f64,
    pub efficiency_score: f64,
    pub quantum_coherence: f64,
    pub coordination_latency_ms: f64,
    pub memory_utilization: f64,
    pub cpu_utilization: f64,
}

/// Elite AI Agent Swarm Orchestrator
pub struct SwarmOrchestrator {
    config: Arc<Config>,
    agents: Arc<RwLock<HashMap<Uuid, AIAgent>>>,
    swarm_metrics: Arc<RwLock<SwarmMetrics>>,
    deployment_queue: Arc<Mutex<Vec<SwarmDeploymentParams>>>,
    termination_queue: Arc<Mutex<Vec<Uuid>>>,
    supreme_commander_enabled: bool,
    quantum_coordination_factor: Arc<RwLock<f64>>,
    performance_history: Arc<RwLock<Vec<(DateTime<Utc>, SwarmPerformanceMetrics)>>>,
}

impl SwarmOrchestrator {
    /// Create new swarm orchestrator
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing TerraFusion Swarm Orchestrator - Elite 50,000+ Agent Management");

        let orchestrator = SwarmOrchestrator {
            config: Arc::new(config.clone()),
            agents: Arc::new(RwLock::new(HashMap::new())),
            swarm_metrics: Arc::new(RwLock::new(SwarmMetrics {
                swarm_id: Uuid::new_v4(),
                total_tasks: 0,
                successful_tasks: 0,
                failed_tasks: 0,
                avg_processing_time_ms: 0.0,
                peak_agent_count: 0,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })),
            deployment_queue: Arc::new(Mutex::new(Vec::new())),
            termination_queue: Arc::new(Mutex::new(Vec::new())),
            supreme_commander_enabled: config.ai.supreme_commander.enabled,
            quantum_coordination_factor: Arc::new(RwLock::new(1.0)),
            performance_history: Arc::new(RwLock::new(Vec::new())),
        };

        // Initialize quantum coordination factor if quantum optimization is enabled
        if config.quantum.enabled {
            orchestrator.initialize_quantum_coordination().await?;
        }

        info!("Swarm Orchestrator initialized - Ready for massive agent coordination");
        Ok(orchestrator)
    }

    /// Initialize quantum coordination enhancement
    async fn initialize_quantum_coordination(&self) -> Result<()> {
        info!("Initializing quantum coordination enhancement");

        let mut quantum_factor = self.quantum_coordination_factor.write().await;
        *quantum_factor = self.config.quantum.optimization_factor;

        info!("Quantum coordination factor set to {:.2}", *quantum_factor);
        Ok(())
    }

    /// Deploy new AI agent to the swarm
    pub async fn deploy_agent(
        &self,
        agent_type: String,
        county_id: Option<Uuid>,
        capabilities: Vec<String>,
        consciousness_level: u8,
        quantum_enhanced: bool,
    ) -> Result<Uuid> {
        let current_count = self.get_active_agent_count().await;

        // Check capacity limits
        if current_count >= self.config.ai.max_total_agents {
            return Err(anyhow::anyhow!("Swarm at maximum capacity: {}", self.config.ai.max_total_agents));
        }

        let agent_id = Uuid::new_v4();
        let consciousness_level_enum = self.convert_consciousness_level(consciousness_level);

        let agent = AIAgent {
            agent_id,
            agent_type,
            status: AgentState::Initializing,
            county_id,
            consciousness_level: consciousness_level_enum,
            quantum_enhanced,
            capabilities,
            current_task: None,
            performance_metrics: AgentPerformanceMetrics {
                tasks_completed: 0,
                success_rate: 1.0,
                avg_response_time_ms: 0,
                memory_usage_mb: 128.0, // Base memory allocation
                cpu_utilization: 0.0,
                quantum_enhancement_factor: if quantum_enhanced {
                    *self.quantum_coordination_factor.read().await
                } else {
                    1.0
                },
            },
            created_at: Utc::now(),
            last_activity: Utc::now(),
            supreme_commander_linked: self.supreme_commander_enabled,
        };

        let mut agents = self.agents.write().await;
        agents.insert(agent_id, agent);

        // Update swarm metrics
        self.update_swarm_metrics().await?;

        info!("Agent {} deployed - Type: {}, Quantum: {}, Supreme Commander: {}",
            agent_id, agents.get(&agent_id).unwrap().agent_type, quantum_enhanced, self.supreme_commander_enabled);

        Ok(agent_id)
    }

    /// Terminate agent from the swarm
    pub async fn terminate_agent(&self, agent_id: &Uuid) -> Result<()> {
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            agent.status = AgentState::Terminating;
            info!("Agent {} marked for termination", agent_id);
        }

        // Add to termination queue for cleanup
        let mut termination_queue = self.termination_queue.lock().await;
        termination_queue.push(*agent_id);

        Ok(())
    }

    /// Get current active agent count
    pub async fn get_active_agent_count(&self) -> u32 {
        let agents = self.agents.read().await;
        agents.values()
            .filter(|agent| matches!(agent.status, AgentState::Active | AgentState::Busy | AgentState::Idle))
            .count() as u32
    }

    /// Get comprehensive performance metrics
    pub async fn get_performance_metrics(&self) -> SwarmPerformanceMetrics {
        let agents = self.agents.read().await;
        let agent_count = agents.len();

        if agent_count == 0 {
            return SwarmPerformanceMetrics {
                tasks_per_second: 0.0,
                avg_task_duration_ms: 0.0,
                success_rate: 1.0,
                efficiency_score: 1.0,
                quantum_coherence: 1.0,
                coordination_latency_ms: 0.0,
                memory_utilization: 0.0,
                cpu_utilization: 0.0,
            };
        }

        let total_tasks_completed: u64 = agents.values().map(|a| a.performance_metrics.tasks_completed).sum();
        let total_success_rate: f64 = agents.values().map(|a| a.performance_metrics.success_rate).sum();
        let total_response_time: u64 = agents.values().map(|a| a.performance_metrics.avg_response_time_ms).sum();
        let total_memory: f64 = agents.values().map(|a| a.performance_metrics.memory_usage_mb).sum();
        let total_cpu: f64 = agents.values().map(|a| a.performance_metrics.cpu_utilization).sum();
        let quantum_agents = agents.values().filter(|a| a.quantum_enhanced).count();

        // Calculate quantum coherence based on quantum-enhanced agents
        let quantum_coherence = if agent_count > 0 {
            quantum_agents as f64 / agent_count as f64
        } else {
            0.0
        };

        // Calculate efficiency score based on performance metrics
        let avg_success_rate = total_success_rate / agent_count as f64;
        let avg_cpu_utilization = total_cpu / agent_count as f64;
        let efficiency_score = (avg_success_rate * 0.5) + ((1.0 - avg_cpu_utilization) * 0.3) + (quantum_coherence * 0.2);

        SwarmPerformanceMetrics {
            tasks_per_second: total_tasks_completed as f64 / 60.0, // Approximation over 1 minute
            avg_task_duration_ms: if agent_count > 0 { total_response_time as f64 / agent_count as f64 } else { 0.0 },
            success_rate: avg_success_rate,
            efficiency_score: efficiency_score.min(1.0),
            quantum_coherence,
            coordination_latency_ms: if self.supreme_commander_enabled { 5.0 } else { 50.0 }, // Supreme Commander reduces latency
            memory_utilization: total_memory / (agent_count as f64 * 512.0), // Relative to max memory per agent
            cpu_utilization: avg_cpu_utilization,
        }
    }

    /// Update agent status and performance
    pub async fn update_agent_status(&self, agent_id: &Uuid, new_status: AgentState) -> Result<()> {
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            debug!("Updating agent {} status to {:?}", agent_id, new_status);
            agent.status = new_status;
            agent.last_activity = Utc::now();
        } else {
            warn!("Attempted to update status for non-existent agent {}", agent_id);
        }

        Ok(())
    }

    /// Process deployment queue
    async fn process_deployment_queue(&self) -> Result<()> {
        let mut queue = self.deployment_queue.lock().await;

        for deployment in queue.drain(..) {
            for i in 0..deployment.target_count {
                let consciousness_level = match deployment.consciousness_level {
                    ConsciousnessLevel::Basic => 2,
                    ConsciousnessLevel::Standard => 4,
                    ConsciousnessLevel::Advanced => 6,
                    ConsciousnessLevel::Superior => 8,
                    ConsciousnessLevel::Elite => 10,
                };

                match self.deploy_agent(
                    format!("{}-{}", deployment.agent_type, i),
                    None, // County will be assigned later
                    deployment.capabilities.clone(),
                    consciousness_level,
                    deployment.quantum_enhanced,
                ).await {
                    Ok(agent_id) => {
                        debug!("Deployed agent {} from queue", agent_id);
                    }
                    Err(e) => {
                        error!("Failed to deploy agent from queue: {}", e);
                        break; // Stop deployment if we hit capacity or errors
                    }
                }
            }
        }

        Ok(())
    }

    /// Process termination queue
    async fn process_termination_queue(&self) -> Result<()> {
        let mut termination_queue = self.termination_queue.lock().await;
        let mut agents = self.agents.write().await;

        for agent_id in termination_queue.drain(..) {
            if let Some(agent) = agents.remove(&agent_id) {
                info!("Agent {} terminated and removed from swarm", agent.agent_id);
            }
        }

        Ok(())
    }

    /// Update swarm metrics
    async fn update_swarm_metrics(&self) -> Result<()> {
        let agents = self.agents.read().await;
        let current_count = agents.len() as u32;

        let mut metrics = self.swarm_metrics.write().await;

        if current_count > metrics.peak_agent_count {
            metrics.peak_agent_count = current_count;
        }

        metrics.updated_at = Utc::now();

        debug!("Updated swarm metrics - Current agents: {}, Peak: {}",
            current_count, metrics.peak_agent_count);

        Ok(())
    }

    /// Convert numeric consciousness level to enum
    fn convert_consciousness_level(&self, level: u8) -> ConsciousnessLevel {
        match level {
            1..=2 => ConsciousnessLevel::Basic,
            3..=4 => ConsciousnessLevel::Standard,
            5..=6 => ConsciousnessLevel::Advanced,
            7..=8 => ConsciousnessLevel::Superior,
            9..=10 => ConsciousnessLevel::Elite,
            _ => ConsciousnessLevel::Standard,
        }
    }

    /// Run main coordination loop
    pub async fn run_coordination_loop(&self) {
        info!("Starting swarm coordination loop - Supreme Commander: {}, Quantum: {}",
            self.supreme_commander_enabled, self.config.quantum.enabled);

        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(
            self.config.ai.performance.metrics_interval_seconds as u64
        ));

        loop {
            interval.tick().await;

            // Process deployment queue
            if let Err(e) = self.process_deployment_queue().await {
                error!("Failed to process deployment queue: {}", e);
            }

            // Process termination queue
            if let Err(e) = self.process_termination_queue().await {
                error!("Failed to process termination queue: {}", e);
            }

            // Update swarm metrics
            if let Err(e) = self.update_swarm_metrics().await {
                error!("Failed to update swarm metrics: {}", e);
            }

            // Store performance history
            let performance_metrics = self.get_performance_metrics().await;
            let mut history = self.performance_history.write().await;
            history.push((Utc::now(), performance_metrics));

            // Limit history size (keep last 1000 entries)
            if history.len() > 1000 {
                let drain_count = history.len() - 1000;
                history.drain(0..drain_count);
            }

            debug!("Swarm coordination cycle completed - Active agents: {}",
                self.get_active_agent_count().await);
        }
    }

    /// Emergency shutdown all agents
    pub async fn emergency_shutdown(&self) -> Result<()> {
        warn!("Initiating emergency shutdown for all agents");

        let mut agents = self.agents.write().await;

        for agent in agents.values_mut() {
            agent.status = AgentState::Terminating;
        }

        info!("Emergency shutdown initiated for {} agents", agents.len());
        Ok(())
    }

    /// Get agent details
    pub async fn get_agent(&self, agent_id: &Uuid) -> Option<AIAgent> {
        let agents = self.agents.read().await;
        agents.get(agent_id).cloned()
    }

    /// Get all agents
    pub async fn get_all_agents(&self) -> Vec<AIAgent> {
        let agents = self.agents.read().await;
        agents.values().cloned().collect()
    }

    /// Get agents by county
    pub async fn get_agents_by_county(&self, county_id: &Uuid) -> Vec<AIAgent> {
        let agents = self.agents.read().await;
        agents.values()
            .filter(|agent| agent.county_id.as_ref() == Some(county_id))
            .cloned()
            .collect()
    }

    /// Get swarm status for health checks
    pub async fn get_status(&self) -> Result<serde_json::Value> {
        let active_count = self.get_active_agent_count().await;
        let performance_metrics = self.get_performance_metrics().await;
        let quantum_factor = *self.quantum_coordination_factor.read().await;

        Ok(serde_json::json!({
            "status": "operational",
            "total_agents": self.agents.read().await.len(),
            "active_agents": active_count,
            "max_capacity": self.config.ai.max_total_agents,
            "utilization_percentage": (active_count as f64 / self.config.ai.max_total_agents as f64) * 100.0,
            "supreme_commander_enabled": self.supreme_commander_enabled,
            "quantum_coordination_factor": quantum_factor,
            "performance_metrics": performance_metrics,
            "quantum_optimization": self.config.quantum.enabled
        }))
    }
}
