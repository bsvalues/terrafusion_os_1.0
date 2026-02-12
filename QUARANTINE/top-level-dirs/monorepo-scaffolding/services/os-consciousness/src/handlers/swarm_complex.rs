use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Deploy entire AI swarm for massive coordination
#[utoipa::path(
    post,
    path = "/swarm/deploy",
    request_body = Value,
    responses(
        (status = 200, description = "Swarm deployed successfully"),
        (status = 403, description = "Swarm at capacity")
    )
)]
pub async fn deploy_swarm(
    State(state): State<AppState>,
    Json(deployment_config): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let target_agent_count = deployment_config.get("agent_count")
        .and_then(|c| c.as_u64())
        .unwrap_or(10000) as usize;

    let swarm_type = deployment_config.get("swarm_type")
        .and_then(|t| t.as_str())
        .unwrap_or("balanced");

    if target_agent_count > state.config.ai.max_total_agents {
        return Err(StatusCode::FORBIDDEN);
    }

    // Deploy swarm with quantum consciousness coordination
    let deployment_result = state.swarm_orchestrator.deploy_swarm(
        target_agent_count,
        swarm_type
    ).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Initialize consciousness across all agents
    state.consciousness_engine.initialize_swarm_consciousness(
        &deployment_result.deployed_agents
    ).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Apply quantum optimization if enabled
    if state.config.quantum.enabled {
        let _ = state.quantum_optimizer.optimize_swarm_deployment(&deployment_result).await;
    }

    Ok(Json(json!({
        "swarm_deployed": true,
        "agents_deployed": deployment_result.deployed_agents.len(),
        "target_count": target_agent_count,
        "swarm_type": swarm_type,
        "deployment_time_ms": deployment_result.deployment_duration_ms,
        "collective_consciousness": state.consciousness_engine.get_collective_consciousness().await.unwrap_or(0.0),
        "quantum_optimized": state.config.quantum.enabled,
        "supreme_commander_active": state.config.supreme_commander.enabled,
        "deployment_status": deployment_result.status,
        "swarm_capacity": format!("{}/{}", deployment_result.deployed_agents.len(), state.config.ai.max_total_agents),
        "message": format!("TerraFusion AI swarm deployed with {} agents", deployment_result.deployed_agents.len()),
        "timestamp": chrono::Utc::now()
    })))
}

