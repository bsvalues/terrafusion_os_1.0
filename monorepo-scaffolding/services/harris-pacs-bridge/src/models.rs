use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// County property data from Harris PACS 9.0 (external representation)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyProperty {
    /// Unique parcel identifier from Harris PACS 9.0
    pub parcel_id: String,

    /// County UUID from TerraFusion system
    pub county_id: Uuid,

    /// Property owner name from PACS 9.0
    pub owner_name: String,

    /// Property situs address
    pub property_address: String,

    /// Current assessed value in cents (to avoid floating point errors)
    pub assessed_value: i64,

    /// Current market value in cents
    pub market_value: i64,

    /// Tax year for current assessment
    pub tax_year: i32,

    /// Property type classification
    pub property_type: String,

    /// Property acreage (if available)
    pub acreage: Option<f64>,

    /// Last sale date
    pub last_sale_date: Option<DateTime<Utc>>,

    /// Last sale price in cents
    pub last_sale_price: Option<i64>,

    /// Last updated timestamp from Harris PACS 9.0
    pub harris_updated: DateTime<Utc>,
}

/// Raw property record from Harris PACS 9.0 database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSPropertyRecord {
    /// Parcel number as stored in PACS 9.0
    pub parcel_number: String,

    /// Jurisdiction code (e.g., BENTON_WA)
    pub jurisdiction_code: String,

    /// Owner name from PACS 9.0
    pub owner_name: String,

    /// Situs address from PACS 9.0
    pub situs_address: String,

    /// Assessed value (in cents for precision)
    pub assessed_value: i64,

    /// Market value (in cents for precision)
    pub market_value: i64,

    /// Assessment tax year
    pub tax_year: i32,

    /// Property type classification
    pub property_type: String,

    /// Property acreage
    pub acreage: Option<f64>,

    /// Last sale date
    pub last_sale_date: Option<DateTime<Utc>>,

    /// Last sale price (in cents)
    pub last_sale_price: Option<i64>,

    /// Assessment date from PACS 9.0
    pub assessment_date: DateTime<Utc>,

    /// Last updated in PACS 9.0
    pub last_updated: DateTime<Utc>,
}

/// Owner record from Harris PACS 9.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSOwnerRecord {
    /// Owner ID from PACS 9.0
    pub owner_id: String,

    /// Owner name
    pub owner_name: String,

    /// Mailing address
    pub mailing_address: Option<String>,

    /// City for mailing address
    pub mailing_city: Option<String>,

    /// State for mailing address
    pub mailing_state: Option<String>,

    /// ZIP code for mailing address
    pub mailing_zip: Option<String>,

    /// Owner type (Individual, Corporation, Government, etc.)
    pub owner_type: Option<String>,

    /// Multiple owners flag
    pub is_multiple_owners: bool,

    /// Last updated in PACS 9.0
    pub last_updated: DateTime<Utc>,
}

/// Assessment record from Harris PACS 9.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSAssessmentRecord {
    /// Assessment ID from PACS 9.0
    pub assessment_id: String,

    /// Associated parcel number
    pub parcel_number: String,

    /// Assessment year
    pub assessment_year: i32,

    /// Land value (in cents)
    pub land_value: i64,

    /// Improvement value (in cents)
    pub improvement_value: i64,

    /// Total assessed value (in cents)
    pub total_assessed_value: i64,

    /// Market value (in cents)
    pub market_value: i64,

    /// Assessment date
    pub assessment_date: DateTime<Utc>,

    /// Assessment method/approach
    pub assessment_method: Option<String>,

    /// Assessment notes
    pub assessment_notes: Option<String>,

    /// Exemptions applied
    pub exemptions: Option<Vec<PACSExemption>>,

    /// Last updated in PACS 9.0
    pub last_updated: DateTime<Utc>,
}

/// Tax exemption from Harris PACS 9.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSExemption {
    /// Exemption code
    pub exemption_code: String,

    /// Exemption description
    pub exemption_description: String,

    /// Exemption amount (in cents)
    pub exemption_amount: i64,

    /// Exemption percentage (0.0 to 100.0)
    pub exemption_percentage: Option<f64>,

    /// Effective start date
    pub effective_date: DateTime<Utc>,

    /// Expiration date (if applicable)
    pub expiration_date: Option<DateTime<Utc>>,
}

/// Tax record from Harris PACS 9.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSTaxRecord {
    /// Tax ID from PACS 9.0
    pub tax_id: String,

    /// Associated parcel number
    pub parcel_number: String,

    /// Tax year
    pub tax_year: i32,

    /// Total tax amount (in cents)
    pub total_tax_amount: i64,

    /// County tax (in cents)
    pub county_tax: i64,

    /// State tax (in cents)
    pub state_tax: Option<i64>,

    /// School district tax (in cents)
    pub school_tax: Option<i64>,

    /// Special assessments (in cents)
    pub special_assessments: Option<i64>,

    /// Tax due date
    pub tax_due_date: Option<DateTime<Utc>>,

    /// Payment status
    pub payment_status: String,

    /// Amount paid (in cents)
    pub amount_paid: i64,

    /// Payment date
    pub payment_date: Option<DateTime<Utc>>,

    /// Delinquent flag
    pub is_delinquent: bool,

    /// Penalty amount (in cents)
    pub penalty_amount: Option<i64>,

    /// Interest amount (in cents)
    pub interest_amount: Option<i64>,

    /// Last updated in PACS 9.0
    pub last_updated: DateTime<Utc>,
}

