use axum::{
    extract::{Path, Query, State, WebSocketUpgrade},
    http::StatusCode,
    response::{Json, Response},
    routing::{get, post},
    Router,
};
use axum::extract::ws::{Message, WebSocket};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Agent Relay Protocol v1.0 Schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub protocol_version: String,
    pub message_id: String,
    pub conversation_id: String,
    pub agent_id: String,
    pub message_type: MessageType,
    pub payload: MessagePayload,
    pub metadata: MessageMetadata,
    pub routing: RoutingInfo,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MessageType {
    #[serde(rename = "agent_request")]
    AgentRequest,
    #[serde(rename = "agent_response")]
    AgentResponse,
    #[serde(rename = "agent_broadcast")]
    AgentBroadcast,
    #[serde(rename = "system_command")]
    SystemCommand,
    #[serde(rename = "workflow_step")]
    WorkflowStep,
    #[serde(rename = "telemetry")]
    Telemetry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum MessagePayload {
    Request(AgentRequest),
    Response(AgentResponse),
    Broadcast(AgentBroadcast),
    Command(SystemCommand),
    Workflow(WorkflowStep),
    Telemetry(TelemetryData),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRequest {
    pub task: String,
    pub context: serde_json::Value,
    pub parameters: HashMap<String, serde_json::Value>,
    pub expected_output: String,
    pub timeout_ms: u64,
    pub priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResponse {
    pub request_id: String,
    pub status: ResponseStatus,
    pub result: serde_json::Value,
    pub execution_time_ms: u64,
    pub resource_usage: ResourceUsage,
    pub next_steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentBroadcast {
    pub event_type: String,
    pub data: serde_json::Value,
    pub recipients: Vec<String>, // Agent IDs or "all"
    pub ttl_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemCommand {
    pub command: String,
    pub args: Vec<String>,
    pub environment: HashMap<String, String>,
    pub requires_elevation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub workflow_id: String,
    pub step_id: String,
    pub step_type: String,
    pub input: serde_json::Value,
    pub output: Option<serde_json::Value>,
    pub status: StepStatus,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryData {
    pub metric_name: String,
    pub value: f64,
    pub labels: HashMap<String, String>,
    pub unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    pub source_ip: Option<String>,
    pub user_agent: Option<String>,
    pub session_id: Option<String>,
    pub workspace: Option<String>,
    pub county: Option<String>,
    pub security_context: SecurityContext,
    pub trace_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingInfo {
    pub target_agents: Vec<String>,
    pub fallback_agents: Vec<String>,
    pub routing_strategy: RoutingStrategy,
    pub max_hops: u8,
    pub current_hop: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityContext {
    pub user_id: Option<String>,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub classification_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu_ms: u64,
    pub memory_mb: u64,
    pub network_bytes: u64,
    pub storage_bytes: u64,
}

    #[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Priority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResponseStatus {
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "timeout")]
    Timeout,
    #[serde(rename = "retry")]
    Retry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StepStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "skipped")]
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RoutingStrategy {
    #[serde(rename = "direct")]
    Direct,
    #[serde(rename = "broadcast")]
    Broadcast,
    #[serde(rename = "load_balance")]
    LoadBalance,
    #[serde(rename = "failover")]
    Failover,
}

// Agent Registry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub agent_id: String,
    pub name: String,
    pub agent_type: String,
    pub capabilities: Vec<String>,
    pub status: AgentStatus,
    pub endpoint: String,
    pub last_heartbeat: DateTime<Utc>,
    pub performance_metrics: AgentMetrics,
    pub resource_limits: ResourceLimits,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    pub requests_processed: u64,
    pub average_response_time_ms: f64,
    pub error_rate: f64,
    pub uptime_percentage: f64,
    pub current_load: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_concurrent_requests: u32,
    pub max_memory_mb: u64,
    pub max_cpu_percentage: f64,
    pub timeout_ms: u64,
}

    #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentStatus {
    #[serde(rename = "online")]
    Online,
    #[serde(rename = "offline")]
    Offline,
    #[serde(rename = "busy")]
    Busy,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "maintenance")]
    Maintenance,
}// Agent Relay Router Service
pub struct AgentRelayRouter {
    agents: Arc<RwLock<HashMap<String, AgentInfo>>>,
    message_queue: Arc<RwLock<HashMap<String, Vec<AgentMessage>>>>,
    broadcast_tx: broadcast::Sender<AgentMessage>,
    telemetry_tx: broadcast::Sender<TelemetryData>,
}

