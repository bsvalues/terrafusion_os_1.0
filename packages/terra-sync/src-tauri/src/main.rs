// Tesla Performance Monitoring
use std::time::{Duration, Instant};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct PerformanceMonitor {
    startup_time: Arc<Mutex<Option<Duration>>>,
    command_times: Arc<Mutex<Vec<(String, Duration)>>>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub async fn record_startup(&self, duration: Duration) {
        *self.startup_time.lock().await = Some(duration);
    }
    
    pub async fn record_command(&self, name: String, duration: Duration) {
        self.command_times.lock().await.push((name, duration));
    }
    
    pub async fn get_stats(&self) -> (Option<Duration>, Vec<(String, Duration)>) {
        let startup = *self.startup_time.lock().await;
        let commands = self.command_times.lock().await.clone();
        (startup, commands)
    }
}

// Tesla Performance Monitoring
use std::time::{Duration, Instant};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct PerformanceMonitor {
    startup_time: Arc<Mutex<Option<Duration>>>,
    command_times: Arc<Mutex<Vec<(String, Duration)>>>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub async fn record_startup(&self, duration: Duration) {
        *self.startup_time.lock().await = Some(duration);
    }
    
    pub async fn record_command(&self, name: String, duration: Duration) {
        self.command_times.lock().await.push((name, duration));
    }
    
    pub async fn get_stats(&self) -> (Option<Duration>, Vec<(String, Duration)>) {
        let startup = *self.startup_time.lock().await;
        let commands = self.command_times.lock().await.clone();
        (startup, commands)
    }
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sync_engine;
mod orchestrator;
mod integrations;
mod monitoring;

use sync_engine::SyncEngine;
use orchestrator::Orchestrator;
use integrations::IntegrationManager;
use monitoring::SystemMonitor;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use dashmap::DashMap;

// Data Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSource {
    pub id: String,
    pub name: String,
    pub source_type: SourceType,
    pub status: SyncStatus,
    pub last_sync: DateTime<Utc>,
    pub record_count: usize,
    pub sync_frequency: String,
    pub health_score: f64,
    pub bandwidth_usage: f64,
    pub error_rate: f64,
    pub configuration: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SourceType {
    #[serde(rename = "postgresql")]
    PostgreSQL,
    #[serde(rename = "api")]
    API,
    #[serde(rename = "gis")]
    GIS,
    #[serde(rename = "mls")]
    MLS,
    #[serde(rename = "file")]
    File,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    #[serde(rename = "connected")]
    Connected,
    #[serde(rename = "disconnected")]
    Disconnected,
    #[serde(rename = "syncing")]
    Syncing,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncJob {
    pub id: String,
    pub source_id: String,
    pub source_name: String,
    pub status: JobStatus,
    pub progress: f64,
    pub records_processed: usize,
    pub records_total: usize,
    pub started_at: DateTime<Utc>,
    pub estimated_completion: Option<DateTime<Utc>>,
    pub sync_type: SyncType,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobStatus {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "paused")]
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncType {
    #[serde(rename = "full")]
    Full,
    #[serde(rename = "incremental")]
    Incremental,
    #[serde(rename = "real-time")]
    RealTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Integration {
    pub id: String,
    pub name: String,
    pub integration_type: IntegrationType,
    pub status: IntegrationStatus,
    pub endpoint: String,
    pub last_health_check: DateTime<Utc>,
    pub response_time: f64,
    pub success_rate: f64,
    pub configuration: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IntegrationType {
    #[serde(rename = "internal")]
    Internal,
    #[serde(rename = "external")]
    External,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IntegrationStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "inactive")]
    Inactive,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub overall_health: HealthStatus,
    pub active_syncs: usize,
    pub queued_jobs: usize,
    pub total_records_synced: usize,
    pub data_throughput: f64,
    pub uptime: String,
    pub memory_usage: f64,
    pub cpu_usage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    #[serde(rename = "healthy")]
    Healthy,
    #[serde(rename = "warning")]
    Warning,
    #[serde(rename = "critical")]
    Critical,
}

// Application State
#[derive(Debug)]
pub struct AppState {
    pub sync_engine: Arc<Mutex<SyncEngine>>,
    pub orchestrator: Arc<Mutex<Orchestrator>>,
    pub integration_manager: Arc<Mutex<IntegrationManager>>,
    pub system_monitor: Arc<Mutex<SystemMonitor>>,
    pub active_jobs: Arc<DashMap<String, SyncJob>>,
}

impl AppState {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            sync_engine: Arc::new(Mutex::new(SyncEngine::new().await?)),
            orchestrator: Arc::new(Mutex::new(Orchestrator::new().await?)),
            integration_manager: Arc::new(Mutex::new(IntegrationManager::new().await?)),
            system_monitor: Arc::new(Mutex::new(SystemMonitor::new().await?)),
            active_jobs: Arc::new(DashMap::new()),
        })
    }
}

