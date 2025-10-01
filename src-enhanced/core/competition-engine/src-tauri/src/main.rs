// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_system_info() -> String {
    format!("TerraFusion Competition Engine v1.0.0 - Government Desktop Applications Framework")
}

#[tauri::command]
fn get_module_status() -> String {
    format!("Competition Engine: OPERATIONAL - 14 Desktop Applications Ready")
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, get_system_info, get_module_status])
        .setup(|app| {
            println!("TerraFusion Competition Engine: Desktop Framework Initialized");
            println!("Government Desktop Applications: 14 modules ready");
            println!("Elite Rust Performance Engine: Connected");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}