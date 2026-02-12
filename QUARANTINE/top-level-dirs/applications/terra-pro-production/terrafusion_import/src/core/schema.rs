use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TerraFusionComp {
    pub id: Option<String>,
    pub address: String,
    pub sale_price_usd: f64,
    pub gla_sqft: u32,
    pub sale_date: String,
    pub source_table: String,
    pub source_file: String,
    pub property_type: Option<String>,
    pub bedrooms: Option<u32>,
    pub bathrooms: Option<f32>,
    pub year_built: Option<u32>,
    pub lot_size: Option<f64>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip_code: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

impl Default for TerraFusionComp {
    fn default() -> Self {
        Self {
            id: None,
            address: String::new(),
            sale_price_usd: 0.0,
            gla_sqft: 0,
            sale_date: String::new(),
            source_table: String::new(),
            source_file: String::new(),
            property_type: None,
            bedrooms: None,
            bathrooms: None,
            year_built: None,
            lot_size: None,
            city: None,
            state: None,
            zip_code: None,
            metadata: None,
        }
    }
}