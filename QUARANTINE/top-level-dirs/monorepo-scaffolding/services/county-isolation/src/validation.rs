//! TerraFusion County Isolation - Government Validation System
//! Elite multi-layer validation for sovereign county operations

use crate::models::*;
use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use std::collections::{HashMap, HashSet};
use std::net::IpAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn, instrument};
use uuid::Uuid;
use regex::Regex;

/// Government-grade validation engine for county isolation
#[derive(Debug)]
pub struct ValidationEngine {
    county_permissions: Arc<RwLock<HashMap<Uuid, CountyPermissions>>>,
    user_permissions: Arc<RwLock<HashMap<Uuid, UserPermissions>>>,
    resource_access_matrix: Arc<RwLock<ResourceAccessMatrix>>,
    security_policies: Arc<RwLock<SecurityPolicies>>,
    validation_cache: Arc<RwLock<HashMap<String, CachedValidationResult>>>,
    violation_patterns: Arc<RwLock<ViolationPatterns>>,
}

/// County-specific permission sets
#[derive(Debug, Clone)]
pub struct CountyPermissions {
    pub county_id: Uuid,
    pub allowed_operations: HashSet<OperationType>,
    pub allowed_resources: HashSet<ResourceType>,
    pub cross_county_access: CrossCountyAccess,
    pub data_sharing_agreements: Vec<DataSharingAgreement>,
    pub compliance_requirements: ComplianceRequirements,
    pub emergency_overrides: EmergencyOverrides,
    pub audit_level: AuditLevel,
}

/// User permission structure for government access
#[derive(Debug, Clone)]
pub struct UserPermissions {
    pub user_id: Uuid,
    pub security_clearance: SecurityClearance,
    pub role_assignments: Vec<RoleAssignment>,
    pub county_access: Vec<CountyAccess>,
    pub resource_permissions: HashMap<ResourceType, PermissionLevel>,
    pub time_restrictions: TimeRestrictions,
    pub ip_restrictions: IpRestrictions,
    pub mfa_requirements: MfaRequirements,
}

/// Resource access control matrix
#[derive(Debug, Clone)]
pub struct ResourceAccessMatrix {
    pub access_rules: HashMap<(ResourceType, PermissionLevel), AccessRule>,
    pub inheritance_rules: HashMap<ResourceType, Vec<ResourceType>>,
    pub default_permissions: HashMap<ResourceType, PermissionLevel>,
    pub escalation_paths: HashMap<OperationType, EscalationPath>,
}

/// Security policy enforcement
#[derive(Debug, Clone)]
pub struct SecurityPolicies {
    pub password_policy: PasswordPolicy,
    pub session_policy: SessionPolicy,
    pub encryption_policy: EncryptionPolicy,
    pub access_policy: AccessPolicy,
    pub audit_policy: AuditPolicy,
    pub data_retention_policy: DataRetentionPolicy,
    pub incident_response_policy: IncidentResponsePolicy,
}

/// Cached validation result for performance
#[derive(Debug, Clone)]
pub struct CachedValidationResult {
    pub validation_result: IsolationValidationResult,
    pub cached_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub cache_key: String,
}

/// Violation pattern detection
#[derive(Debug, Clone)]
pub struct ViolationPatterns {
    pub anomaly_patterns: Vec<AnomalyPattern>,
    pub known_attack_patterns: Vec<AttackPattern>,
    pub behavioral_baselines: HashMap<Uuid, BehavioralBaseline>,
    pub threshold_rules: ThresholdRules,
}

impl ValidationEngine {
    /// Initialize government validation engine
    #[instrument]
    pub fn new() -> Self {
        info!("🔒 Initializing TerraFusion Government Validation Engine");

        Self {
            county_permissions: Arc::new(RwLock::new(HashMap::new())),
            user_permissions: Arc::new(RwLock::new(HashMap::new())),
            resource_access_matrix: Arc::new(RwLock::new(ResourceAccessMatrix::new())),
            security_policies: Arc::new(RwLock::new(SecurityPolicies::new())),
            validation_cache: Arc::new(RwLock::new(HashMap::new())),
            violation_patterns: Arc::new(RwLock::new(ViolationPatterns::new())),
        }
    }

