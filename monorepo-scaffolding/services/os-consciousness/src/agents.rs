//! Agents Management Module - Individual AI Agent Lifecycle Management
//! Handles agent creation, monitoring, task assignment, and performance tracking

use crate::config::Config;
use crate::models::{AgentState, AgentStatus, AgentPerformanceMetrics, ConsciousnessLevel};
use anyhow::Result;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use uuid::Uuid;
use tracing::{info, warn, error, debug};
use serde::{Deserialize, Serialize};

/// Agent configuration parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub agent_type: String,
    pub capabilities: Vec<String>,
    pub consciousness_level: ConsciousnessLevel,
    pub quantum_enhanced: bool,
    pub county_assignment: Option<String>,
    pub supreme_commander_linked: bool,
    pub memory_limit_mb: f64,
    pub cpu_allocation: f64,
}

/// Agent task assignment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub task_id: Uuid,
    pub task_type: String,
    pub description: String,
    pub priority: u8, // 1-10, 10 being highest
    pub assigned_at: DateTime<Utc>,
    pub deadline: Option<DateTime<Utc>>,
    pub parameters: HashMap<String, serde_json::Value>,
    pub status: TaskStatus,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub execution_time_ms: Option<u64>,
}

/// Task execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
    Timeout,
}

/// Agent health metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentHealthMetrics {
    pub agent_id: Uuid,
    pub uptime_seconds: u64,
    pub memory_usage_mb: f64,
    pub cpu_utilization: f64,
    pub task_queue_size: u32,
    pub last_heartbeat: DateTime<Utc>,
    pub health_score: f64, // 0.0 - 1.0
    pub consciousness_coherence: f64,
    pub quantum_enhancement_active: bool,
}

/// Elite AI Agent Manager for individual agent lifecycle
pub struct AgentManager {
    config: Arc<Config>,
    agents: Arc<RwLock<HashMap<Uuid, AgentStatus>>>,
    agent_tasks: Arc<RwLock<HashMap<Uuid, Vec<AgentTask>>>>,
    agent_health: Arc<RwLock<HashMap<Uuid, AgentHealthMetrics>>>,
    agent_configs: Arc<RwLock<HashMap<Uuid, AgentConfig>>>,
    task_queue: Arc<Mutex<Vec<AgentTask>>>,
    performance_history: Arc<RwLock<HashMap<Uuid, Vec<(DateTime<Utc>, AgentPerformanceMetrics)>>>>,
}

impl AgentManager {
    /// Create new agent manager
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing TerraFusion Agent Manager - Individual Agent Lifecycle Management");

