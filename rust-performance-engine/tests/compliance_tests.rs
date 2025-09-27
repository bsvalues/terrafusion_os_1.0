//! Compliance-focused tests validating security and operational guarantees.

use std::collections::HashMap;

use performance_monitor::{MetricType, MonitoringLevel, PerformanceMonitor};
use rust_decimal::{prelude::ToPrimitive, Decimal};
use security_layer::{CryptoAlgorithm, SecurityLayer, SecurityLevel};
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
    for i in 0..3 {
        let sale = ComparableSale {
            sale_id: Uuid::new_v4(),
            parcel_id: format!("{}{:06}", prefix, i),
            sale_date: NaiveDate::from_ymd_opt(2024, 1 + (i as u32), 10).unwrap(),
            sale_price: Decimal::new(320_000 + (i as i64 * 4_000), 0),
            verified: true,
            property_characteristics: PropertyCharacteristics {
                lot_size_sq_ft: Decimal::new(6800 + (i as i64 * 40), 0),
                building_area_sq_ft: Decimal::new(2300 + (i as i64 * 30), 0),
                year_built: 2011 + i as u16,
                bedrooms: 4,
                bathrooms: Decimal::new(23 + (i as i64), 1),
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

fn build_property(prefix: &str) -> (PropertyParcel, PropertyCharacteristics) {
    let parcel = PropertyParcel {
        parcel_id: format!("{}{:06}", prefix, 9001),
        county_id: "HARRIS".to_string(),
        area_sq_feet: 6900.0,
        assessed_value: 330_000.0,
        market_value: 345_000.0,
        centroid_x: -95.35,
        centroid_y: 29.78,
    };

    let characteristics = PropertyCharacteristics {
        lot_size_sq_ft: Decimal::new(6900, 0),
        building_area_sq_ft: Decimal::new(2350, 0),
        year_built: 2014,
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
async fn fisma_encryption_roundtrip() {
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let payload = b"fisma-critical-record";

    for level in [SecurityLevel::Confidential, SecurityLevel::Secret, SecurityLevel::TopSecret] {
        let encrypted = security_layer
            .encrypt(payload, level, Some(CryptoAlgorithm::Aes256Gcm))
            .expect("encryption should succeed");
        let decrypted = security_layer
            .decrypt(&encrypted)
            .expect("decryption should succeed");
        assert_eq!(decrypted.as_slice(), payload);
    }
}

#[tokio::test]
async fn ffi_validation_matrix() {
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let approved_functions = [
        "get_property_valuation",
        "generate_compliance_report",
        "encrypt_sensitive_data",
    ];
    for function in approved_functions {
        assert!(security_layer
            .validate_ffi_operation(function, SecurityLevel::Confidential)
            .expect("FFI validation should succeed"));
    }

    let denied = security_layer
        .validate_ffi_operation("unauthorized_function", SecurityLevel::Secret)
        .expect("validation should run");
    assert!(!denied, "unauthorized functions should be rejected");
}

#[tokio::test]
async fn compliance_report_includes_required_sections() {
    let security_layer = SecurityLayer::new(None).expect("security layer should initialize");
    let payload = b"audit-entry";
    let encrypted = security_layer
        .encrypt(payload, SecurityLevel::Secret, None)
        .expect("encryption should succeed");
    let _ = security_layer.decrypt(&encrypted).expect("decryption should succeed");

    let report = security_layer
        .generate_compliance_report()
        .expect("compliance report should be generated");
    assert!(report.contains("TerraFusion OS Security Compliance Report"));
    assert!(report.contains("Security Operations Summary"));
    assert!(report.contains("Security Level Distribution"));
}

#[tokio::test]
async fn valuation_and_monitoring_compliance() {
    let mut valuation_kernel = ValuationKernel::new(default_market_conditions())
        .expect("valuation kernel should initialize");
    load_sample_comparables(&mut valuation_kernel, "COM");
    let (parcel, characteristics) = build_property("COM");

    let valuation = valuation_kernel
        .value_property(
            &parcel,
            &characteristics,
            PropertyClass::Residential,
            vec![ValuationMethod::SalesComparison],
        )
        .expect("valuation should succeed");
    assert!(valuation.estimated_market_value > Decimal::ZERO);

    let performance_monitor = PerformanceMonitor::new(MonitoringLevel::Government)
        .expect("performance monitor should initialize");
    performance_monitor
        .collect_system_metrics()
        .expect("system metrics collection should succeed");

    let mut labels = HashMap::new();
    labels.insert("parcel_id".to_string(), parcel.parcel_id.clone());
    performance_monitor
        .record_metric(MetricType::Custom {
            name: "compliance.valuation".to_string(),
            value: valuation
                .estimated_market_value
                .to_f64()
                .unwrap_or(0.0),
            labels,
        })
        .expect("metric recording should succeed");
}
