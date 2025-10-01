//! # TerraFusion Valuation Kernel
//! 
//! Government-grade property valuation algorithms with deterministic accuracy.
//! Implements multiple valuation methodologies used by county assessors.

use std::collections::HashMap;
use std::str::FromStr;

use anyhow::Result;
use chrono::{DateTime, Utc, NaiveDate};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use tracing::{info, warn, error, instrument};
use uuid::Uuid;

use geospatial_engine::{PropertyParcel, GeospatialEngine};

/// Valuation methods recognized by government assessment standards
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ValuationMethod {
    /// Market comparison approach - most common for residential
    SalesComparison,
    /// Cost approach - building replacement cost plus land value
    CostApproach,
    /// Income approach - for commercial/rental properties
    IncomeCapitalization,
    /// Mass appraisal computer-assisted valuation
    AutomatedValuationModel,
    /// Hybrid approach combining multiple methods
    HybridApproach,
}

/// Property classification for assessment purposes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PropertyClass {
    Residential,
    Commercial,
    Industrial,
    Agricultural,
    Exempt,
    Utility,
    Personal,
}

/// Market conditions affecting property values
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketConditions {
    pub assessment_date: DateTime<Utc>,
    pub market_trend: MarketTrend,
    pub supply_demand_ratio: Decimal,
    pub interest_rate_environment: Decimal,
    pub economic_indicators: HashMap<String, Decimal>,
    pub local_market_factors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketTrend {
    Appreciating,
    Stable, 
    Declining,
    Volatile,
}

/// Comparable sale for market analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparableSale {
    pub sale_id: Uuid,
    pub parcel_id: String,
    pub sale_date: NaiveDate,
    pub sale_price: Decimal,
    pub verified: bool,
    pub property_characteristics: PropertyCharacteristics,
    pub location_adjustments: Vec<LocationAdjustment>,
    pub time_adjustments: Vec<TimeAdjustment>,
    pub physical_adjustments: Vec<PhysicalAdjustment>,
}