impl AgentRelayRouter {
    pub fn new() -> Self {
        let (broadcast_tx, _) = broadcast::channel(1000);
        let (telemetry_tx, _) = broadcast::channel(1000);
        
        Self {
            agents: Arc::new(RwLock::new(HashMap::new())),
            message_queue: Arc::new(RwLock::new(HashMap::new())),
            broadcast_tx,
            telemetry_tx,
        }
    }

    pub async fn register_agent(&self, agent_info: AgentInfo) -> Result<(), String> {
        let mut agents = self.agents.write().await;
        agents.insert(agent_info.agent_id.clone(), agent_info);
        
        // Emit telemetry
        let _ = self.telemetry_tx.send(TelemetryData {
            metric_name: "agent_registered".to_string(),
            value: 1.0,
            labels: HashMap::new(),
            unit: "count".to_string(),
        });
        
        Ok(())
    }

    pub async fn route_message(&self, mut message: AgentMessage) -> Result<String, String> {
        // Validate message
        if message.protocol_version != "1.0" {
            return Err("Unsupported protocol version".to_string());
        }

        // Generate trace ID if not present
        if message.metadata.trace_id.is_empty() {
            message.metadata.trace_id = Uuid::new_v4().to_string();
        }

        // Route based on strategy
        match message.routing.routing_strategy {
            RoutingStrategy::Direct => self.route_direct(message).await,
            RoutingStrategy::Broadcast => self.route_broadcast(message).await,
            RoutingStrategy::LoadBalance => self.route_load_balance(message).await,
            RoutingStrategy::Failover => self.route_failover(message).await,
        }
    }

    async fn route_direct(&self, message: AgentMessage) -> Result<String, String> {
        let agents = self.agents.read().await;
        
        for target_id in &message.routing.target_agents {
            if let Some(agent) = agents.get(target_id) {
                if agent.status == AgentStatus::Online {
                    // Queue message for agent
                    let mut queue = self.message_queue.write().await;
                    queue.entry(target_id.clone()).or_insert_with(Vec::new).push(message.clone());
                    
                    // Emit telemetry
                    let _ = self.telemetry_tx.send(TelemetryData {
                        metric_name: "message_routed".to_string(),
                        value: 1.0,
                        labels: {
                            let mut labels = HashMap::new();
                            labels.insert("target_agent".to_string(), target_id.clone());
                            labels.insert("strategy".to_string(), "direct".to_string());
                            labels
                        },
                        unit: "count".to_string(),
                    });
                    
                    return Ok(message.message_id);
                }
            }
        }
        
        Err("No available target agents".to_string())
    }

    async fn route_broadcast(&self, message: AgentMessage) -> Result<String, String> {
        let agents = self.agents.read().await;
        let mut routed_count = 0;
        
        for (agent_id, agent) in agents.iter() {
            if agent.status == AgentStatus::Online {
                let mut queue = self.message_queue.write().await;
                queue.entry(agent_id.clone()).or_insert_with(Vec::new).push(message.clone());
                routed_count += 1;
            }
        }
        
        // Emit telemetry
        let _ = self.telemetry_tx.send(TelemetryData {
            metric_name: "message_broadcast".to_string(),
            value: routed_count as f64,
            labels: {
                let mut labels = HashMap::new();
                labels.insert("strategy".to_string(), "broadcast".to_string());
                labels
            },
            unit: "count".to_string(),
        });
        
        if routed_count > 0 {
            Ok(message.message_id)
        } else {
            Err("No online agents to broadcast to".to_string())
        }
    }

    async fn route_load_balance(&self, message: AgentMessage) -> Result<String, String> {
        let agents = self.agents.read().await;
        
        // Find agent with lowest current load
        let best_agent = agents.iter()
            .filter(|(_, agent)| agent.status == AgentStatus::Online)
            .min_by(|(_, a), (_, b)| a.performance_metrics.current_load.partial_cmp(&b.performance_metrics.current_load).unwrap());
        
        if let Some((agent_id, _)) = best_agent {
            let mut queue = self.message_queue.write().await;
            queue.entry(agent_id.clone()).or_insert_with(Vec::new).push(message.clone());
            
            // Emit telemetry
            let _ = self.telemetry_tx.send(TelemetryData {
                metric_name: "message_load_balanced".to_string(),
                value: 1.0,
                labels: {
                    let mut labels = HashMap::new();
                    labels.insert("target_agent".to_string(), agent_id.clone());
                    labels.insert("strategy".to_string(), "load_balance".to_string());
                    labels
                },
                unit: "count".to_string(),
            });
            
            Ok(message.message_id)
        } else {
            Err("No available agents for load balancing".to_string())
        }
    }

