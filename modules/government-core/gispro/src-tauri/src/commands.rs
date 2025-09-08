use serde::{Deserialize, Serialize};
use tauri::State;
use crate::gis_engine::{get_gis_engine, initialize_gis_engine, GeoFeature, GeoPoint};

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

// GIS-specific commands
#[tauri::command]
pub async fn init_gis_engine() -> Result<String, String> {
    match initialize_gis_engine() {
        Ok(_) => Ok("GIS Engine initialized successfully".to_string()),
        Err(e) => Err(format!("Failed to initialize GIS engine: {}", e)),
    }
}

#[tauri::command]
pub async fn perform_spatial_analysis(
    analysis_type: String,
    features: Vec<GeoFeature>,
) -> Result<serde_json::Value, String> {
    let engine = get_gis_engine();
    let engine = engine.lock().map_err(|e| format!("Failed to lock GIS engine: {}", e))?;
    
    let result = match analysis_type.as_str() {
        "buffer" => engine.perform_buffer_analysis(&features, 100.0), // Default 100m buffer
        "intersection" => engine.perform_intersection_analysis(&features),
        "proximity" => engine.perform_proximity_analysis(&features, 500.0), // Default 500m
        _ => return Err(format!("Unknown analysis type: {}", analysis_type)),
    };
    
    match result {
        Ok(analysis_result) => {
            let json_result = serde_json::to_value(analysis_result)
                .map_err(|e| format!("Failed to serialize result: {}", e))?;
            Ok(json_result)
        },
        Err(e) => Err(format!("Spatial analysis failed: {}", e)),
    }
}

#[tauri::command]
pub async fn export_gis_data(
    format: String,
    features: Vec<GeoFeature>,
) -> Result<String, String> {
    let engine = get_gis_engine();
    let engine = engine.lock().map_err(|e| format!("Failed to lock GIS engine: {}", e))?;
    
    match format.as_str() {
        "geojson" => {
            engine.export_geojson(&features)
                .map_err(|e| format!("Failed to export GeoJSON: {}", e))
        },
        "shapefile" => {
            // Mock shapefile export
            Ok("Shapefile export functionality not implemented yet".to_string())
        },
        "kml" => {
            // Mock KML export
            Ok("KML export functionality not implemented yet".to_string())
        },
        _ => Err(format!("Unsupported export format: {}", format)),
    }
}

#[tauri::command]
pub async fn load_map_layer(layer_id: String) -> Result<serde_json::Value, String> {
    // Mock layer loading
    let mock_layer = serde_json::json!({
        "id": layer_id,
        "name": format!("Layer {}", layer_id),
        "type": "vector",
        "features": []
    });
    
    Ok(mock_layer)
}

#[tauri::command]
pub async fn geocode_address(address: String) -> Result<GeoPoint, String> {
    let engine = get_gis_engine();
    let engine = engine.lock().map_err(|e| format!("Failed to lock GIS engine: {}", e))?;
    
    engine.geocode(&address)
        .map_err(|e| format!("Geocoding failed: {}", e))
}

#[tauri::command]
pub async fn reverse_geocode(lat: f64, lng: f64) -> Result<String, String> {
    let engine = get_gis_engine();
    let engine = engine.lock().map_err(|e| format!("Failed to lock GIS engine: {}", e))?;
    
    let point = GeoPoint { lat, lng };
    engine.reverse_geocode(&point)
        .map_err(|e| format!("Reverse geocoding failed: {}", e))
}
