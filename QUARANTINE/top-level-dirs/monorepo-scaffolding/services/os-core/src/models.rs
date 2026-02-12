//! TerraFusion OS Core - Data Models
//! Government-grade data structures with county isolation and FISMA compliance

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Elite County model with sovereign data boundaries
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct County {
    pub id: Uuid,
    pub code: String,                    // "benton", "king", "pierce"
    pub name: String,                    // "Benton County"
    pub state: String,                   // "WA"
    pub fips_code: String,               // Federal FIPS code
    pub population: Option<i32>,         // Census population
    pub area_sq_miles: Option<f64>,      // Geographic area
    pub county_seat: Option<String>,     // County seat city

    // Government configuration
    pub harris_pacs_jurisdiction: Option<String>, // Harris PACS integration
    pub tyler_system_id: Option<String>,          // Tyler Technologies integration
    pub assessment_cycle_months: i32,             // Assessment cycle (typically 12 or 24)

    // SLA targets
    pub availability_target: f64,        // 0.999 for 99.9%
    pub response_time_target_ms: i32,    // 150ms P95
    pub accuracy_target: f64,            // 0.999 for 99.9%

    // Championship features
    pub ai_swarm_enabled: bool,
    pub quantum_optimization: bool,
    pub real_time_sync: bool,

    // Audit fields
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub updated_by: String,
}

/// Elite Property model with government assessment standards
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Property {
    pub id: Uuid,
    pub county_id: Uuid,                 // MANDATORY: County isolation
    pub parcel_id: String,               // County-specific parcel identifier
    pub assessor_id: Option<String>,     // Assessor's unique ID

    // Location data
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: String,
    pub zip_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,

    // Property characteristics
    pub property_type: String,           // Residential, Commercial, Industrial, Agricultural
    pub land_use_code: Option<String>,   // County-specific land use classification
    pub zoning: Option<String>,
    pub legal_description: Option<String>,

    // Assessment data
    pub total_value: Option<i64>,        // Total assessed value (cents)
    pub land_value: Option<i64>,         // Land value (cents)
    pub improvement_value: Option<i64>,  // Improvement value (cents)
    pub assessed_value: Option<i64>,     // Final assessed value (cents)
    pub market_value: Option<i64>,       // Market value estimate (cents)

    // Physical characteristics
    pub lot_size_sq_ft: Option<i32>,
    pub building_sq_ft: Option<i32>,
    pub year_built: Option<i32>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<f32>,
    pub stories: Option<f32>,

    // Assessment metadata
    pub last_assessment_date: Option<DateTime<Utc>>,
    pub next_assessment_date: Option<DateTime<Utc>>,
    pub assessment_year: i32,
    pub assessment_status: String,       // "Assessed", "Pending", "Appeal", "Complete"

    // AI enhancement data
    pub ai_confidence_score: Option<f64>, // AI assessment confidence (0.0-1.0)
    pub quantum_optimization_factor: Option<f64>, // Quantum enhancement factor
    pub ml_model_version: Option<String>, // ML model used for assessment

    // Audit fields (auto-populated)
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub updated_by: String,
}

/// Government property assessment with IAAO standards
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PropertyAssessment {
    pub id: Uuid,
    pub property_id: Uuid,
    pub county_id: Uuid,                 // MANDATORY: County isolation
    pub assessment_year: i32,
    pub assessment_date: DateTime<Utc>,

    // IAAO standard assessment values
    pub assessed_value: i64,             // Final assessed value (cents)
    pub market_value: i64,               // Market value estimate (cents)
    pub assessment_ratio: f64,           // Assessed/Market ratio

    // Property valuation breakdown
    pub land_value: i64,
    pub improvement_value: i64,
    pub personal_property_value: Option<i64>,
    pub exemptions: Option<i64>,
    pub net_taxable_value: i64,

    // Quality metrics
    pub confidence_score: f64,           // Assessment confidence (0.0-1.0)
    pub accuracy_score: Option<f64>,     // Validation accuracy (when available)
    pub iaao_compliant: bool,            // IAAO standards compliance

    // AI enhancement
    pub ai_factors: Option<serde_json::Value>, // Contributing AI factors
    pub quantum_optimized: bool,         // Quantum optimization applied
    pub ml_model_version: String,        // ML model version used

    // Assessment workflow
    pub assessor_id: String,             // Assessor who performed assessment
    pub reviewer_id: Option<String>,     // Reviewer (if applicable)
    pub status: String,                  // "Draft", "Review", "Final", "Appealed"
    pub review_notes: Option<String>,

    // Audit compliance
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub updated_by: String,
}

