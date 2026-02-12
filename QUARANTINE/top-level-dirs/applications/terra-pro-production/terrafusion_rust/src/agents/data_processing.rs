use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use std::collections::HashMap;

#[derive(Default)]
pub struct DataProcessingAgent {
    pub processors: HashMap<String, Box<dyn DataProcessor + Send + Sync>>,
    pub processing_stats: ProcessingStats,
}

impl DataProcessingAgent {
    pub fn new() -> Self {
        let mut agent = Self::default();
        agent.register_processors();
        agent
    }

    fn register_processors(&mut self) {
        self.processors.insert("property_data".to_string(), Box::new(PropertyDataProcessor::new()));
        self.processors.insert("comparable_sales".to_string(), Box::new(ComparableSalesProcessor::new()));
        self.processors.insert("market_data".to_string(), Box::new(MarketDataProcessor::new()));
        self.processors.insert("mls_data".to_string(), Box::new(MLSDataProcessor::new()));
    }

    async fn process_data(&mut self, data_type: &str, raw_data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        if let Some(processor) = self.processors.get_mut(data_type) {
            let start_time = std::time::Instant::now();
            let result = processor.process(raw_data).await?;
            let processing_time = start_time.elapsed();
            
            self.processing_stats.total_processed += 1;
            self.processing_stats.total_processing_time += processing_time;
            
            info!("Processed {} data in {:?}", data_type, processing_time);
            
            Ok(ProcessingResult {
                processed_data: result.processed_data,
                metadata: result.metadata,
                processing_time_ms: processing_time.as_millis() as u64,
                quality_score: result.quality_score,
                validation_errors: result.validation_errors,
            })
        } else {
            Err(format!("No processor found for data type: {}", data_type).into())
        }
    }

    async fn batch_process(&mut self, batch_request: &BatchProcessingRequest) -> Result<BatchProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        let mut results = Vec::new();
        let mut errors = Vec::new();
        
        for item in &batch_request.items {
            match self.process_data(&item.data_type, &item.data).await {
                Ok(result) => results.push(result),
                Err(e) => errors.push(format!("Failed to process item {}: {}", item.id, e)),
            }
        }
        
        Ok(BatchProcessingResult {
            successful_count: results.len(),
            failed_count: errors.len(),
            results,
            errors,
            total_processing_time_ms: self.processing_stats.total_processing_time.as_millis() as u64,
        })
    }
}

