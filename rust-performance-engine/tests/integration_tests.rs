//! Integration tests exercising cross-crate behaviour within the TerraFusion Rust performance engine.

use std::sync::Arc;
use std::time::{Instant, SystemTime};

use agent_coordination::{
    Agent,
    AgentCoordinationEngine,
    AgentPerformanceMetrics,
    AgentStatus,
    AgentType,
    ConsciousnessLevel,
};
use chrono::NaiveDate;
use geospatial_engine::{GeospatialEngine, PropertyParcel};
use performance_monitor::{MetricType, MonitoringLevel, PerformanceMonitor};
use rust_decimal::Decimal;
use security_layer::{SecurityLayer, SecurityLevel};
use uuid::Uuid;
use valuation_kernel::{
    ComparableSale,
    MarketConditions,
    PhysicalAdjustment,
    PropertyCharacteristics,
    PropertyClass,
    PropertyCondition,
    PropertyQuality,
    TimeAdjustment,
    ValuationKernel,
    ValuationMethod,
    LocationAdjustment,
};

fn base_market_conditions() -> MarketConditions {
    MarketConditions::default()
}

fn build_agent(agent_type: AgentType, tier: u8) -> Agent {
    Agent {
        id: Uuid::new_v4(),
        agent_type,
        tier,
        status: AgentStatus::Active,
        capabilities: vec!["coordination".to_string(), "valuation".to_string()],
        assignments: vec!["integration".to_string()],
        consciousness: ConsciousnessLevel::Adaptive,
        quantum_entanglement: Vec::new(),
        performance_metrics: AgentPerformanceMetrics::default(),
        last_activity: SystemTime::now(),
    }
}

fn load_sample_comparables(kernel: &mut ValuationKernel, prefix: &str) {
    let mut sales = Vec::new();
    for i in 0..4 {
        let sale = ComparableSale {
            sale_id: Uuid::new_v4(),
            parcel_id: format!("{}{:06}", prefix, i),
            sale_date: NaiveDate::from_ymd_opt(2023, 10 + (i as u32 % 3), 12).unwrap(),
            sale_price: Decimal::new(300_000 + (i as i64 * 7_500), 0),
            verified: true,
            property_characteristics: PropertyCharacteristics {
                lot_size_sq_ft: Decimal::new(6800 + (i as i64 * 80), 0),
                building_area_sq_ft: Decimal::new(2300 + (i as i64 * 40), 0),
                year_built: 2008 + i as u16,
                bedrooms: 3 + (i as u8 % 2),
                bathrooms: Decimal::new(20 + (i as i64), 1),
                garage_spaces: 2,
                basement: false,
                pool: i % 2 == 0,
                fireplace_count: 1,
                condition: PropertyCondition::Good,
                quality: PropertyQuality::Average,
                construction_type: "masonry".to_string(),
                roof_type: "composition_shingle".to_string(),
                heating_system: "gas_forced_air".to_string(),
                cooling_system: "central_air".to_string(),
            },
            location_adjustments: Vec::<LocationAdjustment>::new(),
            time_adjustments: Vec::<TimeAdjustment>::new(),
            physical_adjustments: Vec::<PhysicalAdjustment>::new(),
        };
        sales.push(sale);
    }

    kernel
        .load_comparable_sales(sales)
        .expect("comparable sales should load");
}

fn build_property(prefix: &str, index: usize) -> (PropertyParcel, PropertyCharacteristics) {
    let parcel = PropertyParcel {
        parcel_id: format!("{}{:06}", prefix, index + 100),
        county_id: "HARRIS".to_string(),
        area_sq_feet: 6500.0 + (index as f64 * 75.0),
        assessed_value: 295_000.0 + (index as f64 * 4_000.0),
        market_value: 315_000.0 + (index as f64 * 4_500.0),
        centroid_x: -95.36 + (index as f64 * 0.001),
        centroid_y: 29.75 + (index as f64 * 0.001),
    };

    let characteristics = PropertyCharacteristics {
        lot_size_sq_ft: Decimal::new(6500 + (index as i64 * 70), 0),
        building_area_sq_ft: Decimal::new(2200 + (index as i64 * 35), 0),
        year_built: 2005 + index as u16,
        bedrooms: 3 + (index as u8 % 2),
        bathrooms: Decimal::new(22 + (index as i64), 1),
        garage_spaces: 2,
        basement: false,
        pool: index % 3 == 0,
        fireplace_count: 1,
        condition: PropertyCondition::Good,
        quality: PropertyQuality::AboveAverage,
        construction_type: "masonry".to_string(),
        roof_type: "composition_shingle".to_string(),
        heating_system: "gas_forced_air".to_string(),
        cooling_system: "central_air".to_string(),
    };

    (parcel, characteristics)
}

