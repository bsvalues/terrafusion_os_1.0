// PropertyWorkbench - Heavy Property Management Suite with GIS and Sketching
// Professional property management with advanced GIS capabilities

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
mod property_manager;
mod gis_engine;
mod sketch_engine;
mod zoning_validator;
mod analytics_engine;
mod role_manager;
mod export_service;

use property_manager::{PropertyManager, Property, PropertyFilter};
use gis_engine::{GISEngine, GeometryData};
use sketch_engine::{SketchEngine, Sketch};
use zoning_validator::{ZoningValidator, ZoningRule};
use analytics_engine::{AnalyticsEngine, PropertyAnalytics};
use role_manager::{RoleManager, UserRole};
use export_service::ExportService;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AppState {
    pub property_manager: PropertyManager,
    pub gis_engine: GISEngine,
    pub sketch_engine: SketchEngine,
    pub zoning_validator: ZoningValidator,
    pub analytics_engine: AnalyticsEngine,
    pub role_manager: RoleManager,
    pub export_service: ExportService,
}

// Property Management Commands
#[tauri::command]
async fn get_properties(
    filter: PropertyFilter,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Property>, String> {
    state
        .property_manager
        .get_properties(filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_property(
    property: Property,
    state: tauri::State<'_, AppState>,
) -> Result<Property, String> {
    state
        .property_manager
        .create_property(property)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_property(
    id: String,
    property: Property,
    state: tauri::State<'_, AppState>,
) -> Result<Property, String> {
    state
        .property_manager
        .update_property(&id, property)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_property(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    state
        .property_manager
        .delete_property(&id)
        .await
        .map_err(|e| e.to_string())
}

// GIS Operations
#[tauri::command]
async fn get_property_geometry(
    property_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<GeometryData, String> {
    state
        .gis_engine
        .get_property_geometry(&property_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_property_geometry(
    property_id: String,
    geometry: GeometryData,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    state
        .gis_engine
        .update_property_geometry(&property_id, geometry)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn spatial_query(
    query_type: String,
    params: serde_json::Value,
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .gis_engine
        .spatial_query(&query_type, &params)
        .await
        .map_err(|e| e.to_string())
}

// Sketching Operations
#[tauri::command]
async fn create_sketch(
    sketch: Sketch,
    state: tauri::State<'_, AppState>,
) -> Result<Sketch, String> {
    state
        .sketch_engine
        .create_sketch(sketch)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_sketch(
    id: String,
    sketch: Sketch,
    state: tauri::State<'_, AppState>,
) -> Result<Sketch, String> {
    state
        .sketch_engine
        .update_sketch(&id, sketch)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_property_sketches(
    property_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Sketch>, String> {
    state
        .sketch_engine
        .get_property_sketches(&property_id)
        .await
        .map_err(|e| e.to_string())
}

// Zoning Validation
#[tauri::command]
async fn validate_property_zoning(
    property_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .zoning_validator
        .validate_property(&property_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_zoning_rules(
    zone_type: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ZoningRule>, String> {
    state
        .zoning_validator
        .get_zoning_rules(zone_type.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_zoning_rule(
    rule: ZoningRule,
    state: tauri::State<'_, AppState>,
) -> Result<ZoningRule, String> {
    state
        .zoning_validator
        .create_zoning_rule(rule)
        .await
        .map_err(|e| e.to_string())
}

// Analytics
#[tauri::command]
async fn get_property_analytics(
    filter: serde_json::Value,
    state: tauri::State<'_, AppState>,
) -> Result<PropertyAnalytics, String> {
    state
        .analytics_engine
        .get_property_analytics(&filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn generate_property_report(
    report_type: String,
    params: serde_json::Value,
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .analytics_engine
        .generate_report(&report_type, &params)
        .await
        .map_err(|e| e.to_string())
}

// Role Management
#[tauri::command]
async fn check_user_permission(
    user_id: String,
    permission: String,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    state
        .role_manager
        .check_permission(&user_id, &permission)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_user_role(
    user_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<UserRole, String> {
    state
        .role_manager
        .get_user_role(&user_id)
        .await
        .map_err(|e| e.to_string())
}

// Export Services
#[tauri::command]
async fn export_properties(
    format: String,
    filter: PropertyFilter,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    state
        .export_service
        .export_properties(&format, filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_sketches(
    property_id: String,
    format: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    state
        .export_service
        .export_sketches(&property_id, &format)
        .await
        .map_err(|e| e.to_string())
}

async fn initialize_app_state() -> Result<AppState, Box<dyn std::error::Error + Send + Sync>> {
    let property_manager = PropertyManager::new().await?;
    let gis_engine = GISEngine::new().await?;
    let sketch_engine = SketchEngine::new().await?;
    let zoning_validator = ZoningValidator::new().await?;
    let analytics_engine = AnalyticsEngine::new().await?;
    let role_manager = RoleManager::new().await?;
    let export_service = ExportService::new().await?;

    Ok(AppState {
        property_manager,
        gis_engine,
        sketch_engine,
        zoning_validator,
        analytics_engine,
        role_manager,
        export_service,
    })
}

fn main() {
    let app_state = tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(initialize_app_state())
        .expect("Failed to initialize app state");

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_properties,
            create_property,
            update_property,
            delete_property,
            get_property_geometry,
            update_property_geometry,
            spatial_query,
            create_sketch,
            update_sketch,
            get_property_sketches,
            validate_property_zoning,
            get_zoning_rules,
            create_zoning_rule,
            get_property_analytics,
            generate_property_report,
            check_user_permission,
            get_user_role,
            export_properties,
            export_sketches
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_title("PropertyWorkbench - Professional Property Management Suite")?;
            window.set_size(tauri::Size::Physical(tauri::PhysicalSize { 
                width: 1600, 
                height: 1000 
            }))?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}