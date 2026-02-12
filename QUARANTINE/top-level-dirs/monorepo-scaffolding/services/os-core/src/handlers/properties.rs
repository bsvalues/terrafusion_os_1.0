//! TerraFusion OS Core - Property Management Handlers
//! IAAO-compliant property administration with government-grade security

use axum::{
    extract::{State, Path, Query, Json},
    response::IntoResponse,
};
use chrono::Datelike;
use crate::{
    handlers::{
        AppError, HandlerResult, success_response, success_response_no_data,
        PropertySearchParams, IdPath, CountyIdPath, handle_with_audit, validation
    },
    models::{Property, PaginatedResponse},
    services::PropertyService,
    auth::Claims,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, instrument};

/// Elite property service state
#[derive(Clone)]
pub struct PropertyState {
    pub property_service: Arc<PropertyService>,
}

/// Government property creation request
#[derive(Debug, Deserialize)]
pub struct CreatePropertyRequest {
    pub county_id: Uuid,
    pub parcel_id: String,
    pub assessor_id: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: String,
    pub zip_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub property_type: String,
    pub land_use_code: Option<String>,
    pub zoning: Option<String>,
    pub legal_description: Option<String>,
    pub lot_size_sq_ft: Option<i32>,
    pub building_sq_ft: Option<i32>,
    pub year_built: Option<i32>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<f32>,
    pub stories: Option<f32>,
    pub assessment_year: i32,
}

/// Championship property update request
#[derive(Debug, Deserialize)]
pub struct UpdatePropertyRequest {
    pub assessor_id: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub zip_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub property_type: Option<String>,
    pub land_use_code: Option<String>,
    pub zoning: Option<String>,
    pub legal_description: Option<String>,
    pub total_value: Option<i64>,
    pub land_value: Option<i64>,
    pub improvement_value: Option<i64>,
    pub assessed_value: Option<i64>,
    pub market_value: Option<i64>,
    pub lot_size_sq_ft: Option<i32>,
    pub building_sq_ft: Option<i32>,
    pub year_built: Option<i32>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<f32>,
    pub stories: Option<f32>,
    pub assessment_year: Option<i32>,
    pub assessment_status: Option<String>,
}

/// Get property by ID with county access validation
#[instrument(skip(state, claims))]
pub async fn get_property_by_id(
    State(state): State<PropertyState>,
    Path(path): Path<IdPath>,
    claims: Claims,
) -> HandlerResult<Property> {
    let property = handle_with_audit("get_property_by_id", &claims, || async {
        let property = state.property_service.get_property_by_id(path.id, &claims).await?
            .ok_or_else(|| AppError::NotFoundError(format!("Property with ID {} not found", path.id)))?;

        info!("🏠 Property retrieved: {} (County: {}) for user {}",
              property.parcel_id, property.county_id, claims.sub);
        Ok(property)
    }).await?;

    success_response(property, "Property retrieved successfully")
}

/// List properties by county with government filtering
#[instrument(skip(state, claims))]
pub async fn list_properties_by_county(
    State(state): State<PropertyState>,
    Path(path): Path<CountyIdPath>,
    Query(params): Query<PropertySearchParams>,
    claims: Claims,
) -> HandlerResult<PaginatedResponse<Property>> {
    let properties = handle_with_audit("list_properties_by_county", &claims, || async {
        let page = params.pagination.get_page();
        let page_size = params.pagination.get_page_size();

        let properties = state.property_service.get_properties_by_county(
            path.county_id,
            page.try_into().unwrap_or(1),
            page_size.try_into().unwrap_or(50),
            &claims
        ).await?;

        info!("📋 Listed {} properties for county {} (user: {})",
              properties.items.len(), path.county_id, claims.sub);
        Ok(properties)
    }).await?;

    success_response(properties, "Properties retrieved successfully")
}

/// Search properties with advanced filtering
#[instrument(skip(state, claims))]
pub async fn search_properties(
    State(state): State<PropertyState>,
    Path(path): Path<CountyIdPath>,
    Query(params): Query<PropertySearchParams>,
    claims: Claims,
) -> HandlerResult<PaginatedResponse<Property>> {
    let properties = handle_with_audit("search_properties", &claims, || async {
        let query = params.q.unwrap_or_default();
        let page = params.pagination.get_page();
        let page_size = params.pagination.get_page_size();

        // Validate search parameters
        if let Some(min_value) = params.min_value {
            validation::validate_amount_cents(min_value, "min_value")?;
        }
        if let Some(max_value) = params.max_value {
            validation::validate_amount_cents(max_value, "max_value")?;
        }
        if let Some(year) = params.assessment_year {
            validation::validate_assessment_year(year)?;
        }
        if let Some(ref prop_type) = params.property_type {
            validation::validate_property_type(prop_type)?;
        }

        let properties = state.property_service.search_properties(
            path.county_id,
            &query,
            params.property_type,
            params.min_value,
            params.max_value,
            page.try_into().unwrap_or(1),
            page_size.try_into().unwrap_or(50),
            &claims
        ).await?;

        info!("🔍 Property search completed: {} results for '{}' in county {} (user: {})",
              properties.items.len(), query, path.county_id, claims.sub);
        Ok(properties)
    }).await?;

    success_response(properties, "Property search completed successfully")
}

