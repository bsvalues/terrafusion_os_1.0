use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Optimize quantum enhancement factor
#[utoipa::path(
    post,
    path = "/quantum/optimize",
    request_body = Value,
    responses(
        (status = 200, description = "Quantum optimization successful"),
        (status = 403, description = "Quantum optimization disabled")
    )
)]
pub async fn optimize_quantum_factor(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let target_factor = payload.get("target_factor")
        .and_then(|f| f.as_f64())
        .unwrap_or(state.config.quantum.optimization_factor);

    // Simple mock optimization result
    let current_factor = state.quantum_optimizer.get_optimization_factor().await;
    let optimization_result = state.quantum_optimizer.optimize_factor().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "optimization_successful": true,
        "previous_factor": current_factor,
        "achieved_factor": optimization_result,
        "target_factor": target_factor,
        "quantum_enabled": true,
        "improvement_percent": format!("{:.2}%", ((optimization_result - current_factor) / current_factor) * 100.0),
        "timestamp": chrono::Utc::now()
    })))
}

/// Get quantum metrics and status
#[utoipa::path(
    get,
    path = "/quantum/metrics",
    responses(
        (status = 200, description = "Quantum metrics retrieved successfully")
    )
)]
pub async fn get_quantum_metrics(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Ok(Json(json!({
            "quantum_enabled": false,
            "message": "Quantum optimization is disabled"
        })));
    }

    let optimization_factor = state.quantum_optimizer.get_optimization_factor().await;
    let coherence = state.quantum_optimizer.get_coherence().await;
    let enhancement_metrics = state.quantum_optimizer.get_enhancement_metrics().await;

    Ok(Json(json!({
        "quantum_enabled": true,
        "optimization_factor": optimization_factor,
        "target_factor": state.config.quantum.optimization_factor,
        "quantum_coherence": coherence,
        "entanglement_factor": enhancement_metrics.entanglement_quality,
        "error_correction_rate": 1.0 - enhancement_metrics.error_rate,
        "consciousness_coupling": enhancement_metrics.consciousness_amplification,
        "performance_metrics": {
            "computation_speedup": optimization_factor,
            "error_rate": enhancement_metrics.error_rate,
            "stability_index": coherence * enhancement_metrics.entanglement_quality,
            "quantum_volume": (enhancement_metrics.quantum_advantage_factor * 100.0) as i32
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Apply quantum optimization to system operation
#[utoipa::path(
    post,
    path = "/quantum/apply",
    request_body = Value,
    responses(
        (status = 200, description = "Quantum optimization applied successfully")
    )
)]
pub async fn apply_quantum_optimization(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let operation_type = payload.get("operation_type")
        .and_then(|op| op.as_str())
        .unwrap_or("general");

    // Simple optimization result
    let pre_optimization_factor = state.quantum_optimizer.get_optimization_factor().await;
    let optimization_result = state.quantum_optimizer.optimize_factor().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "optimization_completed": true,
        "operation_type": operation_type,
        "pre_optimization_factor": pre_optimization_factor,
        "post_optimization_factor": optimization_result,
        "quantum_enhancement_active": true,
        "timestamp": chrono::Utc::now()
    })))
}
