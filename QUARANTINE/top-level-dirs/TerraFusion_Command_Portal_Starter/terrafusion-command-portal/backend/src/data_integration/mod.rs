/// Real Benton County Data Integration Module
/// 
/// This module handles ETL (Extract, Transform, Load) of real government data
/// from SQLite databases including:
/// - 89,447 property parcels with assessments
/// - 89,447 tax bills and valuations
/// - Multiple government service databases (parks, permits, payroll, etc.)

pub mod data_loader;
pub mod property_service;
pub mod assessment_service;
pub mod federation_service;

pub use data_loader::DataLoader;
pub use property_service::PropertyService;
pub use assessment_service::AssessmentService;
pub use federation_service::FederationService;

use serde::{Deserialize, Serialize};

/// Real Benton County Property Record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BentonProperty {
    pub parcel_id: String,
    pub parcel_number: String,
    pub situs_address: String,
    pub situs_city: String,
    pub situs_state: String,
    pub situs_zip: String,
    pub legal_description: String,
    pub owner1_name: Option<String>,
    pub owner2_name: Option<String>,
    pub land_area: Option<f64>,
    pub land_units: Option<String>,
    pub zoning: Option<String>,
    pub use_code: Option<String>,
    pub use_description: Option<String>,
    pub year_built: Option<i32>,
    pub building_sqft: Option<f64>,
    pub total_market_value: Option<f64>,
    pub land_value: Option<f64>,
    pub improvement_value: Option<f64>,
    pub assessed_value: Option<f64>,
    pub tax_year: Option<i32>,
    pub created_date: Option<String>,
    pub modified_date: Option<String>,
}

/// Real Benton County Assessment Record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BentonAssessment {
    pub assessment_id: String,
    pub parcel_id: String,
    pub tax_year: i32,
    pub assessment_date: String,
    pub assessor_name: Option<String>,
    pub land_value: Option<f64>,
    pub improvement_value: Option<f64>,
    pub total_value: Option<f64>,
    pub assessed_value: Option<f64>,
    pub exemptions: Option<f64>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

/// Real Benton County Tax Bill Record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BentonTaxBill {
    pub bill_id: String,
    pub parcel_id: String,
    pub tax_year: i32,
    pub bill_date: String,
    pub due_date: String,
    pub total_tax: Option<f64>,
    pub county_tax: Option<f64>,
    pub city_tax: Option<f64>,
    pub school_tax: Option<f64>,
    pub fire_district_tax: Option<f64>,
    pub special_assessments: Option<f64>,
    pub paid_amount: Option<f64>,
    pub payment_date: Option<String>,
    pub status: Option<String>,
    pub penalty: Option<f64>,
    pub interest: Option<f64>,
}

/// Federated County Data (for multi-county federation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FederatedCountyData {
    pub county_name: String,
    pub state: String,
    pub total_properties: usize,
    pub total_valuations: f64,
    pub average_assessment: f64,
    pub data_source: String,
    pub last_updated: String,
}

/// Statistics for data integration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataIntegrationStats {
    pub total_properties_loaded: usize,
    pub total_assessments_loaded: usize,
    pub total_tax_bills_loaded: usize,
    pub total_government_records: usize,
    pub data_load_timestamp: String,
    pub benton_county_active: bool,
    pub federated_counties: Vec<String>,
    pub last_sync: String,
}
