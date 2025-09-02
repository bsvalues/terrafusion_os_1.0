//! WebAuditTracker - Tesla-Grade Compliance Engine
//! 
//! High-performance native desktop application for web compliance auditing
//! Built with bulletproof Rust backends and concurrent audit processing

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, AppHandle, State};
use terrafusion_core::{
    TerraFusionCore, ComplianceEngine, AppId, AuditConfiguration, AuditId,
    ComplianceSeverity, Result as TerraResult
};
use serde_json::json;
use std::sync::Arc;
use tracing::{info, error, warn};

mod commands;

/// Tesla-grade application state with bulletproof error handling
pub struct WebAuditState {
    core: Arc<TerraFusionCore>,
    compliance_engine: Arc<ComplianceEngine>,
}

impl WebAuditState {
    pub async fn new() -> TerraResult<Self> {
        info!("Initializing WebAuditTracker with Tesla engineering standards");
        
        // Initialize TerraFusion Core
        let core = Arc::new(TerraFusionCore::new().await?);
        
        // Initialize compliance engine
        let compliance_engine = Arc::new(ComplianceEngine::new(
            core.database(),
            core.message_bus(),
            core.metrics(),
        ).await?);
        
        // Register app with message bus
        core.message_bus().register_app(
            AppId::web_audit_tracker(),
            vec!["audit.notifications".to_string()]
        ).await?;
        
        // Start metrics server on different port than TerraFlow
        tokio::spawn(async {
            if let Err(e) = terrafusion_core::metrics::init_metrics_server(9091).await {
                warn!("Failed to start metrics server: {}", e);
            }
        });
        
        info!("WebAuditTracker initialized successfully");
        
        Ok(Self {
            core,
            compliance_engine,
        })
    }
    
    pub fn core(&self) -> Arc<TerraFusionCore> {
        Arc::clone(&self.core)
    }
    
    pub fn compliance_engine(&self) -> Arc<ComplianceEngine> {
        Arc::clone(&self.compliance_engine)
    }
}

#[tokio::main]
async fn main() {
    // Initialize Tesla-grade logging
    tracing_subscriber::fmt()
        .with_env_filter("debug")
        .with_target(false)
        .init();
    
    info!("Starting WebAuditTracker - Tesla-Grade Compliance Engine");
    
    // Initialize application state
    let state = match WebAuditState::new().await {
        Ok(state) => state,
        Err(e) => {
            error!("Failed to initialize WebAuditTracker: {}", e);
            std::process::exit(1);
        }
    };
    
    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::get_app_info,
            commands::health_check,
            commands::start_audit,
            commands::get_audit_status,
            commands::get_audit_results,
            commands::cancel_audit,
            commands::list_audits,
            commands::get_audit_stats,
            commands::get_system_metrics,
            commands::register_custom_rule,
            commands::analyze_compliance_ai,
            commands::assess_security_risks_ai,
            commands::summarize_audit_report_ai,
            commands::get_remediation_recommendations_ai,
            commands::get_compliance_ai_status
        ])
        .setup(setup_application)
        .run(tauri::generate_context!())
        .expect("WebAuditTracker failed to start - critical system error");
}

/// Setup application with Tesla-grade initialization
fn setup_application(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app_handle = app.handle();
    
    // Start background health monitoring
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            if let Some(state) = app_handle.try_state::<WebAuditState>() {
                if let Err(e) = state.core().health_check().await {
                    error!("Background health check failed: {}", e);
                }
            }
        }
    });
    
    info!("WebAuditTracker setup completed with Tesla engineering standards");
    Ok(())
}