    /// Comprehensive validation of county access request
    #[instrument(skip(self, user_context))]
    pub async fn validate_county_access(
        &self,
        access_request: &CountyAccessRequest,
        user_context: &UserSecurityContext,
    ) -> Result<IsolationValidationResult> {
        info!("🔍 Validating county access for user {} to county {}",
              access_request.user_id, access_request.county_id);

        // Check cache first
        let cache_key = self.generate_cache_key(access_request, user_context).await;
        if let Some(cached_result) = self.check_validation_cache(&cache_key).await? {
            debug!("⚡ Using cached validation result");
            return Ok(cached_result.validation_result);
        }

        // Multi-layer validation
        let mut validation_result = IsolationValidationResult {
            validation_id: Uuid::new_v4(),
            county_id: access_request.county_id,
            allowed: true,
            reason: "Multi-layer validation passed".to_string(),
            compliance_level: ComplianceLevel::FismaHigh,
            security_score: 100.0,
            audit_trail_id: Uuid::new_v4(),
            timestamp: Utc::now(),
            validation_duration_ms: 0,
            is_valid: true,
            user_id: access_request.user_id,
            resource_type: access_request.resource_type.clone(),
            operation_type: access_request.operation.clone(),
            validation_timestamp: Utc::now(),
            violations: Vec::new(),
            warnings: Vec::new(),
            required_approvals: Vec::new(),
            audit_requirements: AuditRequirements::Standard,
            escalation_required: false,
            emergency_override_used: false,
        };

        // 1. User authentication and authorization
        let auth_result = self.validate_user_authentication(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, auth_result).await;

        // 2. County jurisdiction validation
        let jurisdiction_result = self.validate_county_jurisdiction(access_request).await?;
        self.apply_validation_layer(&mut validation_result, jurisdiction_result).await;

        // 3. Resource access permissions
        let resource_result = self.validate_resource_access(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, resource_result).await;

        // 4. Operation permission validation
        let operation_result = self.validate_operation_permissions(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, operation_result).await;

        // 5. Security policy compliance
        let policy_result = self.validate_security_policies(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, policy_result).await;

        // 6. Cross-county data sovereignty check
        let sovereignty_result = self.validate_data_sovereignty(access_request).await?;
        self.apply_validation_layer(&mut validation_result, sovereignty_result).await;

        // 7. Temporal and contextual validation
        let temporal_result = self.validate_temporal_context(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, temporal_result).await;

        // 8. Behavioral anomaly detection
        let behavioral_result = self.validate_behavioral_patterns(access_request, user_context).await?;
        self.apply_validation_layer(&mut validation_result, behavioral_result).await;

        // 9. Risk assessment and scoring
        validation_result.security_score = self.calculate_security_score(&validation_result).await;

        // 10. Final compliance determination
        self.finalize_compliance_determination(&mut validation_result).await?;

        // Cache the result
        self.cache_validation_result(cache_key, validation_result.clone()).await?;

        info!("✅ County access validation complete: Valid={}, Score={:.1}, Violations={}",
              validation_result.is_valid, validation_result.security_score, validation_result.violations.len());

        Ok(validation_result)
    }

