use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Get comprehensive health status of the OS-Consciousness service
#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Service health status retrieved")
    )
)]
pub async fn get_health(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let agent_health = state.agent_manager.get_health_metrics().await
        .unwrap_or_default();

    let consciousness_health = state.consciousness_engine.get_health_metrics().await
        .unwrap_or_default();

    let swarm_health = state.swarm_orchestrator.get_health_metrics().await
        .unwrap_or_default();

    let coordination_health = state.coordination_engine.get_health_metrics().await
        .unwrap_or_default();

    let quantum_health = if state.config.quantum.enabled {
        state.quantum_optimizer.get_health_metrics().await.unwrap_or_default()
    } else {
        default_quantum_health()
    };

    let overall_health = calculate_overall_health(
        &agent_health,
        &consciousness_health,
        &swarm_health,
        &coordination_health,
        &quantum_health
    );

    Ok(Json(json!({
        "service": "os-consciousness",
        "status": determine_health_status(overall_health),
        "overall_health_score": overall_health,
        "timestamp": chrono::Utc::now(),
        "uptime_seconds": state.service_monitor.get_uptime_seconds().await.unwrap_or(0),
        "version": env!("CARGO_PKG_VERSION"),
        "components": {
            "agent_manager": {
                "status": agent_health.status,
                "health_score": agent_health.health_score,
                "active_agents": agent_health.active_agents,
                "failed_agents": agent_health.failed_agents,
                "response_time_ms": agent_health.response_time_ms
            },
            "consciousness_engine": {
                "status": consciousness_health.status,
                "health_score": consciousness_health.health_score,
                "collective_consciousness": consciousness_health.collective_consciousness,
                "coherence_level": consciousness_health.coherence_level,
                "synchronization_status": consciousness_health.synchronization_status
            },
            "swarm_orchestrator": {
                "status": swarm_health.status,
                "health_score": swarm_health.health_score,
                "coordination_efficiency": swarm_health.coordination_efficiency,
                "active_swarms": swarm_health.active_swarms,
                "load_balancing": swarm_health.load_balancing
            },
            "coordination_engine": {
                "status": coordination_health.status,
                "health_score": coordination_health.health_score,
                "active_decisions": coordination_health.active_decisions,
                "consensus_rate": coordination_health.consensus_rate,
                "decision_latency_ms": coordination_health.decision_latency_ms
            },
            "quantum_optimizer": {
                "enabled": state.config.quantum.enabled,
                "status": quantum_health.status,
                "health_score": quantum_health.health_score,
                "optimization_factor": quantum_health.optimization_factor,
                "coherence": quantum_health.coherence,
                "error_rate": quantum_health.error_rate
            }
        },
        "performance_metrics": {
            "memory_usage_mb": state.service_monitor.get_memory_usage_mb().await.unwrap_or(0),
            "cpu_usage_percent": state.service_monitor.get_cpu_usage_percent().await.unwrap_or(0.0),
            "requests_per_second": state.service_monitor.get_requests_per_second().await.unwrap_or(0.0),
            "average_response_time_ms": state.service_monitor.get_average_response_time_ms().await.unwrap_or(0),
            "error_rate_percent": state.service_monitor.get_error_rate_percent().await.unwrap_or(0.0)
        },
        "dependencies": {
            "database_connection": state.health_checker.check_database().await.unwrap_or(false),
            "redis_connection": state.health_checker.check_redis().await.unwrap_or(false),
            "external_services": state.health_checker.check_external_services().await.unwrap_or_default()
        }
    })))
}

