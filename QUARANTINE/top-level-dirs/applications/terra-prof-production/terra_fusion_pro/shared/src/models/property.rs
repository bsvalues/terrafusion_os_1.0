use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use validator::Validate;

/// Represents a property in the TerraFusionPro platform
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Property {
    /// Unique identifier for the property
    pub id: Uuid,
    
    /// Property address information
    pub address: Address,
    
    /// Property characteristics
    pub characteristics: PropertyCharacteristics,
    
    /// Property valuation information
    pub valuation: Option<PropertyValuation>,
    
    /// When the property was created in the system
    pub created_at: DateTime<Utc>,
    
    /// When the property was last updated
    pub updated_at: DateTime<Utc>,
}

/// Represents a physical address
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Address {
    /// Street address line 1
    #[validate(length(min = 1, max = 100))]
    pub street1: String,
    
    /// Street address line 2 (optional)
    #[validate(length(max = 100))]
    pub street2: Option<String>,
    
    /// City name
    #[validate(length(min = 1, max = 50))]
    pub city: String,
    
    /// State or province
    #[validate(length(min = 1, max = 50))]
    pub state: String,
    
    /// Postal or ZIP code
    #[validate(length(min = 1, max = 20))]
    pub postal_code: String,
    
    /// Country
    #[validate(length(min = 1, max = 50))]
    pub country: String,
    
    /// Latitude coordinate (optional)
    pub latitude: Option<f64>,
    
    /// Longitude coordinate (optional)
    pub longitude: Option<f64>,
}

/// Represents property characteristics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyCharacteristics {
    /// Property type (e.g., Single Family, Condo, etc.)
    pub property_type: PropertyType,
    
    /// Year the property was built
    pub year_built: Option<i32>,
    
    /// Total living area in square feet
    pub square_feet: Option<f64>,
    
    /// Number of bedrooms
    pub bedrooms: Option<i32>,
    
    /// Number of bathrooms
    pub bathrooms: Option<f64>,
    
    /// Lot size in square feet or acres
    pub lot_size: Option<f64>,
    
    /// Whether lot size is in square feet (true) or acres (false)
    pub lot_size_in_sqft: Option<bool>,
    
    /// Number of parking spots
    pub parking: Option<i32>,
    
    /// Number of stories/floors
    pub stories: Option<i32>,
    
    /// Whether the property has a basement
    pub has_basement: Option<bool>,
    
    /// Whether the property has a pool
    pub has_pool: Option<bool>,
    
    /// Additional property features as key-value pairs
    pub features: Option<serde_json::Value>,
}

/// Enumeration of property types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PropertyType {
    SingleFamily,
    Condo,
    Townhouse,
    MultiFamily,
    Land,
    Commercial,
    Industrial,
    Agricultural,
    Other,
}

/// Represents property valuation information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyValuation {
    /// Estimated market value
    pub market_value: f64,
    
    /// Confidence level in the valuation (0-100)
    pub confidence: Option<i32>,
    
    /// Valuation method used
    pub valuation_method: ValuationMethod,
    
    /// When the valuation was performed
    pub valuation_date: DateTime<Utc>,
    
    /// ID of the appraiser who performed the valuation
    pub appraiser_id: Option<Uuid>,
}

/// Enumeration of valuation methods
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ValuationMethod {
    SalesComparison,
    IncomeApproach,
    CostApproach,
    Automated,
    Combined,
}

/// Property request for creating a new property
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreatePropertyRequest {
    /// Property address information
    #[validate]
    pub address: Address,
    
    /// Property characteristics
    pub characteristics: PropertyCharacteristics,
    
    /// Property valuation information (optional)
    pub valuation: Option<PropertyValuation>,
}

/// Property query parameters for searching properties
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyQuery {
    /// Filter by city
    pub city: Option<String>,
    
    /// Filter by state
    pub state: Option<String>,
    
    /// Filter by postal code
    pub postal_code: Option<String>,
    
    /// Filter by property type
    pub property_type: Option<PropertyType>,
    
    /// Minimum square footage
    pub min_square_feet: Option<f64>,
    
    /// Maximum square footage
    pub max_square_feet: Option<f64>,
    
    /// Minimum number of bedrooms
    pub min_bedrooms: Option<i32>,
    
    /// Maximum number of bedrooms
    pub max_bedrooms: Option<i32>,
    
    /// Minimum number of bathrooms
    pub min_bathrooms: Option<f64>,
    
    /// Maximum number of bathrooms
    pub max_bathrooms: Option<f64>,
    
    /// Minimum year built
    pub min_year_built: Option<i32>,
    
    /// Maximum year built
    pub max_year_built: Option<i32>,
    
    /// Minimum valuation
    pub min_value: Option<f64>,
    
    /// Maximum valuation
    pub max_value: Option<f64>,
    
    /// Pagination: page number (1-based)
    pub page: Option<i32>,
    
    /// Pagination: items per page
    pub limit: Option<i32>,
}