#[tokio::test]
async fn test_complete_elite_performance_engine() {
    // Coordinate agents across tiers
    let agent_engine = Arc::new(AgentCoordinationEngine::new().expect("agent engine should initialize"));
    let agent_types = [
        AgentType::ProcessCoordinator,
        AgentType::ExpertSpecialist,
        AgentType::AdaptiveExecutor,
    ];
    for (tier, agent_type) in agent_types.into_iter().enumerate() {
        agent_engine
            .register_agent(build_agent(agent_type, (tier + 1) as u8))
            .await
            .expect("agent registration should succeed");
    }
    let swarm_metrics = agent_engine.get_swarm_metrics().await;
    assert_eq!(swarm_metrics.total_agents, 3);

    // Geospatial engine sample data + query
    let mut geospatial_engine = GeospatialEngine::new().expect("geospatial engine should initialize");
    geospatial_engine
        .load_harris_pacs_data()
        .expect("sample PACS data should load");
    let spatial_result = geospatial_engine
        .spatial_query(-95.50, 29.70, -95.30, 29.90, 5)
        .expect("spatial query should succeed");
    assert!(!spatial_result.parcels.is_empty(), "spatial query should return parcels");

    // Property valuation pipeline
    let mut valuation_kernel = ValuationKernel::new(base_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel, "TES");
    let (parcel, characteristics) = build_property("TES", 0);
    let valuation = valuation_kernel
        .value_property(
            &parcel,
            &characteristics,
            PropertyClass::Residential,
            vec![ValuationMethod::SalesComparison, ValuationMethod::AutomatedValuationModel],
        )
        .expect("valuation should succeed");
    assert!(valuation.estimated_market_value > Decimal::ZERO);

    // Security enforcement
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let encrypted = security_layer
        .encrypt(b"critical-government-data", SecurityLevel::Secret, None)
        .expect("encryption should succeed");
    let decrypted = security_layer
        .decrypt(&encrypted)
        .expect("decryption should succeed");
    assert_eq!(decrypted.as_slice(), b"critical-government-data");
    assert!(security_layer
        .validate_ffi_operation("generate_compliance_report", SecurityLevel::Secret)
        .expect("FFI validation should succeed"));

    // Performance monitoring
    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");
    performance_monitor
        .collect_system_metrics()
        .expect("collecting system metrics should succeed");
    performance_monitor
        .record_metric(MetricType::Latency {
            operation: "integration.workflow".to_string(),
            duration_ms: 18.5,
        })
        .expect("metric recording should succeed");
    let component_health = performance_monitor
        .get_component_health_summary()
        .expect("component health summary should be present");
    assert!(component_health.len() >= 0);
}

#[tokio::test]
async fn benchmark_government_performance_standards() {
    let mut valuation_kernel = ValuationKernel::new(base_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel, "BEN");

    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");

    let iterations = 60;
    let mut timings = Vec::with_capacity(iterations);
    let start = Instant::now();
    for i in 0..iterations {
        let (parcel, characteristics) = build_property("BEN", i);
        let op_start = Instant::now();
        let valuation = valuation_kernel
            .value_property(
                &parcel,
                &characteristics,
                PropertyClass::Residential,
                vec![ValuationMethod::SalesComparison],
            )
            .expect("valuation should succeed");
        assert!(valuation.estimated_market_value > Decimal::ZERO);
        timings.push(op_start.elapsed().as_millis() as f64);
    }
    let duration = start.elapsed();
    let average_ms = timings.iter().sum::<f64>() / timings.len() as f64;

    performance_monitor
        .record_metric(MetricType::Latency {
            operation: "benchmark.valuation".to_string(),
            duration_ms: average_ms,
        })
        .expect("metric recording should succeed");

    assert!(average_ms <= 120.0, "average valuation must stay under 120ms");
    assert!(duration.as_secs_f64() <= 10.0, "benchmark should complete promptly");
}