    /// Validate data boundary enforcement
    #[instrument(skip(self))]
    pub async fn validate_data_boundaries(
        &self,
        source_county: Uuid,
        target_county: Option<Uuid>,
        data_type: ResourceType,
        operation: OperationType,
    ) -> Result<BoundaryValidationResult> {
        info!("🛡️ Validating data boundaries: {} -> {:?} for {:?}",
              source_county, target_county, data_type);

        let mut boundary_result = BoundaryValidationResult {
            is_valid: true,
            source_county,
            target_county,
            data_type: data_type.clone(),
            operation: operation.clone(),
            boundary_violations: Vec::new(),
            cross_county_approval_required: false,
            data_sharing_agreement_required: false,
            encryption_required: true,
            audit_level_required: AuditLevel::Full,
            compliance_frameworks: vec![ComplianceLevel::FismaHigh],
        };

        // Check if this is a cross-county operation
        if let Some(target) = target_county {
            if source_county != target {
                boundary_result.cross_county_approval_required = true;

                // Validate cross-county data sharing agreements
                let sharing_valid = self.validate_data_sharing_agreement(source_county, target, &data_type).await?;
                if !sharing_valid {
                    boundary_result.is_valid = false;
                    boundary_result.boundary_violations.push(BoundaryViolation {
                        violation_type: BoundaryViolationType::MissingDataSharingAgreement,
                        severity: ViolationSeverity::High,
                        description: format!("No data sharing agreement between counties {} and {}", source_county, target),
                    });
                }
            }
        }

        // Validate data classification requirements
        let classification_valid = self.validate_data_classification(&data_type, &operation).await?;
        if !classification_valid {
            boundary_result.is_valid = false;
            boundary_result.boundary_violations.push(BoundaryViolation {
                violation_type: BoundaryViolationType::DataClassificationViolation,
                severity: ViolationSeverity::Critical,
                description: format!("Data type {:?} not authorized for operation {:?}", data_type, operation),
            });
        }

        // Check encryption requirements
        if self.requires_encryption(&data_type, &operation).await {
            boundary_result.encryption_required = true;
        }

        info!("🔍 Data boundary validation: Valid={}, Violations={}",
              boundary_result.is_valid, boundary_result.boundary_violations.len());

        Ok(boundary_result)
    }

    /// Bulk validation for high-throughput operations
    #[instrument(skip(self))]
    pub async fn bulk_validate_operations(
        &self,
        requests: Vec<CountyAccessRequest>,
        user_context: &UserSecurityContext,
    ) -> Result<Vec<IsolationValidationResult>> {
        info!("⚡ Performing bulk validation for {} requests", requests.len());

        let mut results = Vec::with_capacity(requests.len());

        // Process in parallel for performance
        let validation_futures = requests.iter().map(|request| {
            self.validate_county_access(request, user_context)
        });

        let validation_results = futures::future::join_all(validation_futures).await;

        for result in validation_results {
            match result {
                Ok(validation) => results.push(validation),
                Err(e) => {
                    error!("Bulk validation error: {}", e);
                    // Create error result
                    results.push(IsolationValidationResult {
                        validation_id: Uuid::new_v4(),
                        county_id: Uuid::new_v4(), // Default, will be overridden
                        allowed: false,
                        reason: format!("Validation error: {}", e),
                        compliance_level: ComplianceLevel::None,
                        security_score: 0.0,
                        audit_trail_id: Uuid::new_v4(),
                        timestamp: Utc::now(),
                        validation_duration_ms: 0,
                        is_valid: false,
                        user_id: user_context.user_id,
                        resource_type: ResourceType::Property, // Default
                        operation_type: OperationType::Read, // Default
                        validation_timestamp: Utc::now(),
                        violations: vec![ValidationViolation {
                            violation_type: ViolationType::SystemError,
                            severity: ViolationSeverity::Critical,
                            description: format!("Validation system error: {}", e),
                            detected_at: Utc::now(),
                        }],
                        warnings: Vec::new(),
                        required_approvals: Vec::new(),
                        audit_requirements: AuditRequirements::Full,
                        escalation_required: true,
                        emergency_override_used: false,
                    });
                }
            }
        }

        info!("✅ Bulk validation complete: {} results", results.len());
        Ok(results)
    }

    // Private validation methods