#[async_trait]
impl Agent for DataProcessingAgent {
    fn id(&self) -> &str {
        "data-processing-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "property-data-processing".to_string(),
            "comparable-sales-processing".to_string(),
            "market-data-processing".to_string(),
            "mls-data-processing".to_string(),
            "batch-processing".to_string(),
            "data-validation".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        let mut health = AgentHealth::healthy("Data processing agent operational");
        health.metrics.insert("total_processed".to_string(), self.processing_stats.total_processed as f64);
        health.metrics.insert("avg_processing_time_ms".to_string(), 
            if self.processing_stats.total_processed > 0 {
                self.processing_stats.total_processing_time.as_millis() as f64 / self.processing_stats.total_processed as f64
            } else {
                0.0
            }
        );
        health
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("DataProcessingAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "data-processing-request" => {
                let data_type = msg.content.get("data_type")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let raw_data = msg.content.get("raw_data").cloned().unwrap_or(serde_json::Value::Null);
                
                match self.process_data(data_type, &raw_data).await {
                    Ok(result) => {
                        let content = serde_json::json!({
                            "processing_result": result,
                            "data_type": data_type,
                        });
                        create_success_response(self.id(), &msg, "data-processing-response", content)
                    }
                    Err(e) => {
                        error!("Data processing failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("Data processing failed: {}", e))
                    }
                }
            }
            "batch-processing-request" => {
                if let Ok(batch_request) = serde_json::from_value::<BatchProcessingRequest>(msg.content.clone()) {
                    match self.batch_process(&batch_request).await {
                        Ok(result) => {
                            let content = serde_json::json!({
                                "batch_result": result,
                            });
                            create_success_response(self.id(), &msg, "batch-processing-response", content)
                        }
                        Err(e) => {
                            create_error_response(self.id(), &msg, &format!("Batch processing failed: {}", e))
                        }
                    }
                } else {
                    create_error_response(self.id(), &msg, "Invalid batch processing request format")
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[async_trait]
pub trait DataProcessor {
    async fn process(&mut self, data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>>;
    fn processor_type(&self) -> &str;
}

pub struct PropertyDataProcessor;

impl PropertyDataProcessor {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl DataProcessor for PropertyDataProcessor {
    async fn process(&mut self, data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        let mut processed = data.clone();
        let mut metadata = HashMap::new();
        let mut validation_errors = Vec::new();
        
        // Standardize address format
        if let Some(address) = processed.get_mut("address") {
            if let Some(addr_str) = address.as_str() {
                *address = serde_json::Value::String(addr_str.trim().to_uppercase());
            }
        } else {
            validation_errors.push("Missing required field: address".to_string());
        }
        
        // Validate square footage
        if let Some(sq_ft) = processed.get("square_feet") {
            if let Some(area) = sq_ft.as_f64() {
                if area <= 0.0 || area > 50000.0 {
                    validation_errors.push("Square footage must be between 0 and 50,000".to_string());
                }
            }
        }
        
        metadata.insert("processed_at".to_string(), chrono::Utc::now().to_rfc3339());
        metadata.insert("processor".to_string(), self.processor_type().to_string());
        
        let quality_score = if validation_errors.is_empty() { 0.95 } else { 0.6 };
        
        Ok(ProcessingResult {
            processed_data: processed,
            metadata,
            processing_time_ms: 0, // Will be set by caller
            quality_score,
            validation_errors,
        })
    }

    fn processor_type(&self) -> &str {
        "property_data"
    }
}

pub struct ComparableSalesProcessor;

impl ComparableSalesProcessor {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl DataProcessor for ComparableSalesProcessor {
    async fn process(&mut self, data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        let mut processed = data.clone();
        let mut metadata = HashMap::new();
        
        // Sort comparables by sale date (most recent first)
        if let Some(comparables) = processed.get_mut("comparables") {
            if let Some(comp_array) = comparables.as_array_mut() {
                comp_array.sort_by(|a, b| {
                    let date_a = a.get("sale_date").and_then(|d| d.as_str()).unwrap_or("");
                    let date_b = b.get("sale_date").and_then(|d| d.as_str()).unwrap_or("");
                    date_b.cmp(date_a)
                });
            }
        }
        
        metadata.insert("sorted_by".to_string(), "sale_date_desc".to_string());
        metadata.insert("processor".to_string(), self.processor_type().to_string());
        
        Ok(ProcessingResult {
            processed_data: processed,
            metadata,
            processing_time_ms: 0,
            quality_score: 0.92,
            validation_errors: Vec::new(),
        })
    }

    fn processor_type(&self) -> &str {
        "comparable_sales"
    }
}

pub struct MarketDataProcessor;
pub struct MLSDataProcessor;

impl MarketDataProcessor {
    pub fn new() -> Self { Self }
}

impl MLSDataProcessor {
    pub fn new() -> Self { Self }
}

#[async_trait]
impl DataProcessor for MarketDataProcessor {
    async fn process(&mut self, data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        Ok(ProcessingResult {
            processed_data: data.clone(),
            metadata: HashMap::new(),
            processing_time_ms: 0,
            quality_score: 0.88,
            validation_errors: Vec::new(),
        })
    }

    fn processor_type(&self) -> &str {
        "market_data"
    }
}

#[async_trait]
impl DataProcessor for MLSDataProcessor {
    async fn process(&mut self, data: &serde_json::Value) -> Result<ProcessingResult, Box<dyn std::error::Error + Send + Sync>> {
        Ok(ProcessingResult {
            processed_data: data.clone(),
            metadata: HashMap::new(),
            processing_time_ms: 0,
            quality_score: 0.91,
            validation_errors: Vec::new(),
        })
    }

    fn processor_type(&self) -> &str {
        "mls_data"
    }
}

#[derive(Default)]
pub struct ProcessingStats {
    pub total_processed: u64,
    pub total_processing_time: std::time::Duration,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ProcessingResult {
    pub processed_data: serde_json::Value,
    pub metadata: HashMap<String, String>,
    pub processing_time_ms: u64,
    pub quality_score: f64,
    pub validation_errors: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BatchProcessingRequest {
    pub items: Vec<BatchItem>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BatchItem {
    pub id: String,
    pub data_type: String,
    pub data: serde_json::Value,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BatchProcessingResult {
    pub successful_count: usize,
    pub failed_count: usize,
    pub results: Vec<ProcessingResult>,
    pub errors: Vec<String>,
    pub total_processing_time_ms: u64,
}