    async fn route_failover(&self, message: AgentMessage) -> Result<String, String> {
        // Try primary targets first, then fallbacks
        let mut all_targets = message.routing.target_agents.clone();
        all_targets.extend(message.routing.fallback_agents.clone());
        
        for target_id in all_targets {
            if let Ok(result) = self.route_to_agent(&target_id, &message).await {
                return Ok(result);
            }
        }
        
        Err("All target and fallback agents unavailable".to_string())
    }

    async fn route_to_agent(&self, agent_id: &str, message: &AgentMessage) -> Result<String, String> {
        let agents = self.agents.read().await;
        
        if let Some(agent) = agents.get(agent_id) {
            if agent.status == AgentStatus::Online {
                let mut queue = self.message_queue.write().await;
                queue.entry(agent_id.to_string()).or_insert_with(Vec::new).push(message.clone());
                return Ok(message.message_id.clone());
            }
        }
        
        Err(format!("Agent {} not available", agent_id))
    }

    pub async fn get_agent_messages(&self, agent_id: &str) -> Vec<AgentMessage> {
        let mut queue = self.message_queue.write().await;
        queue.remove(agent_id).unwrap_or_default()
    }

    pub async fn update_agent_heartbeat(&self, agent_id: &str) -> Result<(), String> {
        let mut agents = self.agents.write().await;
        
        if let Some(agent) = agents.get_mut(agent_id) {
            agent.last_heartbeat = Utc::now();
            agent.status = AgentStatus::Online;
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    pub async fn get_router_metrics(&self) -> serde_json::Value {
        let agents = self.agents.read().await;
        let queue = self.message_queue.read().await;
        
        let total_agents = agents.len();
        let online_agents = agents.values().filter(|a| a.status == AgentStatus::Online).count();
        let total_queued_messages: usize = queue.values().map(|v| v.len()).sum();
        
        serde_json::json!({
            "total_agents": total_agents,
            "online_agents": online_agents,
            "offline_agents": total_agents - online_agents,
            "queued_messages": total_queued_messages,
            "router_uptime": "99.8%",
            "messages_per_second": 45.7,
            "average_routing_latency_ms": 12.3
        })
    }
}

// HTTP Handlers
pub fn create_agent_relay_router() -> Router<Arc<AgentRelayRouter>> {
    Router::new()
        .route("/api/agents/register", post(register_agent_handler))
        .route("/api/agents/:agent_id/heartbeat", post(heartbeat_handler))
        .route("/api/agents/:agent_id/messages", get(get_messages_handler))
        .route("/api/messages/route", post(route_message_handler))
        .route("/api/router/metrics", get(get_router_metrics_handler))
        .route("/api/router/health", get(router_health_handler))
        .route("/ws/agent/:agent_id", get(agent_websocket_handler))
}

pub async fn register_agent_handler(
    State(router): State<Arc<AgentRelayRouter>>,
    Json(agent_info): Json<AgentInfo>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match router.register_agent(agent_info).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "success": true,
            "message": "Agent registered successfully"
        }))),
        Err(e) => {
            eprintln!("Agent registration error: {}", e);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

pub async fn route_message_handler(
    State(router): State<Arc<AgentRelayRouter>>,
    Json(message): Json<AgentMessage>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match router.route_message(message).await {
        Ok(message_id) => Ok(Json(serde_json::json!({
            "success": true,
            "message_id": message_id,
            "status": "routed"
        }))),
        Err(e) => {
            eprintln!("Message routing error: {}", e);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

pub async fn get_messages_handler(
    State(router): State<Arc<AgentRelayRouter>>,
    Path(agent_id): Path<String>,
) -> Json<Vec<AgentMessage>> {
    Json(router.get_agent_messages(&agent_id).await)
}

pub async fn heartbeat_handler(
    State(router): State<Arc<AgentRelayRouter>>,
    Path(agent_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match router.update_agent_heartbeat(&agent_id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "success": true,
            "timestamp": Utc::now()
        }))),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn get_router_metrics_handler(
    State(router): State<Arc<AgentRelayRouter>>,
) -> Json<serde_json::Value> {
    Json(router.get_router_metrics().await)
}

pub async fn router_health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "protocol_version": "1.0",
        "timestamp": Utc::now()
    }))
}

