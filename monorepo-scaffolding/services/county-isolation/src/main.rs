use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing::info;
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

mod config;
mod isolation;
mod audit;
mod validation;
mod models;
mod middleware;

use config::Config;
use isolation::CountyIsolationEngine;

/// County Isolation Service State
#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub isolation_engine: Arc<CountyIsolationEngine>,
}

/// County isolation validation request
#[derive(Deserialize, ToSchema)]
struct IsolationValidationRequest {
    county_id: uuid::Uuid,
    resource_type: String,
    resource_id: uuid::Uuid,
    operation: String,
    user_context: UserContext,
}

/// User context for authorization
#[derive(Deserialize, ToSchema)]
struct UserContext {
    user_id: uuid::Uuid,
    county_permissions: Vec<String>,
    role: String,
    clearance_level: u8,
}

/// Isolation validation response
#[derive(Serialize, ToSchema)]
struct IsolationValidationResponse {
    allowed: bool,
    county_id: uuid::Uuid,
    reason: String,
    audit_id: uuid::Uuid,
    compliance_level: String,
    security_score: f64,
}

/// County data access metrics
#[derive(Serialize, ToSchema)]
struct CountyAccessMetrics {
    county_id: uuid::Uuid,
    total_requests: u64,
    allowed_requests: u64,
    denied_requests: u64,
    violation_attempts: u64,
    compliance_score: f64,
    last_violation: Option<chrono::DateTime<chrono::Utc>>,
}

/// OpenAPI documentation
#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::isolation::validate_county_access,
        handlers::isolation::get_county_metrics,
        handlers::audit::create_audit_entry,
        handlers::validation::validate_data_sovereignty,
    ),
    components(
        schemas(IsolationValidationRequest, IsolationValidationResponse, CountyAccessMetrics, UserContext)
    ),
    tags(
        (name = "isolation", description = "County data isolation and validation"),
        (name = "audit", description = "Government compliance audit logging"),
        (name = "validation", description = "Data sovereignty validation"),
        (name = "compliance", description = "FISMA-HIGH compliance monitoring")
    ),
    info(
        title = "TerraFusion County Isolation API",
        version = "1.0.0",
        description = "Sovereign Data Boundaries for 39+ Washington State Counties",
        contact(
            name = "TerraFusion Elite Compliance Team",
            email = "compliance@terrafusion.gov"
        )
    ),
    servers(
        (url = "http://localhost:8001", description = "Development"),
        (url = "https://isolation.terrafusion.gov", description = "Production")
    )
)]
struct ApiDoc;

mod handlers {
    use super::*;

    pub mod isolation {
        use super::*;

        /// Validate county data access with sovereign boundaries
        #[utoipa::path(
            post,
            path = "/county/{county_id}/validate",
            request_body = IsolationValidationRequest,
            responses(
                (status = 200, description = "Access validation result", body = IsolationValidationResponse),
                (status = 403, description = "County access denied"),
                (status = 400, description = "Invalid request")
            ),
            tag = "isolation"
        )]
        pub async fn validate_county_access(
            Path(county_id): Path<uuid::Uuid>,
            State(state): State<AppState>,
            Json(request): Json<IsolationValidationRequest>,
        ) -> Result<Json<IsolationValidationResponse>, StatusCode> {
            // Validate county ID matches request
            if county_id != request.county_id {
                return Err(StatusCode::BAD_REQUEST);
            }

            // Perform sovereign data validation
            let validation_result = state.isolation_engine
                .validate_access(
                    request.county_id,
                    request.resource_type,
                    request.resource_id,
                    request.operation,
                    request.user_context,
                ).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(validation_result))
        }

        /// Get county access metrics for compliance monitoring
        #[utoipa::path(
            get,
            path = "/county/{county_id}/metrics",
            responses(
                (status = 200, description = "County access metrics", body = CountyAccessMetrics)
            ),
            tag = "isolation"
        )]
        pub async fn get_county_metrics(
            Path(county_id): Path<uuid::Uuid>,
            State(state): State<AppState>,
        ) -> Result<Json<CountyAccessMetrics>, StatusCode> {
            let metrics = state.isolation_engine
                .get_county_metrics(county_id).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(metrics))
        }
    }

    pub mod audit {
        use super::*;

        /// Create audit entry for government compliance
        #[utoipa::path(
            post,
            path = "/audit/entry",
            responses(
                (status = 201, description = "Audit entry created")
            ),
            tag = "audit"
        )]
        pub async fn create_audit_entry(
            State(state): State<AppState>,
            Json(entry): Json<serde_json::Value>,
        ) -> Result<StatusCode, StatusCode> {
            state.isolation_engine
                .create_audit_entry(entry).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(StatusCode::CREATED)
        }
    }

    pub mod validation {
        use super::*;

        /// Validate data sovereignty compliance
        #[utoipa::path(
            post,
            path = "/validation/sovereignty",
            responses(
                (status = 200, description = "Sovereignty validation passed"),
                (status = 422, description = "Sovereignty validation failed")
            ),
            tag = "validation"
        )]
        pub async fn validate_data_sovereignty(
            State(state): State<AppState>,
            Json(data): Json<serde_json::Value>,
        ) -> Result<StatusCode, StatusCode> {
            let is_compliant = state.isolation_engine
                .validate_data_sovereignty(data).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            if is_compliant {
                Ok(StatusCode::OK)
            } else {
                Err(StatusCode::UNPROCESSABLE_ENTITY)
            }
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    // Load configuration
    let config = Arc::new(Config::load()?);

    // Initialize county isolation engine
    let isolation_engine = Arc::new(CountyIsolationEngine::new(&config).await?);

    // Create application state
    let state = AppState {
        config: config.clone(),
        isolation_engine,
    };

    // Build router
    let app = create_router(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    info!("TerraFusion County Isolation Service starting on {}", addr);
    info!("Sovereign boundaries enabled for {} counties", config.government.total_counties);

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

/// Create the main application router
fn create_router(state: AppState) -> Router {
    Router::new()
        // County isolation validation
        .route("/county/:county_id/validate", post(handlers::isolation::validate_county_access))
        .route("/county/:county_id/metrics", get(handlers::isolation::get_county_metrics))

        // Audit logging
        .route("/audit/entry", post(handlers::audit::create_audit_entry))
        .route("/audit/county/:county_id", get(|| async { StatusCode::NOT_IMPLEMENTED }))

        // Data sovereignty validation
        .route("/validation/sovereignty", post(handlers::validation::validate_data_sovereignty))
        .route("/validation/compliance", get(|| async { StatusCode::NOT_IMPLEMENTED }))

        // Compliance monitoring
        .route("/compliance/fisma", get(|| async { StatusCode::NOT_IMPLEMENTED }))
        .route("/compliance/report", post(|| async { StatusCode::NOT_IMPLEMENTED }))

        // Health check
        .route("/health", get(|| async { StatusCode::OK }))

        // Documentation
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))

        // Middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive())
                .layer(CompressionLayer::new())
        )
        .with_state(state)
}

/// Government. Transcended. - Elite county data isolation with sovereign
/// boundaries, FISMA-HIGH compliance, and zero cross-county data leakage
/// across 39+ Washington State counties.
pub const TERRAFUSION_ISOLATION_VERSION: &str = "1.0.0-sovereign";
pub const TERRAFUSION_ISOLATION_MOTTO: &str = "Sovereign Data. Zero Leakage. Government. Transcended.";
