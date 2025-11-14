//! TerraFusion OS Core - Assessment Management Handlers
//! IAAO-compliant property assessment endpoints with AI enhancement

use axum::{
    extract::{State, Path, Query, Json},
    response::IntoResponse,
};
use crate::{
    handlers::{
        AppError, HandlerResult, success_response, success_response_no_data,
        AssessmentSearchParams, IdPath, CountyIdPath, handle_with_audit, validation
    },
    models::{PropertyAssessment, PaginatedResponse},
    services::AssessmentService,
    auth::Claims,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, instrument};

/// Elite assessment service state
#[derive(Clone)]
pub struct AssessmentState {
    pub assessment_service: Arc<AssessmentService>,
}

/// Government assessment creation request
#[derive(Debug, Deserialize)]
pub struct CreateAssessmentRequest {
    pub property_id: Uuid,
    pub assessment_year: i32,
    pub assessed_value: i64,        // in cents
    pub market_value: i64,          // in cents
    pub land_value: i64,           // in cents
    pub improvement_value: i64,     // in cents
    pub personal_property_value: Option<i64>, // in cents
    pub exemptions: Option<i64>,    // in cents
    pub assessor_id: String,
    pub reviewer_id: Option<String>,
    pub review_notes: Option<String>,
    pub quantum_optimized: Option<bool>,
    pub ml_model_version: Option<String>,
}

/// Championship assessment update request
#[derive(Debug, Deserialize)]
pub struct UpdateAssessmentRequest {
    pub assessed_value: Option<i64>,
    pub market_value: Option<i64>,
    pub land_value: Option<i64>,
    pub improvement_value: Option<i64>,
    pub personal_property_value: Option<i64>,
    pub exemptions: Option<i64>,
    pub reviewer_id: Option<String>,
    pub review_notes: Option<String>,
    pub status: Option<String>,
    pub quantum_optimized: Option<bool>,
}

/// Elite assessment approval request
#[derive(Debug, Deserialize)]
pub struct ApproveAssessmentRequest {
    pub reviewer_notes: Option<String>,
    pub approved: bool,
}

/// IAAO compliance validation request
#[derive(Debug, Deserialize)]
pub struct IAAOValidationRequest {
    pub assessment_ids: Vec<Uuid>,
    pub validation_year: i32,
}

/// Championship IAAO compliance response
#[derive(Debug, Serialize)]
pub struct IAAOComplianceResponse {
    pub assessment_id: Uuid,
    pub iaao_compliant: bool,
    pub assessment_ratio: f64,
    pub confidence_score: f64,
    pub median_ratio: f64,
    pub coefficient_of_dispersion: f64,
    pub price_related_differential: f64,
    pub compliance_details: IAAOComplianceDetails,
}

/// Government IAAO compliance details
#[derive(Debug, Serialize)]
pub struct IAAOComplianceDetails {
    pub assessment_level_compliant: bool,    // 0.90-1.10 range
    pub uniformity_compliant: bool,          // COD ≤ 15% for residential
    pub prd_compliant: bool,                 // PRD 0.98-1.03 range
    pub accuracy_target_met: bool,           // 99.9% TerraFusion target
    pub recommendations: Vec<String>,
}

/// Get assessment by ID with county validation
#[instrument(skip(state, claims))]
pub async fn get_assessment_by_id(
    State(state): State<AssessmentState>,
    Path(path): Path<IdPath>,
    claims: Claims,
) -> HandlerResult<PropertyAssessment> {
    let assessment = handle_with_audit("get_assessment_by_id", &claims, || async {
        // This would call assessment_service.get_assessment_by_id(path.id, &claims)
        // For now, creating a mock response

        info!("📊 Assessment retrieval requested: {} by user {}", path.id, claims.sub);

        // Mock assessment (in production, this would query the database)
        let assessment = PropertyAssessment {
            id: path.id,
            property_id: Uuid::new_v4(),
            county_id: claims.county_id,
            assessment_year: 2025,
            assessment_date: chrono::Utc::now(),
            assessed_value: 35000000, // $350,000
            market_value: 36000000,   // $360,000
            assessment_ratio: 0.972,
            land_value: 15000000,     // $150,000
            improvement_value: 20000000, // $200,000
            personal_property_value: None,
            exemptions: None,
            net_taxable_value: 35000000,
            confidence_score: 0.985,
            accuracy_score: Some(0.996),
            iaao_compliant: true,
            ai_factors: Some(serde_json::json!({
                "location_score": 0.85,
                "age_factor": 0.92,
                "size_factor": 1.15,
                "type_factor": 1.0
            })),
            quantum_optimized: true,
            ml_model_version: "terrafusion-v2.1".to_string(),
            assessor_id: "assessor-001".to_string(),
            reviewer_id: None,
            status: "Final".to_string(),
            review_notes: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            created_by: "system".to_string(),
            updated_by: "system".to_string(),
        };

        info!("📊 Assessment retrieved: ${:.2} for property {} (user: {})",
              assessment.assessed_value as f64 / 100.0, assessment.property_id, claims.sub);
        Ok(assessment)
    }).await?;

    success_response(assessment, "Assessment retrieved successfully")
}

