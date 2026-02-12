use crate::config::Config;
use crate::models::*;
use crate::county_bridge::{CountyBridgeService};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::{RwLock, Semaphore, mpsc};
use tokio::time::{interval, Duration, timeout};
use tracing::{info, warn, error, debug, instrument};
use uuid::Uuid;
use std::collections::{HashMap, VecDeque};

/// Property Synchronization Service for real-time county data management
#[derive(Debug)]
pub struct PropertySyncService {
    /// County bridge service for Harris PACS integration
    county_bridge: Arc<CountyBridgeService>,

    /// Service configuration
    config: Arc<Config>,

    /// Sync queue for managing synchronization requests
    sync_queue: Arc<RwLock<VecDeque<PropertySyncRequest>>>,

    /// Sync history for tracking completed operations
    sync_history: Arc<RwLock<VecDeque<PropertySyncResponse>>>,

    /// Active sync tracking
    active_syncs: Arc<RwLock<HashMap<Uuid, PropertySyncResponse>>>,

    /// Semaphore for concurrent sync operations
    sync_semaphore: Arc<Semaphore>,

    /// Sync scheduler for automatic synchronization
    scheduler_handle: Arc<RwLock<Option<tokio::task::JoinHandle<()>>>>,

    /// Performance statistics
    performance_stats: Arc<RwLock<SyncPerformanceStats>>,
}

/// Synchronization performance statistics
#[derive(Debug, Clone)]
pub struct SyncPerformanceStats {
    /// Total sync operations completed
    pub total_sync_operations: u64,

    /// Total properties processed
    pub total_properties_processed: u64,

    /// Total errors encountered
    pub total_errors: u64,

    /// Average sync duration in milliseconds
    pub avg_sync_duration_ms: u64,

    /// Fastest sync duration in milliseconds
    pub fastest_sync_ms: u64,

    /// Slowest sync duration in milliseconds
    pub slowest_sync_ms: u64,

    /// Success rate percentage (0-100)
    pub success_rate_percentage: f64,

    /// Properties per second throughput
    pub properties_per_second: f64,

    /// Last statistics update timestamp
    pub last_updated: DateTime<Utc>,
}

/// Sync scheduler configuration
#[derive(Debug, Clone)]
pub struct SyncSchedulerConfig {
    /// Enable automatic scheduling
    pub enabled: bool,

    /// Interval between automatic syncs in minutes
    pub interval_minutes: u32,

    /// Counties to include in automatic sync
    pub counties: Vec<String>,

    /// Default sync type for scheduled syncs
    pub default_sync_type: SyncType,

    /// Maximum concurrent automatic syncs
    pub max_concurrent_syncs: u32,

    /// Sync priority for scheduled operations
    pub priority: SyncPriority,

    /// Include tax data in scheduled syncs
    pub include_tax_data: bool,

    /// Include sales data in scheduled syncs
    pub include_sales_data: bool,

    /// Quiet hours (no automatic syncs)
    pub quiet_hours: Option<QuietHours>,
}

/// Quiet hours configuration
#[derive(Debug, Clone)]
pub struct QuietHours {
    /// Start hour (0-23)
    pub start_hour: u8,

    /// End hour (0-23)
    pub end_hour: u8,

    /// Days of week to apply (0=Sunday, 6=Saturday)
    pub days_of_week: Vec<u8>,
}

impl PropertySyncService {
    /// Create new Property Sync Service
    #[instrument(skip(county_bridge, config))]
    pub async fn new(
        county_bridge: Arc<CountyBridgeService>,
        config: Arc<Config>
    ) -> Result<Self> {
        info!("Initializing Property Sync Service for TerraFusion OS");

        // Initialize sync queue with capacity
        let sync_queue = Arc::new(RwLock::new(VecDeque::with_capacity(1000)));

        // Initialize sync history with capacity limit
        let sync_history = Arc::new(RwLock::new(VecDeque::with_capacity(10000)));

        // Initialize active syncs tracking
        let active_syncs = Arc::new(RwLock::new(HashMap::new()));

        // Create semaphore for concurrent sync operations
        let max_concurrent = config.sync.max_concurrent_syncs as usize;
        let sync_semaphore = Arc::new(Semaphore::new(max_concurrent));

        // Initialize scheduler handle
        let scheduler_handle = Arc::new(RwLock::new(None));

        // Initialize performance statistics
        let performance_stats = Arc::new(RwLock::new(SyncPerformanceStats {
            total_sync_operations: 0,
            total_properties_processed: 0,
            total_errors: 0,
            avg_sync_duration_ms: 0,
            fastest_sync_ms: u64::MAX,
            slowest_sync_ms: 0,
            success_rate_percentage: 100.0,
            properties_per_second: 0.0,
            last_updated: Utc::now(),
        }));

        let service = Self {
            county_bridge,
            config,
            sync_queue,
            sync_history,
            active_syncs,
            sync_semaphore,
            scheduler_handle,
            performance_stats,
        };

        info!("Property Sync Service initialized successfully");
        Ok(service)
    }

