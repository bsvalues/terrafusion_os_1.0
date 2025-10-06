//! Integration Tests for Core Services
//! 
//! Tests the complete stack:
//! React UI → .NET API → Rust FFI → Core Services → Elite Engine

use reqwest;
use serde_json::json;

const API_BASE_URL: &str = "http://localhost:5000/api/core";

#[tokio::test]
async fn test_core_os_health() {
    // Test: Can we reach the Core OS health endpoint?
    let client = reqwest::Client::new();
    
    let response = client
        .get(format!("{}/health", API_BASE_URL))
        .send()
        .await
        .expect("Failed to call health endpoint");
    
    assert!(response.status().is_success());
    
    let health: serde_json::Value = response.json().await.unwrap();
    
    // Verify structure
    assert!(health["overall_status"].is_string());
    assert!(health["terra_sync"].is_object());
    assert!(health["terra_flow"].is_object());
    assert!(health["costforge_ai"].is_object());
}

#[tokio::test]
async fn test_terra_sync_start() {
    // Test: Can we start a sync operation?
    let client = reqwest::Client::new();
    
    let response = client
        .post(format!("{}/terra-sync/start", API_BASE_URL))
        .json(&json!({"county": "benton"}))
        .send()
        .await
        .expect("Failed to start sync");
    
    assert!(response.status().is_success());
    
    let result: serde_json::Value = response.json().await.unwrap();
    
    // Verify result structure
    assert_eq!(result["county"], "benton");
    assert!(result["records_synced"].is_number());
    assert!(result["sync_duration_ms"].is_number());
}

#[tokio::test]
async fn test_costforge_property_valuation() {
    // Test: Can we valuate a property?
    let client = reqwest::Client::new();
    
    let request = json!({
        "property_id": "TEST-001",
        "square_feet": 2500.0,
        "year_built": 2010,
        "location": "Benton County, WA",
        "bedrooms": 4,
        "bathrooms": 2.5,
        "lot_size": 8000.0,
        "comparables": []
    });
    
    let response = client
        .post(format!("{}/costforge/property-valuation", API_BASE_URL))
        .json(&request)
        .send()
        .await
        .expect("Failed to valuate property");
    
    assert!(response.status().is_success());
    
    let result: serde_json::Value = response.json().await.unwrap();
    
    // Verify valuation result
    assert_eq!(result["property_id"], "TEST-001");
    assert!(result["estimated_value"].as_f64().unwrap() > 0.0);
    assert!(result["processing_time_ms"].as_f64().unwrap() < 150.0); // <150ms target!
    assert_eq!(result["confidence_percent"], 95.0);
}

#[tokio::test]
async fn test_performance_targets() {
    // Test: Do we meet performance SLOs?
    let client = reqwest::Client::new();
    let start = std::time::Instant::now();
    
    // Test TerraSync performance
    let _response = client
        .get(format!("{}/terra-sync/status", API_BASE_URL))
        .send()
        .await
        .expect("Failed to get sync status");
    
    let elapsed = start.elapsed();
    
    // Assert: <50ms latency target for TerraSync
    assert!(
        elapsed.as_millis() < 50,
        "TerraSync latency {}ms exceeds 50ms target",
        elapsed.as_millis()
    );
}

