// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::Mutex;
use sysinfo::{System, SystemExt, CpuExt, DiskExt};

mod commands;
mod database;
mod ipc;

// System metrics structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub disk_usage: f32,
    pub network_status: String,
}

// App management state
#[derive(Debug, Clone)]
pub struct AppState {
    pub running_apps: Mutex<HashMap<String, bool>>,
    pub system: Mutex<System>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            running_apps: Mutex::new(HashMap::new()),
            system: Mutex::new(System::new_all()),
        }
    }
}

// Tauri commands for system monitoring
#[tauri::command]
async fn get_system_metrics(state: tauri::State<'_, AppState>) -> Result<SystemMetrics, String> {
    let mut system = state.system.lock().await;
    system.refresh_all();
    
    // Get CPU usage
    let cpu_usage = system.global_cpu_info().cpu_usage();
    
    // Get memory usage
    let memory_usage = (system.used_memory() as f32 / system.total_memory() as f32) * 100.0;
    
    // Get disk usage (first disk)
    let disk_usage = if let Some(disk) = system.disks().first() {
        (disk.total_space() - disk.available_space()) as f32 / disk.total_space() as f32 * 100.0
    } else {
        0.0
    };
    
    // Network status (simplified)
    let network_status = if system.networks().is_empty() {
        "disconnected".to_string()
    } else {
        "connected".to_string()
    };
    
    Ok(SystemMetrics {
        cpu_usage,
        memory_usage,
        disk_usage,
        network_status,
    })
}

#[tauri::command]
async fn start_app(app_id: String, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let mut running_apps = state.running_apps.lock().await;
    
    // Simulate starting an app (in a real implementation, this would start the actual process)
    tracing::info!("Starting app: {}", app_id);
    
    // For demonstration, we'll just mark it as running
    running_apps.insert(app_id.clone(), true);
    
    // In a real implementation, you might:
    // 1. Start the process using std::process::Command
    // 2. Check if the port is available
    // 3. Launch the application with proper parameters
    // 4. Monitor the process health
    
    Ok(true)
}

#[tauri::command]
async fn stop_app(app_id: String, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let mut running_apps = state.running_apps.lock().await;
    
    // Simulate stopping an app
    tracing::info!("Stopping app: {}", app_id);
    
    running_apps.insert(app_id.clone(), false);
    
    // In a real implementation, you might:
    // 1. Send a graceful shutdown signal to the process
    // 2. Kill the process if it doesn't respond
    // 3. Clean up resources
    // 4. Update the database
    
    Ok(true)
}

#[tauri::command]
async fn get_app_status(app_id: String, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let running_apps = state.running_apps.lock().await;
    Ok(running_apps.get(&app_id).copied().unwrap_or(false))
}

#[tauri::command]
async fn restart_all_apps(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let mut running_apps = state.running_apps.lock().await;
    let mut restarted = Vec::new();
    
    // Get all app IDs that were running
    let app_ids: Vec<String> = running_apps.keys().cloned().collect();
    
    for app_id in app_ids {
        // Stop then start each app
        tracing::info!("Restarting app: {}", app_id);
        running_apps.insert(app_id.clone(), true);
        restarted.push(app_id);
    }
    
    Ok(restarted)
}

#[tauri::command]
async fn get_app_logs(app_id: String) -> Result<Vec<String>, String> {
    // In a real implementation, this would read logs from files or database
    let mock_logs = vec![
        format!("{}: Application started successfully", app_id),
        format!("{}: Health check passed", app_id),
        format!("{}: Processing request", app_id),
        format!("{}: Operation completed", app_id),
    ];
    
    Ok(mock_logs)
}

#[tokio::main]
async fn main() {
    // Initialize tracing with better formatting
    tracing_subscriber::fmt()
        .with_env_filter("terrafusion_dashboard=info")
        .init();
    
    // Create application state
    let app_state = AppState::new();
    
    // Create system tray with enhanced menu
    let dashboard = CustomMenuItem::new("dashboard".to_string(), "Open Dashboard");
    let status = CustomMenuItem::new("status".to_string(), "System Status");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(dashboard)
        .add_item(status)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("TerraFusion Master Control Center");

    tauri::Builder::default()
        .manage(app_state)
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    tracing::info!("Shutting down TerraFusion Master Control Center");
                    std::process::exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                "show" | "dashboard" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "status" => {
                    // Could show a quick status popup
                    tracing::info!("System status requested");
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            // Original commands
            commands::greet,
            commands::get_app_version,
            commands::save_data,
            commands::load_data,
            // New dashboard commands
            get_system_metrics,
            start_app,
            stop_app,
            get_app_status,
            restart_all_apps,
            get_app_logs
        ])
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle();
            tokio::spawn(async move {
                if let Err(e) = database::init_database().await {
                    tracing::error!("Failed to initialize database: {}", e);
                }
            });
            
            // Start system monitoring
            tracing::info!("TerraFusion Master Control Center starting up...");
            tracing::info!("System monitoring initialized");
            tracing::info!("Dashboard controls ready");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