    /// Start the synchronization service
    #[instrument(skip(self))]
    pub async fn start(&self) -> Result<()> {
        info!("Starting Property Sync Service");

        // Start sync worker
        self.start_sync_worker().await?;

        // Start scheduler if enabled
        if self.config.counties.get("benton").map_or(false, |c| c.sync_enabled) {
            self.start_scheduler().await?;
        }

        info!("Property Sync Service started successfully");
        Ok(())
    }

    /// Stop the synchronization service
    #[instrument(skip(self))]
    pub async fn stop(&self) -> Result<()> {
        info!("Stopping Property Sync Service");

        // Stop scheduler
        self.stop_scheduler().await?;

        // Cancel all active syncs
        self.cancel_all_active_syncs().await?;

        info!("Property Sync Service stopped");
        Ok(())
    }

    /// Queue a synchronization request
    #[instrument(skip(self, request))]
    pub async fn queue_sync(&self, request: PropertySyncRequest) -> Result<Uuid> {
        let sync_id = Uuid::new_v4();

        debug!("Queuing sync request {} for county {}", sync_id, request.jurisdiction);

        // Validate request
        self.validate_sync_request(&request).await?;

        // Add to queue
        {
            let mut queue = self.sync_queue.write().await;
            queue.push_back(request);
        }

        info!("Sync request {} queued successfully", sync_id);
        Ok(sync_id)
    }

    /// Execute synchronization immediately
    #[instrument(skip(self, request))]
    pub async fn execute_sync(&self, request: PropertySyncRequest) -> Result<PropertySyncResponse> {
        let sync_id = Uuid::new_v4();

        info!("Executing immediate sync {} for county {}", sync_id, request.jurisdiction);

        // Acquire semaphore permit
        let permit = self.sync_semaphore.acquire().await
            .context("Failed to acquire sync permit")?;

        // Execute sync with timeout
        let timeout_duration = Duration::from_secs(
            self.config.harris.timeout_seconds as u64
        );

        let sync_result = timeout(
            timeout_duration,
            self.execute_sync_operation(request)
        ).await;

        // Release permit
        drop(permit);

        match sync_result {
            Ok(Ok(response)) => {
                // Update performance statistics
                self.update_performance_stats(&response).await?;

                // Add to history
                self.add_to_history(response.clone()).await?;

                info!("Sync {} completed successfully", response.sync_id);
                Ok(response)
            },
            Ok(Err(e)) => {
                error!("Sync {} failed: {}", sync_id, e);
                Err(e)
            },
            Err(_) => {
                error!("Sync {} timed out", sync_id);
                Err(anyhow::anyhow!("Sync operation timed out"))
            }
        }
    }

