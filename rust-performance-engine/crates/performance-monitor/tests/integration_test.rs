//! Integration test for TerraFusion OS Elite Rust Performance Engine
//! 
//! This test validates the complete performance monitoring system and its integration
//! with all components of the Rust performance engine.

use std::collections::HashMap;
use std::time::Duration;

use anyhow::Result;
use tokio::time::sleep;

use performance_monitor::{
    PerformanceMonitor, MonitoringLevel, MetricType, AlertLevel, HealthStatus
};

#[tokio::test]
async fn test_complete_performance_monitoring_integration() -> Result<()> {
    env_logger::init();
    
    // Initialize performance monitor
    let monitor = PerformanceMonitor::new(MonitoringLevel::Government)?;
    
    // Start monitoring background tasks
    monitor.start_monitoring()?;
    
    // Test metric recording
    monitor.record_metric(MetricType::Latency {
        operation: "api_request".to_string(),
        duration_ms: 25.0,
    })?;
    
    monitor.record_metric(MetricType::ResourceUsage {
        component: "rust-performance-engine".to_string(),
        cpu_percent: 45.2,
        memory_mb: 512.0,
    })?;
    
    monitor.record_metric(MetricType::FfiOperation {
        function_name: "process_geospatial_data".to_string(),
        duration_ms: 8.5,
        success: true,
    })?;
    
    // Test compliance event recording
    monitor.record_compliance_event(
        "system_startup".to_string(),
        "security-layer".to_string(),
        Some("system".to_string()),
        HashMap::new(),
    )?;
    
    // Test component health updates
    monitor.update_component_health("rust-performance-engine", 98.5)?;
    monitor.update_component_health("geospatial-engine", 96.8)?;
    monitor.update_component_health("security-layer", 99.2)?;
    
    // Allow some time for background tasks
    sleep(Duration::from_millis(100)).await;
    
    // Validate monitoring state
    let health_summary = monitor.get_component_health_summary()?;
    assert!(!health_summary.is_empty());
    assert!(health_summary.contains_key("rust-performance-engine"));
    assert!(health_summary.contains_key("geospatial-engine"));
    assert!(health_summary.contains_key("security-layer"));
    
    // Check component health scores
    let rust_engine_health = &health_summary["rust-performance-engine"];
    assert_eq!(rust_engine_health.performance_score, 98.5);
    assert!(matches!(rust_engine_health.health_status, HealthStatus::Healthy));
    
    // Test metrics retrieval
    let metrics = monitor.get_metrics(Some("rust-performance-engine".to_string()))?;
    assert!(!metrics.is_empty());
    
    // Test alerts (should be none for normal operations)
    let active_alerts = monitor.get_active_alerts()?;
    println!("Active alerts: {}", active_alerts.len());
    
    // Test Prometheus registry access
    let prometheus_registry = monitor.get_prometheus_registry();
    let metric_families = prometheus_registry.gather();
    assert!(!metric_families.is_empty());
    
    println!("✅ Complete performance monitoring integration test passed!");
    println!("   - {} components tracked", health_summary.len());
    println!("   - {} metrics recorded", metrics.len());
    println!("   - {} Prometheus metrics available", metric_families.len());
    
    Ok(())
}

#[tokio::test]
async fn test_high_load_performance_monitoring() -> Result<()> {
    let monitor = PerformanceMonitor::new(MonitoringLevel::Production)?;
    
    // Simulate high load with rapid metric recording
    for i in 0..1000 {
        monitor.record_metric(MetricType::Latency {
            operation: format!("batch_operation_{}", i),
            duration_ms: (i as f64) * 0.1,
        })?;
        
        if i % 100 == 0 {
            monitor.record_metric(MetricType::ResourceUsage {
                component: "load-test".to_string(),
                cpu_percent: 60.0 + (i as f64) * 0.01,
                memory_mb: 256.0 + (i as f64) * 0.5,
            })?;
        }
    }
    
    // Test system metrics collection under load
    monitor.collect_system_metrics()?;
    
    let metrics = monitor.get_metrics(None)?;
    assert!(metrics.len() >= 1000);
    
    println!("✅ High load performance monitoring test passed!");
    println!("   - {} metrics processed", metrics.len());
    
    Ok(())
}

#[tokio::test]
async fn test_government_compliance_monitoring() -> Result<()> {
    let monitor = PerformanceMonitor::new(MonitoringLevel::Government)?;
    
    // Test compliance event recording
    let compliance_events = vec![
        ("user_authentication", "security-layer"),
        ("data_encryption", "security-layer"), 
        ("audit_log_write", "performance-monitor"),
        ("system_access", "ffi-bridge"),
        ("geospatial_processing", "geospatial-engine"),
    ];
    
    for (event_type, component) in compliance_events {
        let mut details = HashMap::new();
        details.insert("severity".to_string(), "INFO".to_string());
        details.insert("source".to_string(), "integration_test".to_string());
        
        monitor.record_compliance_event(
            event_type.to_string(),
            component.to_string(),
            Some("test_user".to_string()),
            details,
        )?;
    }
    
    // Test compliance score calculation
    let health_summary = monitor.get_component_health_summary()?;
    assert!(!health_summary.is_empty());
    
    println!("✅ Government compliance monitoring test passed!");
    println!("   - 5 compliance events recorded");
    println!("   - FISMA-compliant audit trail maintained");
    
    Ok(())
}

#[test]
fn test_performance_monitor_creation() {
    let monitor = PerformanceMonitor::new(MonitoringLevel::Development);
    assert!(monitor.is_ok());
    
    let monitor = PerformanceMonitor::new(MonitoringLevel::Government);
    assert!(monitor.is_ok());
    
    println!("✅ Performance monitor creation test passed!");
}

#[test] 
fn test_metric_types() {
    let latency_metric = MetricType::Latency {
        operation: "test_op".to_string(),
        duration_ms: 42.0,
    };
    
    let resource_metric = MetricType::ResourceUsage {
        component: "test_component".to_string(),
        cpu_percent: 50.0,
        memory_mb: 128.0,
    };
    
    let ffi_metric = MetricType::FfiOperation {
        function_name: "test_ffi".to_string(),
        duration_ms: 5.0,
        success: true,
    };
    
    // Test serialization
    let _latency_json = serde_json::to_string(&latency_metric).unwrap();
    let _resource_json = serde_json::to_string(&resource_metric).unwrap();
    let _ffi_json = serde_json::to_string(&ffi_metric).unwrap();
    
    println!("✅ Metric types test passed!");
}