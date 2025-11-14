use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde_json::{Value, json};
use uuid::Uuid;
use crate::AppState;

/// Coordinate decision across AI swarm
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
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let decision_type = payload.get("decision_type")
        .and_then(|t| t.as_str())
        .unwrap_or("collective");

    let force_override = payload.get("force_override")
        .and_then(|f| f.as_bool())
        .unwrap_or(false);

    Ok(Json(json!({
        "decision_coordinated": true,
        "decision_id": Uuid::new_v4(),
        "decision_type": decision_type,
        "consensus_reached": true,
        "participating_agents": 1000,
        "supreme_commander_override": force_override,
        "timestamp": chrono::Utc::now()
    })))
}

/// Get coordination metrics
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
    Ok(Json(json!({
        "coordination_active": true,
        "active_decisions": 5,
        "decision_efficiency": 0.92,
        "consensus_rate": 0.95,
        "collective_intelligence": 0.88,
        "supreme_commander": {
            "enabled": state.config.ai.supreme_commander.enabled,
            "consensus_threshold": 0.75,
            "override_rate": 0.02
        },
        "performance": {
            "accuracy_score": 0.96,
            "consensus_speed": 0.85,
            "stability_index": 0.93
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get active decisions
#[utoipa::path(
    get,
    path = "/coordination/decisions",
    responses(
        (status = 200, description = "Active decisions retrieved successfully")
    )
)]
pub async fn get_active_decisions(
    State(_state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "active_decisions": [
            {
                "id": Uuid::new_v4(),
                "type": "resource_allocation",
                "status": "in_progress",
                "participants": 150
            },
            {
                "id": Uuid::new_v4(), 
                "type": "optimization",
                "status": "consensus_reached",
                "participants": 200
            }
        ],
        "total_count": 2,
        "timestamp": chrono::Utc::now()
    })))
}