/// Create new property with government validation
#[instrument(skip(state, claims, request))]
pub async fn create_property(
    State(state): State<PropertyState>,
    claims: Claims,
    Json(request): Json<CreatePropertyRequest>,
) -> HandlerResult<Property> {
    let property = handle_with_audit("create_property", &claims, || async {
        // Validate input
        validation::validate_parcel_id(&request.parcel_id)?;
        validation::validate_property_type(&request.property_type)?;
        validation::validate_assessment_year(request.assessment_year)?;

        if request.state.to_uppercase() != "WA" {
            return Err(AppError::ValidationError(
                "Only Washington State properties are supported".to_string()
            ));
        }

        // Validate optional monetary values
        if let Some(value) = request.building_sq_ft {
            if value < 0 {
                return Err(AppError::ValidationError("Building square footage cannot be negative".to_string()));
            }
        }

        if let Some(value) = request.lot_size_sq_ft {
            if value < 0 {
                return Err(AppError::ValidationError("Lot size cannot be negative".to_string()));
            }
        }

        if let Some(year) = request.year_built {
            let current_year = chrono::Utc::now().year();
            if year < 1800 || year > current_year {
                return Err(AppError::ValidationError(
                    format!("Year built must be between 1800 and {}", current_year)
                ));
            }
        }

        // Validate coordinates if provided
        if let Some(lat) = request.latitude {
            if lat < -90.0 || lat > 90.0 {
                return Err(AppError::ValidationError("Invalid latitude range".to_string()));
            }
        }

        if let Some(lng) = request.longitude {
            if lng < -180.0 || lng > 180.0 {
                return Err(AppError::ValidationError("Invalid longitude range".to_string()));
            }
        }

        // Create property model
        let property = Property {
            id: Uuid::new_v4(),
            county_id: request.county_id,
            parcel_id: request.parcel_id,
            assessor_id: request.assessor_id,
            address: request.address,
            city: request.city,
            state: request.state.to_uppercase(),
            zip_code: request.zip_code,
            latitude: request.latitude,
            longitude: request.longitude,
            property_type: request.property_type,
            land_use_code: request.land_use_code,
            zoning: request.zoning,
            legal_description: request.legal_description,

            // Assessment values (initially null, set during assessment)
            total_value: None,
            land_value: None,
            improvement_value: None,
            assessed_value: None,
            market_value: None,

            // Physical characteristics
            lot_size_sq_ft: request.lot_size_sq_ft,
            building_sq_ft: request.building_sq_ft,
            year_built: request.year_built,
            bedrooms: request.bedrooms,
            bathrooms: request.bathrooms,
            stories: request.stories,

            // Assessment metadata
            last_assessment_date: None,
            next_assessment_date: None,
            assessment_year: request.assessment_year,
            assessment_status: "Pending".to_string(),

            // AI enhancement data
            ai_confidence_score: None,
            quantum_optimization_factor: None,
            ml_model_version: None,

            // Audit fields (set by service)
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            created_by: claims.sub.clone(),
            updated_by: claims.sub.clone(),
        };

        let created_property = state.property_service.create_property(property, &claims).await?;

        info!("🏆 Property created: {} (County: {}) by user {}",
              created_property.parcel_id, created_property.county_id, claims.sub);
        Ok(created_property)
    }).await?;

    success_response(property, "Property created successfully")
}

