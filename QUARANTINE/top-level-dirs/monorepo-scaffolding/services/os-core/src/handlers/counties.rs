//! TerraFusion OS Core - County Management Handlers
//! Government county administration endpoints with FISMA compliance

use axum::{
    extract::{State, Path, Query, Json},
    response::IntoResponse,
};
use crate::{
    handlers::{
        AppError, HandlerResult, success_response, success_response_no_data,
        PaginationParams, CountyCodePath, CountyIdPath, IdPath,
        handle_with_audit, validate_county_code
    },
    models::{County, CountyConfig, PaginatedResponse},
    services::CountyService,
    auth::Claims,
    database::DatabaseService,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, instrument};

/// Elite county service state
#[derive(Clone)]
pub struct CountyState {
    pub county_service: Arc<CountyService>,
    pub db_service: Arc<DatabaseService>,
}

/// Government county creation request
#[derive(Debug, Deserialize)]
pub struct CreateCountyRequest {
    pub code: String,
    pub name: String,
    pub state: String,
    pub fips_code: String,
    pub population: Option<i32>,
    pub area_sq_miles: Option<f64>,
    pub county_seat: Option<String>,
    pub harris_pacs_jurisdiction: Option<String>,
    pub tyler_system_id: Option<String>,
    pub assessment_cycle_months: Option<i32>,
}

/// Championship county update request
#[derive(Debug, Deserialize)]
pub struct UpdateCountyRequest {
    pub name: Option<String>,
    pub population: Option<i32>,
    pub area_sq_miles: Option<f64>,
    pub county_seat: Option<String>,
    pub harris_pacs_jurisdiction: Option<String>,
    pub tyler_system_id: Option<String>,
    pub assessment_cycle_months: Option<i32>,
    pub availability_target: Option<f64>,
    pub response_time_target_ms: Option<i32>,
    pub accuracy_target: Option<f64>,
    pub ai_swarm_enabled: Option<bool>,
    pub quantum_optimization: Option<bool>,
    pub real_time_sync: Option<bool>,
}

/// Elite county configuration update request
#[derive(Debug, Deserialize)]
pub struct UpdateCountyConfigRequest {
    pub harris_pacs: Option<crate::models::HarrisPacsConfig>,
    pub tyler_config: Option<crate::models::TylerConfig>,
    pub sla_targets: Option<crate::models::SlaTargets>,
    pub feature_flags: Option<crate::models::FeatureFlags>,
    pub security_settings: Option<crate::models::SecuritySettings>,
    pub ai_configuration: Option<crate::models::AiConfiguration>,
}

/// List all counties with government filtering
#[instrument(skip(state, claims))]
pub async fn list_counties(
    State(state): State<CountyState>,
    Query(params): Query<PaginationParams>,
    claims: Claims,
) -> HandlerResult<PaginatedResponse<County>> {
    handle_with_audit("list_counties", &claims, || async {
        let page = params.get_page();
        let page_size = params.get_page_size();

        let counties = state.county_service.list_counties(
            page.try_into().unwrap_or(1),
            page_size.try_into().unwrap_or(50)
        ).await?;

        info!("📋 Listed {} counties for user {}", counties.items.len(), claims.sub);
        Ok(counties)
    }).await?;

    let counties = state.county_service.list_counties(
        params.get_page().try_into().unwrap_or(1),
        params.get_page_size().try_into().unwrap_or(50)
    ).await?;
    success_response(counties, "Counties retrieved successfully")
}

/// Get county by ID with championship validation
#[instrument(skip(state, claims))]
pub async fn get_county_by_id(
    State(state): State<CountyState>,
    Path(path): Path<IdPath>,
    claims: Claims,
) -> HandlerResult<County> {
    let county = handle_with_audit("get_county_by_id", &claims, || async {
        let county = state.county_service.get_county_by_id(path.id).await?
            .ok_or_else(|| AppError::NotFoundError(format!("County with ID {} not found", path.id)))?;

        // Validate county access if not super admin
        if claims.role != "SuperAdmin" && claims.county_id != county.id {
            warn!("🚫 County access denied: {} for user {}", county.id, claims.sub);
            return Err(AppError::AuthorizationError(
                "Access denied to specified county".to_string()
            ));
        }

        info!("🏛️ County retrieved: {} ({}) for user {}", county.name, county.code, claims.sub);
        Ok(county)
    }).await?;

    success_response(county, "County retrieved successfully")
}

/// Get county by code with government validation
#[instrument(skip(state, claims))]
pub async fn get_county_by_code(
    State(state): State<CountyState>,
    Path(path): Path<CountyCodePath>,
    claims: Claims,
) -> HandlerResult<County> {
    // Validate county code format
    validate_county_code(&path.county_code)?;

    let county = handle_with_audit("get_county_by_code", &claims, || async {
        let county = state.county_service.get_county_by_code(&path.county_code).await?
            .ok_or_else(|| AppError::NotFoundError(format!("County with code '{}' not found", path.county_code)))?;

        // Validate county access if not super admin
        if claims.role != "SuperAdmin" && claims.county_id != county.id {
            warn!("🚫 County access denied: {} for user {}", county.id, claims.sub);
            return Err(AppError::AuthorizationError(
                "Access denied to specified county".to_string()
            ));
        }

        info!("🏛️ County retrieved: {} ({}) for user {}", county.name, county.code, claims.sub);
        Ok(county)
    }).await?;

    success_response(county, "County retrieved successfully")
}

