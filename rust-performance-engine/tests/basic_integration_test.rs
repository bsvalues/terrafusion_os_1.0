//! Basic integration validation for the TerraFusion Rust performance engine.

use std::time::SystemTime;

use agent_coordination::{
    Agent,
    AgentCoordinationEngine,
    AgentPerformanceMetrics,
    AgentStatus,
    AgentType,
    ConsciousnessLevel,
};
use chrono::NaiveDate;
use geospatial_engine::PropertyParcel;
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

fn sample_market_conditions() -> MarketConditions {
    MarketConditions::default()
}

fn sample_property_parcel() -> PropertyParcel {
    PropertyParcel {
        parcel_id: "TES123456".to_string(),
        county_id: "HARRIS".to_string(),
        area_sq_feet: 7200.0,
        assessed_value: 310_000.0,
        market_value: 325_000.0,
        centroid_x: -95.3698,
        centroid_y: 29.7604,
    }
}

fn sample_property_characteristics() -> PropertyCharacteristics {
    PropertyCharacteristics {
        lot_size_sq_ft: Decimal::new(7200, 0),
        building_area_sq_ft: Decimal::new(2400, 0),
        year_built: 2012,
        bedrooms: 4,
        bathrooms: Decimal::new(25, 1),
        garage_spaces: 2,
        basement: false,
        pool: true,
        fireplace_count: 1,
        condition: PropertyCondition::Good,
        quality: PropertyQuality::AboveAverage,
        construction_type: "masonry".to_string(),
        roof_type: "composition_shingle".to_string(),
        heating_system: "gas_forced_air".to_string(),
        cooling_system: "central_air".to_string(),
    }
}

fn load_sample_comparables(kernel: &mut ValuationKernel) {
    let mut sales = Vec::new();
    for i in 0..3 {
        let sale = ComparableSale {
            sale_id: Uuid::new_v4(),
            parcel_id: format!("TES{:06}", i),
            sale_date: NaiveDate::from_ymd_opt(2024, 1 + i as u32, 15).unwrap(),
            sale_price: Decimal::new(315_000 + (i as i64 * 5_000), 0),
            verified: true,
            property_characteristics: PropertyCharacteristics {
                lot_size_sq_ft: Decimal::new(7000 + (i as i64 * 50), 0),
                building_area_sq_ft: Decimal::new(2350 + (i as i64 * 25), 0),
                year_built: 2010 + i as u16,
                bedrooms: 4,
                bathrooms: Decimal::new(23 + (i as i64 * 2), 1),
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

fn sample_agent() -> Agent {
    Agent {
        id: Uuid::new_v4(),
        agent_type: AgentType::ProcessCoordinator,
        tier: 2,
        status: AgentStatus::Active,
        capabilities: vec!["valuation".to_string(), "compliance".to_string()],
        assignments: vec!["integration-test".to_string()],
        consciousness: ConsciousnessLevel::Foundational,
        quantum_entanglement: Vec::new(),
        performance_metrics: AgentPerformanceMetrics::default(),
        last_activity: SystemTime::now(),
    }
}

#[tokio::test]
async fn basic_integration_smoke_test() {
    // Agent coordination
    let agent_engine = AgentCoordinationEngine::new().expect("agent engine should initialize");
    agent_engine
        .register_agent(sample_agent())
        .await
        .expect("agent registration should succeed");
    let swarm_metrics = agent_engine.get_swarm_metrics().await;
    assert_eq!(swarm_metrics.total_agents, 1, "exactly one agent should be registered");

    // Property valuation
    let mut valuation_kernel = ValuationKernel::new(sample_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel);
    let parcel = sample_property_parcel();
    let characteristics = sample_property_characteristics();
    let valuation = valuation_kernel
        .value_property(
            &parcel,
            &characteristics,
            PropertyClass::Residential,
            vec![ValuationMethod::SalesComparison],
        )
        .expect("valuation should succeed");
    assert!(valuation.estimated_market_value > Decimal::ZERO);

    // Security layer – encrypt/decrypt and validate FFI access
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let payload = b"fisma-ready";
    let encrypted = security_layer
        .encrypt(payload, SecurityLevel::Confidential, None)
        .expect("encryption should succeed");
    let decrypted = security_layer.decrypt(&encrypted).expect("decryption should succeed");
    assert_eq!(decrypted.as_slice(), payload);
    assert!(security_layer
        .validate_ffi_operation("get_property_valuation", SecurityLevel::Confidential)
        .expect("FFI validation should succeed"));

    // Performance monitoring – record and collect metrics
    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");
    performance_monitor
        .collect_system_metrics()
        .expect("system metrics collection should succeed");
    performance_monitor
        .record_metric(MetricType::Latency {
            operation: "integration_test".to_string(),
            duration_ms: 12.0,
        })
        .expect("metric recording should succeed");
    let _component_health = performance_monitor
        .get_component_health_summary()
        .expect("component summary should be available");
}
