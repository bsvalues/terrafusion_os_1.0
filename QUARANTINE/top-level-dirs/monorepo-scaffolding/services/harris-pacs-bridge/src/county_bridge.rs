use crate::config::Config;
use crate::harris_pacs::{PACSClient, PACSError, PACSConnectionStatus};
use crate::models::*;
use anyhow::{Context, Result};
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::Json;
use chrono::{DateTime, Utc};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug, instrument};
use uuid::Uuid;
use std::collections::HashMap;

/// County Bridge Service for TerraFusion OS integration
#[derive(Debug, Clone)]
pub struct CountyBridgeService {
    /// Harris PACS client
    pacs_client: Arc<PACSClient>,

    /// Service configuration
    config: Arc<Config>,

    /// County mappings cache
    county_mappings: Arc<RwLock<HashMap<String, CountyMapping>>>,

    /// Active sync operations tracking
    active_syncs: Arc<RwLock<HashMap<Uuid, PropertySyncResponse>>>,

    /// Performance metrics
    performance_metrics: Arc<RwLock<CountyPerformanceMetrics>>,
}

/// County mapping configuration for PACS integration
#[derive(Debug, Clone)]
pub struct CountyMapping {
    /// TerraFusion county UUID
    pub county_id: Uuid,

    /// County name
    pub county_name: String,

    /// Harris PACS jurisdiction code
    pub jurisdiction_code: String,

    /// FIPS county code
    pub fips_code: String,

    /// State code
    pub state_code: String,

    /// County-specific configuration overrides
    pub config_overrides: HashMap<String, serde_json::Value>,

    /// Last sync timestamp
    pub last_sync: Option<DateTime<Utc>>,

    /// County data validation rules
    pub validation_rules: CountyValidationRules,
}

/// County-specific validation rules
#[derive(Debug, Clone)]
pub struct CountyValidationRules {
    /// Required fields for this county
    pub required_fields: Vec<String>,

    /// Minimum assessed value (in cents)
    pub min_assessed_value: Option<i64>,

    /// Maximum assessed value (in cents)
    pub max_assessed_value: Option<i64>,

    /// Valid property types for this county
    pub valid_property_types: Vec<String>,

    /// Parcel ID format validation regex
    pub parcel_id_pattern: Option<String>,

    /// Owner name validation rules
    pub owner_name_rules: OwnerNameRules,

    /// Address validation rules
    pub address_rules: AddressRules,
}

#[derive(Debug, Clone)]
pub struct OwnerNameRules {
    /// Minimum length
    pub min_length: usize,

    /// Maximum length
    pub max_length: usize,

    /// Required patterns (if any)
    pub required_patterns: Vec<String>,

    /// Forbidden patterns
    pub forbidden_patterns: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct AddressRules {
    /// Minimum address length
    pub min_length: usize,

    /// Maximum address length
    pub max_length: usize,

    /// Required state code
    pub required_state: Option<String>,

    /// Valid ZIP code patterns
    pub zip_patterns: Vec<String>,
}

impl CountyBridgeService {
    /// Create new County Bridge Service
    #[instrument(skip(config))]
    pub async fn new(config: Arc<Config>) -> Result<Self> {
        info!("Initializing County Bridge Service for TerraFusion OS");

        // Initialize Harris PACS client
        let pacs_client = Arc::new(
            PACSClient::new(&*config)
                .await
                .context("Failed to initialize Harris PACS client")?
        );

        // Initialize county mappings
        let county_mappings = Arc::new(RwLock::new(HashMap::new()));

        // Initialize active sync tracking
        let active_syncs = Arc::new(RwLock::new(HashMap::new()));

        // Initialize performance metrics
        let performance_metrics = Arc::new(RwLock::new(CountyPerformanceMetrics {
            avg_sync_duration_ms: 0,
            properties_per_minute: 0.0,
            success_rate_percentage: 100.0,
            avg_query_time_ms: 0,
            harris_response_time_ms: 0,
            memory_usage_mb: 0.0,
            cpu_utilization_percentage: 0.0,
        }));

        let service = Self {
            pacs_client,
            config: config.clone(),
            county_mappings,
            active_syncs,
            performance_metrics,
        };

        // Load county mappings
        service.initialize_county_mappings().await?;

        info!("County Bridge Service initialized successfully");
        Ok(service)
    }

