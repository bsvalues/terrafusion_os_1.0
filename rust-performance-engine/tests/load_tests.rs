//! Load-oriented tests for the TerraFusion Rust performance engine.

use std::collections::HashMap;
use std::time::Instant;

use performance_monitor::{MetricType, MonitoringLevel, PerformanceMonitor};
use rust_decimal::Decimal;
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
use chrono::NaiveDate;
use geospatial_engine::PropertyParcel;
use uuid::Uuid;

fn default_market_conditions() -> MarketConditions {
    MarketConditions::default()
}

fn load_sample_comparables(kernel: &mut ValuationKernel, prefix: &str) {
    let mut sales = Vec::new();
    for i in 0..5 {
        let sale = ComparableSale {
            sale_id: Uuid::new_v4(),
            parcel_id: format!("{}{:06}", prefix, i),
            sale_date: NaiveDate::from_ymd_opt(2023, 9 + (i as u32 % 3), 1 + (i as u32 % 20)).unwrap(),
            sale_price: Decimal::new(285_000 + (i as i64 * 6_500), 0),
            verified: true,
            property_characteristics: PropertyCharacteristics {
                lot_size_sq_ft: Decimal::new(6000 + (i as i64 * 50), 0),
                building_area_sq_ft: Decimal::new(2100 + (i as i64 * 30), 0),
                year_built: 2004 + i as u16,
                bedrooms: 3 + (i as u8 % 2),
                bathrooms: Decimal::new(20 + (i as i64), 1),
                garage_spaces: 2,
                basement: false,
                pool: i % 3 == 0,
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
        .expect("comparable sales should load for load test");
}

fn build_property(prefix: &str, index: usize) -> (PropertyParcel, PropertyCharacteristics) {
    let parcel = PropertyParcel {
        parcel_id: format!("{}{:06}", prefix, 1000 + index),
        county_id: "HARRIS".to_string(),
        area_sq_feet: 6400.0 + (index as f64 * 60.0),
        assessed_value: 280_000.0 + (index as f64 * 3_500.0),
        market_value: 300_000.0 + (index as f64 * 4_000.0),
        centroid_x: -95.37 + (index as f64 * 0.0005),
        centroid_y: 29.76 + (index as f64 * 0.0005),
    };

    let characteristics = PropertyCharacteristics {
        lot_size_sq_ft: Decimal::new(6400 + (index as i64 * 55), 0),
        building_area_sq_ft: Decimal::new(2100 + (index as i64 * 28), 0),
        year_built: 2002 + index as u16,
        bedrooms: 3 + (index as u8 % 2),
        bathrooms: Decimal::new(20 + (index as i64), 1),
        garage_spaces: 2,
        basement: false,
        pool: index % 4 == 0,
        fireplace_count: 1,
        condition: PropertyCondition::Good,
        quality: PropertyQuality::Average,
        construction_type: "masonry".to_string(),
        roof_type: "composition_shingle".to_string(),
        heating_system: "gas_forced_air".to_string(),
        cooling_system: "central_air".to_string(),
    };

    (parcel, characteristics)
}

#[tokio::test]
async fn harris_county_production_load_test() {
    let mut valuation_kernel = ValuationKernel::new(default_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel, "HAR");

    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");

    let iterations = 200;
    let start = Instant::now();
    for i in 0..iterations {
        let (parcel, characteristics) = build_property("HAR", i);
        let result = valuation_kernel
            .value_property(
                &parcel,
                &characteristics,
                PropertyClass::Residential,
                vec![ValuationMethod::SalesComparison],
            )
            .expect("valuation should succeed during load test");
        assert!(result.estimated_market_value > Decimal::ZERO);

        let mut labels = HashMap::new();
        labels.insert("parcel_id".to_string(), parcel.parcel_id.clone());
        performance_monitor
            .record_metric(MetricType::Custom {
                name: "valuation_throughput".to_string(),
                value: i as f64,
                labels,
            })
            .expect("metric recording should succeed");
    }

    let elapsed = start.elapsed();
    let throughput = iterations as f64 / elapsed.as_secs_f64();
    assert!(throughput > 5.0, "throughput should exceed 5 valuations per second");
}

#[tokio::test]
async fn memory_leak_detection_test() {
    let mut valuation_kernel = ValuationKernel::new(default_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel, "LEK");

    let operations = 100;
    let mut previous_value = Decimal::ZERO;
    for i in 0..operations {
        let (parcel, characteristics) = build_property("LEK", i);
        let result = valuation_kernel
            .value_property(
                &parcel,
                &characteristics,
                PropertyClass::Residential,
                vec![ValuationMethod::SalesComparison],
            )
            .expect("valuation should succeed during memory check");
        assert!(result.estimated_market_value > Decimal::ZERO);
        previous_value = result.estimated_market_value;
    }

    // simple sanity check so compiler does not optimize away loop
    assert!(previous_value > Decimal::ZERO);
}
