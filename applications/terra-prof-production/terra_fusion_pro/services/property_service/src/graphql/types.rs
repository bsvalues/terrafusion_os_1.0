use async_graphql::{SimpleObject, InputObject, Enum};
use chrono::{DateTime, Utc};
use shared::models::property::{PropertyType as ModelPropertyType, ValuationMethod as ModelValuationMethod};
use uuid::Uuid;

/// GraphQL representation of a property
#[derive(SimpleObject)]
pub struct Property {
    pub id: Uuid,
    pub address: Address,
    pub characteristics: PropertyCharacteristics,
    pub valuation: Option<PropertyValuation>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// GraphQL representation of an address
#[derive(SimpleObject)]
pub struct Address {
    pub street1: String,
    pub street2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// GraphQL representation of property characteristics
#[derive(SimpleObject)]
pub struct PropertyCharacteristics {
    pub property_type: PropertyType,
    pub year_built: Option<i32>,
    pub square_feet: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<f64>,
    pub lot_size: Option<f64>,
    pub lot_size_in_sqft: Option<bool>,
    pub parking: Option<i32>,
    pub stories: Option<i32>,
    pub has_basement: Option<bool>,
    pub has_pool: Option<bool>,
    pub features: Option<String>, // JSON as string
}

/// GraphQL representation of property valuation
#[derive(SimpleObject)]
pub struct PropertyValuation {
    pub market_value: f64,
    pub confidence: Option<i32>,
    pub valuation_method: ValuationMethod,
    pub valuation_date: DateTime<Utc>,
    pub appraiser_id: Option<Uuid>,
}

/// GraphQL enum for property types
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
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

/// GraphQL enum for valuation methods
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ValuationMethod {
    SalesComparison,
    IncomeApproach,
    CostApproach,
    Automated,
    Combined,
}

/// Input type for creating a property
#[derive(InputObject)]
pub struct PropertyInput {
    pub address: AddressInput,
    pub characteristics: PropertyCharacteristicsInput,
    pub valuation: Option<PropertyValuationInput>,
}

/// Input type for an address
#[derive(InputObject)]
pub struct AddressInput {
    pub street1: String,
    pub street2: Option<String>,
    pub city: String,
    pub state: String,
    pub postal_code: String,
    pub country: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// Input type for property characteristics
#[derive(InputObject)]
pub struct PropertyCharacteristicsInput {
    pub property_type: PropertyType,
    pub year_built: Option<i32>,
    pub square_feet: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<f64>,
    pub lot_size: Option<f64>,
    pub lot_size_in_sqft: Option<bool>,
    pub parking: Option<i32>,
    pub stories: Option<i32>,
    pub has_basement: Option<bool>,
    pub has_pool: Option<bool>,
    pub features: Option<String>, // JSON as string
}

/// Input type for property valuation
#[derive(InputObject)]
pub struct PropertyValuationInput {
    pub market_value: f64,
    pub confidence: Option<i32>,
    pub valuation_method: ValuationMethod,
    pub valuation_date: Option<DateTime<Utc>>,
    pub appraiser_id: Option<Uuid>,
}

/// Input type for querying properties
#[derive(InputObject)]
pub struct PropertyQueryInput {
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub property_type: Option<PropertyType>,
    pub min_square_feet: Option<f64>,
    pub max_square_feet: Option<f64>,
    pub min_bedrooms: Option<i32>,
    pub max_bedrooms: Option<i32>,
    pub min_bathrooms: Option<f64>,
    pub max_bathrooms: Option<f64>,
    pub min_year_built: Option<i32>,
    pub max_year_built: Option<i32>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

/// Conversion functions between GraphQL and domain model types
impl From<shared::models::property::Property> for Property {
    fn from(p: shared::models::property::Property) -> Self {
        Self {
            id: p.id,
            address: p.address.into(),
            characteristics: p.characteristics.into(),
            valuation: p.valuation.map(|v| v.into()),
            created_at: p.created_at,
            updated_at: p.updated_at,
        }
    }
}

impl From<shared::models::property::Address> for Address {
    fn from(a: shared::models::property::Address) -> Self {
        Self {
            street1: a.street1,
            street2: a.street2,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            country: a.country,
            latitude: a.latitude,
            longitude: a.longitude,
        }
    }
}

impl From<shared::models::property::PropertyCharacteristics> for PropertyCharacteristics {
    fn from(c: shared::models::property::PropertyCharacteristics) -> Self {
        Self {
            property_type: c.property_type.into(),
            year_built: c.year_built,
            square_feet: c.square_feet,
            bedrooms: c.bedrooms,
            bathrooms: c.bathrooms,
            lot_size: c.lot_size,
            lot_size_in_sqft: c.lot_size_in_sqft,
            parking: c.parking,
            stories: c.stories,
            has_basement: c.has_basement,
            has_pool: c.has_pool,
            features: c.features.map(|f| f.to_string()),
        }
    }
}

impl From<shared::models::property::PropertyValuation> for PropertyValuation {
    fn from(v: shared::models::property::PropertyValuation) -> Self {
        Self {
            market_value: v.market_value,
            confidence: v.confidence,
            valuation_method: v.valuation_method.into(),
            valuation_date: v.valuation_date,
            appraiser_id: v.appraiser_id,
        }
    }
}

impl From<ModelPropertyType> for PropertyType {
    fn from(pt: ModelPropertyType) -> Self {
        match pt {
            ModelPropertyType::SingleFamily => PropertyType::SingleFamily,
            ModelPropertyType::Condo => PropertyType::Condo,
            ModelPropertyType::Townhouse => PropertyType::Townhouse,
            ModelPropertyType::MultiFamily => PropertyType::MultiFamily,
            ModelPropertyType::Land => PropertyType::Land,
            ModelPropertyType::Commercial => PropertyType::Commercial,
            ModelPropertyType::Industrial => PropertyType::Industrial,
            ModelPropertyType::Agricultural => PropertyType::Agricultural,
            ModelPropertyType::Other => PropertyType::Other,
        }
    }
}

impl From<ModelValuationMethod> for ValuationMethod {
    fn from(vm: ModelValuationMethod) -> Self {
        match vm {
            ModelValuationMethod::SalesComparison => ValuationMethod::SalesComparison,
            ModelValuationMethod::IncomeApproach => ValuationMethod::IncomeApproach,
            ModelValuationMethod::CostApproach => ValuationMethod::CostApproach,
            ModelValuationMethod::Automated => ValuationMethod::Automated,
            ModelValuationMethod::Combined => ValuationMethod::Combined,
        }
    }
}

impl From<PropertyType> for ModelPropertyType {
    fn from(pt: PropertyType) -> Self {
        match pt {
            PropertyType::SingleFamily => ModelPropertyType::SingleFamily,
            PropertyType::Condo => ModelPropertyType::Condo,
            PropertyType::Townhouse => ModelPropertyType::Townhouse,
            PropertyType::MultiFamily => ModelPropertyType::MultiFamily,
            PropertyType::Land => ModelPropertyType::Land,
            PropertyType::Commercial => ModelPropertyType::Commercial,
            PropertyType::Industrial => ModelPropertyType::Industrial,
            PropertyType::Agricultural => ModelPropertyType::Agricultural,
            PropertyType::Other => ModelPropertyType::Other,
        }
    }
}

impl From<ValuationMethod> for ModelValuationMethod {
    fn from(vm: ValuationMethod) -> Self {
        match vm {
            ValuationMethod::SalesComparison => ModelValuationMethod::SalesComparison,
            ValuationMethod::IncomeApproach => ModelValuationMethod::IncomeApproach,
            ValuationMethod::CostApproach => ModelValuationMethod::CostApproach,
            ValuationMethod::Automated => ModelValuationMethod::Automated,
            ValuationMethod::Combined => ModelValuationMethod::Combined,
        }
    }
}

impl From<AddressInput> for shared::models::property::Address {
    fn from(a: AddressInput) -> Self {
        Self {
            street1: a.street1,
            street2: a.street2,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            country: a.country,
            latitude: a.latitude,
            longitude: a.longitude,
        }
    }
}

impl From<PropertyCharacteristicsInput> for shared::models::property::PropertyCharacteristics {
    fn from(c: PropertyCharacteristicsInput) -> Self {
        Self {
            property_type: c.property_type.into(),
            year_built: c.year_built,
            square_feet: c.square_feet,
            bedrooms: c.bedrooms,
            bathrooms: c.bathrooms,
            lot_size: c.lot_size,
            lot_size_in_sqft: c.lot_size_in_sqft,
            parking: c.parking,
            stories: c.stories,
            has_basement: c.has_basement,
            has_pool: c.has_pool,
            features: c.features.map(|f| serde_json::from_str(&f).unwrap_or_default()),
        }
    }
}

impl From<PropertyValuationInput> for shared::models::property::PropertyValuation {
    fn from(v: PropertyValuationInput) -> Self {
        Self {
            market_value: v.market_value,
            confidence: v.confidence,
            valuation_method: v.valuation_method.into(),
            valuation_date: v.valuation_date.unwrap_or_else(Utc::now),
            appraiser_id: v.appraiser_id,
        }
    }
}

impl From<PropertyInput> for shared::models::property::CreatePropertyRequest {
    fn from(p: PropertyInput) -> Self {
        Self {
            address: p.address.into(),
            characteristics: p.characteristics.into(),
            valuation: p.valuation.map(|v| v.into()),
        }
    }
}

impl From<PropertyQueryInput> for shared::models::property::PropertyQuery {
    fn from(q: PropertyQueryInput) -> Self {
        Self {
            city: q.city,
            state: q.state,
            postal_code: q.postal_code,
            property_type: q.property_type.map(|pt| pt.into()),
            min_square_feet: q.min_square_feet,
            max_square_feet: q.max_square_feet,
            min_bedrooms: q.min_bedrooms,
            max_bedrooms: q.max_bedrooms,
            min_bathrooms: q.min_bathrooms,
            max_bathrooms: q.max_bathrooms,
            min_year_built: q.min_year_built,
            max_year_built: q.max_year_built,
            min_value: q.min_value,
            max_value: q.max_value,
            page: q.page,
            limit: q.limit,
        }
    }
}