/// Elite AI Agent coordination model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AIAgent {
    pub id: Uuid,
    pub agent_type: String,              // "PropertyAssessment", "DataSync", "Compliance"
    pub name: String,
    pub description: Option<String>,

    // Agent configuration
    pub county_id: Option<Uuid>,         // County scope (null for global agents)
    pub capabilities: serde_json::Value, // JSON array of capabilities
    pub configuration: serde_json::Value, // Agent-specific configuration

    // Performance metrics
    pub tasks_completed: i64,
    pub success_rate: f64,               // Success rate (0.0-1.0)
    pub average_execution_time_ms: f64,
    pub last_execution: Option<DateTime<Utc>>,

    // Swarm coordination
    pub swarm_role: String,              // "Worker", "Coordinator", "Supervisor"
    pub parent_agent_id: Option<Uuid>,   // Parent in hierarchy
    pub consciousness_level: f64,        // AI consciousness metric (0.0-1.0)

    // Status
    pub status: String,                  // "Active", "Idle", "Maintenance", "Error"
    pub health_score: f64,               // Health metric (0.0-1.0)
    pub version: String,

    // Audit fields
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub updated_by: String,
}

/// Championship system health monitoring
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct SystemHealth {
    pub service_name: String,
    pub status: HealthStatus,
    pub version: String,
    pub uptime_seconds: u64,
    pub memory_usage_bytes: u64,
    pub cpu_usage_percent: f64,
    pub active_connections: u32,
    pub last_heartbeat: DateTime<Utc>,
    pub health_checks: Vec<HealthCheck>,
}

/// Service status response for health monitoring
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct ServiceStatus {
    pub name: String,
    pub status: String,
    pub healthy: bool,
    pub response_time_ms: f64,
    pub last_check: chrono::DateTime<chrono::Utc>,
    pub error_count: i32,
    pub version: String,
}

/// Government health status enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, utoipa::ToSchema)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
    Maintenance,
}

/// Elite health check model
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct HealthCheck {
    pub name: String,
    pub status: HealthStatus,
    pub message: String,
    pub duration_ms: u64,
    pub timestamp: DateTime<Utc>,
}

/// Database-specific health information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseHealth {
    pub connection_status: HealthStatus,
    pub connection_count: u32,
    pub query_latency_ms: f64,
    pub last_query_time: DateTime<Utc>,
    pub pool_status: String,
}

/// Government audit log model for FISMA compliance
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub county_id: Option<Uuid>,         // County scope (null for system events)
    pub user_id: String,
    pub action: String,                  // "CREATE", "READ", "UPDATE", "DELETE"
    pub resource_type: String,           // "Property", "Assessment", "County"
    pub resource_id: String,
    pub old_values: Option<serde_json::Value>,
    pub new_values: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub session_id: Option<String>,
    pub request_id: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Championship API request/response models
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    pub request_id: String,
}

/// Government paginated response
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total_count: i64,
    pub page: i32,
    pub page_size: i32,
    pub total_pages: i32,
    pub has_next: bool,
    pub has_previous: bool,
}

/// Elite county configuration model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyConfig {
    pub county_id: Uuid,
    pub harris_pacs: Option<HarrisPacsConfig>,
    pub tyler_config: Option<TylerConfig>,
    pub sla_targets: SlaTargets,
    pub feature_flags: FeatureFlags,
    pub security_settings: SecuritySettings,
    pub ai_configuration: AiConfiguration,
}

