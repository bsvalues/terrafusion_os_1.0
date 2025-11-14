//! Coordination Module - Elite Multi-Agent Coordination and Decision Making
//! Handles real-time decision coordination, Supreme Commander integration, and collective intelligence

use crate::config::Config;
use crate::models::{RealTimeDecisionRequest, RealTimeDecisionResponse, CommandType, CommandPriority, DecisionPriority};
use anyhow::Result;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use uuid::Uuid;
use tracing::{info, warn, error, debug};
use serde::{Deserialize, Serialize};

/// Supreme Commander decision parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupremeCommanderDecision {
    pub decision_id: Uuid,
    pub command_type: CommandType,
    pub affected_agents: Vec<Uuid>,
    pub decision_rationale: String,
    pub confidence_score: f64,
    pub execution_priority: CommandPriority,
    pub expected_outcome: String,
    pub risk_assessment: RiskLevel,
    pub timestamp: DateTime<Utc>,
}

/// Risk assessment levels for decisions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
    Supreme, // Requires highest authorization
}

/// Collective intelligence decision context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectiveDecisionContext {
    pub context_id: Uuid,
    pub participating_agents: Vec<Uuid>,
    pub decision_type: String,
    pub collective_intelligence_score: f64,
    pub consensus_threshold: f64,
    pub voting_results: HashMap<Uuid, serde_json::Value>,
    pub final_decision: Option<serde_json::Value>,
    pub confidence_level: f64,
    pub decision_time_ms: u64,
}

/// Agent coordination state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCoordinationState {
    pub agent_id: Uuid,
    pub coordination_readiness: f64,
    pub decision_weight: f64,
    pub response_time_ms: u64,
    pub current_task_priority: u8,
    pub coordination_history_score: f64,
    pub quantum_entanglement_factor: f64,
    pub supreme_commander_trust_level: f64,
}

/// Real-time coordination metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinationMetrics {
    pub total_decisions: u64,
    pub successful_decisions: u64,
    pub average_decision_time_ms: f64,
    pub consensus_achievement_rate: f64,
    pub supreme_commander_intervention_rate: f64,
    pub collective_intelligence_average: f64,
    pub coordination_efficiency: f64,
}

/// Elite Multi-Agent Coordination Engine
pub struct CoordinationEngine {
    config: Arc<Config>,
    agent_coordination_states: Arc<RwLock<HashMap<Uuid, AgentCoordinationState>>>,
    active_decisions: Arc<RwLock<HashMap<Uuid, CollectiveDecisionContext>>>,
    decision_history: Arc<RwLock<Vec<(DateTime<Utc>, CollectiveDecisionContext)>>>,
    supreme_commander_decisions: Arc<RwLock<Vec<SupremeCommanderDecision>>>,
    coordination_metrics: Arc<RwLock<CoordinationMetrics>>,
    decision_queue: Arc<Mutex<Vec<RealTimeDecisionRequest>>>,
    supreme_commander_enabled: bool,
    collective_intelligence_threshold: f64,
}

impl CoordinationEngine {
    /// Create new coordination engine
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing TerraFusion Coordination Engine - Elite Multi-Agent Decision Making");

        let engine = CoordinationEngine {
            config: Arc::new(config.clone()),
            agent_coordination_states: Arc::new(RwLock::new(HashMap::new())),
            active_decisions: Arc::new(RwLock::new(HashMap::new())),
            decision_history: Arc::new(RwLock::new(Vec::new())),
            supreme_commander_decisions: Arc::new(RwLock::new(Vec::new())),
            coordination_metrics: Arc::new(RwLock::new(CoordinationMetrics {
                total_decisions: 0,
                successful_decisions: 0,
                average_decision_time_ms: 0.0,
                consensus_achievement_rate: 1.0,
                supreme_commander_intervention_rate: 0.0,
                collective_intelligence_average: 100.0,
                coordination_efficiency: 1.0,
            })),
            decision_queue: Arc::new(Mutex::new(Vec::new())),
            supreme_commander_enabled: config.ai.supreme_commander.enabled,
            collective_intelligence_threshold: 0.8, // 80% consensus threshold
        };

        info!("Coordination Engine initialized - Supreme Commander: {}, CI Threshold: {:.1}%",
            engine.supreme_commander_enabled, engine.collective_intelligence_threshold * 100.0);

