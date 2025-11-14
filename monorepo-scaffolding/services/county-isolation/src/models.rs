//! TerraFusion County Isolation - Government Data Models
//! FISMA-HIGH compliant data structures for sovereign county operations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;
use uuid::Uuid;

/// Enhanced county isolation validation result with comprehensive fields
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct IsolationValidationResult {
    // Original fields
    pub validation_id: Uuid,
    pub county_id: Uuid,
    pub allowed: bool,
    pub reason: String,
    pub compliance_level: ComplianceLevel,
    pub security_score: f64,
    pub audit_trail_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub validation_duration_ms: u64,

    // Additional fields required by validation engine
    pub is_valid: bool,
    pub user_id: Uuid,
    pub resource_type: ResourceType,
    pub operation_type: OperationType,
    pub validation_timestamp: DateTime<Utc>,
    pub violations: Vec<ValidationViolation>,
    pub warnings: Vec<ValidationWarning>,
    pub required_approvals: Vec<String>,
    pub audit_requirements: AuditRequirements,
    pub escalation_required: bool,
    pub emergency_override_used: bool,
}

/// Government compliance levels for county operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum ComplianceLevel {
    #[serde(alias = "FISMA_HIGH")]
    FismaHigh,
    #[serde(alias = "FISMA_MODERATE")]
    FismaModerate,
    #[serde(alias = "FISMA_LOW")]
    FismaLow,
    #[serde(alias = "FEDRAMP")]
    FedRamp,
    #[serde(alias = "NIST_800_53")]
    Nist80053,
    #[serde(alias = "SOX")]
    Sox,
    #[serde(alias = "HIPAA")]
    Hipaa,
    None, // Added for validation compatibility
}

/// County access validation request
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyAccessRequest {
    pub request_id: Uuid,
    pub county_id: Uuid,
    pub user_id: Uuid,
    pub resource_type: ResourceType,
    pub resource_id: Option<Uuid>, // Made optional for compatibility
    pub operation_type: OperationType,
    pub operation: OperationType, // Added alias for middleware compatibility
    pub user_context: UserSecurityContext,
    pub requested_at: DateTime<Utc>,
    pub justification: Option<String>,
    pub emergency_override: bool, // Added for middleware compatibility
}

/// Government resource types under county jurisdiction
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq, Hash)] // Added traits
#[serde(rename_all = "snake_case")]
pub enum ResourceType {
    Property,
    Assessment,
    TaxRecord,
    Permit,
    Citizen,
    Parcel,
    ZoningRecord,
    BusinessLicense,
    VitalRecord,
    CourtRecord,
    ElectionRecord,
    EmergencyRecord,
}

/// Government operations requiring authorization
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq, Hash)] // Added traits
#[serde(rename_all = "snake_case")]
pub enum OperationType {
    Read,
    Write,
    Update,
    Delete,
    Export,
    Import,
    BulkExport,
    BulkImport,
    CrossCountyShare,
    Archive,
    Purge,
    Audit,
    Report,
}

/// Enhanced user security context for government access
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserSecurityContext {
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub clearance_level: u8,
    pub county_permissions: Vec<CountyPermission>,
    pub role: GovernmentRole,
    pub authenticated_at: DateTime<Utc>,
    pub mfa_verified: bool,
    pub ip_address: String,
    pub user_agent: String,

    // Additional fields for middleware compatibility
    pub authentication_level: AuthenticationLevel,
    pub security_clearance: SecurityClearance,
    pub active_roles: Vec<String>,
    pub last_authentication: DateTime<Utc>,
    pub session_expiry: DateTime<Utc>,
    pub county_context: Option<Uuid>,
}

/// County-specific permissions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyPermission {
    pub county_id: Uuid,
    pub permission_type: PermissionType,
    pub granted_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub granted_by: Uuid,
    pub restrictions: Vec<String>,
}

/// Government permission types
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PermissionType {
    ReadOnly,
    ReadWrite,
    AdminAccess,
    AuditAccess,
    SupervisorAccess,
    SystemAdmin,
    ComplianceOfficer,
    DataSteward,
    EmergencyAccess,
}

/// Government roles for access control
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GovernmentRole {
    CountyClerk,
    Assessor,
    TaxCollector,
    PlanningOfficer,
    BuildingInspector,
    SystemAdministrator,
    ComplianceOfficer,
    DataAnalyst,
    AuditManager,
    SuperUser,
    EmergencyCoordinator,
    ElectionOfficial,
}