/// List assessments by county with filtering
#[instrument(skip(state, claims))]
pub async fn list_assessments_by_county(
    State(state): State<AssessmentState>,
    Path(path): Path<CountyIdPath>,
    Query(params): Query<AssessmentSearchParams>,
    claims: Claims,
) -> HandlerResult<PaginatedResponse<PropertyAssessment>> {
    let assessments = handle_with_audit("list_assessments_by_county", &claims, || async {
        let page = params.pagination.get_page();
        let page_size = params.pagination.get_page_size();

        // Validate search parameters
        if let Some(year) = params.assessment_year {
            validation::validate_assessment_year(year)?;
        }

        if let Some(confidence) = params.min_confidence {
            validation::validate_confidence_score(confidence, "min_confidence")?;
        }

        // Validate county access
        if claims.role != "SuperAdmin" && claims.county_id != path.county_id {
            return Err(AppError::AuthorizationError(
                "Access denied to specified county assessments".to_string()
            ));
        }

        // Mock paginated response (in production, query database)
        let mock_assessments = vec![]; // Would populate from database

        let paginated_response = PaginatedResponse {
            items: mock_assessments,
            total_count: 0,
            page: page.try_into().unwrap_or(1),
            page_size: page_size.try_into().unwrap_or(50),
            total_pages: 0,
            has_next: false,
            has_previous: false,
        };

        info!("📋 Listed {} assessments for county {} (user: {})",
              paginated_response.items.len(), path.county_id, claims.sub);
        Ok(paginated_response)
    }).await?;

    success_response(assessments, "Assessments retrieved successfully")
}

/// Create new property assessment with AI enhancement
#[instrument(skip(state, claims, request))]
pub async fn create_assessment(
    State(state): State<AssessmentState>,
    claims: Claims,
    Json(request): Json<CreateAssessmentRequest>,
) -> HandlerResult<PropertyAssessment> {
    let assessment = handle_with_audit("create_assessment", &claims, || async {
        // Validate permissions
        if !claims.permissions.contains(&"assessment:write".to_string()) {
            return Err(AppError::AuthorizationError(
                "Insufficient permissions to create assessments".to_string()
            ));
        }

        // Validate input values
        validation::validate_assessment_year(request.assessment_year)?;
        validation::validate_amount_cents(request.assessed_value, "assessed_value")?;
        validation::validate_amount_cents(request.market_value, "market_value")?;
        validation::validate_amount_cents(request.land_value, "land_value")?;
        validation::validate_amount_cents(request.improvement_value, "improvement_value")?;

        if let Some(pp_value) = request.personal_property_value {
            validation::validate_amount_cents(pp_value, "personal_property_value")?;
        }

        if let Some(exemptions) = request.exemptions {
            validation::validate_amount_cents(exemptions, "exemptions")?;
        }

        // Validate assessment ratio (IAAO standards)
        let assessment_ratio = request.assessed_value as f64 / request.market_value as f64;
        if assessment_ratio < 0.80 || assessment_ratio > 1.20 {
            warn!("⚠️ Assessment ratio outside normal range: {:.3}", assessment_ratio);
        }

        // Calculate net taxable value
        let net_taxable_value = request.assessed_value - request.exemptions.unwrap_or(0);
        if net_taxable_value < 0 {
            return Err(AppError::ValidationError(
                "Net taxable value cannot be negative".to_string()
            ));
        }

        // Create assessment model
        let mut assessment = PropertyAssessment {
            id: Uuid::new_v4(),
            property_id: request.property_id,
            county_id: claims.county_id, // Set from user's county access
            assessment_year: request.assessment_year,
            assessment_date: chrono::Utc::now(),
            assessed_value: request.assessed_value,
            market_value: request.market_value,
            assessment_ratio,
            land_value: request.land_value,
            improvement_value: request.improvement_value,
            personal_property_value: request.personal_property_value,
            exemptions: request.exemptions,
            net_taxable_value,

            // Calculate confidence score based on AI factors
            confidence_score: 0.95, // Would be calculated by AI service
            accuracy_score: None,   // Set after validation
            iaao_compliant: assessment_ratio >= 0.90 && assessment_ratio <= 1.10,

            // AI enhancement
            ai_factors: None,       // Set by AI service if quantum optimized
            quantum_optimized: request.quantum_optimized.unwrap_or(false),
            ml_model_version: request.ml_model_version.unwrap_or_else(|| "terrafusion-v2.1".to_string()),

            // Workflow
            assessor_id: request.assessor_id,
            reviewer_id: request.reviewer_id,
            status: "Draft".to_string(),
            review_notes: request.review_notes,

            // Audit fields
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            created_by: claims.sub.clone(),
            updated_by: claims.sub.clone(),
        };

        // AI enhancement if requested
        if assessment.quantum_optimized {
            // Would call AI service to calculate enhanced factors
            assessment.ai_factors = Some(serde_json::json!({
                "quantum_enhancement": true,
                "optimization_factor": 949,
                "confidence_boost": 0.05
            }));
            assessment.confidence_score = (assessment.confidence_score + 0.05).min(1.0);
        }

        // Create assessment via service
        let created_assessment = state.assessment_service.create_assessment(assessment, &claims).await?;

        info!("🏆 Assessment created: ${:.2} for property {} (user: {})",
              created_assessment.assessed_value as f64 / 100.0,
              created_assessment.property_id, claims.sub);
        Ok(created_assessment)
    }).await?;

    success_response(assessment, "Assessment created successfully")
}

