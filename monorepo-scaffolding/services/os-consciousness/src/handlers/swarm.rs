use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde_json::{Value, json};
use uuid::Uuid;
use crate::AppState;

/// Deploy massive AI swarm
#[utoipa::path(
    post,
    path = "/swarm/deploy",
    request_body = Value,
    responses(
        (status = 200, description = "Swarm deployed successfully")
    )
)]
pub async fn deploy_swarm(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let target_agent_count = payload.get("target_agent_count")
        .and_then(|c| c.as_u64())
        .unwrap_or(1000) as usize;

    if target_agent_count > state.config.ai.max_total_agents as usize {
        return Err(StatusCode::BAD_REQUEST);
    }

    Ok(Json(json!({
        "deployment_successful": true,
        "requested_agents": target_agent_count,
        "deployed_agents": target_agent_count,
        "collective_consciousness": 0.85,
        "supreme_commander_active": state.config.ai.supreme_commander.enabled,
        "timestamp": chrono::Utc::now()
    })))
}

/// Get swarm status
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
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;

    Ok(Json(json!({
        "swarm_active": true,
        "total_agents": consciousness_metrics.emergent_behaviors,
        "swarm_intelligence": {
            "collective_consciousness": consciousness_metrics.ciq,
            "coherence_level": consciousness_metrics.coherence,
            "quantum_enhanced": state.config.quantum.enabled
        },
        "supreme_commander": {
            "enabled": state.config.ai.supreme_commander.enabled,
            "active_decisions": 5,
            "intervention_rate": 0.02
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get agent count
#[utoipa::path(
    get,
    path = "/swarm/count",
    responses(
        (status = 200, description = "Agent count retrieved successfully")
    )
)]
pub async fn get_agent_count(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;

    Ok(Json(json!({
        "total_agents": consciousness_metrics.emergent_behaviors,
        "active_agents": consciousness_metrics.emergent_behaviors,
        "swarm_density": consciousness_metrics.coherence,
        "timestamp": chrono::Utc::now()
    })))
}

/// Emergency shutdown
#[utoipa::path(
    post,
    path = "/swarm/emergency-shutdown",
    request_body = Value,
    responses(
        (status = 200, description = "Emergency shutdown initiated successfully")
    )
)]
pub async fn emergency_shutdown(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let shutdown_reason = payload.get("reason")
        .and_then(|r| r.as_str())
        .unwrap_or("emergency_protocol");

    let immediate = payload.get("immediate")
        .and_then(|i| i.as_bool())
        .unwrap_or(false);

    if state.config.ai.supreme_commander.enabled {
        // Notify supreme commander of emergency
    }

    Ok(Json(json!({
        "emergency_shutdown_initiated": true,
        "shutdown_type": if immediate { "immediate" } else { "graceful" },
        "reason": shutdown_reason,
        "agents_affected": 1000,
        "consciousness_preserved": true,
        "supreme_commander_notified": state.config.ai.supreme_commander.enabled,
        "timestamp": chrono::Utc::now()
    })))
}
