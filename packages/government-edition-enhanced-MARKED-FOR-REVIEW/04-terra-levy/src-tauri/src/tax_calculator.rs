use crate::{TaxCalculation, CalculationRequest};
use anyhow::{Result, anyhow};
use chrono::Utc;
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct TaxCalculationService {
    // Tax rate database - in production this would be from external service
    tax_rates: HashMap<String, f64>,
    exemption_rates: HashMap<String, f64>,
}

impl TaxCalculationService {
    pub fn new() -> Self {
        let mut tax_rates = HashMap::new();
        tax_rates.insert("residential".to_string(), 0.0125);
        tax_rates.insert("commercial".to_string(), 0.0135);
        tax_rates.insert("industrial".to_string(), 0.0145);
        tax_rates.insert("agricultural".to_string(), 0.0105);
        
        let mut exemption_rates = HashMap::new();
        exemption_rates.insert("homestead".to_string(), 0.15);
        exemption_rates.insert("senior".to_string(), 0.25);
        exemption_rates.insert("veteran".to_string(), 0.20);
        exemption_rates.insert("disability".to_string(), 0.30);
        
        Self {
            tax_rates,
            exemption_rates,
        }
    }
    
    pub async fn calculate_tax(&self, request: CalculationRequest) -> Result<TaxCalculation> {
        // Use provided values or defaults
        let assessed_value = request.assessed_value.unwrap_or(request.property_value * 0.85);
        let base_tax_rate = request.tax_rate.unwrap_or(0.0125);
        let year = request.year.unwrap_or(2024);
        let exemptions = request.exemptions.unwrap_or_default();
        
        // Calculate exemption discount
        let mut exemption_discount = 0.0;
        for exemption in &exemptions {
            if let Some(rate) = self.exemption_rates.get(exemption) {
                exemption_discount += rate;
            }
        }
        exemption_discount = exemption_discount.min(0.50); // Cap at 50%
        
        // Calculate effective tax rate
        let effective_rate = base_tax_rate * (1.0 - exemption_discount);
        
        // Calculate annual tax
        let annual_tax = assessed_value * effective_rate;
        
        // Apply additional calculations based on property characteristics
        let adjusted_annual_tax = self.apply_levy_adjustments(annual_tax, &exemptions)?;
        
        Ok(TaxCalculation {
            id: Uuid::new_v4().to_string(),
            property_id: format!("prop-{}", Uuid::new_v4().to_string()[..8].to_uppercase()),
            year,
            assessed_value,
            tax_rate: base_tax_rate,
            annual_tax: adjusted_annual_tax,
            exemptions,
            effective_rate,
            created_at: Utc::now(),
        })
    }
    
    pub async fn get_all_calculations(&self) -> Result<Vec<TaxCalculation>> {
        // Mock data for demonstration - in production this would query a database
        Ok(vec![
            TaxCalculation {
                id: "tax-001".to_string(),
                property_id: "PROP-12345".to_string(),
                year: 2024,
                assessed_value: 500000.0,
                tax_rate: 0.0125,
                annual_tax: 5500.0,
                exemptions: vec!["homestead".to_string()],
                effective_rate: 0.011,
                created_at: Utc::now(),
            },
            TaxCalculation {
                id: "tax-002".to_string(),
                property_id: "PROP-12346".to_string(),
                year: 2024,
                assessed_value: 750000.0,
                tax_rate: 0.0135,
                annual_tax: 10125.0,
                exemptions: vec![],
                effective_rate: 0.0135,
                created_at: Utc::now(),
            },
            TaxCalculation {
                id: "tax-003".to_string(),
                property_id: "PROP-12347".to_string(),
                year: 2024,
                assessed_value: 325000.0,
                tax_rate: 0.0125,
                annual_tax: 2031.25,
                exemptions: vec!["homestead".to_string(), "senior".to_string()],
                effective_rate: 0.0075,
                created_at: Utc::now(),
            },
        ])
    }
    
    pub async fn calculate_levy_impact(&self, base_tax: f64, levy_changes: &[f64]) -> Result<f64> {
        let total_levy_change: f64 = levy_changes.iter().sum();
        Ok(base_tax * (1.0 + total_levy_change))
    }
    
    pub async fn project_tax_changes(&self, current_tax: f64, years: i32, growth_rate: f64) -> Result<Vec<f64>> {
        let mut projections = Vec::new();
        let mut current = current_tax;
        
        for _ in 0..years {
            current *= 1.0 + growth_rate;
            projections.push(current);
        }
        
        Ok(projections)
    }
    
    fn apply_levy_adjustments(&self, base_tax: f64, exemptions: &[String]) -> Result<f64> {
        let mut adjusted_tax = base_tax;
        
        // Apply school district levy
        adjusted_tax += base_tax * 0.015;
        
        // Apply county services levy
        adjusted_tax += base_tax * 0.008;
        
        // Apply municipal services levy
        adjusted_tax += base_tax * 0.012;
        
        // Special assessments for infrastructure
        adjusted_tax += base_tax * 0.003;
        
        // Flood control district levy (if applicable)
        if !exemptions.contains(&"flood_exempt".to_string()) {
            adjusted_tax += base_tax * 0.002;
        }
        
        Ok(adjusted_tax)
    }
    
    pub async fn validate_tax_calculation(&self, calculation: &TaxCalculation) -> Result<bool> {
        // Validation rules
        if calculation.assessed_value <= 0.0 {
            return Err(anyhow!("Assessed value must be positive"));
        }
        
        if calculation.tax_rate < 0.0 || calculation.tax_rate > 0.05 {
            return Err(anyhow!("Tax rate must be between 0% and 5%"));
        }
        
        if calculation.effective_rate > calculation.tax_rate {
            return Err(anyhow!("Effective rate cannot exceed base tax rate"));
        }
        
        // Verify calculation accuracy
        let expected_base_tax = calculation.assessed_value * calculation.effective_rate;
        let tolerance = expected_base_tax * 0.01; // 1% tolerance
        
        if (calculation.annual_tax - expected_base_tax).abs() > tolerance {
            return Err(anyhow!("Tax calculation appears incorrect"));
        }
        
        Ok(true)
    }
    
    pub async fn generate_tax_summary(&self, calculations: &[TaxCalculation]) -> Result<serde_json::Value> {
        let total_assessments: f64 = calculations.iter().map(|c| c.assessed_value).sum();
        let total_taxes: f64 = calculations.iter().map(|c| c.annual_tax).sum();
        let average_rate: f64 = if !calculations.is_empty() {
            calculations.iter().map(|c| c.effective_rate).sum::<f64>() / calculations.len() as f64
        } else {
            0.0
        };
        
        let exemption_count: usize = calculations.iter()
            .map(|c| c.exemptions.len())
            .sum();
        
        Ok(serde_json::json!({
            "summary": {
                "total_properties": calculations.len(),
                "total_assessed_value": total_assessments,
                "total_annual_tax": total_taxes,
                "average_effective_rate": average_rate,
                "total_exemptions": exemption_count,
                "revenue_efficiency": if total_assessments > 0.0 { total_taxes / total_assessments } else { 0.0 }
            },
            "breakdown": {
                "residential_properties": calculations.iter().filter(|c| c.tax_rate == 0.0125).count(),
                "commercial_properties": calculations.iter().filter(|c| c.tax_rate == 0.0135).count(),
                "properties_with_exemptions": calculations.iter().filter(|c| !c.exemptions.is_empty()).count()
            }
        }))
    }
}