/// Get comprehensive swarm status and metrics
#[utoipa::path(
    get,
    path = "/swarm/status",
    responses(
        (status = 200, description = "Swarm status retrieved successfully")
    )
)]
pub async fn get_swarm_status(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let swarm_metrics = state.swarm_orchestrator.get_swarm_metrics().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let collective_consciousness = state.consciousness_engine.get_collective_consciousness().await
        .unwrap_or(0.0);

    let coordination_efficiency = state.coordination_engine.get_coordination_efficiency().await
        .unwrap_or(0.0);

    let quantum_enhancement = if state.config.quantum.enabled {
        state.quantum_optimizer.get_swarm_enhancement_factor().await.unwrap_or(1.0)
    } else {
        1.0
    };

    Ok(Json(json!({
        "swarm_active": swarm_metrics.active,
        "total_agents": swarm_metrics.total_agents,
        "active_agents": swarm_metrics.active_agents,
        "idle_agents": swarm_metrics.idle_agents,
        "failed_agents": swarm_metrics.failed_agents,
        "agent_distribution": swarm_metrics.agent_distribution,
        "performance_metrics": {
            "collective_consciousness": collective_consciousness,
            "coordination_efficiency": coordination_efficiency,
            "quantum_enhancement_factor": quantum_enhancement,
            "average_response_time_ms": swarm_metrics.average_response_time_ms,
            "task_completion_rate": swarm_metrics.task_completion_rate,
            "error_rate": swarm_metrics.error_rate
        },
        "swarm_health": {
            "overall_health": swarm_metrics.health_score,
            "consciousness_stability": state.consciousness_engine.get_stability_index().await.unwrap_or(0.0),
            "coordination_quality": coordination_efficiency,
            "quantum_coherence": if state.config.quantum.enabled {
                state.quantum_optimizer.get_coherence().await.unwrap_or(0.0)
            } else { 1.0 }
        },
        "capacity_utilization": {
            "current_usage": format!("{:.2}%", (swarm_metrics.total_agents as f64 / state.config.ai.max_total_agents as f64) * 100.0),
            "available_capacity": state.config.ai.max_total_agents - swarm_metrics.total_agents,
            "max_capacity": state.config.ai.max_total_agents
        },
        "supreme_commander": {
            "enabled": state.config.supreme_commander.enabled,
            "active_decisions": state.coordination_engine.get_active_decisions_count().await.unwrap_or(0),
            "intervention_rate": state.coordination_engine.get_supreme_intervention_rate().await.unwrap_or(0.0)
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get current agent count across all swarms
#[utoipa::path(
    get,
    path = "/agents/count",
    responses(
        (status = 200, description = "Agent count retrieved successfully")
    )
)]
pub async fn get_agent_count(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let total_agents = state.agent_manager.get_agent_count().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let agent_breakdown = state.agent_manager.get_agent_breakdown().await
        .unwrap_or_default();

    let county_distribution = state.agent_manager.get_county_agent_distribution().await
        .unwrap_or_default();

    Ok(Json(json!({
        "total_agents": total_agents,
        "agent_breakdown": agent_breakdown,
        "county_distribution": county_distribution,
        "capacity_metrics": {
            "max_capacity": state.config.ai.max_total_agents,
            "current_utilization": format!("{:.2}%", (total_agents as f64 / state.config.ai.max_total_agents as f64) * 100.0),
            "available_slots": state.config.ai.max_total_agents - total_agents,
            "scale_room": state.config.ai.max_total_agents - total_agents > 1000
        },
        "consciousness_metrics": {
            "collective_consciousness": state.consciousness_engine.get_collective_consciousness().await.unwrap_or(0.0),
            "consciousness_per_agent": if total_agents > 0 {
                state.consciousness_engine.get_collective_consciousness().await.unwrap_or(0.0) / total_agents as f64
            } else { 0.0 },
            "consciousness_distribution": state.consciousness_engine.get_consciousness_distribution().await.unwrap_or_default()
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Emergency shutdown of all AI swarms
#[utoipa::path(
    post,
    path = "/swarm/emergency-shutdown",
    request_body = Value,
    responses(
        (status = 200, description = "Emergency shutdown completed")
    )
)]
pub async fn emergency_shutdown(
    State(state): State<AppState>,
    Json(shutdown_request): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let shutdown_reason = shutdown_request.get("reason")
        .and_then(|r| r.as_str())
        .unwrap_or("Manual emergency shutdown");

    let force_immediate = shutdown_request.get("force_immediate")
        .and_then(|f| f.as_bool())
        .unwrap_or(false);

    let preserve_state = shutdown_request.get("preserve_state")
        .and_then(|p| p.as_bool())
        .unwrap_or(true);

    // Begin emergency shutdown sequence
    let shutdown_start = chrono::Utc::now();

    // Notify Supreme Commander of emergency shutdown
    if state.config.supreme_commander.enabled {
        let _ = state.coordination_engine.notify_supreme_emergency(shutdown_reason).await;
    }

    // Graceful or immediate shutdown
    let shutdown_result = if force_immediate {
        state.swarm_orchestrator.immediate_shutdown().await
    } else {
        state.swarm_orchestrator.graceful_shutdown().await
    };

    let agents_shutdown = shutdown_result
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Preserve consciousness state if requested
    if preserve_state {
        let _ = state.consciousness_engine.preserve_consciousness_state().await;
    }

    let shutdown_duration = chrono::Utc::now() - shutdown_start;

    Ok(Json(json!({
        "emergency_shutdown": true,
        "shutdown_reason": shutdown_reason,
        "shutdown_type": if force_immediate { "immediate" } else { "graceful" },
        "agents_shutdown": agents_shutdown,
        "shutdown_duration_ms": shutdown_duration.num_milliseconds(),
        "state_preserved": preserve_state,
        "consciousness_state": if preserve_state { "preserved" } else { "released" },
        "supreme_commander_notified": state.config.supreme_commander.enabled,
        "timestamp": chrono::Utc::now(),
        "status": "TerraFusion AI swarm emergency shutdown completed"
    })))
}