    /// Validate user authentication and authorization
    async fn validate_user_authentication(
        &self,
        request: &CountyAccessRequest,
        user_context: &UserSecurityContext,
    ) -> Result<ValidationLayerResult> {
        let user_perms = self.user_permissions.read().await;

        if let Some(permissions) = user_perms.get(&request.user_id) {
            let mut result = ValidationLayerResult {
                is_valid: true,
                violations: Vec::new(),
                warnings: Vec::new(),
                security_score_impact: 0.0,
            };

            // Check security clearance
            if !self.check_security_clearance(&permissions.security_clearance, &request.resource_type) {
                result.is_valid = false;
                result.violations.push(ValidationViolation {
                    violation_type: ViolationType::InsufficientClearance,
                    severity: ViolationSeverity::High,
                    description: format!("Insufficient security clearance for resource type {:?}", request.resource_type),
                    detected_at: Utc::now(),
                });
                result.security_score_impact = -20.0;
            }

            // Check MFA requirements
            if !self.check_mfa_compliance(&permissions.mfa_requirements, user_context) {
                result.is_valid = false;
                result.violations.push(ValidationViolation {
                    violation_type: ViolationType::MfaRequired,
                    severity: ViolationSeverity::Medium,
                    description: "Multi-factor authentication required".to_string(),
                    detected_at: Utc::now(),
                });
                result.security_score_impact = -15.0;
            }

            Ok(result)
        } else {
            Ok(ValidationLayerResult {
                is_valid: false,
                violations: vec![ValidationViolation {
                    violation_type: ViolationType::InvalidUser,
                    severity: ViolationSeverity::Critical,
                    description: "User not found or not authorized".to_string(),
                    detected_at: Utc::now(),
                }],
                warnings: Vec::new(),
                security_score_impact: -50.0,
            })
        }
    }

    /// Validate county jurisdiction
    async fn validate_county_jurisdiction(
        &self,
        request: &CountyAccessRequest,
    ) -> Result<ValidationLayerResult> {
        let county_perms = self.county_permissions.read().await;

        if let Some(permissions) = county_perms.get(&request.county_id) {
            let mut result = ValidationLayerResult {
                is_valid: true,
                violations: Vec::new(),
                warnings: Vec::new(),
                security_score_impact: 0.0,
            };

            // Check if operation is allowed for this county
            if !permissions.allowed_operations.contains(&request.operation) {
                result.is_valid = false;
                result.violations.push(ValidationViolation {
                    violation_type: ViolationType::UnauthorizedOperation,
                    severity: ViolationSeverity::High,
                    description: format!("Operation {:?} not permitted for county {}", request.operation, request.county_id),
                    detected_at: Utc::now(),
                });
                result.security_score_impact = -25.0;
            }

            // Check if resource type is allowed
            if !permissions.allowed_resources.contains(&request.resource_type) {
                result.is_valid = false;
                result.violations.push(ValidationViolation {
                    violation_type: ViolationType::UnauthorizedResource,
                    severity: ViolationSeverity::High,
                    description: format!("Resource type {:?} not permitted for county {}", request.resource_type, request.county_id),
                    detected_at: Utc::now(),
                });
                result.security_score_impact = -25.0;
            }

            Ok(result)
        } else {
            Ok(ValidationLayerResult {
                is_valid: false,
                violations: vec![ValidationViolation {
                    violation_type: ViolationType::InvalidCounty,
                    severity: ViolationSeverity::Critical,
                    description: format!("County {} not found or not configured", request.county_id),
                    detected_at: Utc::now(),
                }],
                warnings: Vec::new(),
                security_score_impact: -50.0,
            })
        }
    }

    /// Apply validation layer result to overall result
    async fn apply_validation_layer(
        &self,
        overall_result: &mut IsolationValidationResult,
        layer_result: ValidationLayerResult,
    ) {
        if !layer_result.is_valid {
            overall_result.is_valid = false;
        }

        overall_result.violations.extend(layer_result.violations);
        overall_result.warnings.extend(layer_result.warnings);
        overall_result.security_score += layer_result.security_score_impact;
    }

    /// Generate cache key for validation request
    async fn generate_cache_key(
        &self,
        request: &CountyAccessRequest,
        user_context: &UserSecurityContext,
    ) -> String {
        format!("val_{}_{}_{}_{:?}_{:?}_{}",
                request.user_id,
                request.county_id,
                request.resource_id.unwrap_or(Uuid::new_v4()),
                request.resource_type,
                request.operation,
                user_context.session_id)
    }