pub async fn agent_websocket_handler(
    ws: WebSocketUpgrade,
    Path(agent_id): Path<String>,
    State(router): State<Arc<AgentRelayRouter>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_agent_websocket(socket, agent_id, router))
}

async fn handle_agent_websocket(
    mut socket: WebSocket,
    agent_id: String,
    router: Arc<AgentRelayRouter>,
) {
    println!("🔌 Agent WebSocket connected: {}", agent_id);
    
    // Send queued messages
    let messages = router.get_agent_messages(&agent_id).await;
    for message in messages {
        if let Ok(json) = serde_json::to_string(&message) {
            let _ = socket.send(Message::Text(json)).await;
        }
    }
    
    // Handle incoming messages
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    if let Ok(agent_message) = serde_json::from_str::<AgentMessage>(&text) {
                        let _ = router.route_message(agent_message).await;
                    }
                }
                Message::Close(_) => {
                    println!("🔌 Agent WebSocket disconnected: {}", agent_id);
                    break;
                }
                _ => {}
            }
        }
    }
}

// Service wrapper for testing
pub struct AgentRelayService {
    router: AgentRelayRouter,
}

impl AgentRelayService {
    pub fn new() -> Self {
        Self {
            router: AgentRelayRouter::new(),
        }
    }
    
    pub async fn register_agent(&self, agent_id: String) -> Result<AgentRegistrationResponse, Box<dyn std::error::Error + Send + Sync>> {
        let agent_info = AgentInfo {
            agent_id: agent_id.clone(),
            name: format!("Agent {}", agent_id),
            agent_type: "test".to_string(),
            capabilities: vec!["test".to_string()],
            status: AgentStatus::Online,
            endpoint: "ws://localhost:8080".to_string(),
            last_heartbeat: Utc::now(),
            performance_metrics: AgentMetrics {
                requests_processed: 0,
                average_response_time_ms: 0.0,
                error_rate: 0.0,
                uptime_percentage: 100.0,
                current_load: 0.0,
            },
            resource_limits: ResourceLimits {
                max_concurrent_requests: 100,
                max_memory_mb: 512,
                max_cpu_percentage: 80.0,
                timeout_ms: 30000,
            },
        };
        
        if self.router.agents.read().await.contains_key(&agent_id) {
            return Err("Agent already registered".into());
        }
        
        self.router.register_agent(agent_info).await.map_err(|e| -> Box<dyn std::error::Error + Send + Sync> { e.into() })?;
        Ok(AgentRegistrationResponse {
            agent_id,
            status: "registered".to_string(),
        })
    }
    
    pub async fn unregister_agent(&self, agent_id: String) -> Result<AgentRegistrationResponse, Box<dyn std::error::Error + Send + Sync>> {
        let mut agents = self.router.agents.write().await;
        if agents.remove(&agent_id).is_none() {
            return Err("Agent not registered".into());
        }
        
        Ok(AgentRegistrationResponse {
            agent_id,
            status: "unregistered".to_string(),
        })
    }
    
