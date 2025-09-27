// Property Valuation System - Advanced real estate valuation algorithms

use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValuationRequest {
    pub property_id: String,
    pub location: String,
    pub property_details: serde_json::Value,
    pub valuation_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyValuation {
    pub property_id: String,
    pub estimated_value: f64,
    pub valuation_date: String,
    pub confidence_score: f64,
    pub methodology: String,
    pub comparable_properties: Vec<String>,
    pub market_factors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyMetrics {
    pub square_footage: f64,
    pub lot_size: f64,
    pub bedrooms: i32,
    pub bathrooms: f64,
    pub year_built: i32,
    pub property_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketComparable {
    pub property_id: String,
    pub sale_price: f64,
    pub sale_date: String,
    pub similarity_score: f64,
    pub adjustments: Vec<PropertyAdjustment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyAdjustment {
    pub feature: String,
    pub adjustment_amount: f64,
    pub reasoning: String,
}