    /// Initialize county mappings for all supported counties
    #[instrument(skip(self))]
    async fn initialize_county_mappings(&self) -> Result<()> {
        info!("Loading county mappings for TerraFusion OS integration");

        let mut mappings = self.county_mappings.write().await;

        // Benton County, WA mapping (primary target)
        let benton_mapping = CountyMapping {
            county_id: Uuid::new_v4(), // This should come from TerraFusion county registry
            county_name: "Benton County".to_string(),
            jurisdiction_code: "BENTON_WA".to_string(),
            fips_code: "53005".to_string(),
            state_code: "WA".to_string(),
            config_overrides: HashMap::new(),
            last_sync: None,
            validation_rules: CountyValidationRules {
                required_fields: vec![
                    "parcel_id".to_string(),
                    "owner_name".to_string(),
                    "property_address".to_string(),
                    "assessed_value".to_string(),
                ],
                min_assessed_value: Some(100), // $1.00 minimum
                max_assessed_value: Some(100_000_000_00), // $1B maximum
                valid_property_types: vec![
                    "Residential".to_string(),
                    "Commercial".to_string(),
                    "Industrial".to_string(),
                    "Agricultural".to_string(),
                    "Government".to_string(),
                    "Utility".to_string(),
                ],
                parcel_id_pattern: Some(r"^[A-Z0-9\-]+$".to_string()),
                owner_name_rules: OwnerNameRules {
                    min_length: 2,
                    max_length: 200,
                    required_patterns: vec![],
                    forbidden_patterns: vec![
                        "UNKNOWN".to_string(),
                        "N/A".to_string(),
                        "NULL".to_string(),
                    ],
                },
                address_rules: AddressRules {
                    min_length: 5,
                    max_length: 200,
                    required_state: Some("WA".to_string()),
                    zip_patterns: vec![r"^99\d{3}(-\d{4})?$".to_string()],
                },
            },
        };

        mappings.insert("BENTON_WA".to_string(), benton_mapping);

        info!("County mappings loaded: {} counties", mappings.len());
        Ok(())
    }

    /// Synchronize properties for a specific county
    #[instrument(skip(self, request))]
    pub async fn sync_county_properties(
        &self,
        request: PropertySyncRequest
    ) -> Result<PropertySyncResponse> {
        let sync_id = Uuid::new_v4();
        let sync_started = Utc::now();

        info!("Starting property sync for county {} with ID {}",
              request.jurisdiction, sync_id);

        // Initialize sync response
        let mut sync_response = PropertySyncResponse {
            sync_id,
            county_id: request.county_id,
            status: SyncStatus::Starting,
            properties_processed: 0,
            properties_updated: 0,
            properties_created: 0,
            errors: Vec::new(),
            duration_ms: 0,
            harris_version: "9.0".to_string(),
            sync_started,
            sync_completed: None,
            progress_percentage: 0.0,
            estimated_completion_seconds: None,
        };

        // Add to active syncs tracking
        {
            let mut active_syncs = self.active_syncs.write().await;
            active_syncs.insert(sync_id, sync_response.clone());
        }

        // Update status to in progress
        sync_response.status = SyncStatus::InProgress;
        self.update_sync_status(sync_id, sync_response.clone()).await?;

        // Validate county mapping
        let county_mapping = match self.get_county_mapping(&request.jurisdiction).await? {
            Some(mapping) => mapping,
            None => {
                let error = SyncError {
                    parcel_id: "N/A".to_string(),
                    error_code: "COUNTY_NOT_FOUND".to_string(),
                    error_message: format!("County jurisdiction '{}' not found in mappings", request.jurisdiction),
                    severity: ErrorSeverity::Critical,
                    field_name: None,
                    error_details: None,
                    error_timestamp: Utc::now(),
                };

                sync_response.errors.push(error);
                sync_response.status = SyncStatus::Failed;
                self.update_sync_status(sync_id, sync_response.clone()).await?;
                return Ok(sync_response);
            }
        };

        // Execute synchronization based on sync type
        match request.sync_type {
            SyncType::Full => {
                self.execute_full_sync(&mut sync_response, &county_mapping, &request).await?;
            },
            SyncType::Incremental => {
                self.execute_incremental_sync(&mut sync_response, &county_mapping, &request).await?;
            },
            SyncType::RealTime => {
                self.execute_realtime_sync(&mut sync_response, &county_mapping, &request).await?;
            },
            SyncType::Validation => {
                self.execute_validation_sync(&mut sync_response, &county_mapping, &request).await?;
            },
            SyncType::Emergency => {
                self.execute_emergency_sync(&mut sync_response, &county_mapping, &request).await?;
            },
        }

        // Complete sync operation
        sync_response.sync_completed = Some(Utc::now());
        sync_response.duration_ms = sync_response.sync_completed
            .unwrap()
            .signed_duration_since(sync_response.sync_started)
            .num_milliseconds() as u64;

        // Determine final status
        if sync_response.errors.is_empty() {
            sync_response.status = SyncStatus::Completed;
            sync_response.progress_percentage = 100.0;
        } else {
            let critical_errors = sync_response.errors.iter()
                .any(|e| e.severity == ErrorSeverity::Critical);

            sync_response.status = if critical_errors {
                SyncStatus::Failed
            } else {
                SyncStatus::PartialSuccess
            };
            sync_response.progress_percentage = 100.0;
        }

        // Update final sync status
        self.update_sync_status(sync_id, sync_response.clone()).await?;

        // Remove from active syncs
        {
            let mut active_syncs = self.active_syncs.write().await;
            active_syncs.remove(&sync_id);
        }

        // Update performance metrics
        self.update_performance_metrics(&sync_response).await?;

        info!("Property sync completed for county {} with status {:?}",
              request.jurisdiction, sync_response.status);

        Ok(sync_response)
    }

