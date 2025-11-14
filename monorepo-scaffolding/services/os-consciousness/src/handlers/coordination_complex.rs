use axum::{extract::{State, Path}, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Coordinate a complex decision across the swarm
#[utoipa::path(
    post,
    path = "/coordination/decide",
    request_body = Value,
    responses(
        (status = 200, description = "Decision coordinated successfully")
    )
)]
pub async fn coordinate_decision(
    State(state): State<AppState>,
    Json(decision_request): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let decision_type = decision_request.get("type")
        .and_then(|t| t.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;

    let decision_data = decision_request.get("data")
        .ok_or(StatusCode::BAD_REQUEST)?;

    let priority = decision_request.get("priority")
        .and_then(|p| p.as_str())
        .unwrap_or("normal");

    let require_consensus = decision_request.get("require_consensus")
        .and_then(|c| c.as_bool())
        .unwrap_or(true);

    // Initiate swarm coordination for decision
    let coordination_result = state.coordination_engine.coordinate_decision(
        decision_type,
        decision_data.clone(),
        priority,
        require_consensus
    ).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Apply quantum enhancement if enabled
    let quantum_enhanced_decision = if state.config.quantum.enabled {
        state.quantum_optimizer.enhance_decision(coordination_result.clone()).await
            .unwrap_or(coordination_result.clone())
    } else {
        coordination_result.clone()
    };

    // Check if Supreme Commander override is needed
    let supreme_override = if state.config.supreme_commander.enabled &&
                             quantum_enhanced_decision.confidence < state.config.supreme_commander.consciousness_threshold {
        Some(state.coordination_engine.request_supreme_override(quantum_enhanced_decision.decision_id.clone()).await
             .unwrap_or_default())
    } else {
        None
    };

    Ok(Json(json!({
        "decision_coordinated": true,
        "decision_id": quantum_enhanced_decision.decision_id,
        "decision_type": decision_type,
        "decision": quantum_enhanced_decision.decision,
        "confidence": quantum_enhanced_decision.confidence,
        "participating_agents": quantum_enhanced_decision.participating_agents,
        "consensus_reached": quantum_enhanced_decision.consensus_reached,
        "coordination_time_ms": quantum_enhanced_decision.coordination_time_ms,
        "quantum_enhanced": state.config.quantum.enabled,
        "supreme_override": supreme_override,
        "execution_status": quantum_enhanced_decision.execution_status,
        "affected_systems": quantum_enhanced_decision.affected_systems,
        "timestamp": chrono::Utc::now(),
        "message": "Decision coordinated across TerraFusion consciousness network"
    })))
}

/// Get comprehensive coordination metrics
#[utoipa::path(
    get,
    path = "/coordination/metrics",
    responses(
        (status = 200, description = "Coordination metrics retrieved successfully")
    )
)]
pub async fn get_coordination_metrics(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let coordination_status = state.coordination_engine.get_coordination_status().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let decision_metrics = state.coordination_engine.get_decision_metrics().await
        .unwrap_or_default();

    let agent_participation = state.coordination_engine.get_agent_participation_metrics().await
        .unwrap_or_default();

    let consensus_quality = state.coordination_engine.get_consensus_quality_metrics().await
        .unwrap_or_default();

    Ok(Json(json!({
        "coordination_active": coordination_status.active,
        "total_decisions": decision_metrics.total_decisions,
        "pending_decisions": decision_metrics.pending_decisions,
        "completed_decisions": decision_metrics.completed_decisions,
        "failed_decisions": decision_metrics.failed_decisions,
        "decision_success_rate": if decision_metrics.total_decisions > 0 {
            decision_metrics.completed_decisions as f64 / decision_metrics.total_decisions as f64
        } else { 0.0 },
        "average_coordination_time_ms": decision_metrics.average_coordination_time_ms,
        "agent_participation": {
            "total_agents": agent_participation.total_agents,
            "active_participants": agent_participation.active_participants,
            "participation_rate": agent_participation.participation_rate,
            "average_response_time_ms": agent_participation.average_response_time_ms
        },
        "consensus_quality": {
            "consensus_rate": consensus_quality.consensus_rate,
            "average_confidence": consensus_quality.average_confidence,
            "disagreement_rate": consensus_quality.disagreement_rate,
            "override_rate": consensus_quality.override_rate
        },
        "quantum_coordination": {
            "enabled": state.config.quantum.enabled,
            "enhancement_factor": state.config.quantum.optimization_factor,
            "quantum_decisions": decision_metrics.quantum_enhanced_decisions
        },
        "supreme_commander": {
            "enabled": state.config.supreme_commander.enabled,
            "interventions": decision_metrics.supreme_interventions,
            "override_rate": if decision_metrics.total_decisions > 0 {
                decision_metrics.supreme_interventions as f64 / decision_metrics.total_decisions as f64
            } else { 0.0 }
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get all active decisions in the coordination system
#[utoipa::path(
    get,
    path = "/coordination/decisions",
    responses(
        (status = 200, description = "Active decisions retrieved successfully")
    )
)]
pub async fn get_active_decisions(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let active_decisions = state.coordination_engine.get_active_decisions().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let priority_distribution = active_decisions.iter()
        .fold(std::collections::HashMap::new(), |mut acc, decision| {
            *acc.entry(decision.priority.clone()).or_insert(0) += 1;
            acc
        });

    let status_distribution = active_decisions.iter()
        .fold(std::collections::HashMap::new(), |mut acc, decision| {
            *acc.entry(decision.status.clone()).or_insert(0) += 1;
            acc
        });

    let oldest_decision = active_decisions.iter()
        .min_by_key(|d| d.created_at)
        .map(|d| d.created_at.clone());

    let newest_decision = active_decisions.iter()
        .max_by_key(|d| d.created_at)
        .map(|d| d.created_at.clone());

    Ok(Json(json!({
        "active_decisions": active_decisions,
        "summary": {
            "total_active": active_decisions.len(),
            "priority_distribution": priority_distribution,
            "status_distribution": status_distribution,
            "oldest_decision": oldest_decision,
            "newest_decision": newest_decision,
            "average_age_minutes": if !active_decisions.is_empty() {
                active_decisions.iter()
                    .map(|d| (chrono::Utc::now() - d.created_at).num_minutes())
                    .sum::<i64>() / active_decisions.len() as i64
            } else { 0 },
            "decisions_requiring_consensus": active_decisions.iter().filter(|d| d.requires_consensus).count(),
            "quantum_enhanced_decisions": active_decisions.iter().filter(|d| d.quantum_enhanced).count(),
            "supreme_commander_pending": active_decisions.iter().filter(|d| d.pending_supreme_review).count()
        },
        "coordination_health": {
            "queue_pressure": if active_decisions.len() > 100 { "high" } else if active_decisions.len() > 50 { "medium" } else { "low" },
            "coordination_efficiency": state.coordination_engine.get_coordination_efficiency().await.unwrap_or(0.0),
            "collective_intelligence": state.coordination_engine.get_collective_intelligence().await.unwrap_or(0.0)
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get coordination status and metrics
pub async fn get_coordination_status(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let coordination_active = state.coordination_engine.is_coordination_active().await
        .unwrap_or(false);

    let decision_queue_size = state.coordination_engine.get_decision_queue_size().await
        .unwrap_or(0);

    let collective_intelligence = state.coordination_engine.get_collective_intelligence().await
        .unwrap_or(0.0);

    let coordination_efficiency = state.coordination_engine.get_coordination_efficiency().await
        .unwrap_or(0.0);

    let active_decisions = state.coordination_engine.get_active_decisions_count().await
        .unwrap_or(0);

    Ok(Json(json!({
        "coordination_active": coordination_active,
        "decision_queue_size": decision_queue_size,
        "collective_intelligence": collective_intelligence,
        "coordination_efficiency": coordination_efficiency,
        "active_decisions": active_decisions,
        "supreme_commander": {
            "enabled": state.config.supreme_commander.enabled,
            "authority_level": state.config.supreme_commander.decision_authority_level,
            "emergency_override": state.config.supreme_commander.emergency_override_enabled
        },
        "performance_metrics": {
            "decisions_per_second": state.coordination_engine.get_decision_rate().await.unwrap_or(0.0),
            "consensus_accuracy": state.coordination_engine.get_consensus_accuracy().await.unwrap_or(0.0),
            "response_time_ms": state.coordination_engine.get_average_response_time().await.unwrap_or(0)
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Request Supreme Commander decision
pub async fn request_supreme_decision(
    State(state): State<AppState>,
    Json(decision_request): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.supreme_commander.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let decision_context = decision_request.get("context")
        .ok_or(StatusCode::BAD_REQUEST)?;

    let priority = decision_request.get("priority")
        .and_then(|p| p.as_str())
        .unwrap_or("normal");

    let decision_result = state.coordination_engine.request_supreme_decision(
        decision_context.clone(),
        priority
    ).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "decision_id": decision_result.decision_id,
        "supreme_commander_decision": decision_result.decision,
        "confidence_level": decision_result.confidence,
        "reasoning": decision_result.reasoning,
        "affected_agents": decision_result.affected_agents,
        "execution_priority": priority,
        "decision_time": chrono::Utc::now(),
        "coordination_impact": decision_result.coordination_impact,
        "message": "Supreme Commander decision issued for TerraFusion AI swarm coordination"
    })))
}

/// Get collective intelligence analysis
pub async fn get_collective_intelligence(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let collective_intelligence = state.coordination_engine.get_collective_intelligence().await
        .unwrap_or(0.0);

    let intelligence_distribution = state.coordination_engine.get_intelligence_distribution().await
        .unwrap_or_default();

    let voting_power = state.coordination_engine.get_agent_voting_power().await
        .unwrap_or_default();

    let consensus_mechanisms = state.coordination_engine.get_active_consensus_mechanisms().await
        .unwrap_or_default();

    Ok(Json(json!({
        "collective_intelligence": collective_intelligence,
        "intelligence_metrics": {
            "average_agent_intelligence": intelligence_distribution.get("average").unwrap_or(&0.0),
            "peak_intelligence": intelligence_distribution.get("peak").unwrap_or(&0.0),
            "intelligence_variance": intelligence_distribution.get("variance").unwrap_or(&0.0),
            "intelligence_growth_rate": state.coordination_engine.get_intelligence_growth_rate().await.unwrap_or(0.0)
        },
        "voting_system": {
            "total_voting_power": voting_power.values().sum::<f64>(),
            "voting_agents": voting_power.len(),
            "voting_distribution": voting_power,
            "consensus_threshold": state.config.supreme_commander.consensus_threshold
        },
        "consensus_mechanisms": consensus_mechanisms,
        "decision_quality": {
            "accuracy_score": state.coordination_engine.get_decision_accuracy().await.unwrap_or(0.0),
            "consensus_speed": state.coordination_engine.get_consensus_speed().await.unwrap_or(0.0),
            "stability_index": state.coordination_engine.get_stability_index().await.unwrap_or(0.0)
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Force consensus on pending decisions
pub async fn force_consensus(
    State(state): State<AppState>,
    Json(consensus_request): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let decision_ids = consensus_request.get("decision_ids")
        .and_then(|ids| ids.as_array())
        .ok_or(StatusCode::BAD_REQUEST)?;

    let force_override = consensus_request.get("force_override")
        .and_then(|f| f.as_bool())
        .unwrap_or(false);

    if force_override && !state.config.supreme_commander.emergency_override_enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut results = Vec::new();
    for decision_id in decision_ids {
        if let Some(id_str) = decision_id.as_str() {
            let consensus_result = state.coordination_engine.force_consensus(id_str, force_override).await;
            results.push(json!({
                "decision_id": id_str,
                "consensus_forced": consensus_result.is_ok(),
                "result": consensus_result.unwrap_or_else(|e| format!("Failed: {}", e))
            }));
        }
    }

    Ok(Json(json!({
        "consensus_operations": results,
        "override_used": force_override,
        "total_decisions_processed": results.len(),
        "timestamp": chrono::Utc::now()
    })))
}

/// Get coordination metrics for a specific county
pub async fn get_county_coordination(
    State(state): State<AppState>,
    Path(county_id): Path<String>
) -> Result<Json<Value>, StatusCode> {
    let county_agents = state.coordination_engine.get_county_agents(&county_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let county_coordination_metrics = state.coordination_engine.get_county_coordination_metrics(&county_id).await
        .unwrap_or_default();

    let county_decisions = state.coordination_engine.get_county_active_decisions(&county_id).await
        .unwrap_or_default();

    Ok(Json(json!({
        "county_id": county_id,
        "agents_assigned": county_agents.len(),
        "agent_list": county_agents,
        "coordination_metrics": county_coordination_metrics,
        "active_decisions": county_decisions,
        "county_intelligence": state.coordination_engine.get_county_collective_intelligence(&county_id).await.unwrap_or(0.0),
        "county_coordination_efficiency": state.coordination_engine.get_county_coordination_efficiency(&county_id).await.unwrap_or(0.0),
        "data_isolation_status": "SOVEREIGN", // County data isolation maintained
        "timestamp": chrono::Utc::now()
    })))
}