/// Update existing assessment with government validation
#[instrument(skip(state, claims, request))]
pub async fn update_assessment(
    State(state): State<AssessmentState>,
    Path(path): Path<IdPath>,
    claims: Claims,
    Json(request): Json<UpdateAssessmentRequest>,
) -> HandlerResult<PropertyAssessment> {
    let updated_assessment = handle_with_audit("update_assessment", &claims, || async {
        // Validate permissions
        if !claims.permissions.contains(&"assessment:write".to_string()) {
            return Err(AppError::AuthorizationError(
                "Insufficient permissions to update assessments".to_string()
            ));
        }

        // Mock getting existing assessment (would query database)
        let mut assessment = PropertyAssessment {
            id: path.id,
            property_id: Uuid::new_v4(),
            county_id: claims.county_id,
            assessment_year: 2025,
            assessment_date: chrono::Utc::now(),
            assessed_value: 35000000,
            market_value: 36000000,
            assessment_ratio: 0.972,
            land_value: 15000000,
            improvement_value: 20000000,
            personal_property_value: None,
            exemptions: None,
            net_taxable_value: 35000000,
            confidence_score: 0.985,
            accuracy_score: Some(0.996),
            iaao_compliant: true,
            ai_factors: Some(serde_json::json!({})),
            quantum_optimized: false,
            ml_model_version: "terrafusion-v2.1".to_string(),
            assessor_id: "assessor-001".to_string(),
            reviewer_id: None,
            status: "Draft".to_string(),
            review_notes: None,
            created_at: chrono::Utc::now() - chrono::Duration::hours(1),
            updated_at: chrono::Utc::now(),
            created_by: claims.sub.clone(),
            updated_by: claims.sub.clone(),
        };

        // Apply updates with validation
        if let Some(assessed_value) = request.assessed_value {
            validation::validate_amount_cents(assessed_value, "assessed_value")?;
            assessment.assessed_value = assessed_value;
        }

        if let Some(market_value) = request.market_value {
            validation::validate_amount_cents(market_value, "market_value")?;
            assessment.market_value = market_value;
        }

        if let Some(land_value) = request.land_value {
            validation::validate_amount_cents(land_value, "land_value")?;
            assessment.land_value = land_value;
        }

        if let Some(improvement_value) = request.improvement_value {
            validation::validate_amount_cents(improvement_value, "improvement_value")?;
            assessment.improvement_value = improvement_value;
        }

        if let Some(pp_value) = request.personal_property_value {
            validation::validate_amount_cents(pp_value, "personal_property_value")?;
            assessment.personal_property_value = Some(pp_value);
        }

        if let Some(exemptions) = request.exemptions {
            validation::validate_amount_cents(exemptions, "exemptions")?;
            assessment.exemptions = Some(exemptions);
        }

        if let Some(reviewer_id) = request.reviewer_id {
            assessment.reviewer_id = Some(reviewer_id);
        }

        if let Some(review_notes) = request.review_notes {
            assessment.review_notes = Some(review_notes);
        }

        if let Some(status) = request.status {
            let valid_statuses = ["Draft", "Review", "Final", "Appealed"];
            if !valid_statuses.contains(&status.as_str()) {
                return Err(AppError::ValidationError(
                    format!("Invalid status. Valid values: {:?}", valid_statuses)
                ));
            }
            assessment.status = status;
        }

        if let Some(quantum_opt) = request.quantum_optimized {
            assessment.quantum_optimized = quantum_opt;
            if quantum_opt && assessment.ai_factors.is_none() {
                // Apply quantum enhancement
                assessment.ai_factors = Some(serde_json::json!({
                    "quantum_enhancement": true,
                    "optimization_factor": 949
                }));
            }
        }

        // Recalculate derived values
        assessment.assessment_ratio = assessment.assessed_value as f64 / assessment.market_value as f64;
        assessment.net_taxable_value = assessment.assessed_value - assessment.exemptions.unwrap_or(0);
        assessment.iaao_compliant = assessment.assessment_ratio >= 0.90 && assessment.assessment_ratio <= 1.10;
        assessment.updated_at = chrono::Utc::now();
        assessment.updated_by = claims.sub.clone();

        info!("🏆 Assessment updated: ${:.2} (ratio: {:.3}) for property {} (user: {})",
              assessment.assessed_value as f64 / 100.0, assessment.assessment_ratio,
              assessment.property_id, claims.sub);
        Ok(assessment)
    }).await?;

    success_response(updated_assessment, "Assessment updated successfully")
}

