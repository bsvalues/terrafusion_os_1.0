//! Core system integration tests for the TerraFusion Rust performance engine.

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

fn default_market_conditions() -> MarketConditions {
    MarketConditions::default()
}

fn sample_agent(agent_type: AgentType) -> Agent {
    Agent {
        id: Uuid::new_v4(),
        agent_type,
        tier: 1,
        status: AgentStatus::Active,
        capabilities: vec!["valuation".to_string(), "compliance".to_string()],
        assignments: vec!["core-system".to_string()],
        consciousness: ConsciousnessLevel::Adaptive,
        quantum_entanglement: Vec::new(),
        performance_metrics: AgentPerformanceMetrics::default(),
        last_activity: SystemTime::now(),
    }
}

fn load_comparables(kernel: &mut ValuationKernel, prefix: &str) {
    let mut sales = Vec::new();
    for i in 0..3 {
        let sale = ComparableSale {
            sale_id: Uuid::new_v4(),
            parcel_id: format!("{}{:06}", prefix, i),
            sale_date: NaiveDate::from_ymd_opt(2023, 11 - i as u32, 20).unwrap(),
            sale_price: Decimal::new(335_000 + (i as i64 * 5_000), 0),
            verified: true,
            property_characteristics: PropertyCharacteristics {
                lot_size_sq_ft: Decimal::new(7000 + (i as i64 * 60), 0),
                building_area_sq_ft: Decimal::new(2400 + (i as i64 * 35), 0),
                year_built: 2010 + i as u16,
                bedrooms: 4,
                bathrooms: Decimal::new(24 + (i as i64), 1),
                garage_spaces: 2,
                basement: false,
                pool: i % 2 == 0,
                fireplace_count: 1,
                condition: PropertyCondition::Good,
                quality: PropertyQuality::AboveAverage,
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

fn sample_property(prefix: &str) -> (PropertyParcel, PropertyCharacteristics) {
    let parcel = PropertyParcel {
        parcel_id: format!("{}{:06}", prefix, 5001),
        county_id: "HARRIS".to_string(),
        area_sq_feet: 7100.0,
        assessed_value: 340_000.0,
        market_value: 356_000.0,
        centroid_x: -95.36,
        centroid_y: 29.77,
    };

    let characteristics = PropertyCharacteristics {
        lot_size_sq_ft: Decimal::new(7100, 0),
        building_area_sq_ft: Decimal::new(2450, 0),
        year_built: 2013,
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
    };

    (parcel, characteristics)
}

#[tokio::test]
async fn test_terrafusion_elite_system_integration() {
    let start = Instant::now();

    // Agent coordination
    let agent_engine = Arc::new(AgentCoordinationEngine::new().expect("agent engine should initialize"));
    agent_engine
        .register_agent(sample_agent(AgentType::ProcessCoordinator))
        .await
        .expect("agent registration should succeed");
    agent_engine
        .register_agent(sample_agent(AgentType::ExpertSpecialist))
        .await
        .expect("agent registration should succeed");
    let swarm_metrics = agent_engine.get_swarm_metrics().await;
    assert_eq!(swarm_metrics.total_agents, 2);

    // Geospatial indexing
    let mut geospatial_engine = GeospatialEngine::new().expect("geospatial engine should initialize");
    geospatial_engine
        .load_harris_pacs_data()
        .expect("sample PACS data should load");
    let spatial = geospatial_engine
        .spatial_query(-95.5, 29.7, -95.3, 29.9, 8)
        .expect("spatial query should succeed");
    assert!(!spatial.parcels.is_empty());

    // Valuation pipeline
    let mut valuation_kernel = ValuationKernel::new(default_market_conditions())
        .expect("valuation kernel should initialize");
    load_comparables(&mut valuation_kernel, "SYS");
    let (parcel, characteristics) = sample_property("SYS");
    let valuation = valuation_kernel
        .value_property(
            &parcel,
            &characteristics,
            PropertyClass::Residential,
            vec![ValuationMethod::SalesComparison, ValuationMethod::AutomatedValuationModel],
        )
        .expect("valuation should succeed");
    assert!(valuation.estimated_market_value > Decimal::ZERO);

    // Security validation
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let encrypted = security_layer
        .encrypt(b"core-system-payload", SecurityLevel::Secret, None)
        .expect("encryption should succeed");
    let decrypted = security_layer
        .decrypt(&encrypted)
        .expect("decryption should succeed");
    assert_eq!(decrypted.as_slice(), b"core-system-payload");

    // Performance monitoring
    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");
    performance_monitor
        .collect_system_metrics()
        .expect("system metrics should collect");
    performance_monitor
        .record_metric(MetricType::Latency {
            operation: "core.integration".to_string(),
            duration_ms: start.elapsed().as_millis() as f64,
        })
        .expect("metric recording should succeed");

    assert!(start.elapsed().as_secs() < 15, "core system should initialize quickly");
}

#[tokio::test]
async fn test_error_handling_and_resilience() {
    let valuation_kernel = ValuationKernel::new(default_market_conditions())
        .expect("valuation kernel should initialize");

    // Intentionally missing comparables
    let (parcel, characteristics) = sample_property("ERR");
    let result = valuation_kernel.value_property(
        &parcel,
        &characteristics,
        PropertyClass::Residential,
        vec![ValuationMethod::SalesComparison],
    );

    assert!(result.is_err(), "valuation should fail when comparables are missing");
}