/// Harris PACS integration configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarrisPacsConfig {
    pub jurisdiction: String,
    pub connection_string: String,       // Encrypted
    pub sync_interval_minutes: u32,
    pub batch_size: u32,
    pub timeout_seconds: u32,
}

/// Tyler Technologies configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TylerConfig {
    pub system_id: String,
    pub api_endpoint: String,
    pub api_key: String,                 // Encrypted
    pub sync_enabled: bool,
}

/// Government SLA targets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaTargets {
    pub availability: f64,               // 0.999 for 99.9%
    pub response_time_p95_ms: u32,       // 150ms
    pub accuracy_target: f64,            // 0.999 for 99.9%
}

/// Championship feature flags
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub ai_swarm_enabled: bool,
    pub quantum_optimization: bool,
    pub real_time_sync: bool,
    pub advanced_analytics: bool,
    pub predictive_modeling: bool,
}

/// Government security settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySettings {
    pub sso_provider: String,            // "AzureAD", "Okta"
    pub mfa_required: bool,
    pub audit_logging: bool,
    pub encryption_at_rest: bool,
    pub session_timeout_minutes: u32,
}

/// Elite AI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfiguration {
    pub swarm_size: u32,
    pub consciousness_level: f64,
    pub quantum_factor: f64,
    pub ml_model_versions: HashMap<String, String>,
    pub performance_targets: AiPerformanceTargets,
}

/// Championship AI performance targets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiPerformanceTargets {
    pub accuracy_minimum: f64,          // 0.999 for 99.9%
    pub response_time_max_ms: u32,      // 50ms
    pub throughput_min_per_second: u32, // 1000 assessments/second
    pub uptime_minimum: f64,            // 0.9999 for 99.99%
}

/// Implementation helpers for government standards
impl County {
    pub fn is_washington_state(&self) -> bool {
        self.state.to_uppercase() == "WA"
    }

    pub fn meets_sla_targets(&self) -> bool {
        self.availability_target >= 0.999 &&
        self.response_time_target_ms <= 150 &&
        self.accuracy_target >= 0.999
    }
}

impl Property {
    pub fn calculate_assessment_ratio(&self) -> Option<f64> {
        if let (Some(assessed), Some(market)) = (self.assessed_value, self.market_value) {
            if market > 0 {
                Some(assessed as f64 / market as f64)
            } else {
                None
            }
        } else {
            None
        }
    }

    pub fn is_residential(&self) -> bool {
        self.property_type.to_lowercase().contains("residential")
    }

    pub fn is_commercial(&self) -> bool {
        self.property_type.to_lowercase().contains("commercial")
    }
}

impl PropertyAssessment {
    pub fn meets_iaao_standards(&self) -> bool {
        // IAAO Standard: Assessment ratio should be between 0.90 and 1.10
        self.assessment_ratio >= 0.90 &&
        self.assessment_ratio <= 1.10 &&
        self.confidence_score >= 0.90
    }

    pub fn calculate_coefficient_of_dispersion(&self, median_ratio: f64) -> f64 {
        // COD calculation for IAAO compliance
        let deviation = (self.assessment_ratio - median_ratio).abs();
        (deviation / median_ratio) * 100.0
    }
}

impl ApiResponse<()> {
    pub fn success(message: String, request_id: String) -> Self {
        Self {
            success: true,
            data: None,
            error: None,
            message,
            timestamp: Utc::now(),
            request_id,
        }
    }

    pub fn error(error: String, request_id: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error.clone()),
            message: error,
            timestamp: Utc::now(),
            request_id,
        }
    }
}

impl<T> ApiResponse<T> {
    pub fn success_with_data(data: T, message: String, request_id: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message,
            timestamp: Utc::now(),
            request_id,
        }
    }
}