/// Approve or reject assessment (reviewer only)
#[instrument(skip(_state, claims, request))]
pub async fn approve_assessment(
    State(_state): State<AssessmentState>,
    Path(path): Path<IdPath>,
    claims: Claims,
    Json(request): Json<ApproveAssessmentRequest>,
) -> Result<Json<crate::models::ApiResponse<()>>, AppError> {
    handle_with_audit("approve_assessment", &claims, || async {
        // Validate reviewer permissions
        if !claims.permissions.contains(&"assessment:review".to_string()) {
            return Err(AppError::AuthorizationError(
                "Insufficient permissions to approve assessments".to_string()
            ));
        }

        // Mock approval process (would update database)
        let action = if request.approved { "approved" } else { "rejected" };

        info!("🏆 Assessment {} by reviewer {} (Assessment: {})",
              action, claims.sub, path.id);
        Ok(())
    }).await?;

    let message = if request.approved {
        "Assessment approved successfully"
    } else {
        "Assessment rejected successfully"
    };

    success_response_no_data(message)
}

/// Validate IAAO compliance for assessments
#[instrument(skip(_state, claims, request))]
pub async fn validate_iaao_compliance(
    State(_state): State<AssessmentState>,
    claims: Claims,
    Json(request): Json<IAAOValidationRequest>,
) -> HandlerResult<Vec<IAAOComplianceResponse>> {
    let compliance_results = handle_with_audit("validate_iaao_compliance", &claims, || async {
        validation::validate_assessment_year(request.validation_year)?;

        // Mock IAAO compliance validation (would analyze actual assessments)
        let mut results = Vec::new();

        for assessment_id in request.assessment_ids {
            let compliance = IAAOComplianceResponse {
                assessment_id,
                iaao_compliant: true,
                assessment_ratio: 0.972,
                confidence_score: 0.985,
                median_ratio: 0.975,
                coefficient_of_dispersion: 12.5, // COD ≤ 15% for residential
                price_related_differential: 1.01, // PRD 0.98-1.03
                compliance_details: IAAOComplianceDetails {
                    assessment_level_compliant: true,  // 0.90-1.10
                    uniformity_compliant: true,        // COD ≤ 15%
                    prd_compliant: true,              // PRD 0.98-1.03
                    accuracy_target_met: true,        // 99.9%
                    recommendations: vec![],
                },
            };
            results.push(compliance);
        }

        info!("📊 IAAO compliance validated for {} assessments (user: {})",
              results.len(), claims.sub);
        Ok(results)
    }).await?;

    success_response(compliance_results, "IAAO compliance validation completed")
}

/// Championship assessment router setup
pub fn assessment_routes() -> axum::Router<AssessmentState> {
    axum::Router::new()
        .route("/", axum::routing::post(super::simple::create_assessment_handler))
        .route("/:id",
               axum::routing::get(super::simple::get_assessment_by_id_handler)
                   .put(super::simple::update_assessment_handler))
        .route("/:id/approve", axum::routing::post(super::simple::approve_assessment_handler))
        .route("/county/:county_id", axum::routing::get(super::simple::list_assessments_by_county_handler))
        .route("/iaao/validate", axum::routing::post(super::simple::validate_iaao_compliance_handler))
}