/// Sale record from Harris PACS 9.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PACSSaleRecord {
    /// Sale ID from PACS 9.0
    pub sale_id: String,

    /// Associated parcel number
    pub parcel_number: String,

    /// Sale date
    pub sale_date: DateTime<Utc>,

    /// Sale price (in cents)
    pub sale_price: i64,

    /// Sale type (Warranty Deed, Quit Claim, etc.)
    pub sale_type: String,

    /// Grantor (seller) name
    pub grantor_name: String,

    /// Grantee (buyer) name
    pub grantee_name: String,

    /// Document number
    pub document_number: Option<String>,

    /// Book and page reference
    pub book_page: Option<String>,

    /// Sale validation flag
    pub is_valid_sale: bool,

    /// Sale validation reason
    pub validation_reason: Option<String>,

    /// Deed restrictions
    pub deed_restrictions: Option<String>,

    /// Last updated in PACS 9.0
    pub last_updated: DateTime<Utc>,
}

/// Property synchronization request for Harris PACS 9.0
#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct PropertySyncRequest {
    /// County UUID to sync
    pub county_id: Uuid,

    /// Jurisdiction code for PACS 9.0
    pub jurisdiction: String,

    /// Specific parcel IDs to sync (optional, if empty syncs all)
    pub parcel_ids: Option<Vec<String>>,

    /// Type of synchronization
    pub sync_type: SyncType,

    /// Synchronization priority
    pub priority: SyncPriority,

    /// Include tax data in sync
    pub include_tax_data: bool,

    /// Include sales data in sync
    pub include_sales_data: bool,

    /// Include assessment history
    pub include_assessment_history: bool,

    /// Force resync even if data appears current
    pub force_resync: bool,

    /// Maximum records to process in this sync
    pub max_records: Option<u32>,
}

/// Types of synchronization available
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum SyncType {
    /// Complete sync of all data
    Full,
    /// Only sync records modified since last sync
    Incremental,
    /// Real-time sync of individual records
    RealTime,
    /// Validation sync to check data integrity
    Validation,
    /// Emergency sync with highest priority
    Emergency,
}

/// Synchronization priority levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq, PartialOrd, Ord)]
pub enum SyncPriority {
    Low,
    Normal,
    High,
    Critical,
    Emergency,
}

/// Property synchronization response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PropertySyncResponse {
    /// Unique sync operation ID
    pub sync_id: Uuid,

    /// County being synced
    pub county_id: Uuid,

    /// Current sync status
    pub status: SyncStatus,

    /// Number of properties processed
    pub properties_processed: u32,

    /// Number of properties updated
    pub properties_updated: u32,

    /// Number of properties created
    pub properties_created: u32,

    /// Sync errors encountered
    pub errors: Vec<SyncError>,

    /// Sync duration in milliseconds
    pub duration_ms: u64,

    /// Harris PACS version used
    pub harris_version: String,

    /// Timestamp when sync started
    pub sync_started: DateTime<Utc>,

    /// Timestamp when sync completed
    pub sync_completed: Option<DateTime<Utc>>,

    /// Sync progress percentage (0-100)
    pub progress_percentage: f64,

    /// Estimated time remaining in seconds
    pub estimated_completion_seconds: Option<u32>,
}

/// Synchronization status
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq)]
pub enum SyncStatus {
    /// Sync operation queued
    Queued,
    /// Sync operation starting
    Starting,
    /// Sync operation in progress
    InProgress,
    /// Sync operation completed successfully
    Completed,
    /// Sync operation failed
    Failed,
    /// Sync operation completed with warnings
    PartialSuccess,
    /// Sync operation cancelled by user
    Cancelled,
    /// Sync operation timed out
    Timeout,
}

/// Synchronization error details
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SyncError {
    /// Parcel ID where error occurred
    pub parcel_id: String,

    /// Error code for categorization
    pub error_code: String,

    /// Human-readable error message
    pub error_message: String,

    /// Error severity level
    pub severity: ErrorSeverity,

    /// Field name where error occurred (if applicable)
    pub field_name: Option<String>,

    /// Raw error details for debugging
    pub error_details: Option<HashMap<String, serde_json::Value>>,

    /// Timestamp when error occurred
    pub error_timestamp: DateTime<Utc>,
}

/// Error severity levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq, PartialOrd, Ord)]
pub enum ErrorSeverity {
    /// Informational message
    Info,
    /// Warning that doesn't prevent processing
    Warning,
    /// Error that prevents processing this record
    Error,
    /// Critical error that may stop entire sync
    Critical,
}