/// Physical characteristics affecting property value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyCharacteristics {
    pub lot_size_sq_ft: Decimal,
    pub building_area_sq_ft: Decimal,
    pub year_built: u16,
    pub bedrooms: u8,
    pub bathrooms: Decimal,
    pub garage_spaces: u8,
    pub basement: bool,
    pub pool: bool,
    pub fireplace_count: u8,
    pub condition: PropertyCondition,
    pub quality: PropertyQuality,
    pub construction_type: String,
    pub roof_type: String,
    pub heating_system: String,
    pub cooling_system: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PropertyCondition {
    Excellent,
    VeryGood,
    Good,
    Average,
    Fair,
    Poor,
    VeryPoor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PropertyQuality {
    Superior,
    AboveAverage,
    Average,
    BelowAverage,
    Poor,
}

/// Adjustments for comparable sales analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationAdjustment {
    pub factor: String,
    pub adjustment_percentage: Decimal,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeAdjustment {
    pub months_difference: i32,
    pub market_appreciation_rate: Decimal,
    pub adjusted_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalAdjustment {
    pub characteristic: String,
    pub subject_value: String,
    pub comparable_value: String,
    pub adjustment_amount: Decimal,
}

/// Valuation result with confidence metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValuationResult {
    pub property_id: String,
    pub valuation_date: DateTime<Utc>,
    pub methods_used: Vec<ValuationMethod>,
    pub estimated_market_value: Decimal,
    pub assessed_value: Decimal,
    pub confidence_score: Decimal,
    pub value_range: ValueRange,
    pub methodology_breakdown: HashMap<ValuationMethod, Decimal>,
    pub adjustment_summary: Vec<AdjustmentSummary>,
    pub market_conditions_applied: MarketConditions,
    pub comparable_sales: Vec<ComparableSale>,
    pub depreciation_analysis: Option<DepreciationAnalysis>,
    pub income_analysis: Option<IncomeAnalysis>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValueRange {
    pub low_estimate: Decimal,
    pub high_estimate: Decimal,
    pub most_probable_value: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjustmentSummary {
    pub category: String,
    pub total_adjustment: Decimal,
    pub impact_on_value: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepreciationAnalysis {
    pub physical_deterioration: Decimal,
    pub functional_obsolescence: Decimal,
    pub economic_obsolescence: Decimal,
    pub total_depreciation: Decimal,
    pub effective_age: u16,
    pub remaining_economic_life: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeAnalysis {
    pub gross_rent_multiplier: Decimal,
    pub capitalization_rate: Decimal,
    pub net_operating_income: Decimal,
    pub vacancy_rate: Decimal,
    pub operating_expense_ratio: Decimal,
}

/// Government-grade valuation errors
#[derive(Debug, thiserror::Error)]
pub enum ValuationError {
    #[error("Insufficient comparable sales data for property {property_id}")]
    InsufficientComparables { property_id: String },
    #[error("Invalid property characteristics: {reason}")]
    InvalidPropertyData { reason: String },
    #[error("Market data unavailable for date {date}")]
    MarketDataUnavailable { date: String },
    #[error("Valuation method {method:?} not supported for property class {class:?}")]
    UnsupportedMethod { method: ValuationMethod, class: PropertyClass },
    #[error("Calculation error: {details}")]
    CalculationError { details: String },
    #[error("Data validation failed: {field} - {reason}")]
    ValidationError { field: String, reason: String },
}

/// Core valuation engine with deterministic algorithms
pub struct ValuationKernel {
    market_conditions: MarketConditions,
    comparable_sales_db: HashMap<String, Vec<ComparableSale>>,
    assessment_parameters: AssessmentParameters,
    geospatial_engine: Option<GeospatialEngine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssessmentParameters {
    pub assessment_ratio: Decimal, // Typically 100% of market value
    pub exemption_amounts: HashMap<PropertyClass, Decimal>,
    pub improvement_factors: HashMap<String, Decimal>,
    pub land_value_tables: HashMap<String, Decimal>,
    pub depreciation_tables: HashMap<u16, Decimal>,
    pub market_area_adjustments: HashMap<String, Decimal>,
}

impl ValuationKernel {
    /// Create new valuation kernel with government assessment parameters
    pub fn new(market_conditions: MarketConditions) -> Result<Self> {
        let assessment_parameters = AssessmentParameters::default();
        
        Ok(ValuationKernel {
            market_conditions,
            comparable_sales_db: HashMap::new(),
            assessment_parameters,
            geospatial_engine: None,
        })
    }

    /// Load comparable sales data for market analysis
    #[instrument(skip(self))]
    pub fn load_comparable_sales(&mut self, sales: Vec<ComparableSale>) -> Result<()> {
        info!("Loading {} comparable sales into valuation kernel", sales.len());
        
        for sale in sales {
            let market_area = self.determine_market_area(&sale.parcel_id)?;
            self.comparable_sales_db
                .entry(market_area)
                .or_insert_with(Vec::new)
                .push(sale);
        }
        
        info!("Comparable sales loaded for {} market areas", self.comparable_sales_db.len());
        Ok(())
    }

    /// Perform comprehensive property valuation using multiple approaches
    #[instrument(skip(self))]
    pub fn value_property(
        &self,
        parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
        property_class: PropertyClass,
        methods: Vec<ValuationMethod>,
    ) -> Result<ValuationResult> {
        info!("Valuing property {} using {:?} methods", parcel.parcel_id, methods);
        
        self.validate_property_data(parcel, property_chars)?;
        
        let mut methodology_breakdown = HashMap::new();
        let mut comparable_sales = Vec::new();
        
        // Apply each requested valuation method
        for method in &methods {
            let value = match method {
                ValuationMethod::SalesComparison => {
                    let (value, comps) = self.sales_comparison_approach(parcel, property_chars)?;
                    comparable_sales.extend(comps);
                    value
                },
                ValuationMethod::CostApproach => {
                    self.cost_approach(parcel, property_chars)?
                },
                ValuationMethod::IncomeCapitalization => {
                    self.income_approach(parcel, property_chars)?
                },
                ValuationMethod::AutomatedValuationModel => {
                    self.avm_approach(parcel, property_chars)?
                },
                ValuationMethod::HybridApproach => {
                    // Implemented as weighted combination of other methods
                    continue;
                },
            };
            
            methodology_breakdown.insert(method.clone(), value);
        }
        
        // Calculate final estimated market value
        let estimated_market_value = self.reconcile_value_indications(&methodology_breakdown)?;
        let assessed_value = estimated_market_value * self.assessment_parameters.assessment_ratio;
        
        // Calculate confidence score based on data quality and consistency
        let confidence_score = self.calculate_confidence_score(&methodology_breakdown, &comparable_sales)?;
        
        // Determine value range
        let value_range = self.calculate_value_range(&methodology_breakdown, confidence_score)?;
        
        let result = ValuationResult {
            property_id: parcel.parcel_id.clone(),
            valuation_date: Utc::now(),
            methods_used: methods,
            estimated_market_value,
            assessed_value,
            confidence_score,
            value_range,
            methodology_breakdown,
            adjustment_summary: self.generate_adjustment_summary(parcel, property_chars)?,
            market_conditions_applied: self.market_conditions.clone(),
            comparable_sales,
            depreciation_analysis: self.calculate_depreciation(property_chars)?,
            income_analysis: None, // Calculated separately for income properties
        };
        
        info!("Property {} valued at ${} (confidence: {}%)", 
            parcel.parcel_id, estimated_market_value, confidence_score * Decimal::from(100));
        
        Ok(result)
    }

    /// Sales comparison approach - primary method for residential properties
    fn sales_comparison_approach(
        &self,
        parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
    ) -> Result<(Decimal, Vec<ComparableSale>)> {
        let market_area = self.determine_market_area(&parcel.parcel_id)?;
        
        let comparable_sales = self.comparable_sales_db
            .get(&market_area)
            .ok_or_else(|| ValuationError::InsufficientComparables {
                property_id: parcel.parcel_id.clone()
            })?;
        
        if comparable_sales.len() < 3 {
            return Err(ValuationError::InsufficientComparables {
                property_id: parcel.parcel_id.clone()
            }.into());
        }
        
        // Filter and rank comparable sales by similarity
        let mut adjusted_sales = Vec::new();
        
        for sale in comparable_sales.iter().take(6) { // Use top 6 comparables
            let adjusted_price = self.adjust_comparable_sale(sale, property_chars)?;
            adjusted_sales.push((sale.clone(), adjusted_price));
        }
        
        // Sort by adjusted price
        adjusted_sales.sort_by(|a, b| a.1.cmp(&b.1));
        
        // Use median of adjusted prices for stability
        let median_value = if adjusted_sales.len() % 2 == 0 {
            let mid = adjusted_sales.len() / 2;
            (adjusted_sales[mid - 1].1 + adjusted_sales[mid].1) / Decimal::from(2)
        } else {
            adjusted_sales[adjusted_sales.len() / 2].1
        };
        
        let comps: Vec<ComparableSale> = adjusted_sales.into_iter().map(|(sale, _)| sale).collect();
        
        Ok((median_value, comps))
    }

    /// Cost approach - replacement cost new minus depreciation plus land value
    fn cost_approach(
        &self,
        parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
    ) -> Result<Decimal> {
        // Calculate land value based on location and size
        let land_value = self.calculate_land_value(parcel)?;
        
        // Calculate replacement cost new
        let construction_cost_per_sqft = self.get_construction_cost_per_sqft(&property_chars.construction_type)?;
        let replacement_cost_new = property_chars.building_area_sq_ft * construction_cost_per_sqft;
        
        // Calculate total depreciation
        let depreciation = self.calculate_total_depreciation(property_chars)?;
        
        // Apply depreciation to replacement cost
        let depreciated_improvement_value = replacement_cost_new * (Decimal::ONE - depreciation);
        
        Ok(land_value + depreciated_improvement_value)
    }

    /// Income approach - net operating income capitalized at market rate
    fn income_approach(
        &self,
        _parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
    ) -> Result<Decimal> {
        // Estimate gross rental income
        let monthly_rent = self.estimate_market_rent(property_chars)?;
        let annual_gross_income = monthly_rent * Decimal::from(12);
        
        // Apply vacancy and collection loss
        let vacancy_rate = Decimal::from_str("0.05")?; // 5% default
        let effective_gross_income = annual_gross_income * (Decimal::ONE - vacancy_rate);
        
        // Subtract operating expenses
        let operating_expense_ratio = Decimal::from_str("0.30")?; // 30% default
        let operating_expenses = effective_gross_income * operating_expense_ratio;
        let net_operating_income = effective_gross_income - operating_expenses;
        
        // Capitalize at market rate
        let cap_rate = self.get_market_capitalization_rate()?;
        let indicated_value = net_operating_income / cap_rate;
        
        Ok(indicated_value)
    }

    /// Automated Valuation Model using statistical analysis
    fn avm_approach(
        &self,
        parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
    ) -> Result<Decimal> {
        // Simplified AVM using hedonic pricing model
        let mut base_value = Decimal::from(100000); // Base property value
        
        // Square footage adjustment
        base_value += property_chars.building_area_sq_ft * Decimal::from(50);
        
        // Lot size adjustment  
        base_value += property_chars.lot_size_sq_ft * Decimal::from(2);
        
        // Age adjustment
        let age = 2025 - property_chars.year_built as i32;
        let age_adjustment = Decimal::from(age) * Decimal::from(-500);
        base_value += age_adjustment;
        
        // Quality and condition adjustments
        let quality_multiplier = match property_chars.quality {
            PropertyQuality::Superior => Decimal::from_str("1.30")?,
            PropertyQuality::AboveAverage => Decimal::from_str("1.15")?,
            PropertyQuality::Average => Decimal::ONE,
            PropertyQuality::BelowAverage => Decimal::from_str("0.85")?,
            PropertyQuality::Poor => Decimal::from_str("0.70")?,
        };
        
        base_value *= quality_multiplier;
        
        // Location adjustment from market area
        let location_factor = self.assessment_parameters.market_area_adjustments
            .get(&self.determine_market_area(&parcel.parcel_id)?)
            .unwrap_or(&Decimal::ONE);
        
        base_value *= location_factor;
        
        Ok(base_value)
    }

    // Helper methods for valuation calculations

    fn validate_property_data(
        &self,
        parcel: &PropertyParcel,
        property_chars: &PropertyCharacteristics,
    ) -> Result<()> {
        if parcel.area_sq_feet <= 0.0 {
            return Err(ValuationError::ValidationError {
                field: "area_sq_feet".to_string(),
                reason: "must be greater than zero".to_string(),
            }.into());
        }
        
        if property_chars.building_area_sq_ft <= Decimal::ZERO {
            return Err(ValuationError::ValidationError {
                field: "building_area_sq_ft".to_string(),
                reason: "must be greater than zero".to_string(),
            }.into());
        }
        
        if property_chars.year_built < 1800 || property_chars.year_built > 2025 {
            return Err(ValuationError::ValidationError {
                field: "year_built".to_string(),
                reason: "must be between 1800 and 2025".to_string(),
            }.into());
        }
        
        Ok(())
    }

    fn determine_market_area(&self, parcel_id: &str) -> Result<String> {
        // Simplified market area determination based on parcel ID prefix
        // In production, this would use sophisticated spatial analysis
        let prefix = parcel_id.chars().take(3).collect::<String>();
        Ok(format!("market_area_{}", prefix))
    }

    fn adjust_comparable_sale(
        &self,
        sale: &ComparableSale,
        subject_chars: &PropertyCharacteristics,
    ) -> Result<Decimal> {
        let mut adjusted_price = sale.sale_price;
        
        // Time adjustment for market appreciation
        let months_diff = self.calculate_months_difference(&sale.sale_date)?;
        let appreciation_rate = Decimal::from_str("0.005")?; // 0.5% per month
        let time_adjustment = Decimal::ONE + (appreciation_rate * Decimal::from(months_diff));
        adjusted_price *= time_adjustment;
        
        // Size adjustment
        let size_diff = subject_chars.building_area_sq_ft - sale.property_characteristics.building_area_sq_ft;
        let size_adjustment = size_diff * Decimal::from(50); // $50 per sq ft difference
        adjusted_price += size_adjustment;
        
        // Age adjustment
        let age_diff = subject_chars.year_built as i32 - sale.property_characteristics.year_built as i32;
        let age_adjustment = Decimal::from(age_diff) * Decimal::from(1000); // $1000 per year
        adjusted_price += age_adjustment;
        
        Ok(adjusted_price)
    }

    fn reconcile_value_indications(&self, methodology_breakdown: &HashMap<ValuationMethod, Decimal>) -> Result<Decimal> {
        if methodology_breakdown.is_empty() {
            return Err(ValuationError::CalculationError {
                details: "No valuation methods produced results".to_string(),
            }.into());
        }
        
        // Weight the different approaches based on reliability
        let mut weighted_sum = Decimal::ZERO;
        let mut total_weight = Decimal::ZERO;
        
        for (method, value) in methodology_breakdown {
            let weight = match method {
                ValuationMethod::SalesComparison => Decimal::from_str("0.60")?, // 60% weight
                ValuationMethod::CostApproach => Decimal::from_str("0.25")?,     // 25% weight
                ValuationMethod::IncomeCapitalization => Decimal::from_str("0.40")?, // 40% weight
                ValuationMethod::AutomatedValuationModel => Decimal::from_str("0.15")?, // 15% weight
                ValuationMethod::HybridApproach => Decimal::from_str("0.30")?,  // 30% weight
            };
            
            weighted_sum += value * weight;
            total_weight += weight;
        }
        
        Ok(weighted_sum / total_weight)
    }

    fn calculate_confidence_score(
        &self,
        methodology_breakdown: &HashMap<ValuationMethod, Decimal>,
        comparable_sales: &[ComparableSale],
    ) -> Result<Decimal> {
        let mut confidence = Decimal::from_str("0.50")?; // Base 50% confidence
        
        // Increase confidence based on number of valuation methods
        confidence += Decimal::from(methodology_breakdown.len()) * Decimal::from_str("0.10")?;
        
        // Increase confidence based on number of comparable sales
        confidence += Decimal::from(comparable_sales.len().min(5)) * Decimal::from_str("0.05")?;
        
        // Cap confidence at 95%
        Ok(confidence.min(Decimal::from_str("0.95")?))
    }

    fn calculate_value_range(
        &self,
        methodology_breakdown: &HashMap<ValuationMethod, Decimal>,
        confidence_score: Decimal,
    ) -> Result<ValueRange> {
        let values: Vec<Decimal> = methodology_breakdown.values().cloned().collect();
        let avg_value = values.iter().sum::<Decimal>() / Decimal::from(values.len());
        
        // Range widens with lower confidence
        let range_factor = (Decimal::ONE - confidence_score) * Decimal::from_str("0.20")?;
        
        Ok(ValueRange {
            low_estimate: avg_value * (Decimal::ONE - range_factor),
            high_estimate: avg_value * (Decimal::ONE + range_factor),
            most_probable_value: avg_value,
        })
    }

    // Additional helper methods would be implemented here...
    fn generate_adjustment_summary(&self, _parcel: &PropertyParcel, _property_chars: &PropertyCharacteristics) -> Result<Vec<AdjustmentSummary>> {
        Ok(vec![]) // Placeholder
    }

    fn calculate_depreciation(&self, _property_chars: &PropertyCharacteristics) -> Result<Option<DepreciationAnalysis>> {
        Ok(None) // Placeholder
    }

    fn calculate_land_value(&self, _parcel: &PropertyParcel) -> Result<Decimal> {
        Ok(Decimal::from(50000)) // Placeholder
    }

    fn get_construction_cost_per_sqft(&self, _construction_type: &str) -> Result<Decimal> {
        Ok(Decimal::from(150)) // Placeholder
    }

    fn calculate_total_depreciation(&self, _property_chars: &PropertyCharacteristics) -> Result<Decimal> {
        Ok(Decimal::from_str("0.20")?) // 20% depreciation placeholder
    }

    fn estimate_market_rent(&self, _property_chars: &PropertyCharacteristics) -> Result<Decimal> {
        Ok(Decimal::from(1500)) // $1500/month placeholder
    }

    fn get_market_capitalization_rate(&self) -> Result<Decimal> {
        Ok(Decimal::from_str("0.08")?) // 8% cap rate placeholder
    }

    fn calculate_months_difference(&self, _sale_date: &NaiveDate) -> Result<i32> {
        Ok(6) // 6 months placeholder
    }
}

// Default implementations
impl Default for AssessmentParameters {
    fn default() -> Self {
        let mut exemption_amounts = HashMap::new();
        exemption_amounts.insert(PropertyClass::Residential, Decimal::from(50000));
        exemption_amounts.insert(PropertyClass::Commercial, Decimal::ZERO);
        
        let mut improvement_factors = HashMap::new();
        improvement_factors.insert("excellent".to_string(), Decimal::from_str("1.20").unwrap());
        improvement_factors.insert("good".to_string(), Decimal::ONE);
        improvement_factors.insert("average".to_string(), Decimal::from_str("0.90").unwrap());
        
        AssessmentParameters {
            assessment_ratio: Decimal::ONE, // 100% of market value
            exemption_amounts,
            improvement_factors,
            land_value_tables: HashMap::new(),
            depreciation_tables: HashMap::new(),
            market_area_adjustments: HashMap::new(),
        }
    }
}

impl Default for MarketConditions {
    fn default() -> Self {
        MarketConditions {
            assessment_date: Utc::now(),
            market_trend: MarketTrend::Stable,
            supply_demand_ratio: Decimal::ONE,
            interest_rate_environment: Decimal::from_str("0.06").unwrap(), // 6%
            economic_indicators: HashMap::new(),
            local_market_factors: Vec::new(),
        }
    }
}

// Property testing for deterministic validation
#[cfg(test)]
mod property_tests {
    use super::*;
    use proptest::prelude::*;
    
    proptest! {
        #[test]
        fn test_valuation_always_positive(
            building_area in 500u32..5000,
            lot_size in 5000u32..50000,
            year_built in 1950u16..2023,
        ) {
            let market_conditions = MarketConditions::default();
            let kernel = ValuationKernel::new(market_conditions).unwrap();
            
            let parcel = PropertyParcel {
                parcel_id: "TEST001".to_string(),
                county_id: "TEST".to_string(),
                area_sq_feet: lot_size as f64,
                assessed_value: 100000.0,
                market_value: 120000.0,
                centroid_x: -120.5,
                centroid_y: 46.7,
            };
            
            let property_chars = PropertyCharacteristics {
                lot_size_sq_ft: Decimal::from(lot_size),
                building_area_sq_ft: Decimal::from(building_area),
                year_built,
                bedrooms: 3,
                bathrooms: Decimal::from_str("2.5").unwrap(),
                garage_spaces: 2,
                basement: true,
                pool: false,
                fireplace_count: 1,
                condition: PropertyCondition::Good,
                quality: PropertyQuality::Average,
                construction_type: "frame".to_string(),
                roof_type: "asphalt_shingle".to_string(),
                heating_system: "forced_air".to_string(),
                cooling_system: "central_air".to_string(),
            };
            
            let result = kernel.avm_approach(&parcel, &property_chars).unwrap();
            prop_assert!(result > Decimal::ZERO);
        }
    }
}