    /// Execute batch synchronization
    pub async fn execute_batch_sync(&self, request: BatchSyncRequest) -> Result<BatchSyncResponse> {
        let batch_id = Uuid::new_v4();
        let batch_started = Utc::now();

        info!("Starting batch sync {} for {} counties", batch_id, request.counties.len());

        let mut county_results = Vec::new();
        let mut counties_completed = 0;
        let mut counties_failed = 0;

        // Determine concurrency level
        let max_concurrent = request.max_concurrent_syncs
            .unwrap_or(self.config.sync.max_concurrent_syncs) as usize;

        let semaphore = Semaphore::new(max_concurrent);
        let mut tasks = Vec::new();

        // Create sync tasks for each county
        let total_counties = request.counties.len() as u32;

        for county in request.counties {
            let permit = Arc::clone(&self.sync_semaphore).acquire_owned().await?;
            let county = county.clone();
            let county_bridge = Arc::clone(&self.county_bridge);
            let sync_type = request.sync_type.clone();
            let priority = request.priority.clone();
            let stop_on_error = request.stop_on_error;

            let task = tokio::spawn(async move {
                let _permit = permit; // Keep permit until task completes

                let sync_request = PropertySyncRequest {
                    county_id: Uuid::new_v4(), // This should be looked up properly
                    jurisdiction: county.clone(),
                    parcel_ids: None,
                    sync_type,
                    priority,
                    include_tax_data: true,
                    include_sales_data: true,
                    include_assessment_history: false,
                    force_resync: false,
                    max_records: None,
                };

                let start_time = Utc::now();
                let result = county_bridge.sync_county_properties(sync_request).await;
                let duration_ms = Utc::now()
                    .signed_duration_since(start_time)
                    .num_milliseconds() as u64;

                match result {
                    Ok(response) => {
                        let status = response.status.clone();
                        CountySyncResult {
                            county_id: county,
                            status,
                            sync_response: Some(response),
                            errors: Vec::new(),
                            duration_ms,
                        }
                    },
                    Err(e) => CountySyncResult {
                        county_id: county,
                        status: SyncStatus::Failed,
                        sync_response: None,
                        errors: vec![e.to_string()],
                        duration_ms,
                    },
                }
            });

            tasks.push(task);
        }

        // Wait for all tasks to complete
        for task in tasks {
            match task.await {
                Ok(result) => {
                    if result.status == SyncStatus::Completed {
                        counties_completed += 1;
                    } else {
                        counties_failed += 1;

                        // Stop on error if requested
                        if request.stop_on_error {
                            warn!("Stopping batch sync {} due to error in county {}", batch_id, result.county_id);
                            break;
                        }
                    }
                    county_results.push(result);
                },
                Err(e) => {
                    error!("Batch sync task failed: {}", e);
                    counties_failed += 1;

                    if request.stop_on_error {
                        break;
                    }
                }
            }
        }

        let batch_completed = Utc::now();
        let total_duration_ms = batch_completed
            .signed_duration_since(batch_started)
            .num_milliseconds() as u64;

        // Determine batch status
        let batch_status = if counties_failed == 0 {
            SyncStatus::Completed
        } else if counties_completed > 0 {
            SyncStatus::PartialSuccess
        } else {
            SyncStatus::Failed
        };

        let response = BatchSyncResponse {
            batch_id,
            total_counties,
            counties_completed,
            counties_failed,
            batch_status,
            county_results,
            batch_started,
            batch_completed: Some(batch_completed),
            total_duration_ms,
        };

        info!("Batch sync {} completed: {} succeeded, {} failed",
               batch_id, counties_completed, counties_failed);

        Ok(response)
    }

    /// Get sync queue status
    pub async fn get_queue_status(&self) -> Result<SyncQueueStatus> {
        let queue = self.sync_queue.read().await;
        let active_syncs = self.active_syncs.read().await;
        let performance_stats = self.performance_stats.read().await;

        Ok(SyncQueueStatus {
            queued_requests: queue.len() as u32,
            active_syncs: active_syncs.len() as u32,
            max_concurrent_syncs: self.sync_semaphore.available_permits() as u32,
            total_completed: performance_stats.total_sync_operations,
            avg_duration_ms: performance_stats.avg_sync_duration_ms,
            success_rate: performance_stats.success_rate_percentage,
        })
    }

    /// Get sync history
    pub async fn get_sync_history(&self, limit: Option<usize>) -> Result<Vec<PropertySyncResponse>> {
        let history = self.sync_history.read().await;
        let limit = limit.unwrap_or(100);

        Ok(history.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect())
    }

    /// Get performance statistics
    pub async fn get_performance_stats(&self) -> Result<SyncPerformanceStats> {
        let stats = self.performance_stats.read().await;
        Ok(stats.clone())
    }

