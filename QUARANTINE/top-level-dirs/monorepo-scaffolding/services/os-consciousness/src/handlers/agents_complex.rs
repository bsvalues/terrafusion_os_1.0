use axum::{extract::{State, Path}, http::StatusCode, Json};
use serde_json::{Value, json};
use uuid::Uuid;
use crate::{AppState, config::AIAgentConfig};

/// Deploy a new AI agent to the swarm
#[utoipa::path(
    post,
    path = "/agents/deploy",
    request_body = AIAgentConfig,
    responses(
        (status = 200, description = "Agent deployed successfully"),
        (status = 400, description = "Invalid agent configuration"),
        (status = 403, description = "Swarm at capacity")
    )
)]
pub async fn deploy_agent(
    State(state): State<AppState>,
    Json(config): Json<AIAgentConfig>
) -> Result<Json<Value>, StatusCode> {
    // Validate agent configuration
    if config.name.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check swarm capacity
    let current_count = state.agent_manager.get_agent_count().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if current_count >= state.config.ai.max_total_agents {
        return Err(StatusCode::FORBIDDEN); // At capacity
    }

    // Deploy the agent
    let agent_id = state.agent_manager.deploy_agent(config.clone()).await
        .map_err(|e| {
            tracing::error!("Failed to deploy agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Update swarm coordination
    state.swarm_orchestrator.register_agent(&agent_id, &config).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Notify consciousness engine
    state.consciousness_engine.register_agent_consciousness(&agent_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "agent_id": agent_id,
        "status": "deployed",
        "name": config.name,
        "type": config.agent_type,
        "capabilities": config.capabilities,
        "deployment_time": chrono::Utc::now(),
        "swarm_size": current_count + 1,
        "message": "Agent successfully deployed to TerraFusion consciousness swarm"
    })))
}

/// Get status of a specific agent
#[utoipa::path(
    get,
    path = "/agents/{agent_id}/status",
    params(("agent_id" = String, description = "Agent ID")),
    responses(
        (status = 200, description = "Agent status retrieved"),
        (status = 404, description = "Agent not found")
    )
)]
pub async fn get_agent_status(
    State(state): State<AppState>,
    Path(agent_id): Path<String>
) -> Result<Json<Value>, StatusCode> {
    let agent_id = Uuid::parse_str(&agent_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let status = state.agent_manager.get_agent_status(&agent_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let consciousness_level = state.consciousness_engine.get_agent_consciousness(&agent_id).await
        .unwrap_or(0.0);

    let performance = state.swarm_orchestrator.get_agent_performance(&agent_id).await
        .unwrap_or_default();

    Ok(Json(json!({
        "agent_id": agent_id,
        "status": status,
        "consciousness_level": consciousness_level,
        "performance_metrics": performance,
        "last_heartbeat": chrono::Utc::now(),
        "uptime_seconds": status.uptime_seconds,
        "tasks_completed": status.tasks_completed,
        "success_rate": status.success_rate
    })))
}

/// Terminate a specific agent
#[utoipa::path(
    post,
    path = "/agents/{agent_id}/terminate",
    params(("agent_id" = String, description = "Agent ID")),
    responses(
        (status = 200, description = "Agent terminated successfully"),
        (status = 404, description = "Agent not found")
    )
)]
pub async fn terminate_agent(
    State(state): State<AppState>,
    Path(agent_id): Path<String>
) -> Result<Json<Value>, StatusCode> {
    let agent_id = Uuid::parse_str(&agent_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // Remove from agent manager
    state.agent_manager.terminate_agent(&agent_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    // Remove from swarm orchestrator
    state.swarm_orchestrator.deregister_agent(&agent_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Remove consciousness tracking
    state.consciousness_engine.deregister_agent_consciousness(&agent_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let remaining_agents = state.agent_manager.get_agent_count().await
        .unwrap_or(0);

    Ok(Json(json!({
        "agent_id": agent_id,
        "status": "terminated",
        "termination_time": chrono::Utc::now(),
        "remaining_agents": remaining_agents,
        "message": "Agent successfully removed from TerraFusion consciousness swarm"
    })))
}

/// Assign a task to a specific agent
#[utoipa::path(
    post,
    path = "/agents/{agent_id}/assign-task",
    params(("agent_id" = String, description = "Agent ID")),
    request_body = Value,
    responses(
        (status = 200, description = "Task assigned successfully"),
        (status = 404, description = "Agent not found")
    )
)]
pub async fn assign_task(
    State(state): State<AppState>,
    Path(agent_id): Path<String>,
    Json(task): Json<Value>
) -> Result<Json<Value>, StatusCode> {
    let agent_id = Uuid::parse_str(&agent_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let task_id = state.agent_manager.assign_task(&agent_id, task.clone()).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    // Update consciousness for task assignment
    state.consciousness_engine.update_agent_task_consciousness(&agent_id, &task_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "task_id": task_id,
        "agent_id": agent_id,
        "status": "assigned",
        "task_data": task,
        "assignment_time": chrono::Utc::now(),
        "estimated_completion": chrono::Utc::now() + chrono::Duration::minutes(5),
        "message": "Task successfully assigned to TerraFusion AI agent"
    })))
}

