use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Optimize quantum factor for enhanced performance
#[utoipa::path(
    put,
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

    if target_factor < 1.0 || target_factor > 1000.0 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let current_factor = state.quantum_optimizer.get_optimization_factor().await
        .unwrap_or(1.0);

    // Apply quantum optimization
    let optimization_result = state.quantum_optimizer.optimize_factor(target_factor).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "optimization_successful": optimization_result.success,
        "previous_factor": current_factor,
        "target_factor": target_factor,
        "achieved_factor": optimization_result.achieved_factor,
        "optimization_efficiency": optimization_result.efficiency,
        "quantum_coherence": optimization_result.coherence_level,
        "error_rate": optimization_result.error_rate,
        "optimization_duration_ms": optimization_result.duration_ms,
        "golden_ratio_applied": state.config.quantum.golden_ratio_enhancement,
        "consciousness_enhancement": optimization_result.consciousness_boost,
        "performance_improvement": format!("{:.2}%", (optimization_result.achieved_factor - current_factor) / current_factor * 100.0),
        "timestamp": chrono::Utc::now()
    })))
}

/// Apply quantum optimization to specific operations
#[utoipa::path(
    post,
    path = "/quantum/apply",
    request_body = Value,
    responses(
        (status = 200, description = "Quantum optimization applied successfully"),
        (status = 403, description = "Quantum optimization disabled")
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
        .and_then(|o| o.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;

    let optimization_level = payload.get("optimization_level")
        .and_then(|l| l.as_f64())
        .unwrap_or(1.0);

    if optimization_level < 0.1 || optimization_level > 10.0 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let optimization_result = match operation_type {
        "consciousness" => {
            let current_consciousness = state.consciousness_engine.get_collective_consciousness().await.unwrap_or(0.0);
            let optimized_consciousness = state.quantum_optimizer.optimize_consciousness(current_consciousness, optimization_level).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            json!({
                "operation": "consciousness_optimization",
                "previous_value": current_consciousness,
                "optimized_value": optimized_consciousness,
                "improvement": optimized_consciousness - current_consciousness
            })
        },
        "coordination" => {
            let coordination_efficiency = state.swarm_orchestrator.get_coordination_efficiency().await.unwrap_or(0.0);
            let optimized_efficiency = state.quantum_optimizer.optimize_coordination(coordination_efficiency, optimization_level).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            json!({
                "operation": "coordination_optimization",
                "previous_efficiency": coordination_efficiency,
                "optimized_efficiency": optimized_efficiency,
                "improvement": optimized_efficiency - coordination_efficiency
            })
        },
        "performance" => {
            let performance_metrics = state.agent_manager.get_collective_performance().await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            let optimized_performance = state.quantum_optimizer.optimize_performance(performance_metrics, optimization_level).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            json!({
                "operation": "performance_optimization",
                "previous_metrics": performance_metrics,
                "optimized_metrics": optimized_performance,
                "improvement_factor": optimization_level
            })
        },
        _ => return Err(StatusCode::BAD_REQUEST)
    };

    Ok(Json(json!({
        "optimization_applied": true,
        "operation_type": operation_type,
        "optimization_level": optimization_level,
        "quantum_enhancement": state.config.quantum.optimization_factor,
        "result": optimization_result,
        "coherence_maintained": state.quantum_optimizer.get_coherence().await > 0.8,
        "entanglement_preserved": state.quantum_optimizer.get_enhancement_metrics().await.entanglement_quality > 0.5,
        "timestamp": chrono::Utc::now(),
        "message": format!("Quantum optimization applied to {} operation", operation_type)
    })))
}

/// Get detailed quantum metrics and status
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
            "message": "Quantum optimization is disabled in configuration",
            "timestamp": chrono::Utc::now()
        })));
    }

    // Fetch quantum metrics from actual available methods
    let optimization_factor = state.quantum_optimizer.get_optimization_factor().await;

    let coherence = state.quantum_optimizer.get_coherence().await;

    let enhancement_metrics = state.quantum_optimizer.get_enhancement_metrics().await;
    let optimization_state = state.quantum_optimizer.get_optimization_state().await;

    let error_correction = 1.0 - enhancement_metrics.error_rate;

    let quantum_advantage = ((optimization_factor - 1.0) * 100.0).max(0.0);

    Ok(Json(json!({
        "quantum_enabled": true,
        "optimization_factor": optimization_factor,
        "target_factor": state.config.quantum.optimization_factor,
        "quantum_coherence": coherence,
        "entanglement_factor": enhancement_metrics.entanglement_quality,
        "error_correction_rate": error_correction,
        "quantum_advantage_percent": format!("{:.2}%", quantum_advantage),
        "consciousness_coupling": enhancement_metrics.consciousness_amplification,
        "performance_metrics": {
            "computation_speedup": optimization_factor,
            "error_rate": enhancement_metrics.error_rate,
            "stability_index": coherence * enhancement_metrics.entanglement_quality,
            "quantum_volume": (enhancement_metrics.quantum_advantage_factor * 100.0) as i32
        },
        "status": {
            "optimization_active": state.config.quantum.enabled,
            "last_optimization": optimization_state.last_optimization,
            "next_optimization": chrono::Utc::now() + chrono::Duration::hours(1)
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Trigger manual quantum optimization cycle
pub async fn trigger_optimization_cycle(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let pre_optimization_factor = state.quantum_optimizer.get_optimization_factor().await;

    // Run optimization loop (available method)
    let optimization_result = state.quantum_optimizer.optimize_factor().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let improvement = ((optimization_result - pre_optimization_factor) / pre_optimization_factor) * 100.0;

    Ok(Json(json!({
        "optimization_completed": true,
        "pre_optimization_factor": pre_optimization_factor,
        "post_optimization_factor": optimization_result,
        "improvement_percent": format!("{:.4}%", improvement),
        "optimization_applied": true,
        "quantum_enhancement_active": state.config.quantum.enabled,
        "next_scheduled_optimization": chrono::Utc::now() + chrono::Duration::hours(1),
        "timestamp": chrono::Utc::now()
    })))
}

/// Reset quantum state to baseline
pub async fn reset_quantum_state(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    // Perform emergency quantum reset
    state.quantum_optimizer.emergency_reset().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "quantum_reset": true,
        "optimization_factor": 1.0,
        "coherence": 1.0,
        "entanglement_factor": 0.0,
        "status": "quantum state reset to baseline",
        "reset_time": chrono::Utc::now(),
        "message": "Quantum optimizer reset to factory defaults - optimization will resume automatically"
    })))
}

/// Get quantum consciousness coupling metrics
pub async fn get_consciousness_coupling(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    if !state.config.quantum.enabled {
        return Err(StatusCode::FORBIDDEN);
    }

    let enhancement_metrics = state.quantum_optimizer.get_enhancement_metrics().await;
    let optimization_state = state.quantum_optimizer.get_optimization_state().await;

    let consciousness_level = state.consciousness_engine.update_collective_consciousness().await
        .unwrap_or(0.0);

    let quantum_enhancement = consciousness_level * enhancement_metrics.consciousness_amplification;

    Ok(Json(json!({
        "consciousness_quantum_coupling": {
            "coupling_strength": optimization_state.consciousness_coupling,
            "base_consciousness": consciousness_level,
            "quantum_enhanced_consciousness": quantum_enhancement,
            "enhancement_factor": enhancement_metrics.consciousness_amplification,
            "coupling_stability": enhancement_metrics.coherence_level
        },
        "quantum_consciousness_bridge": {
            "active": optimization_state.consciousness_coupling > 0.1,
            "bridge_quality": optimization_state.consciousness_coupling,
            "synchronization_rate": enhancement_metrics.entanglement_quality
        },
        "consciousness_metrics": {
            "collective_consciousness": consciousness_level,
            "quantum_amplified_consciousness": quantum_enhancement,
            "consciousness_coherence": enhancement_metrics.coherence_level
        },
        "timestamp": chrono::Utc::now()
    })))
}