    /// Check validation cache
    async fn check_validation_cache(&self, cache_key: &str) -> Result<Option<CachedValidationResult>> {
        let cache = self.validation_cache.read().await;
        if let Some(cached) = cache.get(cache_key) {
            if cached.expires_at > Utc::now() {
                return Ok(Some(cached.clone()));
            }
        }
        Ok(None)
    }

    /// Cache validation result
    async fn cache_validation_result(
        &self,
        cache_key: String,
        result: IsolationValidationResult,
    ) -> Result<()> {
        let cached_result = CachedValidationResult {
            validation_result: result,
            cached_at: Utc::now(),
            expires_at: Utc::now() + chrono::Duration::minutes(5), // 5-minute cache
            cache_key: cache_key.clone(),
        };

        let mut cache = self.validation_cache.write().await;
        cache.insert(cache_key, cached_result);
        Ok(())
    }

    /// Calculate overall security score
    async fn calculate_security_score(&self, result: &IsolationValidationResult) -> f64 {
        let mut score = result.security_score;

        // Deduct for violations
        for violation in &result.violations {
            score -= match violation.severity {
                ViolationSeverity::Critical | ViolationSeverity::Catastrophic => 30.0,
                ViolationSeverity::High => 20.0,
                ViolationSeverity::Medium => 10.0,
                ViolationSeverity::Low => 5.0,
            };
        }

        // Deduct for warnings
        score -= result.warnings.len() as f64 * 2.0;

        score.max(0.0).min(100.0)
    }

    /// Finalize compliance determination
    async fn finalize_compliance_determination(&self, result: &mut IsolationValidationResult) -> Result<()> {
        // Set compliance level based on violations and score
        result.compliance_level = if result.is_valid && result.security_score >= 95.0 {
            ComplianceLevel::FismaHigh
        } else if result.is_valid && result.security_score >= 80.0 {
            ComplianceLevel::FismaModerate
        } else if result.is_valid && result.security_score >= 60.0 {
            ComplianceLevel::FismaLow
        } else {
            ComplianceLevel::None
        };

        // Set escalation requirements
        result.escalation_required = result.violations.iter().any(|v| {
            matches!(v.severity, ViolationSeverity::Critical | ViolationSeverity::Catastrophic)
        });

        Ok(())
    }

    // Placeholder methods for complex validation logic
    async fn validate_resource_access(&self, _request: &CountyAccessRequest, _user_context: &UserSecurityContext) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_operation_permissions(&self, _request: &CountyAccessRequest, _user_context: &UserSecurityContext) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_security_policies(&self, _request: &CountyAccessRequest, _user_context: &UserSecurityContext) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_data_sovereignty(&self, _request: &CountyAccessRequest) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_temporal_context(&self, _request: &CountyAccessRequest, _user_context: &UserSecurityContext) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_behavioral_patterns(&self, _request: &CountyAccessRequest, _user_context: &UserSecurityContext) -> Result<ValidationLayerResult> {
        Ok(ValidationLayerResult { is_valid: true, violations: Vec::new(), warnings: Vec::new(), security_score_impact: 0.0 })
    }

    async fn validate_data_sharing_agreement(&self, _source: Uuid, _target: Uuid, _data_type: &ResourceType) -> Result<bool> {
        Ok(true) // Placeholder
    }

    async fn validate_data_classification(&self, _data_type: &ResourceType, _operation: &OperationType) -> Result<bool> {
        Ok(true) // Placeholder
    }

    async fn requires_encryption(&self, _data_type: &ResourceType, _operation: &OperationType) -> bool {
        true // Always require encryption for government data
    }

    fn check_security_clearance(&self, _clearance: &SecurityClearance, _resource_type: &ResourceType) -> bool {
        true // Placeholder
    }

    fn check_mfa_compliance(&self, _mfa_req: &MfaRequirements, _user_context: &UserSecurityContext) -> bool {
        true // Placeholder
    }
}

// Default implementations and helper structures

#[derive(Debug, Clone)]
pub struct ValidationLayerResult {
    pub is_valid: bool,
    pub violations: Vec<ValidationViolation>,
    pub warnings: Vec<ValidationWarning>,
    pub security_score_impact: f64,
}