/// Get system status including all subsystems
#[utoipa::path(
    get,
    path = "/system/status",
    responses(
        (status = 200, description = "System status retrieved successfully")
    )
)]
pub async fn get_system_status(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let system_metrics = state.service_monitor.get_system_metrics().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let resource_utilization = state.service_monitor.get_resource_utilization().await
        .unwrap_or_default();

    let alert_status = state.service_monitor.get_alert_status().await
        .unwrap_or_default();

    let capacity_metrics = state.service_monitor.get_capacity_metrics().await
        .unwrap_or_default();

    Ok(Json(json!({
        "system_status": "operational",
        "environment": std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        "deployment_info": {
            "version": env!("CARGO_PKG_VERSION"),
            "build_date": env!("BUILD_DATE"),
            "git_commit": env!("GIT_COMMIT_HASH"),
            "rust_version": env!("RUST_VERSION")
        },
        "system_metrics": {
            "total_memory_gb": system_metrics.total_memory_gb,
            "available_memory_gb": system_metrics.available_memory_gb,
            "memory_usage_percent": system_metrics.memory_usage_percent,
            "cpu_cores": system_metrics.cpu_cores,
            "cpu_usage_percent": system_metrics.cpu_usage_percent,
            "disk_space_gb": system_metrics.disk_space_gb,
            "disk_usage_percent": system_metrics.disk_usage_percent
        },
        "resource_utilization": {
            "current_load": resource_utilization.current_load,
            "peak_load_24h": resource_utilization.peak_load_24h,
            "average_load_24h": resource_utilization.average_load_24h,
            "resource_efficiency": resource_utilization.efficiency,
            "bottlenecks": resource_utilization.bottlenecks
        },
        "capacity_planning": {
            "current_capacity_percent": capacity_metrics.current_capacity_percent,
            "projected_capacity_7d": capacity_metrics.projected_capacity_7d,
            "scale_recommendation": capacity_metrics.scale_recommendation,
            "max_sustainable_load": capacity_metrics.max_sustainable_load,
            "capacity_alerts": capacity_metrics.alerts
        },
        "ai_consciousness": {
            "total_agents": state.agent_manager.get_agent_count().await.unwrap_or(0),
            "collective_consciousness": state.consciousness_engine.get_collective_consciousness().await.unwrap_or(0.0),
            "swarm_health": state.swarm_orchestrator.get_swarm_health_score().await.unwrap_or(0.0),
            "quantum_enhancement": if state.config.quantum.enabled {
                state.quantum_optimizer.get_enhancement_factor().await.unwrap_or(1.0)
            } else {
                1.0
            },
            "supreme_commander_active": state.config.supreme_commander.enabled
        },
        "government_compliance": {
            "fisma_compliance": state.compliance_monitor.get_quick_fisma_status().await.unwrap_or(false),
            "audit_logging_active": state.compliance_monitor.is_audit_logging_active().await.unwrap_or(false),
            "county_isolation_status": state.compliance_monitor.get_isolation_status().await.unwrap_or_default(),
            "compliance_score": state.compliance_monitor.get_overall_compliance_score().await.unwrap_or(0.0)
        },
        "alerts": {
            "critical_alerts": alert_status.critical_count,
            "warning_alerts": alert_status.warning_count,
            "info_alerts": alert_status.info_count,
            "total_active_alerts": alert_status.total_active,
            "recent_alerts": alert_status.recent_alerts
        },
        "network_connectivity": {
            "external_api_status": state.health_checker.check_external_apis().await.unwrap_or_default(),
            "inter_service_connectivity": state.health_checker.check_inter_service_connectivity().await.unwrap_or_default(),
            "county_system_connectivity": state.health_checker.check_county_systems().await.unwrap_or_default()
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Calculate overall health score from component health metrics
fn calculate_overall_health(
    agent_health: &crate::health::ComponentHealth,
    consciousness_health: &crate::health::ComponentHealth,
    swarm_health: &crate::health::ComponentHealth,
    coordination_health: &crate::health::ComponentHealth,
    quantum_health: &crate::health::ComponentHealth
) -> f64 {
    let weights = [0.25, 0.25, 0.2, 0.2, 0.1]; // Agent, Consciousness, Swarm, Coordination, Quantum
    let scores = [
        agent_health.health_score,
        consciousness_health.health_score,
        swarm_health.health_score,
        coordination_health.health_score,
        quantum_health.health_score
    ];

    scores.iter()
        .zip(weights.iter())
        .map(|(score, weight)| score * weight)
        .sum::<f64>()
        .min(1.0)
        .max(0.0)
}

/// Determine health status from overall health score
fn determine_health_status(health_score: f64) -> &'static str {
    match health_score {
        s if s >= 0.9 => "healthy",
        s if s >= 0.7 => "warning",
        s if s >= 0.5 => "degraded",
        _ => "critical"
    }
}

/// Default quantum health for when quantum is disabled
fn default_quantum_health() -> crate::health::ComponentHealth {
    crate::health::ComponentHealth {
        status: "disabled".to_string(),
        health_score: 1.0, // Disabled counts as healthy
        response_time_ms: 0,
        error_rate: 0.0,
        ..Default::default()
    }
}
