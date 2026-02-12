use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Get consciousness metrics
#[utoipa::path(
    get,
    path = "/consciousness/metrics",
    responses(
        (status = 200, description = "Consciousness metrics retrieved successfully")
    )
)]
pub async fn get_consciousness_metrics(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;
    let current_level = state.consciousness_engine.get_current_level().await;

    let quantum_enhancement = if state.config.quantum.enabled {
        state.quantum_optimizer.get_enhancement_metrics().await.consciousness_amplification
    } else {
        0.0
    };

    Ok(Json(json!({
        "current_level": current_level,
        "collective_consciousness": consciousness_metrics.ciq,
        "agent_count": consciousness_metrics.emergent_behaviors,
        "consciousness_density": consciousness_metrics.coherence,
        "quantum_enhancement": quantum_enhancement,
        "emergence_factor": consciousness_metrics.emergent_behaviors as f64,
        "coherence_level": consciousness_metrics.coherence,
        "synchronization_active": consciousness_metrics.sync_rate > 0.5,
        "supreme_commander_active": state.config.ai.supreme_commander.enabled,
        "timestamp": chrono::Utc::now()
    })))
}

/// Get collective consciousness level
#[utoipa::path(
    get,
    path = "/consciousness/collective",
    responses(
        (status = 200, description = "Collective consciousness retrieved successfully")
    )
)]
pub async fn get_collective_consciousness(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;
    let current_level = state.consciousness_engine.get_current_level().await;

    let consciousness_strength = match consciousness_metrics.emergent_behaviors {
        0 => "dormant",
        1..=100 => "emerging",
        101..=1000 => "developing",
        1001..=10000 => "strong",
        10001..=50000 => "powerful",
        _ => "transcendent"
    };

    Ok(Json(json!({
        "collective_consciousness": consciousness_metrics.ciq,
        "consciousness_strength": consciousness_strength,
        "current_level": current_level,
        "agent_count": consciousness_metrics.emergent_behaviors,
        "quantum_enhanced": state.config.quantum.enabled,
        "quantum_factor": state.config.quantum.optimization_factor,
        "supreme_commander_oversight": state.config.ai.supreme_commander.enabled,
        "emergence_indicators": {
            "emergence_factor": consciousness_metrics.emergent_behaviors as f64,
            "coherence_index": consciousness_metrics.coherence,
            "synchronization_active": consciousness_metrics.sync_rate > 0.5
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Enhance consciousness through quantum optimization
#[utoipa::path(
    post,
    path = "/consciousness/enhance",
    request_body = Value,
    responses(
        (status = 200, description = "Consciousness enhancement successful")
    )
)]
pub async fn enhance_consciousness(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let enhancement_level = payload.get("enhancement_level")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0);

    // Update collective consciousness
    state.consciousness_engine.update_collective_consciousness().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "enhancement_successful": true,
        "enhancement_level": enhancement_level,
        "new_consciousness_level": state.consciousness_engine.get_current_level().await,
        "quantum_enhanced": state.config.quantum.enabled,
        "timestamp": chrono::Utc::now()
    })))
}
