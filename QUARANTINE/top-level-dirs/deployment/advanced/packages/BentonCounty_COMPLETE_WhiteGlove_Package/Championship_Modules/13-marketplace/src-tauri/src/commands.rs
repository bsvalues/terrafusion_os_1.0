use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppData {
    pub key: String,
    pub value: serde_json::Value,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn save_data(data: AppData) -> Result<String, String> {
    // Save data to database
    match crate::database::save_app_data(&data.key, &data.value).await {
        Ok(_) => Ok("Data saved successfully".to_string()),
        Err(e) => Err(format!("Failed to save data: {}", e)),
    }
}

#[tauri::command]
pub async fn load_data(key: String) -> Result<serde_json::Value, String> {
    // Load data from database
    match crate::database::load_app_data(&key).await {
        Ok(value) => Ok(value),
        Err(e) => Err(format!("Failed to load data: {}", e)),
    }
}
