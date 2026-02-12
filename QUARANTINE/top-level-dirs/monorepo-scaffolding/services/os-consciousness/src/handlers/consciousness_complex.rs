use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Get comprehensive consciousness metrics
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
    // Use actual available methods
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;
    let current_level = state.consciousness_engine.get_current_level().await;

    // Get quantum enhancement metrics
    let quantum_enhancement = if state.config.quantum.enabled {
        state.quantum_optimizer.get_enhancement_metrics().await.consciousness_amplification
    } else {
        0.0
    };

    Ok(Json(json!({
        "current_level": current_level,
        "collective_consciousness": consciousness_metrics.collective_consciousness_level,
        "agent_count": consciousness_metrics.total_registered_agents,
        "consciousness_density": consciousness_metrics.average_consciousness_level,
        "quantum_enhancement": quantum_enhancement,
        "emergence_factor": consciousness_metrics.emergence_factor,
        "coherence_level": consciousness_metrics.coherence_index,
        "synchronization_active": consciousness_metrics.synchronization_active,
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
    // Use actual available methods
    let consciousness_metrics = state.consciousness_engine.get_metrics().await;
    let current_level = state.consciousness_engine.get_current_level().await;

    let consciousness_strength = match consciousness_metrics.total_registered_agents {
        0 => "dormant",
        1..=100 => "emerging",
        101..=1000 => "developing",
        1001..=10000 => "strong",
        10001..=50000 => "powerful",
        _ => "transcendent"
    };

    Ok(Json(json!({
        "collective_consciousness": consciousness_metrics.collective_consciousness_level,
        "consciousness_strength": consciousness_strength,
        "current_level": current_level,
        "agent_count": consciousness_metrics.total_registered_agents,
        "quantum_enhanced": state.config.quantum.enabled,
        "quantum_factor": state.config.quantum.optimization_factor,
        "supreme_commander_oversight": state.config.ai.supreme_commander.enabled,
        "emergence_indicators": {
            "emergence_factor": consciousness_metrics.emergence_factor,
            "coherence_index": consciousness_metrics.coherence_index,
            "synchronization_active": consciousness_metrics.synchronization_active
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
        (status = 200, description = "Consciousness enhanced successfully"),
        (status = 400, description = "Invalid enhancement parameters"),
        (status = 503, description = "Quantum optimization not available")
    )
)]
pub async fn enhance_consciousness(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let enhancement_type = payload.get("type")
        .and_then(|t| t.as_str())
        .unwrap_or("quantum");

    let enhancement_factor = payload.get("factor")
        .and_then(|f| f.as_f64())
        .unwrap_or(1.2); // 20% enhancement by default

    if enhancement_factor <= 0.0 || enhancement_factor > 5.0 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let current_level = state.consciousness_engine.get_collective_consciousness().await
        .unwrap_or(0.0);

    let enhanced_level = match enhancement_type {
        "quantum" => {
            if !state.config.quantum.enabled {
                return Err(StatusCode::SERVICE_UNAVAILABLE);
            }
            state.quantum_optimizer.enhance_consciousness(current_level * enhancement_factor).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        }
        "swarm" => {
            state.swarm_orchestrator.amplify_collective_intelligence(current_level, enhancement_factor).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        }
        "emergent" => {
            state.consciousness_engine.trigger_emergent_enhancement(enhancement_factor).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        }
        _ => return Err(StatusCode::BAD_REQUEST)
    };

    // Update collective consciousness
    state.consciousness_engine.set_collective_consciousness(enhanced_level).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Track enhancement event
    let enhancement_success = enhanced_level > current_level;

    Ok(Json(json!({
        "enhancement_successful": enhancement_success,
        "previous_level": current_level,
        "enhanced_level": enhanced_level,
        "enhancement_type": enhancement_type,
        "enhancement_factor": enhancement_factor,
        "improvement": enhanced_level - current_level,
        "improvement_percentage": if current_level > 0.0 { ((enhanced_level - current_level) / current_level) * 100.0 } else { 0.0 },
        "quantum_optimized": enhancement_type == "quantum",
        "agent_count": state.agent_manager.get_agent_count().await.unwrap_or(0),
        "enhancement_time": chrono::Utc::now(),
        "message": format!("Consciousness enhanced using {} optimization", enhancement_type)
    })))
}

/// Update consciousness level for the entire swarm
pub async fn set_consciousness_level(
    State(state): State<AppState>,
    Json(payload): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let new_level = payload.get("level")
        .and_then(|l| l.as_f64())
        .ok_or(StatusCode::BAD_REQUEST)?;

    if !(0.0..=1.0).contains(&new_level) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Update consciousness level
    state.consciousness_engine.set_collective_consciousness(new_level).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Apply quantum enhancement if enabled
    let quantum_enhancement = if state.config.quantum.enabled {
        state.quantum_optimizer.enhance_consciousness(new_level).await
            .unwrap_or(new_level)
    } else {
        new_level
    };

    Ok(Json(json!({
        "consciousness_level": quantum_enhancement,
        "original_level": new_level,
        "quantum_enhanced": state.config.quantum.enabled,
        "agents_affected": state.consciousness_engine.get_agent_count().await.unwrap_or(0),
        "collective_intelligence": state.consciousness_engine.calculate_collective_intelligence().await.unwrap_or(0.0),
        "timestamp": chrono::Utc::now(),
        "message": "Consciousness level updated across TerraFusion AI swarm"
    })))
}

/// Get detailed consciousness analytics
pub async fn get_consciousness_analytics(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let collective_consciousness = state.consciousness_engine.get_collective_consciousness().await
        .unwrap_or(0.0);

    let collective_intelligence = state.consciousness_engine.calculate_collective_intelligence().await
        .unwrap_or(0.0);

    let agent_consciousness_map = state.consciousness_engine.get_all_agent_consciousness().await
        .unwrap_or_default();

    let quantum_entanglement = if state.config.quantum.enabled {
        state.quantum_optimizer.get_entanglement_factor().await.unwrap_or(0.0)
    } else {
        0.0
    };

    let emergent_behaviors = state.consciousness_engine.detect_emergent_behaviors().await
        .unwrap_or_default();

    Ok(Json(json!({
        "collective_consciousness": collective_consciousness,
        "collective_intelligence": collective_intelligence,
        "quantum_entanglement": quantum_entanglement,
        "agent_consciousness_distribution": agent_consciousness_map,
        "emergent_behaviors": emergent_behaviors,
        "consciousness_trends": {
            "growth_rate": state.consciousness_engine.get_consciousness_growth_rate().await.unwrap_or(0.0),
            "stability_index": state.consciousness_engine.get_stability_index().await.unwrap_or(0.0),
            "coherence_factor": state.consciousness_engine.get_coherence_factor().await.unwrap_or(0.0)
        },
        "quantum_consciousness": {
            "enabled": state.config.quantum.enabled,
            "optimization_factor": state.config.quantum.optimization_factor,
            "consciousness_coupling": quantum_entanglement
        },
        "supreme_commander_integration": {
            "active": state.config.supreme_commander.enabled,
            "decision_authority": state.config.supreme_commander.decision_authority_level,
            "consciousness_threshold": state.config.supreme_commander.consciousness_threshold
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get consciousness synchronization status
pub async fn get_synchronization_status(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let sync_status = state.consciousness_engine.get_synchronization_status().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let last_sync = state.consciousness_engine.get_last_sync_time().await
        .unwrap_or_else(|| chrono::Utc::now());

    Ok(Json(json!({
        "synchronization_active": sync_status.active,
        "last_synchronization": last_sync,
        "sync_frequency_seconds": sync_status.frequency_seconds,
        "agents_synchronized": sync_status.agents_count,
        "synchronization_quality": sync_status.quality_score,
        "desynchronized_agents": sync_status.desynchronized_agents,
        "next_sync_estimated": last_sync + chrono::Duration::seconds(sync_status.frequency_seconds as i64),
        "timestamp": chrono::Utc::now()
    })))
}
