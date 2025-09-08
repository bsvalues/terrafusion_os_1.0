//! TerraFlow - Tesla-Grade Workflow Management System
//! 
//! High-performance native desktop application for workflow automation
//! Built with bulletproof Rust backends and zero-copy message passing

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem, State, AppHandle};
use terrafusion_core::{
    TerraFusionCore, WorkflowEngine, AppId, WorkflowDefinition, WorkflowId, 
    WorkflowStepDefinition, TaskPriority, Result as TerraResult
};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

mod commands;

/// Tesla-grade application state with bulletproof error handling
pub struct TerraFlowState {
    core: Arc<TerraFusionCore>,
    workflow_engine: Arc<WorkflowEngine>,
}

impl TerraFlowState {
    pub async fn new() -> TerraResult<Self> {
        info!("Initializing TerraFlow with Tesla engineering standards");
        
        // Initialize TerraFusion Core
        let core = Arc::new(TerraFusionCore::new().await?);
        
        // Initialize workflow engine
        let workflow_engine = Arc::new(WorkflowEngine::new(
            core.database(),
            core.message_bus(),
            core.metrics(),
        ).await?);
        
        // Register app with message bus
        core.message_bus().register_app(
            AppId::terra_flow(),
            vec!["workflow.notifications".to_string()]
        ).await?;
        
        // Start metrics server
        tokio::spawn(async {
            if let Err(e) = terrafusion_core::metrics::init_metrics_server(9090).await {
                warn!("Failed to start metrics server: {}", e);
            }
        });
        
        info!("TerraFlow initialized successfully");
        
        Ok(Self {
            core,
            workflow_engine,
        })
    }
    
    pub fn core(&self) -> Arc<TerraFusionCore> {
        Arc::clone(&self.core)
    }
    
    pub fn workflow_engine(&self) -> Arc<WorkflowEngine> {
        Arc::clone(&self.workflow_engine)
    }
}

#[tokio::main]
async fn main() {
    // Initialize Tesla-grade logging
    tracing_subscriber::fmt()
        .with_env_filter("debug")
        .with_target(false)
        .init();
    
    info!("Starting TerraFlow - Tesla-Grade Workflow System");
    
    // Initialize application state
    let state = match TerraFlowState::new().await {
        Ok(state) => state,
        Err(e) => {
            error!("Failed to initialize TerraFlow: {}", e);
            std::process::exit(1);
        }
    };
    
    // Create system tray with Tesla-style efficiency
    let quit = CustomMenuItem::new("quit".to_string(), "Quit TerraFlow");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide Window");
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let health = CustomMenuItem::new("health".to_string(), "System Health");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(health)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(state)
        .system_tray(system_tray)
        .on_system_tray_event(handle_system_tray_event)
        .invoke_handler(tauri::generate_handler![
            commands::get_app_info,
            commands::health_check,
            commands::create_workflow,
            commands::start_workflow,
            commands::get_workflow_status,
            commands::get_workflow_results,
            commands::cancel_workflow,
            commands::list_workflows,
            commands::get_system_metrics,
            commands::optimize_workflow_ai,
            commands::get_process_recommendations,
            commands::summarize_workflow_ai,
            commands::get_ai_status
        ])
        .setup(setup_application)
        .run(tauri::generate_context!())
        .expect("TerraFlow failed to start - critical system error");
}

/// Handle system tray events with Tesla-grade responsiveness
fn handle_system_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "quit" => {
                info!("TerraFlow shutting down via system tray");
                std::process::exit(0);
            }
            "hide" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.hide();
                }
            }
            "show" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "health" => {
                // Trigger health check notification
                let app_clone = app.clone();
                tokio::spawn(async move {
                    if let Some(state) = app_clone.try_state::<TerraFlowState>() {
                        match state.core().health_check().await {
                            Ok(_) => info!("System health check: PASSED"),
                            Err(e) => error!("System health check: FAILED - {}", e),
                        }
                    }
                });
            }
            _ => {}
        },
        _ => {}
    }
}

/// Setup application with Tesla-grade initialization
fn setup_application(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app_handle = app.handle();
    
    // Start background health monitoring
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            if let Some(state) = app_handle.try_state::<TerraFlowState>() {
                if let Err(e) = state.core().health_check().await {
                    error!("Background health check failed: {}", e);
                }
            }
        }
    });
    
    info!("TerraFlow setup completed with Tesla engineering standards");
    Ok(())
}
