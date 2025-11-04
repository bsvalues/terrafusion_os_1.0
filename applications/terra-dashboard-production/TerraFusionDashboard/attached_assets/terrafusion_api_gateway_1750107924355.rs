// TerraFusion API Gateway - Production REST Implementation
// File: api-gateway/src/main.rs

use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    middleware,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc, time::Duration};
use tower::{ServiceBuilder, limit::ConcurrencyLimitLayer};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::{Result, Context};
use tracing::{info, error, instrument};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

// Import our database layer
use terrafusion_database::{
    Database, PropertyRepository, AgentExecutionRepository, PerformanceAnalytics,
    Property, PropertyType, AgentExecution, ExecutionStatus, TaskType,
};

// ============================================================================
// APPLICATION STATE
// ============================================================================

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
    pub property_repo: Arc<PropertyRepository>,
    pub agent_repo: Arc<AgentExecutionRepository>,
    pub analytics: Arc<PerformanceAnalytics>,
    pub jwt_secret: Arc<String>,
    pub agent_orchestrator: Arc<crate::orchestrator::TaskOrchestrator>,
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub request_id: String,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T, request_id: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: Utc::now(),
            request_id,
        }
    }

    pub fn error(error: String, request_id: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
            timestamp: Utc::now(),
            request_id,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreatePropertyRequest {
    pub parcel_id: String,
    pub address: String,
    pub legal_description: Option<String>,
    pub assessed_value: f64, // Will convert to cents
    pub land_value: f64,
    pub improvement_value: f64,
    pub square_feet: Option<i32>,
    pub lot_size_acres: Option<f64>,
    pub year_built: Option<i32>,
    pub property_type: PropertyType,
    pub zoning: Option<String>,
    pub coordinates: Option<Coordinates>,
    pub county_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Coordinates {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct PropertyResponse {
    pub id: Uuid,
    pub parcel_id: String,
    pub address: String,
    pub assessed_value: f64, // Converted from cents
    pub land_value: f64,
    pub improvement_value: f64,
    pub square_feet: Option<i32>,
    pub year_built: Option<i32>,
    pub property_type: PropertyType,
    pub coordinates: Option<Coordinates>,
    pub last_assessment_date: DateTime<Utc>,
    pub county_name: Option<String>,
    pub neighborhood_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PropertySearchQuery {
    pub q: Option<String>,
    pub county_id: Option<Uuid>,
    pub property_type: Option<PropertyType>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct AgentTaskRequest {
    pub property_id: Uuid,
    pub task_type: TaskType,
    pub parameters: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct AgentTaskResponse {
    pub task_id: Uuid,
    pub status: ExecutionStatus,
    pub estimated_completion: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid, // User ID
    pub email: String,
    pub role: String,
    pub county_id: Option<Uuid>,
    pub permissions: Vec<String>,
    pub exp: usize, // Expiration timestamp
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

#[derive(Debug)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
    pub county_id: Option<Uuid>,
    pub permissions: Vec<String>,
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut request: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let claims = decode_jwt(token, &state.jwt_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let auth_context = AuthContext {
        user_id: claims.sub,
        email: claims.email,
        role: claims.role,
        county_id: claims.county_id,
        permissions: claims.permissions,
    };

    request.extensions_mut().insert(auth_context);
    Ok(next.run(request).await)
}

fn decode_jwt(token: &str, secret: &str) -> Result<Claims> {
    let key = DecodingKey::from_secret(secret.as_ref());
    let validation = Validation::default();
    
    let token_data = decode::<Claims>(token, &key, &validation)
        .context("Failed to decode JWT")?;
    
    Ok(token_data.claims)
}

// ============================================================================
// PROPERTY API HANDLERS
// ============================================================================

#[instrument(skip(state))]
pub async fn create_property(
    State(state): State<AppState>,
    Json(request): Json<CreatePropertyRequest>,
) -> Result<Json<ApiResponse<PropertyResponse>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    // Convert dollars to cents for storage
    let property = Property {
        id: Uuid::new_v4(),
        parcel_id: request.parcel_id,
        address: request.address,
        legal_description: request.legal_description,
        assessed_value: (request.assessed_value * 100.0) as i64,
        market_value: None,
        land_value: (request.land_value * 100.0) as i64,
        improvement_value: (request.improvement_value * 100.0) as i64,
        square_feet: request.square_feet,
        lot_size_acres: request.lot_size_acres,
        year_built: request.year_built,
        property_type: request.property_type,
        zoning: request.zoning,
        neighborhood_id: None,
        coordinates: request.coordinates.map(|c| sqlx::types::Json(c)),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        last_assessment_date: Utc::now(),
        next_assessment_due: Utc::now() + chrono::Duration::days(365),
        county_id: request.county_id,
        active: true,
    };

    match state.property_repo.create_property(&property).await {
        Ok(created_property) => {
            let response = PropertyResponse {
                id: created_property.id,
                parcel_id: created_property.parcel_id,
                address: created_property.address,
                assessed_value: created_property.assessed_value as f64 / 100.0,
                land_value: created_property.land_value as f64 / 100.0,
                improvement_value: created_property.improvement_value as f64 / 100.0,
                square_feet: created_property.square_feet,
                year_built: created_property.year_built,
                property_type: created_property.property_type,
                coordinates: created_property.coordinates.map(|c| c.0),
                last_assessment_date: created_property.last_assessment_date,
                county_name: None,
                neighborhood_name: None,
            };

            Ok(Json(ApiResponse::success(response, request_id)))
        }
        Err(e) => {
            error!("Failed to create property: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[instrument(skip(state))]
pub async fn get_property(
    State(state): State<AppState>,
    Path(property_id): Path<Uuid>,
) -> Result<Json<ApiResponse<PropertyResponse>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    match state.property_repo.get_property_by_id(property_id).await {
        Ok(Some(property)) => {
            let response = PropertyResponse {
                id: property.id,
                parcel_id: property.parcel_id,
                address: property.address,
                assessed_value: property.assessed_value as f64 / 100.0,
                land_value: property.land_value as f64 / 100.0,
                improvement_value: property.improvement_value as f64 / 100.0,
                square_feet: property.square_feet,
                year_built: property.year_built,
                property_type: property.property_type,
                coordinates: property.coordinates.map(|c| c.0),
                last_assessment_date: property.last_assessment_date,
                county_name: None,
                neighborhood_name: None,
            };

            Ok(Json(ApiResponse::success(response, request_id)))
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to get property: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[instrument(skip(state))]
pub async fn search_properties(
    State(state): State<AppState>,
    Query(params): Query<PropertySearchQuery>,
) -> Result<Json<ApiResponse<Vec<PropertyResponse>>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    // Default search parameters
    let county_id = params.county_id.unwrap_or_else(|| {
        // Default to Benton County for demo
        Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap()
    });
    let limit = params.limit.unwrap_or(50).min(100) as i32;
    let offset = (params.page.unwrap_or(1).saturating_sub(1)) * params.limit.unwrap_or(50) as u32;

    let properties = if let Some(query) = params.q {
        state.property_repo.search_properties(&query, county_id).await
    } else {
        state.property_repo.get_properties_by_county(county_id, limit, offset as i32).await
    };

    match properties {
        Ok(props) => {
            let response: Vec<PropertyResponse> = props
                .into_iter()
                .map(|p| PropertyResponse {
                    id: p.id,
                    parcel_id: p.parcel_id,
                    address: p.address,
                    assessed_value: p.assessed_value as f64 / 100.0,
                    land_value: p.land_value as f64 / 100.0,
                    improvement_value: p.improvement_value as f64 / 100.0,
                    square_feet: p.square_feet,
                    year_built: p.year_built,
                    property_type: p.property_type,
                    coordinates: p.coordinates.map(|c| c.0),
                    last_assessment_date: p.last_assessment_date,
                    county_name: None,
                    neighborhood_name: None,
                })
                .collect();

            Ok(Json(ApiResponse::success(response, request_id)))
        }
        Err(e) => {
            error!("Failed to search properties: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ============================================================================
// AGENT API HANDLERS
// ============================================================================

#[instrument(skip(state))]
pub async fn submit_agent_task(
    State(state): State<AppState>,
    Json(request): Json<AgentTaskRequest>,
) -> Result<Json<ApiResponse<AgentTaskResponse>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    // Create agent execution record
    let execution = AgentExecution {
        id: Uuid::new_v4(),
        property_id: request.property_id,
        agent_id: match request.task_type {
            TaskType::PropertyValuation => "narrator-ai".to_string(),
            TaskType::ExemptionAnalysis => "exemption-seer".to_string(),
            TaskType::SalesValidation => "sales-validator".to_string(),
            TaskType::NeighborhoodAnalysis => "neighborhood-agent".to_string(),
            TaskType::ComplianceCheck => "statistical-agent".to_string(),
            TaskType::CostEstimation => "cost-analyzer".to_string(),
        },
        task_type: format!("{:?}", request.task_type),
        parameters: sqlx::types::Json(request.parameters.clone()),
        result: None,
        status: ExecutionStatus::Pending,
        started_at: Utc::now(),
        completed_at: None,
        duration_ms: None,
        error_message: None,
        confidence_score: None,
        created_by: Uuid::new_v4(), // TODO: Get from auth context
    };

    match state.agent_repo.create_execution(&execution).await {
        Ok(created_execution) => {
            // Submit to orchestrator
            let orchestrator_task = crate::orchestrator::AgentTask {
                id: created_execution.id,
                agent_id: created_execution.agent_id.clone(),
                property_id: created_execution.property_id,
                task_type: request.task_type,
                parameters: request.parameters,
                status: crate::orchestrator::TaskStatus::Pending,
                created_at: Utc::now(),
                completed_at: None,
                result: None,
                error: None,
            };

            match state.agent_orchestrator.submit_task(orchestrator_task).await {
                Ok(_) => {
                    let response = AgentTaskResponse {
                        task_id: created_execution.id,
                        status: ExecutionStatus::Pending,
                        estimated_completion: Some(Utc::now() + chrono::Duration::minutes(5)),
                    };
                    Ok(Json(ApiResponse::success(response, request_id)))
                }
                Err(e) => {
                    error!("Failed to submit task to orchestrator: {:?}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        Err(e) => {
            error!("Failed to create agent execution: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[instrument(skip(state))]
pub async fn get_agent_task_status(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<ApiResponse<AgentExecution>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    // First check orchestrator for real-time status
    if let Some(orchestrator_task) = state.agent_orchestrator.get_task_status(task_id).await {
        // Update database with latest status
        if orchestrator_task.status == crate::orchestrator::TaskStatus::Completed {
            if let Some(result) = orchestrator_task.result {
                let _ = state.agent_repo.complete_execution(task_id, result, None).await;
            }
        } else if orchestrator_task.status == crate::orchestrator::TaskStatus::Failed {
            if let Some(error) = orchestrator_task.error {
                let _ = state.agent_repo.fail_execution(task_id, error).await;
            }
        }
    }

    // Return updated status from database
    match state.agent_repo.get_execution_history(task_id).await {
        Ok(mut executions) => {
            if let Some(execution) = executions.pop() {
                Ok(Json(ApiResponse::success(execution, request_id)))
            } else {
                Err(StatusCode::NOT_FOUND)
            }
        }
        Err(e) => {
            error!("Failed to get agent execution: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[instrument(skip(state))]
pub async fn get_property_agent_history(
    State(state): State<AppState>,
    Path(property_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<AgentExecution>>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    match state.agent_repo.get_execution_history(property_id).await {
        Ok(executions) => Ok(Json(ApiResponse::success(executions, request_id))),
        Err(e) => {
            error!("Failed to get agent history: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ============================================================================
// ANALYTICS API HANDLERS
// ============================================================================

#[instrument(skip(state))]
pub async fn get_agent_performance(
    State(state): State<AppState>,
    Path(agent_id): Path<String>,
) -> Result<Json<ApiResponse<terrafusion_database::AgentPerformanceStats>>, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    match state.analytics.get_agent_performance_stats(&agent_id).await {
        Ok(stats) => Ok(Json(ApiResponse::success(stats, request_id))),
        Err(e) => {
            error!("Failed to get agent performance: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ============================================================================
// HEALTH CHECK HANDLERS
// ============================================================================

#[derive(Debug, Serialize)]
pub struct HealthCheck {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub database: String,
    pub agents: String,
}

pub async fn health_check(
    State(state): State<AppState>,
) -> Json<ApiResponse<HealthCheck>> {
    let request_id = Uuid::new_v4().to_string();

    let db_status = match state.db.health_check().await {
        Ok(_) => "healthy".to_string(),
        Err(_) => "unhealthy".to_string(),
    };

    let health = HealthCheck {
        status: if db_status == "healthy" { "healthy".to_string() } else { "degraded".to_string() },
        timestamp: Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: db_status,
        agents: "healthy".to_string(), // TODO: Check agent orchestrator
    };

    Json(ApiResponse::success(health, request_id))
}

// ============================================================================
// WEBSOCKET HANDLERS FOR REAL-TIME UPDATES
// ============================================================================

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::Response;
use futures_util::{sink::SinkExt, stream::StreamExt};
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize)]
pub struct AgentUpdate {
    pub task_id: Uuid,
    pub property_id: Uuid,
    pub agent_id: String,
    pub status: ExecutionStatus,
    pub progress: Option<f32>,
    pub message: Option<String>,
    pub timestamp: DateTime<Utc>,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

async fn handle_websocket(socket: WebSocket, _state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    
    // Create a broadcast channel for agent updates
    let (tx, mut rx) = broadcast::channel::<AgentUpdate>(100);

    // Spawn task to send updates to client
    let send_task = tokio::spawn(async move {
        while let Ok(update) = rx.recv().await {
            let message = serde_json::to_string(&update).unwrap();
            if sender.send(Message::Text(message)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from client
    let receive_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            if let Ok(msg) = msg {
                match msg {
                    Message::Text(text) => {
                        info!("Received WebSocket message: {}", text);
                        // Handle client subscriptions, etc.
                    }
                    Message::Close(_) => {
                        info!("WebSocket connection closed");
                        break;
                    }
                    _ => {}
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = receive_task => {},
    }
}

// ============================================================================
// ROUTER SETUP
// ============================================================================

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Property endpoints
        .route("/api/v1/properties", post(create_property))
        .route("/api/v1/properties", get(search_properties))
        .route("/api/v1/properties/:id", get(get_property))
        
        // Agent endpoints
        .route("/api/v1/agents/tasks", post(submit_agent_task))
        .route("/api/v1/agents/tasks/:id", get(get_agent_task_status))
        .route("/api/v1/properties/:id/agents", get(get_property_agent_history))
        
        // Analytics endpoints
        .route("/api/v1/analytics/agents/:id", get(get_agent_performance))
        
        // WebSocket endpoint
        .route("/api/v1/ws", get(websocket_handler))
        
        // Health check
        .route("/health", get(health_check))
        
        .with_state(state)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(CorsLayer::new()
                    .allow_origin(Any)
                    .allow_methods(Any)
                    .allow_headers(Any))
                .layer(ConcurrencyLimitLayer::new(1000))
        )
        // Add auth middleware to protected routes
        .route_layer(middleware::from_fn_with_state(
            state.clone(), 
            auth_middleware
        ))
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load configuration
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/terrafusion".to_string());
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "terrafusion-super-secret-key-change-in-production".to_string());

    // Initialize database
    let db = Arc::new(Database::new(&database_url).await?);
    db.migrate().await?;

    // Initialize repositories
    let property_repo = Arc::new(PropertyRepository::new(db.pool().clone()));
    let agent_repo = Arc::new(AgentExecutionRepository::new(db.pool().clone()));
    let analytics = Arc::new(PerformanceAnalytics::new(db.pool().clone()));

    // Initialize agent orchestrator
    let agent_registry = Arc::new(crate::orchestrator::AgentRegistry::new());
    let (orchestrator, _results_receiver) = crate::orchestrator::TaskOrchestrator::new(agent_registry);

    // Create application state
    let state = AppState {
        db,
        property_repo,
        agent_repo,
        analytics,
        jwt_secret: Arc::new(jwt_secret),
        agent_orchestrator: Arc::new(orchestrator),
    };

    // Create router
    let app = create_router(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    info!("TerraFusion API Gateway starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
    pub timestamp: DateTime<Utc>,
    pub request_id: String,
}

// ============================================================================
// CARGO.TOML DEPENDENCIES
// ============================================================================

/*
[package]
name = "terrafusion-api-gateway"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["ws", "macros"] }
tokio = { version = "1.0", features = ["full"] }
tower = { version = "0.4", features = ["full"] }
tower-http = { version = "0.5", features = ["fs", "trace", "cors", "compression"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
jsonwebtoken = "9.0"
futures-util = "0.3"
terrafusion-database = { path = "../database" }
terrafusion-orchestrator = { path = "../orchestrator" }
*/

// ============================================================================
// EXAMPLE API USAGE
// ============================================================================

/*
// Create a new property
POST /api/v1/properties
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "parcel_id": "1102234413",
  "address": "124 Main Street, Richland, WA 99354",
  "assessed_value": 495000.00,
  "land_value": 85000.00,
  "improvement_value": 410000.00,
  "square_feet": 2450,
  "year_built": 1998,
  "property_type": "Residential",
  "coordinates": {
    "latitude": 46.2383,
    "longitude": -119.2752
  },
  "county_id": "550e8400-e29b-41d4-a716-446655440000"
}

// Search properties
GET /api/v1/properties?q=main%20street&county_id=550e8400-e29b-41d4-a716-446655440000&limit=20

// Submit agent task
POST /api/v1/agents/tasks
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "property_id": "550e8400-e29b-41d4-a716-446655440003",
  "task_type": "PropertyValuation",
  "parameters": {
    "assessment_type": "market_value",
    "include_comparables": true,
    "neighborhood_analysis": true
  }
}

// Check task status
GET /api/v1/agents/tasks/550e8400-e29b-41d4-a716-446655440004

// WebSocket connection for real-time updates
ws://localhost:3000/api/v1/ws
*/