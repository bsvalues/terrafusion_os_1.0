mod config;
mod harris_pacs;
mod models;
mod county_bridge;
mod property_sync;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use config::Config;
use county_bridge::CountyBridgeService;
use harris_pacs::PACSClient;
use models::*;
use property_sync::{PropertySyncService, SyncQueueStatus};
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
use serde::{Deserialize, Serialize};

#[derive(OpenApi)]
#[openapi(
    paths(
        sync_properties,
        get_county_status,
        health_check
    ),
    components(
        schemas(
            PropertySyncRequest, PropertySyncResponse, SyncStatus,
            CountySystemStatus, SyncType, SyncPriority
        )
    ),
    tags(
        (name = "sync", description = "Property synchronization endpoints"),
        (name = "county", description = "County management endpoints"),
        (name = "health", description = "Health check endpoints")
    )
)]
struct ApiDoc;

#[derive(Debug, Clone)]
pub struct AppState {
    pub county_bridge: Arc<CountyBridgeService>,
    pub property_sync: Arc<PropertySyncService>,
    pub config: Arc<Config>,
}

/// Property synchronization request
#[derive(Deserialize, ToSchema)]
struct PropertySyncRequest {
    county_id: uuid::Uuid,
    jurisdiction: String,
    parcel_ids: Option<Vec<String>>,
    sync_type: SyncType,
    priority: SyncPriority,
}

/// Synchronization type
#[derive(Deserialize, ToSchema)]
enum SyncType {
    Full,
    Incremental,
    RealTime,
    Validation,
}

/// Synchronization priority
#[derive(Deserialize, ToSchema)]
enum SyncPriority {
    Low,
    Normal,
    High,
    Critical,
}

/// Property synchronization response
#[derive(Serialize, ToSchema)]
struct PropertySyncResponse {
    sync_id: uuid::Uuid,
    county_id: uuid::Uuid,
    status: SyncStatus,
    properties_processed: u32,
    properties_updated: u32,
    properties_created: u32,
    errors: Vec<SyncError>,
    duration_ms: u64,
    harris_version: String,
}

/// Synchronization status
#[derive(Serialize, ToSchema)]
enum SyncStatus {
    Started,
    InProgress,
    Completed,
    Failed,
    PartialSuccess,
}

/// Synchronization error
#[derive(Serialize, ToSchema)]
struct SyncError {
    parcel_id: String,
    error_code: String,
    error_message: String,
    severity: ErrorSeverity,
}

/// Error severity levels
#[derive(Serialize, ToSchema)]
enum ErrorSeverity {
    Warning,
    Error,
    Critical,
}

/// County property data from Harris PACS
#[derive(Serialize, ToSchema)]
struct CountyProperty {
    parcel_id: String,
    county_id: uuid::Uuid,
    owner_name: String,
    property_address: String,
    assessed_value: i64,
    market_value: i64,
    tax_year: i32,
    property_type: String,
    acreage: Option<f64>,
    last_sale_date: Option<chrono::DateTime<chrono::Utc>>,
    last_sale_price: Option<i64>,
    harris_updated: chrono::DateTime<chrono::Utc>,
}

/// OpenAPI documentation
#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::sync::sync_county_properties,
        handlers::sync::get_sync_status,
        handlers::property::get_property_by_parcel,
        handlers::county::get_county_status,
    ),
    components(
        schemas(PropertySyncRequest, PropertySyncResponse, CountyProperty, SyncType, SyncPriority, SyncStatus, SyncError, ErrorSeverity)
    ),
    tags(
        (name = "sync", description = "Harris PACS property synchronization"),
        (name = "property", description = "County property data access"),
        (name = "county", description = "County system status and health"),
        (name = "bridge", description = "County system bridge operations")
    ),
    info(
        title = "TerraFusion Harris PACS Bridge API",
        version = "1.0.0",
        description = "County Property System Integration for 39+ Washington State Counties",
        contact(
            name = "TerraFusion Elite County Integration Team",
            email = "counties@terrafusion.gov"
        )
    ),
    servers(
        (url = "http://localhost:8002", description = "Development"),
        (url = "https://pacs.terrafusion.gov", description = "Production")
    )
)]
struct ApiDoc;

mod handlers {
    use super::*;

    pub mod sync {
        use super::*;