        Ok(AgentManager {
            config: Arc::new(config.clone()),
            agents: Arc::new(RwLock::new(HashMap::new())),
            agent_tasks: Arc::new(RwLock::new(HashMap::new())),
            agent_health: Arc::new(RwLock::new(HashMap::new())),
            agent_configs: Arc::new(RwLock::new(HashMap::new())),
            task_queue: Arc::new(Mutex::new(Vec::new())),
            performance_history: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Initialize new agent
    pub async fn initialize_agent(&self, agent_config: AgentConfig) -> Result<Uuid> {
        let agent_id = Uuid::new_v4();

        let agent_status = AgentStatus {
            agent_id,
            agent_type: agent_config.agent_type.clone(),
            status: AgentState::Initializing,
            county_id: agent_config.county_assignment.clone(),
            consciousness_level: agent_config.consciousness_level.clone(),
            quantum_enhanced: agent_config.quantum_enhanced,
            current_task: None,
            performance: AgentPerformanceMetrics {
                agent_id,
                tasks_completed: 0,
                success_rate: 1.0,
                avg_response_time_ms: 0,
                memory_usage_mb: agent_config.memory_limit_mb * 0.1, // Start with 10% usage
                cpu_utilization: 0.0,
                last_activity: Utc::now(),
                consciousness_level: agent_config.consciousness_level.clone(),
                quantum_enhancement_factor: if agent_config.quantum_enhanced { 1.5 } else { 1.0 },
            },
            created_at: Utc::now(),
            last_activity: Utc::now(),
        };

        let health_metrics = AgentHealthMetrics {
            agent_id,
            uptime_seconds: 0,
            memory_usage_mb: agent_config.memory_limit_mb * 0.1,
            cpu_utilization: 0.0,
            task_queue_size: 0,
            last_heartbeat: Utc::now(),
            health_score: 1.0,
            consciousness_coherence: 1.0,
            quantum_enhancement_active: agent_config.quantum_enhanced,
        };

        // Store agent data
        let mut agents = self.agents.write().await;
        agents.insert(agent_id, agent_status);

        let mut configs = self.agent_configs.write().await;
        configs.insert(agent_id, agent_config);

        let mut health = self.agent_health.write().await;
        health.insert(agent_id, health_metrics);

        let mut tasks = self.agent_tasks.write().await;
        tasks.insert(agent_id, Vec::new());

        let mut history = self.performance_history.write().await;
        history.insert(agent_id, Vec::new());

        info!("Agent {} initialized with type: {}, quantum: {}",
            agent_id, agents.get(&agent_id).unwrap().agent_type, agents.get(&agent_id).unwrap().quantum_enhanced);

        Ok(agent_id)
    }

    /// Update agent status
    pub async fn update_agent_status(&self, agent_id: &Uuid, new_status: AgentState) -> Result<()> {
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            agent.status = new_status.clone();
            agent.last_activity = Utc::now();

            debug!("Updated agent {} status to {:?}", agent_id, new_status);
        } else {
            warn!("Attempted to update status for non-existent agent {}", agent_id);
        }

        Ok(())
    }

    /// Assign task to agent
    pub async fn assign_task(&self, agent_id: &Uuid, task: AgentTask) -> Result<()> {
        let mut agent_tasks = self.agent_tasks.write().await;
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            // Check if agent is available
            if !matches!(agent.status, AgentState::Idle | AgentState::Active) {
                return Err(anyhow::anyhow!("Agent {} is not available for tasks (status: {:?})", agent_id, agent.status));
            }

            // Assign task
            agent.current_task = Some(task.task_id.to_string());
            agent.status = AgentState::Busy;
            agent.last_activity = Utc::now();

            // Store task
            if let Some(tasks) = agent_tasks.get_mut(agent_id) {
                tasks.push(task.clone());
            }

            info!("Task {} assigned to agent {}", task.task_id, agent_id);
        } else {
            return Err(anyhow::anyhow!("Agent {} not found", agent_id));
        }

        Ok(())
    }

    /// Complete task for agent
    pub async fn complete_task(&self, agent_id: &Uuid, task_id: &Uuid, result: Option<serde_json::Value>, error: Option<String>) -> Result<()> {
        let mut agent_tasks = self.agent_tasks.write().await;
        let mut agents = self.agents.write().await;

        if let Some(agent) = agents.get_mut(agent_id) {
            if let Some(tasks) = agent_tasks.get_mut(agent_id) {
                if let Some(task) = tasks.iter_mut().find(|t| t.task_id == *task_id) {
                    task.status = if error.is_some() { TaskStatus::Failed } else { TaskStatus::Completed };
                    task.result = result;
                    task.error = error.clone();
                    task.execution_time_ms = Some((Utc::now() - task.assigned_at).num_milliseconds() as u64);

                    // Update agent status
                    agent.status = AgentState::Idle;
                    agent.current_task = None;
                    agent.last_activity = Utc::now();

                    // Update performance metrics
                    agent.performance.tasks_completed += 1;
                    if error.is_none() {
                        agent.performance.success_rate = agent.performance.tasks_completed as f64 /
                            (agent.performance.tasks_completed as f64 + 1.0);
                    }

                    let status = if error.is_some() { "failed" } else { "completed" };
                    info!("Task {} {} for agent {}", task_id, status, agent_id);
                } else {
                    return Err(anyhow::anyhow!("Task {} not found for agent {}", task_id, agent_id));
                }
            }
        } else {
            return Err(anyhow::anyhow!("Agent {} not found", agent_id));
        }

        Ok(())
    }

