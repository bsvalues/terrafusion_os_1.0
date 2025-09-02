use crate::{InvestmentModel, InvestmentRequest};
use anyhow::Result;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct InvestmentModelingService {
    market_parameters: HashMap<String, f64>,
}

impl InvestmentModelingService {
    pub fn new() -> Self {
        let mut market_parameters = HashMap::new();
        market_parameters.insert("appreciation_rate".to_string(), 0.035);
        market_parameters.insert("maintenance_rate".to_string(), 0.01);
        market_parameters.insert("vacancy_rate".to_string(), 0.05);
        market_parameters.insert("management_fee".to_string(), 0.08);
        market_parameters.insert("insurance_rate".to_string(), 0.003);
        market_parameters.insert("tax_rate".to_string(), 0.0125);
        
        Self {
            market_parameters,
        }
    }
    
    pub async fn calculate_model(&self, request: InvestmentRequest) -> Result<InvestmentModel> {
        let loan_amount = request.property_value - request.down_payment;
        
        // Calculate monthly payment
        let monthly_rate = request.interest_rate / 12.0;
        let num_payments = request.loan_term * 12;
        
        let monthly_payment = if request.interest_rate > 0.0 {
            (loan_amount * monthly_rate * (1.0 + monthly_rate).powi(num_payments)) / 
            ((1.0 + monthly_rate).powi(num_payments) - 1.0)
        } else {
            loan_amount / num_payments as f64
        };
        
        // Calculate total interest
        let total_payments = monthly_payment * num_payments as f64;
        let total_interest = total_payments - loan_amount;
        
        // Calculate break-even analysis
        let annual_debt_service = monthly_payment * 12.0;
        let estimated_annual_income = request.property_value * 0.08; // 8% rental yield
        let annual_expenses = self.calculate_annual_expenses(request.property_value);
        let net_annual_income = estimated_annual_income - annual_expenses - annual_debt_service;
        
        let break_even_years = if net_annual_income > 0.0 {
            request.down_payment / net_annual_income
        } else {
            999.0 // No break-even if negative cash flow
        };
        
        // Calculate projected appreciation
        let appreciation_rate = self.market_parameters.get("appreciation_rate").unwrap_or(&0.035);
        let projected_appreciation = format!("{:.1}% annually", appreciation_rate * 100.0);
        
        Ok(InvestmentModel {
            property_value: request.property_value,
            down_payment: request.down_payment,
            loan_amount,
            monthly_payment,
            total_interest,
            break_even_years: break_even_years.min(50.0), // Cap at 50 years
            projected_appreciation,
        })
    }
    
    pub async fn calculate_cash_flow_analysis(&self, 
        property_value: f64,
        down_payment: f64,
        loan_term: i32,
        interest_rate: f64,
        rental_income: f64
    ) -> Result<serde_json::Value> {
        let loan_amount = property_value - down_payment;
        let monthly_rate = interest_rate / 12.0;
        let num_payments = loan_term * 12;
        
        let monthly_payment = if interest_rate > 0.0 {
            (loan_amount * monthly_rate * (1.0 + monthly_rate).powi(num_payments)) / 
            ((1.0 + monthly_rate).powi(num_payments) - 1.0)
        } else {
            loan_amount / num_payments as f64
        };
        
        // Calculate annual expenses
        let annual_expenses = self.calculate_annual_expenses(property_value);
        let annual_debt_service = monthly_payment * 12.0;
        let net_operating_income = rental_income - annual_expenses;
        let cash_flow = net_operating_income - annual_debt_service;
        
        // Calculate key metrics
        let cap_rate = net_operating_income / property_value;
        let cash_on_cash_return = if down_payment > 0.0 {
            cash_flow / down_payment
        } else {
            0.0
        };
        let debt_service_coverage = if annual_debt_service > 0.0 {
            net_operating_income / annual_debt_service
        } else {
            999.0
        };
        
        Ok(serde_json::json!({
            "cash_flow": {
                "gross_rental_income": rental_income,
                "operating_expenses": annual_expenses,
                "net_operating_income": net_operating_income,
                "debt_service": annual_debt_service,
                "cash_flow": cash_flow
            },
            "metrics": {
                "cap_rate": cap_rate,
                "cash_on_cash_return": cash_on_cash_return,
                "debt_service_coverage": debt_service_coverage,
                "gross_rent_multiplier": if rental_income > 0.0 { property_value / rental_income } else { 0.0 }
            },
            "analysis": {
                "cash_flow_positive": cash_flow > 0.0,
                "investment_grade": self.grade_investment(cap_rate, cash_on_cash_return, debt_service_coverage)
            }
        }))
    }
    
    pub async fn calculate_appreciation_scenarios(&self, 
        property_value: f64,
        years: i32
    ) -> Result<serde_json::Value> {
        let base_rate = self.market_parameters.get("appreciation_rate").unwrap_or(&0.035);
        
        let scenarios = vec![
            ("conservative", base_rate - 0.01),
            ("moderate", *base_rate),
            ("optimistic", base_rate + 0.015),
        ];
        
        let mut results = serde_json::Map::new();
        
        for (scenario_name, rate) in scenarios {
            let mut yearly_values = Vec::new();
            let mut current_value = property_value;
            
            for year in 1..=years {
                current_value *= 1.0 + rate;
                yearly_values.push(serde_json::json!({
                    "year": year,
                    "value": current_value,
                    "appreciation": current_value - property_value,
                    "total_return": ((current_value - property_value) / property_value) * 100.0
                }));
            }
            
            results.insert(scenario_name.to_string(), serde_json::json!({
                "rate": rate * 100.0,
                "final_value": current_value,
                "total_appreciation": current_value - property_value,
                "yearly_values": yearly_values
            }));
        }
        
        Ok(serde_json::json!({
            "scenarios": results,
            "base_property_value": property_value,
            "projection_years": years
        }))
    }
    