    /// Start sync worker
    #[instrument(skip(self))]
    async fn start_sync_worker(&self) -> Result<()> {
        let sync_queue = Arc::clone(&self.sync_queue);
        let county_bridge = Arc::clone(&self.county_bridge);
        let semaphore = Arc::clone(&self.sync_semaphore);
        let performance_stats = Arc::clone(&self.performance_stats);
        let sync_history = Arc::clone(&self.sync_history);

        tokio::spawn(async move {
            info!("Sync worker started");

            loop {
                // Check for queued requests
                let request = {
                    let mut queue = sync_queue.write().await;
                    queue.pop_front()
                };

                if let Some(request) = request {
                    // Acquire permit
                      if let Ok(permit) = Arc::clone(&semaphore).acquire_owned().await {
                        let county_bridge_clone = Arc::clone(&county_bridge);
                        let performance_stats_clone = Arc::clone(&performance_stats);
                        let sync_history_clone = Arc::clone(&sync_history);

                        tokio::spawn(async move {
                            let _permit = permit; // Keep permit until completion

                            match county_bridge_clone.sync_county_properties(request).await {
                                Ok(response) => {
                                    // Update performance stats
                                    if let Err(e) = update_performance_stats_task(
                                        &performance_stats_clone,
                                        &response
                                    ).await {
                                        error!("Failed to update performance stats: {}", e);
                                    }

                                    // Add to history
                                    if let Err(e) = add_to_history_task(
                                        &sync_history_clone,
                                        response
                                    ).await {
                                        error!("Failed to add sync to history: {}", e);
                                    }
                                },
                                Err(e) => {
                                    error!("Sync worker failed to process request: {}", e);
                                }
                            }
                        });
                    }
                } else {
                    // No queued requests, sleep briefly
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }
        });

        Ok(())
    }

    /// Start scheduler for automatic syncs
    #[instrument(skip(self))]
    async fn start_scheduler(&self) -> Result<()> {
        let config = Arc::clone(&self.config);
        let county_bridge = Arc::clone(&self.county_bridge);

        let mut scheduler_handle = self.scheduler_handle.write().await;

        if scheduler_handle.is_some() {
            warn!("Scheduler already running");
            return Ok(());
        }

        let handle = tokio::spawn(async move {
            info!("Sync scheduler started");

            let interval_duration = Duration::from_secs(
                (config.counties.get("benton")
                    .map(|c| c.sync_interval_minutes)
                    .unwrap_or(60) * 60) as u64
            );

            let mut interval_timer = interval(interval_duration);

            loop {
                interval_timer.tick().await;

                // Check if we're in quiet hours
                if is_quiet_hours(&config).await {
                    debug!("Skipping scheduled sync - in quiet hours");
                    continue;
                }

                info!("Executing scheduled sync");

                // Create sync request for Benton County
                let sync_request = PropertySyncRequest {
                    county_id: Uuid::new_v4(), // This should be the actual Benton County UUID
                    jurisdiction: "BENTON_WA".to_string(),
                    parcel_ids: None,
                    sync_type: SyncType::Incremental,
                    priority: SyncPriority::Normal,
                    include_tax_data: true,
                    include_sales_data: false,
                    include_assessment_history: false,
                    force_resync: false,
                    max_records: None,
                };

                match county_bridge.sync_county_properties(sync_request).await {
                    Ok(response) => {
                        info!("Scheduled sync completed: {} properties processed",
                               response.properties_processed);
                    },
                    Err(e) => {
                        error!("Scheduled sync failed: {}", e);
                    }
                }
            }
        });

        *scheduler_handle = Some(handle);

        info!("Sync scheduler started successfully");
        Ok(())
    }

    /// Stop scheduler
    async fn stop_scheduler(&self) -> Result<()> {
        let mut scheduler_handle = self.scheduler_handle.write().await;

        if let Some(handle) = scheduler_handle.take() {
            handle.abort();
            info!("Scheduler stopped");
        }

        Ok(())
    }

    /// Cancel all active syncs
    async fn cancel_all_active_syncs(&self) -> Result<()> {
        let mut active_syncs = self.active_syncs.write().await;

        for (sync_id, mut response) in active_syncs.drain() {
            response.status = SyncStatus::Cancelled;
            response.sync_completed = Some(Utc::now());

            warn!("Cancelled sync operation {}", sync_id);
        }

        Ok(())
    }

    /// Execute sync operation
    async fn execute_sync_operation(&self, request: PropertySyncRequest) -> Result<PropertySyncResponse> {
        self.county_bridge.sync_county_properties(request).await
    }

    /// Validate sync request
    async fn validate_sync_request(&self, request: &PropertySyncRequest) -> Result<()> {
        // Validate jurisdiction
        if request.jurisdiction.is_empty() {
            return Err(anyhow::anyhow!("Jurisdiction cannot be empty"));
        }

        // Validate max records
        if let Some(max_records) = request.max_records {
            if max_records > 1_000_000 {
                return Err(anyhow::anyhow!("Max records cannot exceed 1,000,000"));
            }
        }

        // Validate parcel IDs for real-time sync
        if request.sync_type == SyncType::RealTime && request.parcel_ids.is_none() {
            return Err(anyhow::anyhow!("Real-time sync requires specific parcel IDs"));
        }

        Ok(())
    }

    /// Update performance statistics
    async fn update_performance_stats(&self, response: &PropertySyncResponse) -> Result<()> {
        let mut stats = self.performance_stats.write().await;

        stats.total_sync_operations += 1;
        stats.total_properties_processed += response.properties_processed as u64;
        stats.total_errors += response.errors.len() as u64;

        // Update duration statistics
        if response.duration_ms < stats.fastest_sync_ms {
            stats.fastest_sync_ms = response.duration_ms;
        }
        if response.duration_ms > stats.slowest_sync_ms {
            stats.slowest_sync_ms = response.duration_ms;
        }

        // Update average duration
        stats.avg_sync_duration_ms = (stats.avg_sync_duration_ms + response.duration_ms) / 2;

        // Update success rate
        if stats.total_sync_operations > 0 {
            let error_rate = (stats.total_errors as f64 / stats.total_sync_operations as f64) * 100.0;
            stats.success_rate_percentage = 100.0 - error_rate;
        }

        // Update throughput
        if response.duration_ms > 0 {
            let seconds = response.duration_ms as f64 / 1000.0;
            let properties_per_second = response.properties_processed as f64 / seconds;
            stats.properties_per_second = (stats.properties_per_second + properties_per_second) / 2.0;
        }

        stats.last_updated = Utc::now();

        Ok(())
    }

    /// Add sync response to history
    async fn add_to_history(&self, response: PropertySyncResponse) -> Result<()> {
        let mut history = self.sync_history.write().await;

        // Add to history
        history.push_back(response);

        // Trim history if it exceeds capacity
        while history.len() > 10000 {
            history.pop_front();
        }

        Ok(())
    }
}

/// Sync queue status information
#[derive(Debug, Clone, serde::Serialize, utoipa::ToSchema)]
pub struct SyncQueueStatus {
    /// Number of queued sync requests
    pub queued_requests: u32,

