//! TerraFusion OS Consciousness Service
//! Elite AI swarm orchestration with quantum consciousness optimization

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing::{info, error};
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;
use serde::{Deserialize, Serialize};

mod config;
mod swarm;
mod consciousness;
mod quantum;
mod agents;
mod coordination;
mod models;
mod handlers;

use config::Config;
use swarm::SwarmOrchestrator;
use consciousness::ConsciousnessEngine;
use quantum::QuantumOptimizer;
use agents::AgentManager;
use coordination::CoordinationEngine;

/// TerraFusion OS Consciousness Service State
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub swarm_orchestrator: Arc<SwarmOrchestrator>,
    pub consciousness_engine: Arc<ConsciousnessEngine>,
    pub quantum_optimizer: Arc<QuantumOptimizer>,
    pub agent_manager: Arc<AgentManager>,
    pub coordination_engine: Arc<CoordinationEngine>,
    pub compliance_monitor: Arc<ComplianceMonitor>,
    pub service_monitor: Arc<ServiceMonitor>,
    pub health_checker: Arc<HealthChecker>,
}

/// Basic compliance monitor
#[derive(Debug)]
pub struct ComplianceMonitor;

impl ComplianceMonitor {
    pub fn new() -> Self {
        Self
    }
}

/// Basic service monitor
#[derive(Debug)]
pub struct ServiceMonitor;

impl ServiceMonitor {
    pub fn new() -> Self {
        Self
    }
}

/// Basic health checker
#[derive(Debug)]
pub struct HealthChecker;

impl HealthChecker {
    pub fn new() -> Self {
        Self
    }
}

/// OpenAPI documentation
#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::agents::deploy_agent,
        handlers::agents::get_agent_status,
        handlers::agents::terminate_agent,
        handlers::agents::assign_task,
        handlers::agents::get_agent_health,
        handlers::agents::get_all_agents,
        handlers::swarm::deploy_swarm,
        handlers::swarm::get_swarm_status,
        handlers::swarm::get_agent_count,
        handlers::swarm::emergency_shutdown,
        handlers::consciousness::get_consciousness_metrics,
        handlers::consciousness::get_collective_consciousness,
        handlers::consciousness::enhance_consciousness,
        handlers::quantum::optimize_quantum_factor,
        handlers::quantum::get_quantum_metrics,
        handlers::quantum::apply_quantum_optimization,
        handlers::coordination::coordinate_decision,
        handlers::coordination::get_coordination_metrics,
        handlers::coordination::get_active_decisions,
        handlers::compliance::monitor_compliance,
        handlers::compliance::get_compliance_status,
        handlers::health::get_health,
        handlers::health::get_system_status,
    ),
    components(schemas()),
    tags(
        (name = "agents", description = "AI Agent Management"),
        (name = "swarm", description = "AI Swarm Coordination"),
        (name = "consciousness", description = "Consciousness Engine"),
        (name = "quantum", description = "Quantum Optimization"),
        (name = "coordination", description = "Decision Coordination"),
        (name = "compliance", description = "Government Compliance"),
        (name = "health", description = "Service Health")
    ),
    info(
        title = "TerraFusion OS Consciousness API",
        version = "1.0.0",
        description = "Elite AI swarm orchestration with quantum consciousness optimization for government operations"
    ),
    servers(
        (url = "http://localhost:3004", description = "Development"),
        (url = "https://consciousness.terrafusion.gov", description = "Production")
    )
)]
struct ApiDoc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = Config::load()?;
    info!("TerraFusion OS Consciousness Service starting on {}:{}", config.host, config.port);

    // Initialize components with proper config references and await calls
    let swarm_orchestrator = Arc::new(SwarmOrchestrator::new(&config).await?);
    let consciousness_engine = Arc::new(ConsciousnessEngine::new(&config).await?);
    let quantum_optimizer = Arc::new(QuantumOptimizer::new(&config).await?);
    let agent_manager = Arc::new(AgentManager::new(&config).await?);
    let coordination_engine = Arc::new(CoordinationEngine::new(&config).await?);
    let compliance_monitor = Arc::new(ComplianceMonitor::new());
    let service_monitor = Arc::new(ServiceMonitor::new());
    let health_checker = Arc::new(HealthChecker::new());

    // Create shared application state
    let app_state = AppState {
        config: Arc::new(config.clone()),
        swarm_orchestrator,
        consciousness_engine,
        quantum_optimizer,
        agent_manager,
        coordination_engine,
        compliance_monitor,
        service_monitor,
        health_checker,
    };

    // Build router
    let app = create_router(app_state.clone());

    // Create listener
    let listener = TcpListener::bind(format!("{}:{}", config.host, config.port)).await?;
    info!("🚀 TerraFusion OS Consciousness Service listening on {}:{}", config.host, config.port);

    // Start background tasks
    tokio::spawn({
        let _app_state_bg = app_state.clone();
        async move {
            info!("🧠 Starting consciousness synchronization...");
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                // Background consciousness synchronization
            }
        }
    });

    // Serve application
    axum::serve(listener, app).await?;

    Ok(())
}

/// Create the main application router
fn create_router(state: AppState) -> Router {
    Router::new()
        // Health endpoints
        .route("/health", get(handlers::health::get_health))
        .route("/system/status", get(handlers::health::get_system_status))

        // Agent management
        .route("/agents/deploy", post(handlers::agents::deploy_agent))
        .route("/swarm/agents", get(handlers::agents::get_all_agents))
        .route("/agents/:agent_id/status", get(handlers::agents::get_agent_status))
        .route("/agents/:agent_id/terminate", post(handlers::agents::terminate_agent))
        .route("/agents/:agent_id/assign-task", post(handlers::agents::assign_task))
        .route("/agents/:agent_id/health", get(handlers::agents::get_agent_health))

        // Swarm coordination
        .route("/swarm/deploy", post(handlers::swarm::deploy_swarm))
        .route("/swarm/status", get(handlers::swarm::get_swarm_status))
        .route("/agents/count", get(handlers::swarm::get_agent_count))
        .route("/swarm/emergency-shutdown", post(handlers::swarm::emergency_shutdown))

        // Consciousness management
        .route("/consciousness/metrics", get(handlers::consciousness::get_consciousness_metrics))
        .route("/consciousness/collective", get(handlers::consciousness::get_collective_consciousness))
        .route("/consciousness/enhance", post(handlers::consciousness::enhance_consciousness))

        // Quantum optimization
        .route("/quantum/optimize", put(handlers::quantum::optimize_quantum_factor))
        .route("/quantum/metrics", get(handlers::quantum::get_quantum_metrics))
        .route("/quantum/apply", post(handlers::quantum::apply_quantum_optimization))

        // Decision coordination
        .route("/coordination/decide", post(handlers::coordination::coordinate_decision))
        .route("/coordination/metrics", get(handlers::coordination::get_coordination_metrics))
        .route("/coordination/decisions", get(handlers::coordination::get_active_decisions))

        // Government compliance
        .route("/compliance/monitor", get(handlers::compliance::monitor_compliance))
        .route("/compliance/status", get(handlers::compliance::get_compliance_status))

        // OpenAPI documentation
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))

        // Middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(CorsLayer::permissive())
        )
        .with_state(state)
}