    pub async fn calculate_refinancing_analysis(&self,
        current_loan_balance: f64,
        current_rate: f64,
        new_rate: f64,
        remaining_term: i32,
        closing_costs: f64
    ) -> Result<serde_json::Value> {
        // Current payment calculation
        let current_monthly_rate = current_rate / 12.0;
        let current_payments = remaining_term * 12;
        let current_payment = if current_rate > 0.0 {
            (current_loan_balance * current_monthly_rate * (1.0 + current_monthly_rate).powi(current_payments)) / 
            ((1.0 + current_monthly_rate).powi(current_payments) - 1.0)
        } else {
            current_loan_balance / current_payments as f64
        };
        
        // New payment calculation
        let new_monthly_rate = new_rate / 12.0;
        let new_payment = if new_rate > 0.0 {
            (current_loan_balance * new_monthly_rate * (1.0 + new_monthly_rate).powi(current_payments)) / 
            ((1.0 + new_monthly_rate).powi(current_payments) - 1.0)
        } else {
            current_loan_balance / current_payments as f64
        };
        
        let monthly_savings = current_payment - new_payment;
        let total_savings = monthly_savings * current_payments as f64 - closing_costs;
        let break_even_months = if monthly_savings > 0.0 {
            closing_costs / monthly_savings
        } else {
            999.0
        };
        
        Ok(serde_json::json!({
            "current_payment": current_payment,
            "new_payment": new_payment,
            "monthly_savings": monthly_savings,
            "total_savings": total_savings,
            "closing_costs": closing_costs,
            "break_even_months": break_even_months,
            "recommendation": if total_savings > 0.0 && break_even_months < 36.0 {
                "Refinancing recommended"
            } else {
                "Consider waiting for better rates"
            }
        }))
    }
    
    fn calculate_annual_expenses(&self, property_value: f64) -> f64 {
        let maintenance_rate = self.market_parameters.get("maintenance_rate").unwrap_or(&0.01);
        let insurance_rate = self.market_parameters.get("insurance_rate").unwrap_or(&0.003);
        let tax_rate = self.market_parameters.get("tax_rate").unwrap_or(&0.0125);
        let management_fee_rate = self.market_parameters.get("management_fee").unwrap_or(&0.08);
        
        let maintenance = property_value * maintenance_rate;
        let insurance = property_value * insurance_rate;
        let taxes = property_value * tax_rate;
        let management = property_value * 0.08 * management_fee_rate; // 8% rental yield * management fee
        
        maintenance + insurance + taxes + management
    }
    
    fn grade_investment(&self, cap_rate: f64, cash_on_cash: f64, dscr: f64) -> String {
        let mut score = 0;
        
        // Cap rate scoring
        if cap_rate > 0.08 { score += 3; }
        else if cap_rate > 0.06 { score += 2; }
        else if cap_rate > 0.04 { score += 1; }
        
        // Cash-on-cash return scoring
        if cash_on_cash > 0.12 { score += 3; }
        else if cash_on_cash > 0.08 { score += 2; }
        else if cash_on_cash > 0.04 { score += 1; }
        
        // Debt service coverage scoring
        if dscr > 1.3 { score += 2; }
        else if dscr > 1.1 { score += 1; }
        
        match score {
            7..=8 => "A+ (Excellent)",
            5..=6 => "A (Very Good)",
            3..=4 => "B (Good)",
            1..=2 => "C (Fair)",
            _ => "D (Poor)"
        }.to_string()
    }
    
    pub async fn generate_investment_summary(&self, models: &[InvestmentModel]) -> Result<serde_json::Value> {
        if models.is_empty() {
            return Ok(serde_json::json!({
                "error": "No investment models provided"
            }));
        }
        
        let total_property_value: f64 = models.iter().map(|m| m.property_value).sum();
        let total_down_payment: f64 = models.iter().map(|m| m.down_payment).sum();
        let average_monthly_payment: f64 = models.iter().map(|m| m.monthly_payment).sum::<f64>() / models.len() as f64;
        let average_break_even: f64 = models.iter().map(|m| m.break_even_years).sum::<f64>() / models.len() as f64;
        
        Ok(serde_json::json!({
            "portfolio_summary": {
                "total_properties": models.len(),
                "total_property_value": total_property_value,
                "total_down_payment": total_down_payment,
                "total_loan_amount": total_property_value - total_down_payment,
                "average_monthly_payment": average_monthly_payment,
                "average_break_even_years": average_break_even
            },
            "metrics": {
                "average_loan_to_value": if total_property_value > 0.0 {
                    ((total_property_value - total_down_payment) / total_property_value) * 100.0
                } else {
                    0.0
                },
                "total_monthly_payments": models.iter().map(|m| m.monthly_payment).sum::<f64>(),
                "portfolio_diversification": "Single Asset Class" // Could be enhanced
            }
        }))
    }
}