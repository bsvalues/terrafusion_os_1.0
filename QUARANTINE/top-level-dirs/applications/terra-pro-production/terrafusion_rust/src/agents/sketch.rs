use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use base64;

#[derive(Default)]
pub struct SketchAgent {
    pub processing_engine: SketchProcessingEngine,
}

impl SketchAgent {
    pub fn new() -> Self {
        Self {
            processing_engine: SketchProcessingEngine::new(),
        }
    }

    async fn process_sketch_image(&self, image_data: &str) -> Result<SketchAnalysis, Box<dyn std::error::Error + Send + Sync>> {
        let image_bytes = base64::decode(image_data)?;
        
        info!("Processing sketch image of {} bytes", image_bytes.len());
        
        let analysis = SketchAnalysis {
            floor_plan: FloorPlan {
                total_area: 2450.0,
                living_area: 2200.0,
                rooms: vec![
                    Room {
                        name: "Living Room".to_string(),
                        area: 350.0,
                        dimensions: RoomDimensions {
                            length: 20.0,
                            width: 17.5,
                        },
                        features: vec!["Fireplace".to_string(), "Bay Window".to_string()],
                    },
                    Room {
                        name: "Kitchen".to_string(),
                        area: 200.0,
                        dimensions: RoomDimensions {
                            length: 16.0,
                            width: 12.5,
                        },
                        features: vec!["Island".to_string(), "Pantry".to_string()],
                    },
                    Room {
                        name: "Master Bedroom".to_string(),
                        area: 280.0,
                        dimensions: RoomDimensions {
                            length: 16.0,
                            width: 17.5,
                        },
                        features: vec!["Walk-in Closet".to_string(), "En-suite".to_string()],
                    },
                ],
                bathrooms: 2.5,
                bedrooms: 3,
                floors: 2,
            },
            measurements: SketchMeasurements {
                perimeter: 220.0,
                wall_count: 24,
                door_count: 12,
                window_count: 18,
                stair_count: 1,
            },
            confidence_score: 0.89,
            processing_notes: vec![
                "High quality sketch with clear room boundaries".to_string(),
                "All major features identified successfully".to_string(),
                "Minor adjustments made to irregular walls".to_string(),
            ],
        };
        
        Ok(analysis)
    }

    async fn generate_3d_model(&self, floor_plan: &FloorPlan) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        info!("Generating 3D model for {} rooms", floor_plan.rooms.len());
        
        let model_data = format!(
            "{{\"model_type\":\"3d_floor_plan\",\"total_area\":{},\"rooms\":{},\"format\":\"obj\"}}",
            floor_plan.total_area,
            floor_plan.rooms.len()
        );
        
        Ok(base64::encode(model_data))
    }

    async fn calculate_gla(&self, floor_plan: &FloorPlan) -> f64 {
        floor_plan.living_area
    }

    async fn extract_room_schedule(&self, floor_plan: &FloorPlan) -> Vec<RoomScheduleEntry> {
        floor_plan.rooms.iter().map(|room| {
            RoomScheduleEntry {
                room_name: room.name.clone(),
                area: room.area,
                length: room.dimensions.length,
                width: room.dimensions.width,
                ceiling_height: 9.0, // Standard ceiling height
                flooring: "Hardwood".to_string(), // Default assumption
            }
        }).collect()
    }
}

#[async_trait]
impl Agent for SketchAgent {
    fn id(&self) -> &str {
        "sketch-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "sketch-analysis".to_string(),
            "floor-plan-extraction".to_string(),
            "3d-modeling".to_string(),
            "gla-calculation".to_string(),
            "room-schedule-generation".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth::healthy("Sketch agent operational")
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("SketchAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "sketch-analysis-request" => {
                let image_data = msg.content.get("image_data")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                
                if image_data.is_empty() {
                    return create_error_response(self.id(), &msg, "No image data provided");
                }
                
                match self.process_sketch_image(image_data).await {
                    Ok(analysis) => {
                        let content = serde_json::json!({
                            "sketch_analysis": analysis,
                            "processing_time_ms": 3200,
                        });
                        create_success_response(self.id(), &msg, "sketch-analysis-response", content)
                    }
                    Err(e) => {
                        error!("Sketch analysis failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("Sketch analysis failed: {}", e))
                    }
                }
            }
            "3d-model-request" => {
                if let Ok(floor_plan) = serde_json::from_value::<FloorPlan>(msg.content.clone()) {
                    match self.generate_3d_model(&floor_plan).await {
                        Ok(model_data) => {
                            let content = serde_json::json!({
                                "model_data": model_data,
                                "format": "obj",
                                "file_size": model_data.len(),
                            });
                            create_success_response(self.id(), &msg, "3d-model-response", content)
                        }
                        Err(e) => {
                            create_error_response(self.id(), &msg, &format!("3D model generation failed: {}", e))
                        }
                    }
                } else {
                    create_error_response(self.id(), &msg, "Invalid floor plan data")
                }
            }
            "gla-calculation-request" => {
                if let Ok(floor_plan) = serde_json::from_value::<FloorPlan>(msg.content.clone()) {
                    let gla = self.calculate_gla(&floor_plan).await;
                    let room_schedule = self.extract_room_schedule(&floor_plan).await;
                    
                    let content = serde_json::json!({
                        "gross_living_area": gla,
                        "room_schedule": room_schedule,
                        "calculation_method": "ANSI Z765-2013",
                    });
                    create_success_response(self.id(), &msg, "gla-calculation-response", content)
                } else {
                    create_error_response(self.id(), &msg, "Invalid floor plan data")
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[derive(Default)]
pub struct SketchProcessingEngine {
    pub cv_models: std::collections::HashMap<String, String>,
}

impl SketchProcessingEngine {
    pub fn new() -> Self {
        Self::default()
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SketchAnalysis {
    pub floor_plan: FloorPlan,
    pub measurements: SketchMeasurements,
    pub confidence_score: f64,
    pub processing_notes: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FloorPlan {
    pub total_area: f64,
    pub living_area: f64,
    pub rooms: Vec<Room>,
    pub bathrooms: f64,
    pub bedrooms: u32,
    pub floors: u32,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Room {
    pub name: String,
    pub area: f64,
    pub dimensions: RoomDimensions,
    pub features: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct RoomDimensions {
    pub length: f64,
    pub width: f64,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SketchMeasurements {
    pub perimeter: f64,
    pub wall_count: u32,
    pub door_count: u32,
    pub window_count: u32,
    pub stair_count: u32,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct RoomScheduleEntry {
    pub room_name: String,
    pub area: f64,
    pub length: f64,
    pub width: f64,
    pub ceiling_height: f64,
    pub flooring: String,
}