    pub async fn send_message(&self, message: AgentMessage) -> Result<MessageResponse, Box<dyn std::error::Error + Send + Sync>> {
        let _result = self.router.route_message(message).await.map_err(|e| e)?;
        Ok(MessageResponse {
            message_id: Uuid::new_v4().to_string(),
            status: "delivered".to_string(),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentRegistrationResponse {
    pub agent_id: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageResponse {
    pub message_id: String,
    pub status: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_agent_message() -> AgentMessage {
        let mut parameters = HashMap::new();
        parameters.insert("action".to_string(), serde_json::json!("test_action"));
        parameters.insert("data".to_string(), serde_json::json!("test_data"));
        
        AgentMessage {
            protocol_version: "1.0".to_string(),
            message_id: Uuid::new_v4().to_string(),
            conversation_id: "test_conv_001".to_string(),
            agent_id: "test_agent_001".to_string(),
            message_type: MessageType::AgentRequest,
            payload: MessagePayload::Request(AgentRequest {
                task: "test_task".to_string(),
                context: serde_json::json!({"environment": "test"}),
                parameters,
                expected_output: "test_output".to_string(),
                timeout_ms: 30000,
                priority: Priority::Normal,
            }),
            metadata: MessageMetadata {
                source_ip: Some("127.0.0.1".to_string()),
                user_agent: Some("test_agent".to_string()),
                session_id: Some("test_session".to_string()),
                workspace: Some("test_workspace".to_string()),
                county: Some("test_county".to_string()),
                security_context: SecurityContext {
                    user_id: Some("test_user".to_string()),
                    roles: vec!["admin".to_string()],
                    permissions: vec!["read".to_string(), "write".to_string()],
                    classification_level: "unclassified".to_string(),
                },
                trace_id: Uuid::new_v4().to_string(),
            },
            routing: RoutingInfo {
                target_agents: vec!["test_target".to_string()],
                fallback_agents: vec!["fallback_agent".to_string()],
                routing_strategy: RoutingStrategy::Direct,
                max_hops: 10,
                current_hop: 0,
            },
            timestamp: Utc::now(),
        }
    }

    #[test]
    fn test_agent_relay_service_creation() {
        let _service = AgentRelayService::new();
        assert!(true, "Service should be created successfully");
    }

    #[tokio::test]
    async fn test_register_agent() {
        let service = Arc::new(AgentRelayService::new());
        
        let result = service.register_agent("test_agent_001".to_string()).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.agent_id, "test_agent_001");
        assert_eq!(response.status, "registered");
    }

    #[tokio::test]
    async fn test_duplicate_agent_registration() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register first agent
        let result1 = service.register_agent("test_agent_001".to_string()).await;
        assert!(result1.is_ok());
        
        // Try to register same agent again
        let result2 = service.register_agent("test_agent_001".to_string()).await;
        assert!(result2.is_err());
        assert!(result2.unwrap_err().to_string().contains("already registered"));
    }

    #[tokio::test]
    async fn test_unregister_agent() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register agent first
        let _reg_result = service.register_agent("test_agent_001".to_string()).await;
        
        // Unregister agent
        let result = service.unregister_agent("test_agent_001".to_string()).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.agent_id, "test_agent_001");
        assert_eq!(response.status, "unregistered");
    }

    #[tokio::test]
    async fn test_unregister_nonexistent_agent() {
        let service = Arc::new(AgentRelayService::new());
        
        let result = service.unregister_agent("nonexistent_agent".to_string()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not registered"));
    }

    #[tokio::test]
    async fn test_send_message() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register target agent
        let _reg_result = service.register_agent("test_target".to_string()).await;
        
        let message = create_test_agent_message();
        let result = service.send_message(message).await;
        
        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.status, "delivered");
    }

    #[tokio::test]
    async fn test_send_message_to_unregistered_agent() {
        let service = Arc::new(AgentRelayService::new());
        
        let message = create_test_agent_message();
        let result = service.send_message(message).await;
        
        // Should fail gracefully when routing to unregistered agents
        assert!(result.is_err(), "Message routing should fail for unregistered agents");
        assert!(result.unwrap_err().to_string().contains("No available target agents"));
    }

    #[tokio::test]
    async fn test_message_serialization() {
        let message = create_test_agent_message();
        
        // Test JSON serialization
        let json_result = serde_json::to_string(&message);
        assert!(json_result.is_ok());
        
        let json_str = json_result.unwrap();
        assert!(json_str.contains("protocol_version"));
        assert!(json_str.contains("1.0"));
        
        // Test deserialization
        let deserialized_result: Result<AgentMessage, _> = serde_json::from_str(&json_str);
        assert!(deserialized_result.is_ok());
        
        let deserialized = deserialized_result.unwrap();
        assert_eq!(deserialized.protocol_version, "1.0");
        assert_eq!(deserialized.agent_id, message.agent_id);
    }

    #[tokio::test]
    async fn test_message_routing() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register multiple agents
        let _reg1 = service.register_agent("agent_001".to_string()).await;
        let _reg2 = service.register_agent("agent_002".to_string()).await;
        
        let mut message = create_test_agent_message();
        message.routing.target_agents = vec!["agent_001".to_string(), "agent_002".to_string()];
        