    /// Number of active sync operations
    pub active_syncs: u32,

    /// Maximum concurrent sync operations
    pub max_concurrent_syncs: u32,

    /// Total completed sync operations
    pub total_completed: u64,

    /// Average sync duration in milliseconds
    pub avg_duration_ms: u64,

    /// Success rate percentage (0-100)
    pub success_rate: f64,
}

/// Helper function to update performance stats in task
async fn update_performance_stats_task(
    performance_stats: &Arc<RwLock<SyncPerformanceStats>>,
    response: &PropertySyncResponse
) -> Result<()> {
    let mut stats = performance_stats.write().await;

    stats.total_sync_operations += 1;
    stats.total_properties_processed += response.properties_processed as u64;
    stats.total_errors += response.errors.len() as u64;

    // Update duration statistics
    if response.duration_ms < stats.fastest_sync_ms {
        stats.fastest_sync_ms = response.duration_ms;
    }
    if response.duration_ms > stats.slowest_sync_ms {
        stats.slowest_sync_ms = response.duration_ms;
    }

    stats.avg_sync_duration_ms = (stats.avg_sync_duration_ms + response.duration_ms) / 2;

    // Update success rate
    if stats.total_sync_operations > 0 {
        let error_rate = (stats.total_errors as f64 / stats.total_sync_operations as f64) * 100.0;
        stats.success_rate_percentage = 100.0 - error_rate;
    }

    // Update throughput
    if response.duration_ms > 0 {
        let seconds = response.duration_ms as f64 / 1000.0;
        let properties_per_second = response.properties_processed as f64 / seconds;
        stats.properties_per_second = (stats.properties_per_second + properties_per_second) / 2.0;
    }

    stats.last_updated = Utc::now();

    Ok(())
}

/// Helper function to add to history in task
async fn add_to_history_task(
    sync_history: &Arc<RwLock<VecDeque<PropertySyncResponse>>>,
    response: PropertySyncResponse
) -> Result<()> {
    let mut history = sync_history.write().await;

    history.push_back(response);

    while history.len() > 10000 {
        history.pop_front();
    }

    Ok(())
}

/// Check if current time is in quiet hours
async fn is_quiet_hours(config: &Config) -> bool {
    // For now, return false - implement actual quiet hours logic as needed
    false
}