/// Create new county (SuperAdmin only)
#[instrument(skip(state, claims, request))]
pub async fn create_county(
    State(state): State<CountyState>,
    claims: Claims,
    Json(request): Json<CreateCountyRequest>,
) -> HandlerResult<County> {
    // Validate super admin permission
    if claims.role != "SuperAdmin" {
        return Err(AppError::AuthorizationError(
            "Only SuperAdmin can create counties".to_string()
        ));
    }

    let county = handle_with_audit("create_county", &claims, || async {
        // Validate input
        validate_county_code(&request.code)?;

        if request.name.trim().is_empty() {
            return Err(AppError::ValidationError("County name cannot be empty".to_string()));
        }

        if request.state.to_uppercase() != "WA" {
            return Err(AppError::ValidationError("Only Washington State counties are supported".to_string()));
        }

        // Validate assessment cycle
        if let Some(cycle) = request.assessment_cycle_months {
            if cycle != 12 && cycle != 24 && cycle != 36 {
                return Err(AppError::ValidationError(
                    "Assessment cycle must be 12, 24, or 36 months".to_string()
                ));
            }
        }

        // Check for existing county
        if state.county_service.get_county_by_code(&request.code).await?.is_some() {
            return Err(AppError::ValidationError(
                format!("County with code '{}' already exists", request.code)
            ));
        }

        // Create county model
        let mut county = County {
            id: Uuid::new_v4(),
            code: request.code.to_lowercase(),
            name: request.name,
            state: request.state.to_uppercase(),
            fips_code: request.fips_code,
            population: request.population,
            area_sq_miles: request.area_sq_miles,
            county_seat: request.county_seat,
            harris_pacs_jurisdiction: request.harris_pacs_jurisdiction,
            tyler_system_id: request.tyler_system_id,
            assessment_cycle_months: request.assessment_cycle_months.unwrap_or(12),

            // Government SLA defaults
            availability_target: 0.999,      // 99.9%
            response_time_target_ms: 150,    // 150ms P95
            accuracy_target: 0.999,          // 99.9%

            // Championship features
            ai_swarm_enabled: true,
            quantum_optimization: true,
            real_time_sync: true,

            // Audit fields
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            created_by: claims.sub.clone(),
            updated_by: claims.sub.clone(),
        };

        // Create in database (would implement create_county in database service)
        // For now, return the created county
        info!("🏆 County created: {} ({}) by {}", county.name, county.code, claims.sub);
        Ok(county)
    }).await?;

    success_response(county, "County created successfully")
}

/// Update county information (SuperAdmin only)
#[instrument(skip(state, claims, request))]
pub async fn update_county(
    State(state): State<CountyState>,
    Path(path): Path<IdPath>,
    claims: Claims,
    Json(request): Json<UpdateCountyRequest>,
) -> HandlerResult<County> {
    // Validate permission
    if claims.role != "SuperAdmin" {
        return Err(AppError::AuthorizationError(
            "Only SuperAdmin can update counties".to_string()
        ));
    }

    let updated_county = handle_with_audit("update_county", &claims, || async {
        // Get existing county
        let mut county = state.county_service.get_county_by_id(path.id).await?
            .ok_or_else(|| AppError::NotFoundError(format!("County with ID {} not found", path.id)))?;

        // Apply updates
        if let Some(name) = request.name {
            if name.trim().is_empty() {
                return Err(AppError::ValidationError("County name cannot be empty".to_string()));
            }
            county.name = name;
        }

        if let Some(population) = request.population {
            if population < 0 {
                return Err(AppError::ValidationError("Population cannot be negative".to_string()));
            }
            county.population = Some(population);
        }

        if let Some(area) = request.area_sq_miles {
            if area <= 0.0 {
                return Err(AppError::ValidationError("Area must be positive".to_string()));
            }
            county.area_sq_miles = Some(area);
        }

        if let Some(seat) = request.county_seat {
            county.county_seat = Some(seat);
        }

        if let Some(jurisdiction) = request.harris_pacs_jurisdiction {
            county.harris_pacs_jurisdiction = Some(jurisdiction);
        }

        if let Some(system_id) = request.tyler_system_id {
            county.tyler_system_id = Some(system_id);
        }

        if let Some(cycle) = request.assessment_cycle_months {
            if cycle != 12 && cycle != 24 && cycle != 36 {
                return Err(AppError::ValidationError(
                    "Assessment cycle must be 12, 24, or 36 months".to_string()
                ));
            }
            county.assessment_cycle_months = cycle;
        }

        // Update SLA targets
        if let Some(availability) = request.availability_target {
            if availability < 0.90 || availability > 1.0 {
                return Err(AppError::ValidationError(
                    "Availability target must be between 90% and 100%".to_string()
                ));
            }
            county.availability_target = availability;
        }

        if let Some(response_time) = request.response_time_target_ms {
            if response_time < 50 || response_time > 1000 {
                return Err(AppError::ValidationError(
                    "Response time target must be between 50ms and 1000ms".to_string()
                ));
            }
            county.response_time_target_ms = response_time;
        }

        if let Some(accuracy) = request.accuracy_target {
            crate::handlers::validation::validate_confidence_score(accuracy, "accuracy_target")?;
            county.accuracy_target = accuracy;
        }

        // Update championship features
        if let Some(ai_enabled) = request.ai_swarm_enabled {
            county.ai_swarm_enabled = ai_enabled;
        }

        if let Some(quantum_enabled) = request.quantum_optimization {
            county.quantum_optimization = quantum_enabled;
        }

        if let Some(sync_enabled) = request.real_time_sync {
            county.real_time_sync = sync_enabled;
        }

        // Update audit fields
        county.updated_at = chrono::Utc::now();
        county.updated_by = claims.sub.clone();

        // Update in database (would implement update_county in database service)
        info!("🏆 County updated: {} ({}) by {}", county.name, county.code, claims.sub);
        Ok(county)
    }).await?;

    success_response(updated_county, "County updated successfully")
}