/// County isolation metrics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyIsolationMetrics {
    pub county_id: Uuid,
    pub county_name: String,
    pub measurement_period_start: DateTime<Utc>,
    pub measurement_period_end: DateTime<Utc>,
    pub total_access_requests: u64,
    pub successful_access_requests: u64,
    pub denied_access_requests: u64,
    pub violation_attempts: u64,
    pub cross_county_requests: u64,
    pub emergency_overrides: u64,
    pub compliance_score: f64,
    pub sovereignty_violations: u64,
    pub data_leakage_incidents: u64,
    pub audit_entries_created: u64,
    pub average_validation_time_ms: f64,
    pub peak_request_rate_per_second: u32,
}

/// Audit trail entry for government compliance
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AuditEntry {
    pub audit_id: Uuid,
    pub county_id: Uuid,
    pub event_type: AuditEventType,
    pub user_id: Uuid,
    pub resource_type: ResourceType,
    pub resource_id: Option<Uuid>,
    pub operation: OperationType,
    pub result: AuditResult,
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u64,
    pub ip_address: String,
    pub user_agent: String,
    pub session_id: Uuid,
    pub compliance_context: ComplianceContext,
    pub risk_assessment: RiskAssessment,
}

/// Government audit event types
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum AuditEventType {
    AccessRequest,
    AccessDenied,
    AccessGranted,
    DataModification,
    DataExport,
    DataImport,
    SystemLogin,
    SystemLogout,
    PermissionChange,
    ConfigurationChange,
    SecurityViolation,
    ComplianceCheck,
    EmergencyOverride,
    DataBreach,
}

/// Audit result classification
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum AuditResult {
    Success,
    Failure,
    Denied,
    Warning,
    Critical,
    Violation,
    Approved,
    Escalated,
    Blocked,      // Added for middleware compatibility
    Unauthorized, // Added for middleware compatibility
}

/// Compliance context for audit entries
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ComplianceContext {
    pub regulation_framework: ComplianceLevel,
    pub data_classification: DataClassification,
    pub retention_requirements: u32, // days
    pub sovereignty_requirements: bool,
    pub cross_border_restrictions: bool,
    pub encryption_required: bool,
}

/// Government data classification levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum DataClassification {
    Public,
    Internal,
    Confidential,
    Restricted,
    Secret,
    TopSecret,
    ControlledUnclassified,
    ForOfficialUseOnly,
}

/// Risk assessment for government operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RiskAssessment {
    pub risk_level: RiskLevel,
    pub risk_score: f64, // 0.0 to 100.0
    pub risk_factors: Vec<String>,
    pub mitigation_applied: bool,
    pub requires_approval: bool,
    pub escalation_required: bool,
}

/// Government risk levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
    Extreme,
}

/// Data sovereignty violation record
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SovereigntyViolation {
    pub violation_id: Uuid,
    pub county_id: Uuid,
    pub violated_county_id: Uuid,
    pub violation_type: ViolationType,
    pub user_id: Uuid,
    pub resource_type: ResourceType,
    pub resource_id: Uuid,
    pub detected_at: DateTime<Utc>,
    pub severity: ViolationSeverity,
    pub automatic_action: AutomaticAction,
    pub investigation_required: bool,
    pub resolved: bool,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolution_notes: Option<String>,
}

/// Types of sovereignty violations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ViolationType {
    CrossCountyAccess,
    DataLeakage,
    UnauthorizedExport,
    PermissionEscalation,
    BypassAttempt,
    ImpersonationAttempt,
    BulkDataExtraction,
    SystemCompromise,
    InsiderThreat,
    // Additional violation types for comprehensive coverage
    SovereigntyViolation,
    InsufficientClearance,
    MfaRequired,
    InvalidUser,
    UnauthorizedOperation,
    UnauthorizedResource,
    InvalidCounty,
    SystemError,
    UnauthorizedAccess,
    DataBreach,
    PolicyViolation,
    ComplianceFailure,
    CrossBoundaryViolation,
    IntegrityViolation,
    AvailabilityViolation,
}

/// Violation severity levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum ViolationSeverity {
    Low,
    Medium,
    High,
    Critical,
    Catastrophic,
}

/// Automatic actions taken on violations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum AutomaticAction {
    LogOnly,
    BlockAccess,
    SuspendUser,
    AlertAdministrator,
    QuarantineData,
    EmergencyLockdown,
    ForensicCapture,
    LawEnforcementAlert,
    NotifyCompliance,
}

/// County data isolation configuration
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyIsolationConfig {
    pub county_id: Uuid,
    pub isolation_level: IsolationLevel,
    pub cross_county_sharing_enabled: bool,
    pub emergency_override_enabled: bool,
    pub data_residency_enforced: bool,
    pub compliance_frameworks: Vec<ComplianceLevel>,
    pub authorized_integrations: Vec<String>,
    pub restricted_operations: Vec<OperationType>,
    pub monitoring_enabled: bool,
    pub real_time_alerts: bool,
}

