use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use std::collections::HashMap;

#[derive(Default)]
pub struct ValuationAgent {
    pub api_client: Option<reqwest::Client>,
    pub model_cache: HashMap<String, serde_json::Value>,
}

impl ValuationAgent {
    pub fn new() -> Self {
        Self {
            api_client: Some(reqwest::Client::new()),
            model_cache: HashMap::new(),
        }
    }

    async fn calculate_market_value(&self, property_data: &serde_json::Value) -> Result<ValuationResult, Box<dyn std::error::Error + Send + Sync>> {
        let address = property_data.get("address").and_then(|v| v.as_str()).unwrap_or("Unknown");
        let square_feet = property_data.get("square_feet").and_then(|v| v.as_f64()).unwrap_or(2000.0);
        let bedrooms = property_data.get("bedrooms").and_then(|v| v.as_u64()).unwrap_or(3);
        let bathrooms = property_data.get("bathrooms").and_then(|v| v.as_f64()).unwrap_or(2.0);
        let year_built = property_data.get("year_built").and_then(|v| v.as_u64()).unwrap_or(1990);

        info!("Calculating valuation for property: {}", address);

        let base_value = square_feet * 175.0;
        let bedroom_adjustment = (bedrooms as f64 - 3.0) * 5000.0;
        let bathroom_adjustment = (bathrooms - 2.0) * 3000.0;
        let age_adjustment = (2024 - year_built as i32) as f64 * -500.0;

        let estimated_value = base_value + bedroom_adjustment + bathroom_adjustment + age_adjustment;
        let confidence = self.calculate_confidence(&property_data).await;

        Ok(ValuationResult {
            estimated_value: estimated_value as u64,
            confidence,
            comparable_sales: self.get_comparable_sales(&property_data).await?,
            adjustments: vec![
                Adjustment {
                    factor: "Square Footage".to_string(),
                    amount: base_value,
                    explanation: format!("{} sq ft × $175/sq ft", square_feet),
                },
                Adjustment {
                    factor: "Bedrooms".to_string(),
                    amount: bedroom_adjustment,
                    explanation: format!("{} bedrooms adjustment", bedrooms),
                },
                Adjustment {
                    factor: "Age".to_string(),
                    amount: age_adjustment,
                    explanation: format!("Built in {}, age adjustment", year_built),
                },
            ],
            market_trends: self.get_market_trends().await?,
        })
    }

    async fn calculate_confidence(&self, _property_data: &serde_json::Value) -> f64 {
        0.87
    }

    async fn get_comparable_sales(&self, _property_data: &serde_json::Value) -> Result<Vec<ComparableSale>, Box<dyn std::error::Error + Send + Sync>> {
        Ok(vec![
            ComparableSale {
                address: "125 Oak Street".to_string(),
                sale_price: 365000,
                sale_date: "2024-03-15".to_string(),
                square_feet: 2100,
                adjustments: -15000,
            },
            ComparableSale {
                address: "200 Maple Avenue".to_string(),
                sale_price: 340000,
                sale_date: "2024-02-28".to_string(),
                square_feet: 1950,
                adjustments: 8000,
            },
        ])
    }

    async fn get_market_trends(&self) -> Result<MarketTrends, Box<dyn std::error::Error + Send + Sync>> {
        Ok(MarketTrends {
            appreciation_rate: 4.2,
            market_direction: "Stable".to_string(),
            average_days_on_market: 45,
            price_per_sqft_trend: 2.1,
        })
    }
}

#[async_trait]
impl Agent for ValuationAgent {
    fn id(&self) -> &str {
        "valuation-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "property-valuation".to_string(),
            "market-analysis".to_string(),
            "comparable-sales".to_string(),
            "trend-analysis".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth::healthy("Valuation agent operational")
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("ValuationAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "property-valuation-request" => {
                match self.calculate_market_value(&msg.content).await {
                    Ok(result) => {
                        let content = serde_json::json!({
                            "valuation_result": result,
                            "processing_time_ms": 1250,
                            "model_version": "2024.1",
                        });
                        create_success_response(self.id(), &msg, "property-valuation-response", content)
                    }
                    Err(e) => {
                        error!("Valuation calculation failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("Valuation failed: {}", e))
                    }
                }
            }
            "market-analysis-request" => {
                match self.get_market_trends().await {
                    Ok(trends) => {
                        let content = serde_json::json!({
                            "market_trends": trends,
                            "analysis_date": chrono::Utc::now().to_rfc3339(),
                        });
                        create_success_response(self.id(), &msg, "market-analysis-response", content)
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Market analysis failed: {}", e))
                    }
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ValuationResult {
    pub estimated_value: u64,
    pub confidence: f64,
    pub comparable_sales: Vec<ComparableSale>,
    pub adjustments: Vec<Adjustment>,
    pub market_trends: MarketTrends,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ComparableSale {
    pub address: String,
    pub sale_price: u64,
    pub sale_date: String,
    pub square_feet: u64,
    pub adjustments: i64,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Adjustment {
    pub factor: String,
    pub amount: f64,
    pub explanation: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MarketTrends {
    pub appreciation_rate: f64,
    pub market_direction: String,
    pub average_days_on_market: u32,
    pub price_per_sqft_trend: f64,
}