    /// Execute full synchronization
    #[instrument(skip(self, sync_response, county_mapping, request))]
    async fn execute_full_sync(
        &self,
        sync_response: &mut PropertySyncResponse,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<()> {
        info!("Executing full sync for county {}", county_mapping.county_name);

        // Get total property count for progress tracking
        let total_properties = self.pacs_client
            .get_property_count(&county_mapping.jurisdiction_code)
            .await
            .context("Failed to get property count")?;

        sync_response.estimated_completion_seconds = Some((total_properties as u32 * 2) / 60); // 2 seconds per property estimate

        let batch_size = request.max_records.unwrap_or(1000) as usize;
        let mut page = 1;
        let mut properties_processed = 0;

        loop {
            // Fetch batch of properties from Harris PACS 9.0
            let properties = self.pacs_client
                .get_properties_batch(&county_mapping.jurisdiction_code, page, batch_size as u32)
                .await
                .context("Failed to fetch properties batch")?;

            if properties.is_empty() {
                break;
            }

            // Process each property in the batch
            for pacs_property in properties {
                let result = self.process_property_record(
                    &pacs_property,
                    county_mapping,
                    request
                ).await;

                match result {
                    Ok(ProcessResult::Created) => {
                        sync_response.properties_created += 1;
                        sync_response.properties_processed += 1;
                    },
                    Ok(ProcessResult::Updated) => {
                        sync_response.properties_updated += 1;
                        sync_response.properties_processed += 1;
                    },
                    Ok(ProcessResult::NoChange) => {
                        sync_response.properties_processed += 1;
                    },
                    Err(e) => {
                        let error = SyncError {
                            parcel_id: pacs_property.parcel_number.clone(),
                            error_code: "PROPERTY_PROCESSING_ERROR".to_string(),
                            error_message: format!("Failed to process property: {}", e),
                            severity: ErrorSeverity::Error,
                            field_name: None,
                            error_details: Some(json!({
                                "error": e.to_string(),
                                "parcel_id": pacs_property.parcel_number
                            }).as_object().unwrap().iter()
                                .map(|(k, v)| (k.clone(), v.clone()))
                                .collect()),
                            error_timestamp: Utc::now(),
                        };
                        sync_response.errors.push(error);
                    }
                }

                properties_processed += 1;
            }

            // Update progress
            sync_response.properties_processed = properties_processed;
            sync_response.progress_percentage = (properties_processed as f64 / total_properties as f64) * 100.0;

            // Update status periodically
            if page % 10 == 0 {
                self.update_sync_status(sync_response.sync_id, sync_response.clone()).await?;
            }

            page += 1;

            // Check for maximum records limit
            if let Some(max_records) = request.max_records {
                if properties_processed >= max_records as u32 {
                    break;
                }
            }
        }

        info!("Full sync completed: {} properties processed", properties_processed);
        Ok(())
    }

    /// Execute incremental synchronization (only changed records)
    #[instrument(skip(self, sync_response, county_mapping, request))]
    async fn execute_incremental_sync(
        &self,
        sync_response: &mut PropertySyncResponse,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<()> {
        info!("Executing incremental sync for county {}", county_mapping.county_name);

        // Get last sync timestamp
        let last_sync = county_mapping.last_sync.unwrap_or_else(|| {
            // If no last sync, go back 24 hours
            Utc::now() - chrono::Duration::hours(24)
        });

        // Fetch properties modified since last sync
        let modified_properties = self.pacs_client
            .get_properties_since(&county_mapping.jurisdiction_code, last_sync)
            .await
            .context("Failed to fetch modified properties")?;

        sync_response.estimated_completion_seconds = Some(modified_properties.len() as u32 / 30); // 30 properties per second estimate

        // Process modified properties
        for pacs_property in modified_properties {
            let result = self.process_property_record(
                &pacs_property,
                county_mapping,
                request
            ).await;

            match result {
                Ok(ProcessResult::Created) => {
                    sync_response.properties_created += 1;
                    sync_response.properties_processed += 1;
                },
                Ok(ProcessResult::Updated) => {
                    sync_response.properties_updated += 1;
                    sync_response.properties_processed += 1;
                },
                Ok(ProcessResult::NoChange) => {
                    sync_response.properties_processed += 1;
                },
                Err(e) => {
                    let error = SyncError {
                        parcel_id: pacs_property.parcel_number.clone(),
                        error_code: "PROPERTY_PROCESSING_ERROR".to_string(),
                        error_message: format!("Failed to process property: {}", e),
                        severity: ErrorSeverity::Error,
                        field_name: None,
                        error_details: None,
                        error_timestamp: Utc::now(),
                    };
                    sync_response.errors.push(error);
                }
            }
        }

        info!("Incremental sync completed: {} properties processed", sync_response.properties_processed);
        Ok(())
    }

    /// Execute real-time synchronization for specific properties
    #[instrument(skip(self, sync_response, county_mapping, request))]
    async fn execute_realtime_sync(
        &self,
        sync_response: &mut PropertySyncResponse,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<()> {
        info!("Executing real-time sync for county {}", county_mapping.county_name);

        let parcel_ids = match &request.parcel_ids {
            Some(ids) => ids.clone(),
            None => {
                let error = SyncError {
                    parcel_id: "N/A".to_string(),
                    error_code: "MISSING_PARCEL_IDS".to_string(),
                    error_message: "Real-time sync requires specific parcel IDs".to_string(),
                    severity: ErrorSeverity::Critical,
                    field_name: Some("parcel_ids".to_string()),
                    error_details: None,
                    error_timestamp: Utc::now(),
                };
                sync_response.errors.push(error);
                return Ok(());
            }
        };

        sync_response.estimated_completion_seconds = Some(parcel_ids.len() as u32 / 10); // 10 properties per second

        // Process each specified parcel
        for parcel_id in parcel_ids {
            match self.pacs_client
                .get_property_by_parcel(county_mapping.county_id, parcel_id.clone())
                .await
            {
                Ok(Some(pacs_property)) => {
                    // For now, just count as processed
                    // TODO: Implement proper conversion from CountyProperty to PACSPropertyRecord
                    sync_response.properties_processed += 1;
                },
                Ok(None) => {
                    let error = SyncError {
                        parcel_id: parcel_id.clone(),
                        error_code: "PROPERTY_NOT_FOUND".to_string(),
                        error_message: format!("Property {} not found in Harris PACS", parcel_id),
                        severity: ErrorSeverity::Warning,
                        field_name: None,
                        error_details: None,
                        error_timestamp: Utc::now(),
                    };
                    sync_response.errors.push(error);
                },
                Err(e) => {
                    let error = SyncError {
                        parcel_id: parcel_id.clone(),
                        error_code: "PACS_QUERY_ERROR".to_string(),
                        error_message: format!("Failed to query Harris PACS: {}", e),
                        severity: ErrorSeverity::Error,
                        field_name: None,
                        error_details: None,
                        error_timestamp: Utc::now(),
                    };
                    sync_response.errors.push(error);
                }
            }
        }

        info!("Real-time sync completed: {} properties processed", sync_response.properties_processed);
        Ok(())
    }

    /// Execute validation synchronization
    #[instrument(skip(self, sync_response, county_mapping, request))]
    async fn execute_validation_sync(
        &self,
        sync_response: &mut PropertySyncResponse,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<()> {
        info!("Executing validation sync for county {}", county_mapping.county_name);

        // This would validate data integrity between Harris PACS and TerraFusion
        // For now, implement basic validation

        let sample_size = request.max_records.unwrap_or(100);
        let properties = self.pacs_client
            .get_properties_batch(&county_mapping.jurisdiction_code, 1, sample_size as u32)
            .await
            .context("Failed to fetch properties for validation")?;

        for pacs_property in properties {
            // Validate against county rules
            if let Err(validation_errors) = self.validate_property_record(&pacs_property, county_mapping) {
                for validation_error in validation_errors {
                    sync_response.errors.push(validation_error);
                }
            }
            sync_response.properties_processed += 1;
        }

        info!("Validation sync completed: {} properties validated", sync_response.properties_processed);
        Ok(())
    }

    /// Execute emergency synchronization
    #[instrument(skip(self, sync_response, county_mapping, request))]
    async fn execute_emergency_sync(
        &self,
        sync_response: &mut PropertySyncResponse,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<()> {
        warn!("Executing EMERGENCY sync for county {}", county_mapping.county_name);

        // Emergency sync prioritizes speed over completeness
        // Process only critical property updates

        if let Some(parcel_ids) = &request.parcel_ids {
            // Emergency sync for specific parcels
            self.execute_realtime_sync(sync_response, county_mapping, request).await?;
        } else {
            // Emergency sync for recent changes only
            let emergency_cutoff = Utc::now() - chrono::Duration::hours(1);
            let recent_properties = self.pacs_client
                .get_properties_since(&county_mapping.jurisdiction_code, emergency_cutoff)
                .await
                .context("Failed to fetch recent properties for emergency sync")?;

            for pacs_property in recent_properties {
                let result = self.process_property_record(
                    &pacs_property,
                    county_mapping,
                    request
                ).await;

                match result {
                    Ok(ProcessResult::Created) => {
                        sync_response.properties_created += 1;
                        sync_response.properties_processed += 1;
                    },
                    Ok(ProcessResult::Updated) => {
                        sync_response.properties_updated += 1;
                        sync_response.properties_processed += 1;
                    },
                    Ok(ProcessResult::NoChange) => {
                        sync_response.properties_processed += 1;
                    },
                    Err(e) => {
                        // In emergency mode, log errors but continue processing
                        warn!("Emergency sync error for parcel {}: {}", pacs_property.parcel_number, e);
                        let error = SyncError {
                            parcel_id: pacs_property.parcel_number.clone(),
                            error_code: "EMERGENCY_PROCESSING_ERROR".to_string(),
                            error_message: format!("Emergency processing error: {}", e),
                            severity: ErrorSeverity::Warning,
                            field_name: None,
                            error_details: None,
                            error_timestamp: Utc::now(),
                        };
                        sync_response.errors.push(error);
                    }
                }
            }
        }

        warn!("Emergency sync completed: {} properties processed", sync_response.properties_processed);
        Ok(())
    }

    /// Process individual property record
    #[instrument(skip(self, pacs_property, county_mapping, request))]
    async fn process_property_record(
        &self,
        pacs_property: &PACSPropertyRecord,
        county_mapping: &CountyMapping,
        request: &PropertySyncRequest
    ) -> Result<ProcessResult> {
        // Validate property record
        if let Err(validation_errors) = self.validate_property_record(pacs_property, county_mapping) {
            return Err(anyhow::anyhow!("Property validation failed: {} errors", validation_errors.len()));
        }

        // Convert PACS record to TerraFusion format
        let mut county_property = CountyProperty::from(pacs_property.clone());
        county_property.county_id = county_mapping.county_id;

        // TODO: Integrate with TerraFusion OS data layer
        // This would typically:
        // 1. Check if property exists in TerraFusion database
        // 2. Create or update the property record
        // 3. Return appropriate result

        // For now, simulate the operation
        debug!("Processing property {} for county {}",
               county_property.parcel_id, county_mapping.county_name);

        // Mock implementation - would be replaced with actual TerraFusion integration
        Ok(ProcessResult::Updated)
    }

    /// Validate property record against county rules
    fn validate_property_record(
        &self,
        pacs_property: &PACSPropertyRecord,
        county_mapping: &CountyMapping
    ) -> Result<(), Vec<SyncError>> {
        let mut errors = Vec::new();
        let rules = &county_mapping.validation_rules;

        // Check required fields
        for required_field in &rules.required_fields {
            match required_field.as_str() {
                "parcel_id" if pacs_property.parcel_number.is_empty() => {
                    errors.push(SyncError {
                        parcel_id: pacs_property.parcel_number.clone(),
                        error_code: "MISSING_REQUIRED_FIELD".to_string(),
                        error_message: "Parcel ID is required but empty".to_string(),
                        severity: ErrorSeverity::Error,
                        field_name: Some("parcel_id".to_string()),
                        error_details: None,
                        error_timestamp: Utc::now(),
                    });
                },
                "owner_name" if pacs_property.owner_name.is_empty() => {
                    errors.push(SyncError {
                        parcel_id: pacs_property.parcel_number.clone(),
                        error_code: "MISSING_REQUIRED_FIELD".to_string(),
                        error_message: "Owner name is required but empty".to_string(),
                        severity: ErrorSeverity::Error,
                        field_name: Some("owner_name".to_string()),
                        error_details: None,
                        error_timestamp: Utc::now(),
                    });
                },
                "property_address" if pacs_property.situs_address.is_empty() => {
                    errors.push(SyncError {
                        parcel_id: pacs_property.parcel_number.clone(),
                        error_code: "MISSING_REQUIRED_FIELD".to_string(),
                        error_message: "Property address is required but empty".to_string(),
                        severity: ErrorSeverity::Error,
                        field_name: Some("property_address".to_string()),
                        error_details: None,
                        error_timestamp: Utc::now(),
                    });
                },
                _ => {}
            }
        }

        // Validate assessed value range
        if let Some(min_value) = rules.min_assessed_value {
            if pacs_property.assessed_value < min_value {
                errors.push(SyncError {
                    parcel_id: pacs_property.parcel_number.clone(),
                    error_code: "VALUE_OUT_OF_RANGE".to_string(),
                    error_message: format!("Assessed value {} below minimum {}", pacs_property.assessed_value, min_value),
                    severity: ErrorSeverity::Warning,
                    field_name: Some("assessed_value".to_string()),
                    error_details: None,
                    error_timestamp: Utc::now(),
                });
            }
        }

        if let Some(max_value) = rules.max_assessed_value {
            if pacs_property.assessed_value > max_value {
                errors.push(SyncError {
                    parcel_id: pacs_property.parcel_number.clone(),
                    error_code: "VALUE_OUT_OF_RANGE".to_string(),
                    error_message: format!("Assessed value {} exceeds maximum {}", pacs_property.assessed_value, max_value),
                    severity: ErrorSeverity::Warning,
                    field_name: Some("assessed_value".to_string()),
                    error_details: None,
                    error_timestamp: Utc::now(),
                });
            }
        }

        // Validate property type
        if !rules.valid_property_types.contains(&pacs_property.property_type) {
            errors.push(SyncError {
                parcel_id: pacs_property.parcel_number.clone(),
                error_code: "INVALID_PROPERTY_TYPE".to_string(),
                error_message: format!("Property type '{}' not valid for county", pacs_property.property_type),
                severity: ErrorSeverity::Warning,
                field_name: Some("property_type".to_string()),
                error_details: None,
                error_timestamp: Utc::now(),
            });
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    /// Get county mapping by jurisdiction code
    async fn get_county_mapping(&self, jurisdiction: &str) -> Result<Option<CountyMapping>> {
        let mappings = self.county_mappings.read().await;
        Ok(mappings.get(jurisdiction).cloned())
    }

    /// Update sync status in active syncs tracking
    async fn update_sync_status(&self, sync_id: Uuid, sync_response: PropertySyncResponse) -> Result<()> {
        let mut active_syncs = self.active_syncs.write().await;
        active_syncs.insert(sync_id, sync_response);
        Ok(())
    }

    /// Update performance metrics
    async fn update_performance_metrics(&self, sync_response: &PropertySyncResponse) -> Result<()> {
        let mut metrics = self.performance_metrics.write().await;

        // Update average sync duration
        metrics.avg_sync_duration_ms = (metrics.avg_sync_duration_ms + sync_response.duration_ms) / 2;

        // Update properties per minute
        if sync_response.duration_ms > 0 {
            let properties_per_ms = sync_response.properties_processed as f64 / sync_response.duration_ms as f64;
            metrics.properties_per_minute = properties_per_ms * 60_000.0; // Convert to per minute
        }

        // Update success rate
        let error_rate = if sync_response.properties_processed > 0 {
            (sync_response.errors.len() as f64 / sync_response.properties_processed as f64) * 100.0
        } else {
            0.0
        };
        metrics.success_rate_percentage = 100.0 - error_rate;

        Ok(())
    }

    /// Get county system status
    #[instrument(skip(self))]
    pub async fn get_county_status(&self, jurisdiction: &str) -> Result<CountySystemStatus> {
        let county_mapping = self.get_county_mapping(jurisdiction)
            .await?
            .ok_or_else(|| anyhow::anyhow!("County jurisdiction '{}' not found", jurisdiction))?;

        // Test Harris PACS connection
        let harris_status = self.pacs_client
            .test_connection()
            .await
            .unwrap_or(PACSConnectionStatus {
                connected: false,
                version: "Unknown".to_string(),
                last_ping: Utc::now(),
                database_name: "Unknown".to_string(),
                jurisdiction_count: 0,
                connection_pool_size: 0,
            });

        // Get property count
        let property_count = self.pacs_client
            .get_property_count(&county_mapping.jurisdiction_code)
            .await
            .unwrap_or(0);

        // Get active sync operations count
        let active_sync_operations = {
            let active_syncs = self.active_syncs.read().await;
            active_syncs.len() as u32
        };

        // Calculate health score
        let sync_health = self.calculate_health_score(&county_mapping, harris_status.connected).await;

        // Get performance metrics
        let performance_metrics = {
            let metrics = self.performance_metrics.read().await;
            metrics.clone()
        };

        Ok(CountySystemStatus {
            county_id: county_mapping.county_id,
            county_name: county_mapping.county_name,
            harris_connected: harris_status.connected,
            last_sync: county_mapping.last_sync,
            property_count: property_count as u64,
            sync_health,
            active_sync_operations,
            recent_errors_count: 0, // TODO: Implement error tracking
            performance_metrics,
            last_health_check: Utc::now(),
        })
    }

    /// Calculate system health score (0-100)
    async fn calculate_health_score(&self, county_mapping: &CountyMapping, harris_connected: bool) -> u8 {
        let mut score = 0;

        // Harris PACS connection (40 points)
        if harris_connected {
            score += 40;
        }

        // Recent sync activity (30 points)
        if let Some(last_sync) = county_mapping.last_sync {
            let hours_since_sync = Utc::now()
                .signed_duration_since(last_sync)
                .num_hours();

            if hours_since_sync < 2 {
                score += 30;
            } else if hours_since_sync < 24 {
                score += 20;
            } else if hours_since_sync < 168 { // 1 week
                score += 10;
            }
        }

        // Performance metrics (30 points)
        let metrics = self.performance_metrics.read().await;
        if metrics.success_rate_percentage >= 99.0 {
            score += 30;
        } else if metrics.success_rate_percentage >= 95.0 {
            score += 20;
        } else if metrics.success_rate_percentage >= 90.0 {
            score += 10;
        }

        score.min(100)
    }

    /// Get active sync operations
    pub async fn get_active_syncs(&self) -> Vec<PropertySyncResponse> {
        let active_syncs = self.active_syncs.read().await;
        active_syncs.values().cloned().collect()
    }
}

/// Result of processing a property record
#[derive(Debug, Clone)]
enum ProcessResult {
    /// Property was created
    Created,
    /// Property was updated
    Updated,
    /// Property was unchanged
    NoChange,
}