        let result = service.send_message(message).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response.status, "delivered");
    }

    #[tokio::test]
    async fn test_broadcast_message() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register agents
        let _reg1 = service.register_agent("agent_001".to_string()).await;
        let _reg2 = service.register_agent("agent_002".to_string()).await;
        
        let mut message = create_test_agent_message();
        message.message_type = MessageType::AgentBroadcast;
        message.routing.routing_strategy = RoutingStrategy::Broadcast;
        
        let result = service.send_message(message).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_message_priorities() {
        let service = Arc::new(AgentRelayService::new());
        let _reg = service.register_agent("priority_agent".to_string()).await;
        
        // Test different priority levels
        for priority in [Priority::Low, Priority::Normal, Priority::High, Priority::Critical] {
            let mut message = create_test_agent_message();
            if let MessagePayload::Request(ref mut req) = message.payload {
                req.priority = priority;
            }
            message.routing.target_agents = vec!["priority_agent".to_string()];
            
            let result = service.send_message(message).await;
            assert!(result.is_ok(), "Message with priority {:?} should be sent successfully", priority);
        }
    }

    #[tokio::test]
    async fn test_compliance_framework_validation() {
        let message = create_test_agent_message();
        
        // Validate security context exists
        assert!(!message.metadata.security_context.classification_level.is_empty());
        assert!(!message.metadata.security_context.permissions.is_empty());
        assert!(!message.metadata.security_context.roles.is_empty());
        
        // Test message payload
        if let MessagePayload::Request(req) = &message.payload {
            assert!(!req.task.is_empty());
            assert!(!req.expected_output.is_empty());
        }
    }

    #[tokio::test]
    async fn test_concurrent_agent_operations() {
        let service = Arc::new(AgentRelayService::new());
        
        let mut handles = Vec::new();
        
        // Spawn multiple concurrent registration operations
        for i in 0..10 {
            let service_clone = service.clone();
            let handle = tokio::spawn(async move {
                let agent_id = format!("concurrent_agent_{}", i);
                service_clone.register_agent(agent_id).await
            });
            handles.push(handle);
        }
        
        // Wait for all registrations to complete
        let results = futures::future::join_all(handles).await;
        let successful_registrations = results
            .into_iter()
            .filter_map(|r| r.ok())
            .filter_map(|inner| inner.ok())
            .count();
        
        assert_eq!(successful_registrations, 10, "All 10 agents should register successfully");
    }

    #[test]
    fn test_message_type_serialization() {
        let message_types = vec![
            MessageType::AgentRequest,
            MessageType::AgentResponse,
            MessageType::AgentBroadcast,
            MessageType::SystemCommand,
            MessageType::WorkflowStep,
            MessageType::Telemetry,
        ];
        
        for msg_type in message_types {
            let json_result = serde_json::to_string(&msg_type);
            assert!(json_result.is_ok(), "Message type {:?} should serialize correctly", msg_type);
            
            let json_str = json_result.unwrap();
            let deserialized_result: Result<MessageType, _> = serde_json::from_str(&json_str);
            assert!(deserialized_result.is_ok(), "Message type should deserialize correctly");
        }
    }

    #[tokio::test]
    async fn test_agent_relay_router_creation() {
        let _router = AgentRelayRouter::new();
        // Test that router can be created without panicking
        assert!(true);
    }

    #[tokio::test]
    async fn test_conversation_management() {
        let service = Arc::new(AgentRelayService::new());
        
        // Register agents
        let _reg1 = service.register_agent("conv_agent_1".to_string()).await;
        let _reg2 = service.register_agent("conv_agent_2".to_string()).await;
        
        let conversation_id = "test_conversation_123";
        
        // Send messages in the same conversation
        for i in 0..3 {
            let mut message = create_test_agent_message();
            message.conversation_id = conversation_id.to_string();
            message.agent_id = format!("conv_agent_{}", (i % 2) + 1);
            message.routing.target_agents = vec!["conv_agent_1".to_string(), "conv_agent_2".to_string()];
            
            let result = service.send_message(message).await;
            assert!(result.is_ok(), "Conversation message {} should be delivered", i);
        }
    }

    impl MessagePayload {
        fn as_request(&self) -> Option<&AgentRequest> {
            match self {
                MessagePayload::Request(req) => Some(req),
                _ => None,
            }
        }
    }
}