/// County isolation levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum IsolationLevel {
    Strict,        // Complete isolation, no cross-county access
    Controlled,    // Limited cross-county access with approval
    Cooperative,   // Shared access with audit trail
    Emergency,     // Temporary elevated access for emergencies
}

/// Government API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct GovernmentApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
    pub request_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub compliance_level: ComplianceLevel,
    pub audit_reference: Uuid,
    pub warnings: Vec<String>,
    pub security_context: SecurityResponseContext,
}

/// Security context in API responses
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SecurityResponseContext {
    pub classification: DataClassification,
    pub handling_instructions: Vec<String>,
    pub retention_period_days: u32,
    pub distribution_restrictions: Vec<String>,
    pub encryption_required: bool,
}

impl<T> GovernmentApiResponse<T> {
    /// Create successful government response
    pub fn success(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            message,
            request_id: Uuid::new_v4(),
            timestamp: Utc::now(),
            compliance_level: ComplianceLevel::FismaHigh,
            audit_reference: Uuid::new_v4(),
            warnings: vec![],
            security_context: SecurityResponseContext::default(),
        }
    }

    /// Create error government response
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message,
            request_id: Uuid::new_v4(),
            timestamp: Utc::now(),
            compliance_level: ComplianceLevel::FismaHigh,
            audit_reference: Uuid::new_v4(),
            warnings: vec![],
            security_context: SecurityResponseContext::default(),
        }
    }
}

impl Default for SecurityResponseContext {
    fn default() -> Self {
        Self {
            classification: DataClassification::ControlledUnclassified,
            handling_instructions: vec![
                "FOR OFFICIAL USE ONLY".to_string(),
                "HANDLE PER GOVERNMENT PROTOCOLS".to_string(),
            ],
            retention_period_days: 2555, // 7 years
            distribution_restrictions: vec![
                "COUNTY PERSONNEL ONLY".to_string(),
                "NO FOREIGN DISCLOSURE".to_string(),
            ],
            encryption_required: true,
        }
    }
}

/// Real-time county isolation status
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyIsolationStatus {
    pub county_id: Uuid,
    pub status: IsolationStatus,
    pub last_validation: DateTime<Utc>,
    pub active_sessions: u32,
    pub pending_requests: u32,
    pub violation_count_today: u32,
    pub compliance_score_current: f64,
    pub system_health: SystemHealthStatus,
    pub emergency_mode: bool,
}

/// Isolation status types
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum IsolationStatus {
    Operational,
    Degraded,
    Compromised,
    Emergency,
    Maintenance,
    Offline,
}

/// System health for county isolation
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum SystemHealthStatus {
    Healthy,
    Warning,
    Critical,
    Failure,
}

// Additional types required by validation and middleware systems

/// Authentication levels for government access
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum AuthenticationLevel {
    Basic,
    TwoFactor,
    MultiFactorAuthenticated,
    BiometricVerified,
    SmartCard,
    DigitalCertificate,
}

/// Security clearance levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum SecurityClearance {
    Public,
    Confidential,
    Secret,
    TopSecret,
    SCI, // Sensitive Compartmented Information
}

/// FISMA compliance levels
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum FismaLevel {
    Low,
    Moderate,
    High,
    HighPlus, // Enhanced government requirements
}

/// Validation violations for detailed reporting
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ValidationViolation {
    pub violation_type: ViolationType,
    pub severity: ViolationSeverity,
    pub description: String,
    pub detected_at: DateTime<Utc>,
}

// ViolationSeverity enum moved to earlier in file to avoid duplication

/// Validation warnings for informational purposes
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ValidationWarning {
    pub warning_type: String,
    pub message: String,
    pub detected_at: DateTime<Utc>,
}

/// Audit requirements for different operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum AuditRequirements {
    None,
    Basic,
    Standard,
    Full,
    Enhanced,
    Forensic,
}

/// Audit levels for different operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum AuditLevel {
    Minimal,
    Standard,
    Enhanced,
    Full,
    Comprehensive,
}

// SovereigntyViolation struct moved to earlier in file to avoid duplication

// AutomaticAction enum moved to earlier in file to avoid duplication

// Implementation methods for compatibility

// Additional types required by validation and middleware systems

/// Cross-county access permissions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum CrossCountyAccess {
    None,
    ReadOnly,
    Limited,
    Full,
}