/// Update existing property with government validation
#[instrument(skip(state, claims, request))]
pub async fn update_property(
    State(state): State<PropertyState>,
    Path(path): Path<IdPath>,
    claims: Claims,
    Json(request): Json<UpdatePropertyRequest>,
) -> HandlerResult<Property> {
    let updated_property = handle_with_audit("update_property", &claims, || async {
        // Get existing property
        let mut property = state.property_service.get_property_by_id(path.id, &claims).await?
            .ok_or_else(|| AppError::NotFoundError(format!("Property with ID {} not found", path.id)))?;

        // Apply updates with validation
        if let Some(ref prop_type) = request.property_type {
            validation::validate_property_type(prop_type)?;
            property.property_type = prop_type.clone();
        }

        if let Some(assessor_id) = request.assessor_id {
            property.assessor_id = Some(assessor_id);
        }

        if let Some(address) = request.address {
            property.address = Some(address);
        }

        if let Some(city) = request.city {
            property.city = Some(city);
        }

        if let Some(zip_code) = request.zip_code {
            property.zip_code = Some(zip_code);
        }

        if let Some(lat) = request.latitude {
            if lat < -90.0 || lat > 90.0 {
                return Err(AppError::ValidationError("Invalid latitude range".to_string()));
            }
            property.latitude = Some(lat);
        }

        if let Some(lng) = request.longitude {
            if lng < -180.0 || lng > 180.0 {
                return Err(AppError::ValidationError("Invalid longitude range".to_string()));
            }
            property.longitude = Some(lng);
        }

        if let Some(land_use_code) = request.land_use_code {
            property.land_use_code = Some(land_use_code);
        }

        if let Some(zoning) = request.zoning {
            property.zoning = Some(zoning);
        }

        if let Some(legal_description) = request.legal_description {
            property.legal_description = Some(legal_description);
        }

        // Update assessment values
        if let Some(total_value) = request.total_value {
            validation::validate_amount_cents(total_value, "total_value")?;
            property.total_value = Some(total_value);
        }

        if let Some(land_value) = request.land_value {
            validation::validate_amount_cents(land_value, "land_value")?;
            property.land_value = Some(land_value);
        }

        if let Some(improvement_value) = request.improvement_value {
            validation::validate_amount_cents(improvement_value, "improvement_value")?;
            property.improvement_value = Some(improvement_value);
        }

        if let Some(assessed_value) = request.assessed_value {
            validation::validate_amount_cents(assessed_value, "assessed_value")?;
            property.assessed_value = Some(assessed_value);
        }

        if let Some(market_value) = request.market_value {
            validation::validate_amount_cents(market_value, "market_value")?;
            property.market_value = Some(market_value);
        }

        // Update physical characteristics
        if let Some(lot_size) = request.lot_size_sq_ft {
            if lot_size < 0 {
                return Err(AppError::ValidationError("Lot size cannot be negative".to_string()));
            }
            property.lot_size_sq_ft = Some(lot_size);
        }

        if let Some(building_size) = request.building_sq_ft {
            if building_size < 0 {
                return Err(AppError::ValidationError("Building square footage cannot be negative".to_string()));
            }
            property.building_sq_ft = Some(building_size);
        }

        if let Some(year_built) = request.year_built {
            let current_year = chrono::Utc::now().year();
            if year_built < 1800 || year_built > current_year {
                return Err(AppError::ValidationError(
                    format!("Year built must be between 1800 and {}", current_year)
                ));
            }
            property.year_built = Some(year_built);
        }

        if let Some(bedrooms) = request.bedrooms {
            if bedrooms < 0 || bedrooms > 50 {
                return Err(AppError::ValidationError("Bedrooms must be between 0 and 50".to_string()));
            }
            property.bedrooms = Some(bedrooms);
        }

        if let Some(bathrooms) = request.bathrooms {
            if bathrooms < 0.0 || bathrooms > 50.0 {
                return Err(AppError::ValidationError("Bathrooms must be between 0 and 50".to_string()));
            }
            property.bathrooms = Some(bathrooms);
        }

        if let Some(stories) = request.stories {
            if stories < 1.0 || stories > 10.0 {
                return Err(AppError::ValidationError("Stories must be between 1 and 10".to_string()));
            }
            property.stories = Some(stories);
        }

        if let Some(assessment_year) = request.assessment_year {
            validation::validate_assessment_year(assessment_year)?;
            property.assessment_year = assessment_year;
        }

        if let Some(status) = request.assessment_status {
            let valid_statuses = ["Pending", "Assessed", "Review", "Complete", "Appeal"];
            if !valid_statuses.contains(&status.as_str()) {
                return Err(AppError::ValidationError(
                    format!("Invalid assessment status. Valid values: {:?}", valid_statuses)
                ));
            }
            property.assessment_status = status;
        }

        let updated_property = state.property_service.update_property(path.id, property, &claims).await?;

        info!("🏆 Property updated: {} (County: {}) by user {}",
              updated_property.parcel_id, updated_property.county_id, claims.sub);
        Ok(updated_property)
    }).await?;

    success_response(updated_property, "Property updated successfully")
}

/// Delete property with government audit
#[instrument(skip(state, claims))]
pub async fn delete_property(
    State(state): State<PropertyState>,
    Path(path): Path<IdPath>,
    claims: Claims,
) -> Result<Json<crate::models::ApiResponse<()>>, AppError> {
    handle_with_audit("delete_property", &claims, || async {
        // Verify property exists and user has access
        let property = state.property_service.get_property_by_id(path.id, &claims).await?
            .ok_or_else(|| AppError::NotFoundError(format!("Property with ID {} not found", path.id)))?;

        // Delete the property
        state.property_service.delete_property(path.id, &claims).await?;

        info!("🗑️ Property deleted: {} (County: {}) by user {}",
              property.parcel_id, property.county_id, claims.sub);

        Ok(())
    }).await?;

    success_response_no_data("Property deleted successfully")
}

/// Championship property router setup
pub fn property_routes() -> axum::Router<PropertyState> {
    axum::Router::new()
        .route("/", axum::routing::post(super::simple::create_property_handler))
        .route("/:id",
               axum::routing::get(super::simple::get_property_by_id_handler)
                   .put(super::simple::update_property_handler)
                   .delete(super::simple::delete_property_handler))
        .route("/county/:county_id", axum::routing::get(super::simple::list_properties_by_county_handler))
        .route("/county/:county_id/search", axum::routing::get(super::simple::search_properties_handler))
}