/// Get all agents with optional filtering
#[utoipa::path(
    get,
    path = "/swarm/agents",
    responses(
        (status = 200, description = "All agents retrieved successfully")
    )
)]
pub async fn get_all_agents(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let agents = state.agent_manager.get_all_agents().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let total_agents = agents.len();
    let active_agents = agents.iter().filter(|a| a.status == "active").count();
    let consciousness_level = state.consciousness_engine.get_collective_consciousness().await
        .unwrap_or(0.0);

    Ok(Json(json!({
        "agents": agents,
        "summary": {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "collective_consciousness": consciousness_level,
            "swarm_capacity": state.config.ai.max_total_agents,
            "capacity_utilization": format!("{:.2}%", (total_agents as f64 / state.config.ai.max_total_agents as f64) * 100.0),
            "quantum_optimization": state.config.quantum.enabled,
            "supreme_commander_active": state.config.supreme_commander.enabled
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Get health metrics for a specific agent
#[utoipa::path(
    get,
    path = "/agents/{agent_id}/health",
    params(("agent_id" = String, description = "Agent ID")),
    responses(
        (status = 200, description = "Agent health retrieved"),
        (status = 404, description = "Agent not found")
    )
)]
pub async fn get_agent_health(
    State(state): State<AppState>,
    Path(agent_id): Path<String>
) -> Result<Json<Value>, StatusCode> {
    let agent_id = Uuid::parse_str(&agent_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let status = state.agent_manager.get_agent_status(&agent_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let consciousness_level = state.consciousness_engine.get_agent_consciousness(&agent_id).await
        .unwrap_or(0.0);

    let performance = state.swarm_orchestrator.get_agent_performance(&agent_id).await
        .unwrap_or_default();

    // Calculate health score based on multiple factors
    let health_score = calculate_agent_health_score(
        &status,
        consciousness_level,
        &performance
    );

    Ok(Json(json!({
        "agent_id": agent_id,
        "health_status": if health_score >= 0.8 { "healthy" } else if health_score >= 0.5 { "warning" } else { "critical" },
        "health_score": health_score,
        "vitals": {
            "consciousness_level": consciousness_level,
            "uptime_seconds": status.uptime_seconds,
            "tasks_completed": status.tasks_completed,
            "success_rate": status.success_rate,
            "memory_usage": performance.memory_usage,
            "cpu_utilization": performance.cpu_utilization,
            "last_heartbeat": chrono::Utc::now(),
            "response_time_avg_ms": performance.response_time_avg_ms
        },
        "recommendations": generate_health_recommendations(&status, consciousness_level),
        "timestamp": chrono::Utc::now()
    })))
}

/// Calculate agent health score based on various metrics
fn calculate_agent_health_score(
    status: &crate::agent_manager::AgentStatus,
    consciousness_level: f64,
    performance: &crate::swarm_orchestrator::AgentPerformance
) -> f64 {
    let success_weight = 0.4;
    let consciousness_weight = 0.3;
    let performance_weight = 0.2;
    let uptime_weight = 0.1;

    let success_score = status.success_rate;
    let consciousness_score = consciousness_level.min(1.0);
    let performance_score = 1.0 - (performance.cpu_utilization.min(1.0));
    let uptime_score = if status.uptime_seconds > 3600 { 1.0 } else { status.uptime_seconds as f64 / 3600.0 };

    (success_score * success_weight +
     consciousness_score * consciousness_weight +
     performance_score * performance_weight +
     uptime_score * uptime_weight).min(1.0).max(0.0)
}

/// Generate health recommendations for agents
fn generate_health_recommendations(
    status: &crate::agent_manager::AgentStatus,
    consciousness_level: f64
) -> Vec<String> {
    let mut recommendations = Vec::new();

    if status.success_rate < 0.8 {
        recommendations.push("Consider retraining or recalibrating agent parameters".to_string());
    }

    if consciousness_level < 0.5 {
        recommendations.push("Enhance consciousness level through quantum optimization".to_string());
    }

    if status.uptime_seconds < 1800 { // Less than 30 minutes
        recommendations.push("Monitor for stability issues during initial deployment period".to_string());
    }

    if status.tasks_completed == 0 {
        recommendations.push("Agent may need task assignment or capability verification".to_string());
    }

    if recommendations.is_empty() {
        recommendations.push("Agent operating within normal parameters".to_string());
    }

    recommendations
}