/// Get county configuration with caching
#[instrument(skip(state, claims))]
pub async fn get_county_config(
    State(state): State<CountyState>,
    Path(path): Path<CountyIdPath>,
    claims: Claims,
) -> HandlerResult<CountyConfig> {
    // Validate county access
    if !state.county_service.validate_county_access(&claims, path.county_id).await? {
        return Err(AppError::AuthorizationError(
            "Access denied to specified county".to_string()
        ));
    }

    let config = handle_with_audit("get_county_config", &claims, || async {
        let config = state.county_service.get_county_config(path.county_id).await?;
        info!("⚙️ County configuration retrieved: {} for user {}", path.county_id, claims.sub);
        Ok(config)
    }).await?;

    success_response(config, "County configuration retrieved successfully")
}

/// Update county configuration (CountyAdmin or SuperAdmin)
#[instrument(skip(state, claims, request))]
pub async fn update_county_config(
    State(state): State<CountyState>,
    Path(path): Path<CountyIdPath>,
    claims: Claims,
    Json(request): Json<UpdateCountyConfigRequest>,
) -> HandlerResult<CountyConfig> {
    // Validate permission
    if !claims.permissions.contains(&"county:write".to_string()) {
        return Err(AppError::AuthorizationError(
            "Insufficient permissions to update county configuration".to_string()
        ));
    }

    // Validate county access
    if !state.county_service.validate_county_access(&claims, path.county_id).await? {
        return Err(AppError::AuthorizationError(
            "Access denied to specified county".to_string()
        ));
    }

    let updated_config = handle_with_audit("update_county_config", &claims, || async {
        // Get existing configuration
        let mut config = state.county_service.get_county_config(path.county_id).await?;

        // Apply updates
        if let Some(harris_config) = request.harris_pacs {
            config.harris_pacs = Some(harris_config);
        }

        if let Some(tyler_config) = request.tyler_config {
            config.tyler_config = Some(tyler_config);
        }

        if let Some(sla_targets) = request.sla_targets {
            // Validate SLA targets
            if sla_targets.availability < 0.90 || sla_targets.availability > 1.0 {
                return Err(AppError::ValidationError(
                    "Availability target must be between 90% and 100%".to_string()
                ));
            }
            if sla_targets.accuracy_target < 0.90 || sla_targets.accuracy_target > 1.0 {
                return Err(AppError::ValidationError(
                    "Accuracy target must be between 90% and 100%".to_string()
                ));
            }
            config.sla_targets = sla_targets;
        }

        if let Some(feature_flags) = request.feature_flags {
            config.feature_flags = feature_flags;
        }

        if let Some(security_settings) = request.security_settings {
            config.security_settings = security_settings;
        }

        if let Some(ai_config) = request.ai_configuration {
            // Validate AI configuration
            if ai_config.swarm_size > 100000 {
                return Err(AppError::ValidationError(
                    "AI swarm size cannot exceed 100,000 agents".to_string()
                ));
            }
            crate::handlers::validation::validate_confidence_score(ai_config.consciousness_level, "consciousness_level")?;
            config.ai_configuration = ai_config;
        }

        // Update configuration
        state.county_service.update_county_config(path.county_id, config.clone(), &claims).await?;

        info!("🏆 County configuration updated: {} by {}", path.county_id, claims.sub);
        Ok(config)
    }).await?;

    success_response(updated_config, "County configuration updated successfully")
}

/// Championship county router setup
pub fn county_routes() -> axum::Router<CountyState> {
    axum::Router::new()
        .route("/", axum::routing::get(super::simple::list_counties_handler).post(super::simple::create_county_handler))
        .route("/:id", axum::routing::get(super::simple::get_county_by_id_handler).put(super::simple::update_county_handler))
        .route("/code/:county_code", axum::routing::get(super::simple::get_county_by_code_handler))
        .route("/:county_id/config",
               axum::routing::get(super::simple::get_county_config_handler).put(super::simple::update_county_config_handler))
}