/// Data sharing agreements between counties
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct DataSharingAgreement {
    pub agreement_id: Uuid,
    pub primary_county_id: Uuid,
    pub partner_county_id: Uuid,
    pub data_types: Vec<ResourceType>,
    pub access_level: PermissionType,
    pub effective_date: DateTime<Utc>,
    pub expiration_date: Option<DateTime<Utc>>,
    pub active: bool,
}

/// Compliance requirements for operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ComplianceRequirements {
    pub fisma_level: FismaLevel,
    pub audit_required: bool,
    pub encryption_required: bool,
    pub mfa_required: bool,
    pub approval_required: bool,
}

/// Emergency override permissions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct EmergencyOverrides {
    pub enabled: bool,
    pub authorized_users: Vec<Uuid>,
    pub override_levels: Vec<String>,
    pub expiration_time: Option<DateTime<Utc>>,
    pub reason_required: bool,
}

/// Role assignments for users
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RoleAssignment {
    pub role_id: Uuid,
    pub role_name: String,
    pub permissions: Vec<PermissionType>,
    pub county_scope: Option<Uuid>,
    pub assigned_at: DateTime<Utc>,
    pub assigned_by: Uuid,
}

/// County access specifications
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CountyAccess {
    pub county_id: Uuid,
    pub access_level: PermissionType,
    pub granted_at: DateTime<Utc>,
    pub granted_by: Uuid,
    pub expires_at: Option<DateTime<Utc>>,
}

/// Permission levels for resources
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum PermissionLevel {
    None,
    Read,
    Write,
    Delete,
    Admin,
    Owner,
}

/// Time-based restrictions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TimeRestrictions {
    pub allowed_hours: Vec<u8>, // 0-23
    pub allowed_days: Vec<u8>,  // 0-6 (Sunday=0)
    pub timezone: String,
    pub emergency_override: bool,
}

/// IP address restrictions
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct IpRestrictions {
    pub allowed_ranges: Vec<String>,
    pub blocked_ranges: Vec<String>,
    pub geo_restrictions: Vec<String>, // Country codes
    pub vpn_allowed: bool,
}

/// MFA requirements specification
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MfaRequirements {
    pub required: bool,
    pub methods: Vec<String>,
    pub frequency_hours: u64,
    pub backup_codes_allowed: bool,
}

/// Access control rules
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AccessRule {
    pub rule_id: Uuid,
    pub conditions: Vec<String>,
    pub actions: Vec<String>,
    pub priority: u32,
    pub active: bool,
}

/// Escalation paths for violations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct EscalationPath {
    pub path_id: Uuid,
    pub escalation_levels: Vec<Uuid>, // User IDs
    pub timeout_minutes: u32,
    pub auto_escalate: bool,
}

/// Anomaly detection patterns
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AnomalyPattern {
    pub pattern_id: Uuid,
    pub pattern_type: String,
    pub threshold: f64,
    pub window_minutes: u32,
    pub severity: ViolationSeverity,
}

/// Attack patterns for detection
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AttackPattern {
    pub pattern_id: Uuid,
    pub signature: String,
    pub indicators: Vec<String>,
    pub severity: ViolationSeverity,
    pub auto_block: bool,
}

/// Behavioral baseline tracking
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BehavioralBaseline {
    pub user_id: Uuid,
    pub baseline_data: std::collections::HashMap<String, f64>,
    pub established_at: DateTime<Utc>,
    pub confidence_level: f64,
}

// Implementation methods for compatibility

impl CountyAccessRequest {
    /// Get the primary operation for compatibility
    pub fn get_operation(&self) -> &OperationType {
        &self.operation_type
    }
}

impl IsolationValidationResult {
    /// Create a new validation result
    pub fn new(user_id: Uuid, county_id: Uuid) -> Self {
        let now = Utc::now();
        Self {
            validation_id: Uuid::new_v4(),
            county_id,
            allowed: true,
            reason: String::new(),
            compliance_level: ComplianceLevel::FismaHigh,
            security_score: 100.0,
            audit_trail_id: Uuid::new_v4(),
            timestamp: now,
            validation_duration_ms: 0,
            is_valid: true,
            user_id,
            resource_type: ResourceType::Property,
            operation_type: OperationType::Read,
            validation_timestamp: now,
            violations: Vec::new(),
            warnings: Vec::new(),
            required_approvals: Vec::new(),
            audit_requirements: AuditRequirements::Standard,
            escalation_required: false,
            emergency_override_used: false,
        }
    }

    /// Check if the validation was successful
    pub fn is_successful(&self) -> bool {
        self.is_valid && self.allowed
    }

    /// Get violation count
    pub fn violation_count(&self) -> usize {
        self.violations.len()
    }
}