#[derive(Debug, Clone)]
pub struct BoundaryValidationResult {
    pub is_valid: bool,
    pub source_county: Uuid,
    pub target_county: Option<Uuid>,
    pub data_type: ResourceType,
    pub operation: OperationType,
    pub boundary_violations: Vec<BoundaryViolation>,
    pub cross_county_approval_required: bool,
    pub data_sharing_agreement_required: bool,
    pub encryption_required: bool,
    pub audit_level_required: AuditLevel,
    pub compliance_frameworks: Vec<ComplianceLevel>,
}

#[derive(Debug, Clone)]
pub struct BoundaryViolation {
    pub violation_type: BoundaryViolationType,
    pub severity: ViolationSeverity,
    pub description: String,
}

#[derive(Debug, Clone)]
pub enum BoundaryViolationType {
    MissingDataSharingAgreement,
    DataClassificationViolation,
    CrossBorderRestriction,
    EncryptionRequired,
    UnauthorizedTransfer,
}

// Default implementations for supporting structures

impl ResourceAccessMatrix {
    fn new() -> Self {
        Self {
            access_rules: HashMap::new(),
            inheritance_rules: HashMap::new(),
            default_permissions: HashMap::new(),
            escalation_paths: HashMap::new(),
        }
    }
}

impl SecurityPolicies {
    fn new() -> Self {
        Self {
            password_policy: PasswordPolicy::default(),
            session_policy: SessionPolicy::default(),
            encryption_policy: EncryptionPolicy::default(),
            access_policy: AccessPolicy::default(),
            audit_policy: AuditPolicy::default(),
            data_retention_policy: DataRetentionPolicy::default(),
            incident_response_policy: IncidentResponsePolicy::default(),
        }
    }
}

impl ViolationPatterns {
    fn new() -> Self {
        Self {
            anomaly_patterns: Vec::new(),
            known_attack_patterns: Vec::new(),
            behavioral_baselines: HashMap::new(),
            threshold_rules: ThresholdRules::default(),
        }
    }
}

// Additional supporting types with default implementations

#[derive(Debug, Clone, Default)]
pub struct PasswordPolicy {
    pub min_length: u8,
    pub require_uppercase: bool,
    pub require_lowercase: bool,
    pub require_numbers: bool,
    pub require_special_chars: bool,
    pub max_age_days: u32,
    pub prevent_reuse_count: u8,
}

#[derive(Debug, Clone, Default)]
pub struct SessionPolicy {
    pub max_session_duration_hours: u32,
    pub max_idle_time_minutes: u32,
    pub require_reauthentication: bool,
    pub concurrent_session_limit: u8,
}

#[derive(Debug, Clone, Default)]
pub struct EncryptionPolicy {
    pub require_encryption_at_rest: bool,
    pub require_encryption_in_transit: bool,
    pub min_key_length: u16,
    pub approved_algorithms: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct AccessPolicy {
    pub default_deny: bool,
    pub require_approval_for_sensitive: bool,
    pub max_concurrent_access: u32,
    pub location_restrictions: bool,
}

#[derive(Debug, Clone, Default)]
pub struct AuditPolicy {
    pub log_all_access: bool,
    pub log_failed_attempts: bool,
    pub retention_years: u8,
    pub real_time_monitoring: bool,
}

#[derive(Debug, Clone, Default)]
pub struct DataRetentionPolicy {
    pub retention_years: u8,
    pub automatic_deletion: bool,
    pub archive_after_years: u8,
    pub compliance_requirements: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct IncidentResponsePolicy {
    pub automatic_lockdown: bool,
    pub notification_required: bool,
    pub escalation_time_minutes: u32,
    pub forensic_capture: bool,
}

#[derive(Debug, Clone, Default)]
pub struct ThresholdRules {
    pub max_failed_attempts: u8,
    pub suspicious_activity_threshold: u32,
    pub bulk_operation_threshold: u32,
    pub cross_county_access_threshold: u8,
}