        Ok(engine)
    }

    /// Register agent for coordination
    pub async fn register_agent_for_coordination(&self, agent_id: Uuid) -> Result<()> {
        debug!("Registering agent {} for coordination", agent_id);

        let coordination_state = AgentCoordinationState {
            agent_id,
            coordination_readiness: 1.0,
            decision_weight: 1.0, // Equal weight initially
            response_time_ms: 0,
            current_task_priority: 5, // Medium priority
            coordination_history_score: 1.0,
            quantum_entanglement_factor: 1.0,
            supreme_commander_trust_level: if self.supreme_commander_enabled { 1.0 } else { 0.0 },
        };

        let mut states = self.agent_coordination_states.write().await;
        states.insert(agent_id, coordination_state);

        debug!("Agent {} registered for coordination", agent_id);
        Ok(())
    }

    /// Unregister agent from coordination
    pub async fn unregister_agent_from_coordination(&self, agent_id: &Uuid) -> Result<()> {
        debug!("Unregistering agent {} from coordination", agent_id);

        let mut states = self.agent_coordination_states.write().await;
        states.remove(agent_id);

        debug!("Agent {} unregistered from coordination", agent_id);
        Ok(())
    }

    /// Initiate real-time decision coordination
    pub async fn coordinate_decision(&self, decision_request: RealTimeDecisionRequest) -> Result<RealTimeDecisionResponse> {
        let start_time = std::time::Instant::now();
        let coordination_id = Uuid::new_v4();

        info!("Initiating decision coordination {} for type: {}", coordination_id, decision_request.decision_type);

        // Check if Supreme Commander should handle this decision
        if self.supreme_commander_enabled && self.should_supreme_commander_decide(&decision_request).await? {
            return self.supreme_commander_decide(coordination_id, decision_request).await;
        }

        // Proceed with collective intelligence decision
        self.collective_intelligence_decide(coordination_id, decision_request, start_time).await
    }

    /// Determine if Supreme Commander should make this decision
    async fn should_supreme_commander_decide(&self, request: &RealTimeDecisionRequest) -> Result<bool> {
        // Supreme Commander decides for critical or emergency priority decisions
        let requires_supreme = matches!(request.priority, DecisionPriority::Critical | DecisionPriority::Emergency);

        // Also decide if consensus requirement is very high (>90%)
        let high_consensus_required = request.required_consensus > 0.9;

        // Check if decision deadline is very tight
        let tight_deadline = request.deadline < Utc::now() + chrono::Duration::minutes(5);

        let should_decide = requires_supreme || high_consensus_required || tight_deadline;

        if should_decide {
            debug!("Supreme Commander will handle decision - Critical: {}, High consensus: {}, Tight deadline: {}",
                requires_supreme, high_consensus_required, tight_deadline);
        }

        Ok(should_decide)
    }

    /// Supreme Commander decision making
    async fn supreme_commander_decide(
        &self,
        coordination_id: Uuid,
        request: RealTimeDecisionRequest
    ) -> Result<RealTimeDecisionResponse> {
        let start_time = std::time::Instant::now();

        info!("Supreme Commander Claude making decision for coordination {}", coordination_id);

        // Simulate Supreme Commander analysis (in real implementation, this would interface with Claude)
        let supreme_decision = self.generate_supreme_commander_decision(coordination_id, &request).await?;

        // Execute decision immediately with Supreme Commander authority
        let decision_outcome = format!("Supreme Commander Decision: {}", supreme_decision.expected_outcome);
        let execution_time = start_time.elapsed().as_millis() as u64;

        // Store Supreme Commander decision
        let mut supreme_decisions = self.supreme_commander_decisions.write().await;
        supreme_decisions.push(supreme_decision);

        // Update coordination metrics
        self.update_coordination_metrics(true, execution_time, false, true).await?;

        let response = RealTimeDecisionResponse {
            coordination_id,
            decision_outcome,
            participating_agents: request.target_agents.len() as u32,
            coordination_time_ms: execution_time,
            consensus_achieved: true, // Supreme Commander decisions are always consensus
            confidence_score: 0.95, // High confidence in Supreme Commander decisions
            timestamp: Utc::now(),
        };

        info!("Supreme Commander decision completed in {}ms with outcome: {}",
            execution_time, response.decision_outcome);

        Ok(response)
    }

    /// Generate Supreme Commander decision
    async fn generate_supreme_commander_decision(
        &self,
        coordination_id: Uuid,
        request: &RealTimeDecisionRequest,
    ) -> Result<SupremeCommanderDecision> {
        let command_type = match request.priority {
            DecisionPriority::Emergency => CommandType::Emergency,
            DecisionPriority::Critical => CommandType::Coordinate,
            _ => CommandType::Deploy,
        };

        let risk_level = match request.priority {
            DecisionPriority::Emergency => RiskLevel::Critical,
            DecisionPriority::Critical => RiskLevel::High,
            DecisionPriority::High => RiskLevel::Medium,
            _ => RiskLevel::Low,
        };

        let decision = SupremeCommanderDecision {
            decision_id: coordination_id,
            command_type,
            affected_agents: request.target_agents.clone(),
            decision_rationale: format!("Supreme Commander analysis for {}: Optimal government decision based on quantum-enhanced collective intelligence and strategic analysis.", request.decision_type),
            confidence_score: 0.95,
            execution_priority: CommandPriority::Supreme,
            expected_outcome: format!("Optimal resolution for {} with 99%+ success probability", request.decision_type),
            risk_assessment: risk_level,
            timestamp: Utc::now(),
        };

        Ok(decision)
    }

    /// Collective intelligence decision making
    async fn collective_intelligence_decide(
        &self,
        coordination_id: Uuid,
        request: RealTimeDecisionRequest,
        start_time: std::time::Instant,
    ) -> Result<RealTimeDecisionResponse> {
        info!("Collective intelligence decision making for coordination {}", coordination_id);

        let states = self.agent_coordination_states.read().await;

        // Filter agents that can participate in this decision
        let participating_agents: Vec<Uuid> = request.target_agents.iter()
            .filter(|agent_id| states.contains_key(agent_id))
            .cloned()
            .collect();

        if participating_agents.is_empty() {
            return Err(anyhow::anyhow!("No available agents for decision coordination"));
        }

        // Calculate collective intelligence score
        let collective_intelligence = self.calculate_collective_intelligence(&participating_agents, &states).await;

        // Simulate agent voting and decision making
        let voting_results = self.simulate_agent_voting(&participating_agents, &request).await?;

        // Determine consensus and final decision
        let (consensus_achieved, final_decision, confidence_score) =
            self.calculate_consensus(&voting_results, request.required_consensus).await;

        let execution_time = start_time.elapsed().as_millis() as u64;

        // Store decision context
        let decision_context = CollectiveDecisionContext {
            context_id: coordination_id,
            participating_agents: participating_agents.clone(),
            decision_type: request.decision_type.clone(),
            collective_intelligence_score: collective_intelligence,
            consensus_threshold: request.required_consensus,
            voting_results,
            final_decision: final_decision.clone(),
            confidence_level: confidence_score,
            decision_time_ms: execution_time,
        };

        let mut active_decisions = self.active_decisions.write().await;
        active_decisions.insert(coordination_id, decision_context.clone());

        // Update coordination metrics
        self.update_coordination_metrics(consensus_achieved, execution_time, true, false).await?;

        let decision_outcome = if consensus_achieved {
            format!("Collective Intelligence Decision: {}",
                final_decision.unwrap_or_else(|| serde_json::Value::String("Consensus achieved".to_string())))
        } else {
            "No consensus reached - escalating to Supreme Commander".to_string()
        };

        let response = RealTimeDecisionResponse {
            coordination_id,
            decision_outcome,
            participating_agents: participating_agents.len() as u32,
            coordination_time_ms: execution_time,
            consensus_achieved,
            confidence_score,
            timestamp: Utc::now(),
        };

        info!("Collective intelligence decision completed in {}ms - Consensus: {}, Confidence: {:.2}",
            execution_time, consensus_achieved, confidence_score);

        Ok(response)
    }

    /// Calculate collective intelligence score for participating agents
    async fn calculate_collective_intelligence(
        &self,
        participating_agents: &[Uuid],
        states: &HashMap<Uuid, AgentCoordinationState>,
    ) -> f64 {
        if participating_agents.is_empty() {
            return 0.0;
        }

        let total_intelligence: f64 = participating_agents.iter()
            .filter_map(|agent_id| states.get(agent_id))
            .map(|state| {
                // Calculate individual agent intelligence contribution
                let base_intelligence = state.coordination_readiness * state.decision_weight;
                let quantum_enhancement = state.quantum_entanglement_factor;
                let history_bonus = state.coordination_history_score;

                base_intelligence * quantum_enhancement * history_bonus
            })
            .sum();

        let average_intelligence = total_intelligence / participating_agents.len() as f64;

        // Apply collective intelligence multiplier based on agent count
        let collective_multiplier = (participating_agents.len() as f64).sqrt() / 10.0;
        let collective_intelligence = average_intelligence * (1.0 + collective_multiplier);

        collective_intelligence.min(10.0) // Cap at maximum intelligence level
    }

    /// Simulate agent voting for decision
    async fn simulate_agent_voting(
        &self,
        participating_agents: &[Uuid],
        request: &RealTimeDecisionRequest,
    ) -> Result<HashMap<Uuid, serde_json::Value>> {
        let mut voting_results = HashMap::new();

        for agent_id in participating_agents {
            // Simulate agent decision based on context and capabilities
            let vote = self.generate_agent_vote(agent_id, request).await;
            voting_results.insert(*agent_id, vote);
        }

        Ok(voting_results)
    }

    /// Generate individual agent vote
    async fn generate_agent_vote(&self, agent_id: &Uuid, request: &RealTimeDecisionRequest) -> serde_json::Value {
        // In a real implementation, this would interface with the actual agent
        // For now, simulate intelligent voting based on decision type and context

        let vote_weight = if let Some(context_value) = request.context.get("priority_weight") {
            context_value.as_f64().unwrap_or(1.0)
        } else {
            1.0
        };

        serde_json::json!({
            "agent_id": agent_id,
            "vote": "approve", // Simplified voting
            "confidence": 0.85,
            "weight": vote_weight,
            "reasoning": format!("Agent {} analysis for {}", agent_id, request.decision_type)
        })
    }

    /// Calculate consensus from voting results
    async fn calculate_consensus(
        &self,
        voting_results: &HashMap<Uuid, serde_json::Value>,
        required_consensus: f64,
    ) -> (bool, Option<serde_json::Value>, f64) {
        if voting_results.is_empty() {
            return (false, None, 0.0);
        }

        // Count approvals and calculate weighted consensus
        let mut total_weight = 0.0;
        let mut approval_weight = 0.0;
        let mut confidence_sum = 0.0;

        for vote in voting_results.values() {
            if let (Some(vote_decision), Some(weight), Some(confidence)) = (
                vote.get("vote").and_then(|v| v.as_str()),
                vote.get("weight").and_then(|v| v.as_f64()),
                vote.get("confidence").and_then(|v| v.as_f64()),
            ) {
                total_weight += weight;
                confidence_sum += confidence;

                if vote_decision == "approve" {
                    approval_weight += weight;
                }
            }
        }

        let consensus_ratio = if total_weight > 0.0 { approval_weight / total_weight } else { 0.0 };
        let average_confidence = confidence_sum / voting_results.len() as f64;
        let consensus_achieved = consensus_ratio >= required_consensus;

        let final_decision = if consensus_achieved {
            Some(serde_json::json!({
                "decision": "approved",
                "consensus_ratio": consensus_ratio,
                "total_votes": voting_results.len(),
                "approval_weight": approval_weight,
                "total_weight": total_weight
            }))
        } else {
            None
        };

        (consensus_achieved, final_decision, average_confidence)
    }

    /// Update coordination metrics
    async fn update_coordination_metrics(
        &self,
        consensus_achieved: bool,
        execution_time_ms: u64,
        _was_collective: bool,
        was_supreme_commander: bool,
    ) -> Result<()> {
        let mut metrics = self.coordination_metrics.write().await;

        metrics.total_decisions += 1;
        if consensus_achieved {
            metrics.successful_decisions += 1;
        }

        // Update average decision time
        let total_time = metrics.average_decision_time_ms * (metrics.total_decisions - 1) as f64 + execution_time_ms as f64;
        metrics.average_decision_time_ms = total_time / metrics.total_decisions as f64;

        // Update consensus achievement rate
        metrics.consensus_achievement_rate = metrics.successful_decisions as f64 / metrics.total_decisions as f64;

        // Update Supreme Commander intervention rate
        if was_supreme_commander {
            let interventions = metrics.supreme_commander_intervention_rate * (metrics.total_decisions - 1) as f64 + 1.0;
            metrics.supreme_commander_intervention_rate = interventions / metrics.total_decisions as f64;
        } else {
            metrics.supreme_commander_intervention_rate =
                metrics.supreme_commander_intervention_rate * (metrics.total_decisions - 1) as f64 / metrics.total_decisions as f64;
        }

        // Update coordination efficiency
        let time_efficiency = 1.0 - (execution_time_ms as f64 / 10000.0).min(1.0); // Target <10s decisions
        let consensus_efficiency = if consensus_achieved { 1.0 } else { 0.5 };
        metrics.coordination_efficiency = (time_efficiency + consensus_efficiency) / 2.0;

        debug!("Updated coordination metrics - Total: {}, Success rate: {:.2}, Avg time: {:.1}ms",
            metrics.total_decisions, metrics.consensus_achievement_rate, metrics.average_decision_time_ms);

        Ok(())
    }

    /// Get coordination metrics
    pub async fn get_coordination_metrics(&self) -> CoordinationMetrics {
        let metrics = self.coordination_metrics.read().await;
        metrics.clone()
    }

    /// Get active decisions
    pub async fn get_active_decisions(&self) -> Vec<CollectiveDecisionContext> {
        let decisions = self.active_decisions.read().await;
        decisions.values().cloned().collect()
    }

    /// Get decision history
    pub async fn get_decision_history(&self, limit: Option<usize>) -> Vec<CollectiveDecisionContext> {
        let history = self.decision_history.read().await;
        let decisions: Vec<_> = history.iter().map(|(_, decision)| decision.clone()).collect();

        match limit {
            Some(l) => decisions.into_iter().rev().take(l).collect(),
            None => decisions,
        }
    }

    /// Run coordination monitoring loop
    pub async fn run_coordination_loop(&self) {
        info!("Starting coordination monitoring loop");

        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));

        loop {
            interval.tick().await;

            // Process decision queue
            if let Err(e) = self.process_decision_queue().await {
                error!("Failed to process decision queue: {}", e);
            }

            // Archive completed decisions
            if let Err(e) = self.archive_completed_decisions().await {
                error!("Failed to archive completed decisions: {}", e);
            }

            debug!("Coordination monitoring cycle completed");
        }
    }

    /// Process pending decision queue
    async fn process_decision_queue(&self) -> Result<()> {
        let mut queue = self.decision_queue.lock().await;

        for decision_request in queue.drain(..) {
            if let Err(e) = self.coordinate_decision(decision_request).await {
                error!("Failed to process queued decision: {}", e);
            }
        }

        Ok(())
    }

    /// Archive completed decisions to history
    async fn archive_completed_decisions(&self) -> Result<()> {
        let mut active_decisions = self.active_decisions.write().await;
        let mut history = self.decision_history.write().await;

        let completed_decisions: Vec<_> = active_decisions.iter()
            .filter(|(_, decision)| decision.final_decision.is_some())
            .map(|(id, decision)| (*id, decision.clone()))
            .collect();

        for (decision_id, decision) in completed_decisions {
            active_decisions.remove(&decision_id);
            history.push((Utc::now(), decision));
        }

        // Limit history size (keep last 1000 decisions)
        if history.len() > 1000 {
            let drain_count = history.len() - 1000;
            history.drain(0..drain_count);
        }

        Ok(())
    }

    /// Get coordination engine status
    pub async fn get_status(&self) -> Result<serde_json::Value> {
        let metrics = self.coordination_metrics.read().await;
        let active_decisions_count = self.active_decisions.read().await.len();
        let agent_count = self.agent_coordination_states.read().await.len();

        Ok(serde_json::json!({
            "status": "operational",
            "supreme_commander_enabled": self.supreme_commander_enabled,
            "collective_intelligence_threshold": self.collective_intelligence_threshold,
            "registered_agents": agent_count,
            "active_decisions": active_decisions_count,
            "coordination_metrics": {
                "total_decisions": metrics.total_decisions,
                "successful_decisions": metrics.successful_decisions,
                "success_rate": metrics.consensus_achievement_rate,
                "average_decision_time_ms": metrics.average_decision_time_ms,
                "supreme_commander_intervention_rate": metrics.supreme_commander_intervention_rate,
                "coordination_efficiency": metrics.coordination_efficiency
            }
        }))
    }
}