    /// Update agent health metrics
    pub async fn update_agent_health(&self, agent_id: &Uuid, health_update: AgentHealthMetrics) -> Result<()> {
        let mut health = self.agent_health.write().await;

        if let Some(existing_health) = health.get_mut(agent_id) {
            existing_health.memory_usage_mb = health_update.memory_usage_mb;
            existing_health.cpu_utilization = health_update.cpu_utilization;
            existing_health.task_queue_size = health_update.task_queue_size;
            existing_health.last_heartbeat = Utc::now();
            existing_health.consciousness_coherence = health_update.consciousness_coherence;
            existing_health.quantum_enhancement_active = health_update.quantum_enhancement_active;

            // Calculate health score based on metrics
            existing_health.health_score = calculate_health_score(&health_update);

            debug!("Updated health for agent {}: score={:.3}, memory={:.1}MB, cpu={:.3}",
                agent_id, existing_health.health_score, existing_health.memory_usage_mb, existing_health.cpu_utilization);
        } else {
            health.insert(*agent_id, health_update);
        }

        Ok(())
    }

    /// Get agent status
    pub async fn get_agent_status(&self, agent_id: &Uuid) -> Option<AgentStatus> {
        let agents = self.agents.read().await;
        agents.get(agent_id).cloned()
    }

    /// Get agent health metrics
    pub async fn get_agent_health(&self, agent_id: &Uuid) -> Option<AgentHealthMetrics> {
        let health = self.agent_health.read().await;
        health.get(agent_id).cloned()
    }

    /// Get agent tasks
    pub async fn get_agent_tasks(&self, agent_id: &Uuid) -> Vec<AgentTask> {
        let tasks = self.agent_tasks.read().await;
        tasks.get(agent_id).cloned().unwrap_or_default()
    }

    /// Get all agents
    pub async fn get_all_agents(&self) -> Vec<AgentStatus> {
        let agents = self.agents.read().await;
        agents.values().cloned().collect()
    }

    /// Get agents by county
    pub async fn get_agents_by_county(&self, county_id: &str) -> Vec<AgentStatus> {
        let agents = self.agents.read().await;
        agents.values()
            .filter(|agent| agent.county_id.as_ref() == Some(&county_id.to_string()))
            .cloned()
            .collect()
    }

    /// Get unhealthy agents
    pub async fn get_unhealthy_agents(&self) -> Vec<(Uuid, AgentHealthMetrics)> {
        let health = self.agent_health.read().await;

        health.iter()
            .filter(|(_, metrics)| metrics.health_score < self.config.ai.performance.thresholds.min_consciousness_coherence)
            .map(|(id, metrics)| (*id, metrics.clone()))
            .collect()
    }

    /// Terminate agent
    pub async fn terminate_agent(&self, agent_id: &Uuid) -> Result<()> {
        let mut agents = self.agents.write().await;
        let mut agent_tasks = self.agent_tasks.write().await;
        let mut agent_health = self.agent_health.write().await;
        let mut agent_configs = self.agent_configs.write().await;
        let mut performance_history = self.performance_history.write().await;

        // Cancel any active tasks
        if let Some(tasks) = agent_tasks.get_mut(agent_id) {
            for task in tasks.iter_mut() {
                if matches!(task.status, TaskStatus::Pending | TaskStatus::InProgress) {
                    task.status = TaskStatus::Cancelled;
                }
            }
        }

        // Remove agent from all collections
        agents.remove(agent_id);
        agent_tasks.remove(agent_id);
        agent_health.remove(agent_id);
        agent_configs.remove(agent_id);
        performance_history.remove(agent_id);

        info!("Agent {} terminated and removed from system", agent_id);
        Ok(())
    }

