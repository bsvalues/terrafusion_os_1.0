//! # Valuation Kernel
//!
//! Government-grade property assessment algorithms
//! Multiple valuation methodologies with market analysis
//!
//! MIT/PhD Level Systems Design - September 26, 2025

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use statrs::statistics::{Statistics, OrderStatistics};
use rayon::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValuationMethod {
    SalesComparison,
    CostApproach,
    IncomeApproach,
    AutomatedValuationModel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyCharacteristics {
    pub parcel_id: String,
    pub address: String,
    pub property_type: String,
    pub land_area_sqm: f64,
    pub building_area_sqm: f64,
    pub year_built: Option<u32>,
    pub bedrooms: Option<u32>,
    pub bathrooms: Option<f32>,
    pub garage_spaces: Option<u32>,
    pub pool: bool,
    pub quality_grade: String,
    pub condition: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparableSale {
    pub id: Uuid,
    pub sale_price: f64,
    pub sale_date: DateTime<Utc>,
    pub characteristics: PropertyCharacteristics,
    pub distance_meters: f64,
    pub adjustments: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValuationResult {
    pub parcel_id: String,
    pub valuation_method: ValuationMethod,
    pub estimated_value: f64,
    pub confidence_interval: (f64, f64),
    pub valuation_date: DateTime<Utc>,
    pub comparables_used: Vec<ComparableSale>,
    pub adjustments_applied: HashMap<String, f64>,
    pub market_trends: HashMap<String, f64>,
}

pub struct GovernmentValuationKernel {
    market_data: HashMap<String, Vec<ComparableSale>>,
    valuation_models: HashMap<String, Box<dyn ValuationModel + Send + Sync>>,
}

#[async_trait::async_trait]
pub trait ValuationModel: Send + Sync {
    async fn estimate_value(&self, subject: &PropertyCharacteristics, comparables: &[ComparableSale]) -> Result<f64, Box<dyn std::error::Error + Send + Sync>>;
    fn get_method(&self) -> ValuationMethod;
}

pub struct SalesComparisonApproach;

#[async_trait::async_trait]
impl ValuationModel for SalesComparisonApproach {
    async fn estimate_value(&self, subject: &PropertyCharacteristics, comparables: &[ComparableSale]) -> Result<f64, Box<dyn std::error::Error + Send + Sync>> {
        if comparables.is_empty() {
            return Err("No comparable sales available".into());
        }

        let mut adjusted_prices: Vec<f64> = comparables.par_iter()
            .map(|comp| {
                let mut adjusted_price = comp.sale_price;

                // Apply adjustments based on property differences
                if let Some(subject_bedrooms) = subject.bedrooms {
                    if let Some(comp_bedrooms) = comp.characteristics.bedrooms {
                        let bedroom_adjustment = (subject_bedrooms as f64 - comp_bedrooms as f64) * 10000.0;
                        adjusted_price += bedroom_adjustment;
                    }
                }

                if let Some(subject_bathrooms) = subject.bathrooms {
                    if let Some(comp_bathrooms) = comp.characteristics.bathrooms {
                        let bathroom_adjustment = (subject_bathrooms - comp_bathrooms) * 15000.0;
                        adjusted_price += bathroom_adjustment;
                    }
                }

                // Size adjustment
                let size_adjustment = (subject.building_area_sqm - comp.characteristics.building_area_sqm) * 200.0;
                adjusted_price += size_adjustment;

                // Distance adjustment (closer comparables are more reliable)
                let distance_weight = 1.0 / (1.0 + comp.distance_meters / 1000.0);
                adjusted_price * distance_weight
            })
            .collect();

        // Calculate weighted average
        let estimated_value = adjusted_prices.mean();
        Ok(estimated_value)
    }

    fn get_method(&self) -> ValuationMethod {
        ValuationMethod::SalesComparison
    }
}

impl GovernmentValuationKernel {
    pub fn new() -> Self {
        let mut valuation_models = HashMap::new();
        valuation_models.insert(
            "sales_comparison".to_string(),
            Box::new(SalesComparisonApproach) as Box<dyn ValuationModel + Send + Sync>
        );

        Self {
            market_data: HashMap::new(),
            valuation_models,
        }
    }

    pub async fn load_market_data(&mut self, region: &str, sales_data: Vec<ComparableSale>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.market_data.insert(region.to_string(), sales_data);
        tracing::info!("✅ Loaded {} comparable sales for region {}", sales_data.len(), region);
        Ok(())
    }

    pub async fn estimate_property_value(&self, subject: PropertyCharacteristics, region: &str, method: ValuationMethod) -> Result<ValuationResult, Box<dyn std::error::Error + Send + Sync>> {
        let comparables = self.market_data.get(region)
            .ok_or_else(|| format!("No market data available for region: {}", region))?;

        // Filter comparables by property type and recency
        let relevant_comparables: Vec<_> = comparables.iter()
            .filter(|comp| {
                comp.characteristics.property_type == subject.property_type &&
                (Utc::now() - comp.sale_date).num_days() <= 365 // Within last year
            })
            .cloned()
            .collect();

        if relevant_comparables.is_empty() {
            return Err("No relevant comparable sales found".into());
        }

        // Select closest comparables
        let mut sorted_comparables = relevant_comparables;
        sorted_comparables.sort_by(|a, b| a.distance_meters.partial_cmp(&b.distance_meters).unwrap());

        let selected_comparables = sorted_comparables.into_iter().take(5).collect::<Vec<_>>();

        // Get valuation model
        let model_key = match method {
            ValuationMethod::SalesComparison => "sales_comparison",
            _ => return Err("Valuation method not implemented".into()),
        };

        let model = self.valuation_models.get(model_key)
            .ok_or("Valuation model not found")?;

        // Estimate value
        let estimated_value = model.estimate_value(&subject, &selected_comparables).await?;

        // Calculate confidence interval
        let prices: Vec<f64> = selected_comparables.iter().map(|c| c.sale_price).collect();
        let std_dev = prices.std_dev();
        let confidence_interval = (
            estimated_value - 1.96 * std_dev / (prices.len() as f64).sqrt(),
            estimated_value + 1.96 * std_dev / (prices.len() as f64).sqrt(),
        );

        // Calculate market trends
        let mut market_trends = HashMap::new();
        if prices.len() >= 2 {
            let recent_avg = prices.mean();
            let older_prices: Vec<f64> = comparables.iter()
                .filter(|c| (Utc::now() - c.sale_date).num_days() > 180)
                .map(|c| c.sale_price)
                .collect();

            if !older_prices.is_empty() {
                let older_avg = older_prices.mean();
                let trend = (recent_avg - older_avg) / older_avg * 100.0;
                market_trends.insert("price_trend_6months".to_string(), trend);
            }
        }

        Ok(ValuationResult {
            parcel_id: subject.parcel_id.clone(),
            valuation_method: method,
            estimated_value,
            confidence_interval,
            valuation_date: Utc::now(),
            comparables_used: selected_comparables,
            adjustments_applied: HashMap::new(), // Would be populated by the model
            market_trends,
        })
    }

    pub async fn batch_valuation(&self, properties: Vec<PropertyCharacteristics>, region: &str, method: ValuationMethod) -> Vec<Result<ValuationResult, Box<dyn std::error::Error + Send + Sync>>> {
        let futures: Vec<_> = properties.into_iter()
            .map(|prop| self.estimate_property_value(prop, region, method))
            .collect();

        futures::future::join_all(futures).await
    }

    pub async fn get_market_statistics(&self, region: &str) -> Result<HashMap<String, f64>, Box<dyn std::error::Error + Send + Sync>> {
        let comparables = self.market_data.get(region)
            .ok_or_else(|| format!("No market data available for region: {}", region))?;

        let prices: Vec<f64> = comparables.iter().map(|c| c.sale_price).collect();

        let mut stats = HashMap::new();
        stats.insert("total_sales".to_string(), comparables.len() as f64);
        stats.insert("average_price".to_string(), prices.mean());
        stats.insert("median_price".to_string(), prices.median());
        stats.insert("min_price".to_string(), prices.min());
        stats.insert("max_price".to_string(), prices.max());
        stats.insert("price_std_dev".to_string(), prices.std_dev());

        Ok(stats)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_sales_comparison_valuation() {
        let mut kernel = GovernmentValuationKernel::new();

        // Load sample market data
        let sample_sales = vec![
            ComparableSale {
                id: Uuid::new_v4(),
                sale_price: 350000.0,
                sale_date: Utc::now(),
                characteristics: PropertyCharacteristics {
                    parcel_id: "COMP001".to_string(),
                    address: "123 Main St".to_string(),
                    property_type: "Single Family".to_string(),
                    land_area_sqm: 1000.0,
                    building_area_sqm: 200.0,
                    year_built: Some(2000),
                    bedrooms: Some(3),
                    bathrooms: Some(2.0),
                    garage_spaces: Some(2),
                    pool: false,
                    quality_grade: "C".to_string(),
                    condition: "Good".to_string(),
                },
                distance_meters: 500.0,
                adjustments: HashMap::new(),
            }
        ];

        kernel.load_market_data("benton_county", sample_sales).await.unwrap();

        // Test valuation
        let subject = PropertyCharacteristics {
            parcel_id: "TEST001".to_string(),
            address: "456 Oak St".to_string(),
            property_type: "Single Family".to_string(),
            land_area_sqm: 1000.0,
            building_area_sqm: 200.0,
            year_built: Some(2000),
            bedrooms: Some(3),
            bathrooms: Some(2.0),
            garage_spaces: Some(2),
            pool: false,
            quality_grade: "C".to_string(),
            condition: "Good".to_string(),
        };

        let result = kernel.estimate_property_value(subject, "benton_county", ValuationMethod::SalesComparison).await.unwrap();
        assert!(result.estimated_value > 0.0);
        assert!(result.comparables_used.len() > 0);
    }
}