        /// Synchronize county properties from Harris PACS
        #[utoipa::path(
            post,
            path = "/county/{county_id}/sync",
            request_body = PropertySyncRequest,
            responses(
                (status = 202, description = "Synchronization started", body = PropertySyncResponse),
                (status = 400, description = "Invalid sync request"),
                (status = 429, description = "Rate limit exceeded")
            ),
            tag = "sync"
        )]
        pub async fn sync_county_properties(
            Path(county_id): Path<uuid::Uuid>,
            State(state): State<AppState>,
            Json(request): Json<PropertySyncRequest>,
        ) -> Result<Json<PropertySyncResponse>, StatusCode> {
            // Validate county ID matches request
            if county_id != request.county_id {
                return Err(StatusCode::BAD_REQUEST);
            }

            // Start property synchronization
            let sync_result = state.county_bridge
                .sync_properties(request).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(sync_result))
        }

        /// Get synchronization status
        #[utoipa::path(
            get,
            path = "/sync/{sync_id}/status",
            responses(
                (status = 200, description = "Sync status", body = PropertySyncResponse)
            ),
            tag = "sync"
        )]
        pub async fn get_sync_status(
            Path(sync_id): Path<uuid::Uuid>,
            State(state): State<AppState>,
        ) -> Result<Json<PropertySyncResponse>, StatusCode> {
            let status = state.county_bridge
                .get_sync_status(sync_id).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(status))
        }
    }

    pub mod property {
        use super::*;

        /// Get property data by parcel ID
        #[utoipa::path(
            get,
            path = "/county/{county_id}/property/{parcel_id}",
            responses(
                (status = 200, description = "Property data", body = CountyProperty),
                (status = 404, description = "Property not found")
            ),
            tag = "property"
        )]
        pub async fn get_property_by_parcel(
            Path((county_id, parcel_id)): Path<(uuid::Uuid, String)>,
            State(state): State<AppState>,
        ) -> Result<Json<CountyProperty>, StatusCode> {
            let property = state.harris_client
                .get_property_by_parcel(county_id, parcel_id).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
                .ok_or(StatusCode::NOT_FOUND)?;

            Ok(Json(property))
        }
    }

    pub mod county {
        use super::*;

        /// Get county system status
        #[utoipa::path(
            get,
            path = "/county/{county_id}/status",
            responses(
                (status = 200, description = "County system status")
            ),
            tag = "county"
        )]
        pub async fn get_county_status(
            Path(county_id): Path<uuid::Uuid>,
            State(state): State<AppState>,
        ) -> Result<Json<serde_json::Value>, StatusCode> {
            let status = state.county_bridge
                .get_county_status(county_id).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(serde_json::json!({
                "county_id": county_id,
                "harris_connected": status.harris_connected,
                "last_sync": status.last_sync,
                "property_count": status.property_count,
                "sync_health": status.sync_health
            })))
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

    // Initialize Harris PACS client
    let harris_client = Arc::new(HarrisPACSClient::new(&config).await?);

    // Initialize county bridge
    let county_bridge = Arc::new(CountyBridge::new(&config, &harris_client).await?);

    // Create application state
    let state = AppState {
        config: config.clone(),
        harris_client,
        county_bridge,
    };

    // Build router
    let app = create_router(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    info!("TerraFusion Harris PACS Bridge starting on {}", addr);
    info!("Harris PACS version: {}", config.harris.version);
    info!("Counties supported: {}", config.counties.len());

    let listener = TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

/// Create the main application router
fn create_router(state: AppState) -> Router {
    Router::new()
        // Property synchronization
        .route("/county/:county_id/sync", post(handlers::sync::sync_county_properties))
        .route("/sync/:sync_id/status", get(handlers::sync::get_sync_status))

        // Property data access
        .route("/county/:county_id/property/:parcel_id", get(handlers::property::get_property_by_parcel))
        .route("/county/:county_id/properties", get(|| async { StatusCode::NOT_IMPLEMENTED }))

        // County status
        .route("/county/:county_id/status", get(handlers::county::get_county_status))
        .route("/county/:county_id/health", get(|| async { StatusCode::NOT_IMPLEMENTED }))

        // Harris PACS integration
        .route("/harris/version", get(|| async { StatusCode::NOT_IMPLEMENTED }))
        .route("/harris/connection", get(|| async { StatusCode::NOT_IMPLEMENTED }))

        // Batch operations
        .route("/batch/sync", post(|| async { StatusCode::NOT_IMPLEMENTED }))
        .route("/batch/status", get(|| async { StatusCode::NOT_IMPLEMENTED }))

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

/// Government. Transcended. - Elite Harris PACS integration with real-time
/// property synchronization, county system bridging, and championship-level
/// data accuracy for 39+ Washington State counties.
pub const TERRAFUSION_HARRIS_VERSION: &str = "1.0.0-bridge";
pub const TERRAFUSION_HARRIS_MOTTO: &str = "Real-Time Counties. Zero Lag. Government. Transcended.";