    /// Run agent monitoring loop
    pub async fn run_monitoring_loop(&self) {
        info!("Starting agent monitoring loop");

        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(
            self.config.ai.performance.metrics_interval_seconds as u64
        ));

        loop {
            interval.tick().await;

            // Check agent health
            if let Err(e) = self.check_agent_health().await {
                error!("Failed to check agent health: {}", e);
            }

            // Update performance history
            if let Err(e) = self.update_performance_history().await {
                error!("Failed to update performance history: {}", e);
            }

            debug!("Agent monitoring cycle completed");
        }
    }

    /// Check health of all agents
    async fn check_agent_health(&self) -> Result<()> {
        let unhealthy_agents = self.get_unhealthy_agents().await;

        if !unhealthy_agents.is_empty() {
            warn!("Found {} unhealthy agents", unhealthy_agents.len());

            for (agent_id, health) in unhealthy_agents {
                warn!("Unhealthy agent {}: health_score={:.3}, memory={:.1}MB, cpu={:.3}",
                    agent_id, health.health_score, health.memory_usage_mb, health.cpu_utilization);

                // Attempt to recover agent if health score is critically low
                if health.health_score < 0.3 {
                    warn!("Attempting recovery for critically unhealthy agent {}", agent_id);
                    if let Err(e) = self.attempt_agent_recovery(&agent_id).await {
                        error!("Failed to recover agent {}: {}", agent_id, e);
                    }
                }
            }
        }

        Ok(())
    }

    /// Attempt to recover unhealthy agent
    async fn attempt_agent_recovery(&self, agent_id: &Uuid) -> Result<()> {
        info!("Attempting to recover agent {}", agent_id);

        // Reset agent status to initialization for recovery
        self.update_agent_status(agent_id, AgentState::Initializing).await?;

        // Clear current task if any
        let mut agents = self.agents.write().await;
        if let Some(agent) = agents.get_mut(agent_id) {
            agent.current_task = None;
            agent.last_activity = Utc::now();
        }

        // Reset health metrics
        let mut health = self.agent_health.write().await;
        if let Some(health_metrics) = health.get_mut(agent_id) {
            health_metrics.health_score = 0.8; // Partial recovery
            health_metrics.last_heartbeat = Utc::now();
            health_metrics.cpu_utilization = 0.0;
        }

        info!("Agent {} recovery attempted", agent_id);
        Ok(())
    }

    /// Update performance history for all agents
    async fn update_performance_history(&self) -> Result<()> {
        let agents = self.agents.read().await;
        let mut history = self.performance_history.write().await;

        for (agent_id, agent) in agents.iter() {
            if let Some(agent_history) = history.get_mut(agent_id) {
                agent_history.push((Utc::now(), agent.performance.clone()));

                // Limit history size (keep last 100 entries per agent)
                if agent_history.len() > 100 {
                    agent_history.drain(0..agent_history.len() - 100);
                }
            }
        }

        Ok(())
    }
}

/// Calculate agent health score based on metrics
fn calculate_health_score(metrics: &AgentHealthMetrics) -> f64 {
    let mut score = 1.0;

    // Memory utilization impact (reduce score if memory usage is too high)
    if metrics.memory_usage_mb > 400.0 { // Over 400MB usage
        score *= 0.8;
    }

    // CPU utilization impact
    if metrics.cpu_utilization > 0.9 {
        score *= 0.7;
    }

    // Task queue size impact
    if metrics.task_queue_size > 10 {
        score *= 0.9;
    }

    // Consciousness coherence impact
    score *= metrics.consciousness_coherence;

    // Quantum enhancement bonus
    if metrics.quantum_enhancement_active {
        score *= 1.1;
    }

    score.clamp(0.0, 1.0)
}