/// County system health status
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CountySystemStatus {
    /// County identifier
    pub county_id: Uuid,

    /// County name
    pub county_name: String,

    /// Harris PACS connection status
    pub harris_connected: bool,

    /// Last successful sync timestamp
    pub last_sync: Option<DateTime<Utc>>,

    /// Total property count in county
    pub property_count: u64,

    /// Sync health score (0-100)
    pub sync_health: u8,

    /// Active sync operations
    pub active_sync_operations: u32,

    /// Recent errors count
    pub recent_errors_count: u32,

    /// System performance metrics
    pub performance_metrics: CountyPerformanceMetrics,

    /// Last health check timestamp
    pub last_health_check: DateTime<Utc>,
}

/// County performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CountyPerformanceMetrics {
    /// Average sync duration in milliseconds
    pub avg_sync_duration_ms: u64,

    /// Properties synced per minute
    pub properties_per_minute: f64,

    /// Success rate percentage (0-100)
    pub success_rate_percentage: f64,

    /// Average database query time in milliseconds
    pub avg_query_time_ms: u64,

    /// Harris PACS response time in milliseconds
    pub harris_response_time_ms: u64,

    /// Memory usage in MB
    pub memory_usage_mb: f64,

    /// CPU utilization percentage
    pub cpu_utilization_percentage: f64,
}

/// Batch operation request for multiple counties
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct BatchSyncRequest {
    /// Counties to sync
    pub counties: Vec<String>,

    /// Sync type to apply to all counties
    pub sync_type: SyncType,

    /// Priority level
    pub priority: SyncPriority,

    /// Maximum concurrent syncs
    pub max_concurrent_syncs: Option<u32>,

    /// Sync timeout in minutes
    pub timeout_minutes: Option<u32>,

    /// Stop on first error flag
    pub stop_on_error: bool,
}

/// Batch operation response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct BatchSyncResponse {
    /// Batch operation ID
    pub batch_id: Uuid,

    /// Total counties in batch
    pub total_counties: u32,

    /// Counties completed
    pub counties_completed: u32,

    /// Counties failed
    pub counties_failed: u32,

    /// Overall batch status
    pub batch_status: SyncStatus,

    /// Individual county results
    pub county_results: Vec<CountySyncResult>,

    /// Batch start time
    pub batch_started: DateTime<Utc>,

    /// Batch completion time
    pub batch_completed: Option<DateTime<Utc>>,

    /// Total batch duration in milliseconds
    pub total_duration_ms: u64,
}

/// Individual county sync result in batch operation
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CountySyncResult {
    /// County identifier
    pub county_id: String,

    /// County sync status
    pub status: SyncStatus,

    /// County sync response
    pub sync_response: Option<PropertySyncResponse>,

    /// County-specific errors
    pub errors: Vec<String>,

    /// Duration for this county in milliseconds
    pub duration_ms: u64,
}

/// Harris PACS 9.0 system information
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct HarrisPACSSystemInfo {
    /// PACS version
    pub version: String,

    /// Database name
    pub database_name: String,

    /// Server name
    pub server_name: String,

    /// Connection status
    pub connection_status: String,

    /// Last connection test timestamp
    pub last_ping: DateTime<Utc>,

    /// Available jurisdictions
    pub available_jurisdictions: Vec<String>,

    /// System statistics
    pub system_statistics: HashMap<String, serde_json::Value>,

    /// Performance metrics
    pub performance_metrics: PACSPerformanceMetrics,
}

/// PACS performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PACSPerformanceMetrics {
    /// Average query response time in milliseconds
    pub avg_query_time_ms: u64,

    /// Total queries executed
    pub total_queries: u64,

    /// Failed queries count
    pub failed_queries: u64,

    /// Active connections count
    pub active_connections: u32,

    /// Connection pool size
    pub connection_pool_size: u32,

    /// Database size in MB
    pub database_size_mb: u64,
}

/// Implementation helpers for converting between formats
impl From<PACSPropertyRecord> for CountyProperty {
    fn from(pacs_record: PACSPropertyRecord) -> Self {
        Self {
            parcel_id: pacs_record.parcel_number,
            county_id: Uuid::new_v4(), // This should be populated by the caller
            owner_name: pacs_record.owner_name,
            property_address: pacs_record.situs_address,
            assessed_value: pacs_record.assessed_value,
            market_value: pacs_record.market_value,
            tax_year: pacs_record.tax_year,
            property_type: pacs_record.property_type,
            acreage: pacs_record.acreage,
            last_sale_date: pacs_record.last_sale_date,
            last_sale_price: pacs_record.last_sale_price,
            harris_updated: pacs_record.last_updated,
        }
    }
}

/// Default implementations
impl Default for SyncType {
    fn default() -> Self {
        SyncType::Incremental
    }
}

impl Default for SyncPriority {
    fn default() -> Self {
        SyncPriority::Normal
    }
}

impl Default for ErrorSeverity {
    fn default() -> Self {
        ErrorSeverity::Warning
    }
}