// Tauri Commands
#[tauri::command]
async fn get_sync_sources(
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let sync_engine = app_state.sync_engine.lock().await;
    
    let sources = sync_engine.get_all_sources().await
        .map_err(|e| format!("Failed to get sync sources: {}", e))?;
    
    Ok(serde_json::json!({
        "sync_sources": sources,
        "total": sources.len(),
        "status": "success"
    }))
}

#[tauri::command]
async fn get_sync_jobs(
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let jobs: Vec<SyncJob> = app_state.active_jobs.iter()
        .map(|entry| entry.value().clone())
        .collect();
    
    Ok(serde_json::json!({
        "sync_jobs": jobs,
        "total": jobs.len(),
        "status": "success"
    }))
}

#[tauri::command]
async fn get_integrations(
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let integration_manager = app_state.integration_manager.lock().await;
    
    let integrations = integration_manager.get_all_integrations().await
        .map_err(|e| format!("Failed to get integrations: {}", e))?;
    
    Ok(serde_json::json!({
        "integrations": integrations,
        "total": integrations.len(),
        "status": "success"
    }))
}

#[tauri::command]
async fn get_system_status(
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<SystemStatus, String> {
    let app_state = state.lock().await;
    let system_monitor = app_state.system_monitor.lock().await;
    
    system_monitor.get_current_status(&app_state.active_jobs).await
        .map_err(|e| format!("Failed to get system status: {}", e))
}

#[tauri::command]
async fn get_real_time_metrics(
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<SystemStatus, String> {
    let app_state = state.lock().await;
    let system_monitor = app_state.system_monitor.lock().await;
    
    system_monitor.get_real_time_metrics(&app_state.active_jobs).await
        .map_err(|e| format!("Failed to get real-time metrics: {}", e))
}

#[tauri::command]
async fn trigger_sync(
    source_id: String,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let mut sync_engine = app_state.sync_engine.lock().await;
    
    let job = sync_engine.trigger_sync(source_id.clone()).await
        .map_err(|e| format!("Failed to trigger sync: {}", e))?;
    
    app_state.active_jobs.insert(job.id.clone(), job.clone());
    
    Ok(serde_json::json!({
        "job_id": job.id,
        "source_id": source_id,
        "status": "started",
        "message": "Sync job started successfully"
    }))
}

#[tauri::command]
async fn pause_sync_job(
    job_id: String,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    
    if let Some(mut job) = app_state.active_jobs.get_mut(&job_id) {
        job.status = JobStatus::Paused;
        
        Ok(serde_json::json!({
            "job_id": job_id,
            "status": "paused",
            "message": "Job paused successfully"
        }))
    } else {
        Err(format!("Job {} not found", job_id))
    }
}

#[tauri::command]
async fn resume_sync_job(
    job_id: String,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    
    if let Some(mut job) = app_state.active_jobs.get_mut(&job_id) {
        job.status = JobStatus::Running;
        
        Ok(serde_json::json!({
            "job_id": job_id,
            "status": "resumed",
            "message": "Job resumed successfully"
        }))
    } else {
        Err(format!("Job {} not found", job_id))
    }
}

#[tauri::command]
async fn test_integration(
    integration_id: String,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let integration_manager = app_state.integration_manager.lock().await;
    
    let result = integration_manager.test_integration(integration_id.clone()).await
        .map_err(|e| format!("Failed to test integration: {}", e))?;
    
    Ok(result)
}

#[tauri::command]
async fn get_sync_history(
    source_id: String,
    limit: Option<usize>,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let sync_engine = app_state.sync_engine.lock().await;
    
    let history = sync_engine.get_sync_history(source_id, limit.unwrap_or(50)).await
        .map_err(|e| format!("Failed to get sync history: {}", e))?;
    
    Ok(history)
}

#[tauri::command]
async fn configure_sync_source(
    source_id: String,
    configuration: serde_json::Value,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<serde_json::Value, String> {
    let app_state = state.lock().await;
    let mut sync_engine = app_state.sync_engine.lock().await;
    
    sync_engine.configure_source(source_id.clone(), configuration).await
        .map_err(|e| format!("Failed to configure sync source: {}", e))?;
    
    Ok(serde_json::json!({
        "source_id": source_id,
        "status": "configured",
        "message": "Source configuration updated successfully"
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the application state
    let app_state = Arc::new(Mutex::new(AppState::new().await?));
    
    // Start background services
    {
        let app_state_clone = app_state.clone();
        tokio::spawn(async move {
            // Background orchestration service
            loop {
                if let Ok(state) = app_state_clone.try_lock() {
                    if let Ok(mut orchestrator) = state.orchestrator.try_lock() {
                        let _ = orchestrator.run_orchestration_cycle().await;
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
            }
        });
    }
    
    // Build and run the Tauri application
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_sync_sources,
            get_sync_jobs,
            get_integrations,
            get_system_status,
            get_real_time_metrics,
            trigger_sync,
            pause_sync_job,
            resume_sync_job,
            test_integration,
            get_sync_history,
            configure_sync_source
        ])
        .run(tauri::generate_context!())?;
    
    Ok(())
}