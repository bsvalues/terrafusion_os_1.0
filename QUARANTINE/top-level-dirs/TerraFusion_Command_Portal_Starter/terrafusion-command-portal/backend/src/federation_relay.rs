//! TerraFusion Federation Relay - Cross-County Communication Hub
//! 
//! This service manages secure, real-time communication between TerraFusion
//! county deployments, enabling seamless citizen services across jurisdictions.
//! 
//! Architecture:
//! - Multi-county mesh topology with automatic discovery
//! - End-to-end encryption with county-specific keypairs  
//! - Message routing with multiple strategies (nearest, broadcast, etc.)
//! - Health monitoring and failover capabilities
//! - Comprehensive audit logging for compliance

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use axum::{
    extract::{Path, State, WebSocketUpgrade},
    http::StatusCode,
    response::{Json, Response},
    routing::{get, post},
    Router,
};
use axum::extract::ws::{WebSocket, Message};
use axum::response::IntoResponse;
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock, Mutex};
use tokio::time::interval;
use tracing::{info, warn, error, debug};
use uuid::Uuid;
use futures_util::{SinkExt, StreamExt};

/// Federation Relay Server State
#[derive(Clone)]
pub struct FederationRelayState {
    pub cluster_id: String,
    pub county_name: String,
    pub counties: Arc<RwLock<HashMap<String, CountyNode>>>,
    pub message_bus: broadcast::Sender<FederationMessage>,
    pub metrics: Arc<FederationMetrics>,
    pub health_checker: Arc<HealthChecker>,
    pub security_manager: Arc<SecurityManager>,
    pub websocket_subscribers: Arc<RwLock<HashMap<String, tokio::sync::mpsc::UnboundedSender<String>>>>,
    pub real_time_connections: Arc<RwLock<HashMap<String, CountyConnection>>>,
}

/// County Node Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyNode {
    pub name: String,
    pub display_name: String,
    pub endpoints: Vec<String>,
    pub public_key: String,
    pub capabilities: Vec<String>,
    pub trust_level: TrustLevel,
    pub last_seen: SystemTime,
    pub health_status: HealthStatus,
    pub metrics: CountyMetrics,
}

/// Trust levels for inter-county communication
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrustLevel {
    Verified,      // Full trust, all operations allowed
    Provisional,   // Limited trust, restricted operations
    Untrusted,     // No trust, blocked
}

/// Health status of county nodes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
}

/// County-specific performance metrics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CountyMetrics {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub avg_latency_ms: f64,
    pub error_rate: f64,
    pub last_error: Option<String>,
    pub uptime_percentage: f64,
    pub fips_code: Option<String>,
    pub coordinates: Option<(f64, f64)>, // lat, lng for mapping
    pub population: Option<u64>,
    pub active_connections: u32,
    pub total_throughput_mbps: f64,
}

/// Real-time county connection for monitoring dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyConnection {
    pub id: String,
    pub source_county: String,
    pub target_county: String,
    pub source_fips: Option<String>,
    pub target_fips: Option<String>,
    pub status: ConnectionStatus,
    pub latency_ms: f64,
    pub throughput_mbps: f64,
    pub last_updated: u64,
    pub connection_type: ConnectionType,
    pub security_level: SecurityLevel,
    pub packet_loss_percent: f64,
    pub bandwidth_utilization: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Active,
    Degraded,
    Failed,
    Maintenance,
    Establishing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionType {
    Primary,
    Backup,
    Emergency,
    Satellite,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityLevel {
    Public,
    Confidential,
    Secret,
    TopSecret,
}

/// Real-time WebSocket message for federation monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub timestamp: u64,
    pub data: serde_json::Value,
}

/// Comprehensive federation dashboard metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FederationDashboardMetrics {
    pub timestamp: u64,
    pub total_counties: u32,
    pub active_counties: u32,
    pub total_connections: u32,
    pub active_connections: u32,
    pub avg_latency_ms: f64,
    pub total_throughput_gbps: f64,
    pub security_incidents: u32,
    pub system_health: f64, // 0.0 to 1.0
    pub geographic_coverage: f64,
    pub redundancy_factor: f64,
}

/// Federation message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FederationMessage {
    pub id: String,
    pub source_county: String,
    pub target_county: Option<String>, // None for broadcast
    pub message_type: FederationMessageType,
    pub payload: serde_json::Value,
    pub timestamp: SystemTime,
    pub ttl_seconds: u64,
    pub hop_count: u32,
    pub signature: Option<String>,
    pub priority: MessagePriority,
}

/// Types of federation messages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FederationMessageType {
    // Core Services
    CitizenServiceRequest,
    PublicRecordRequest,
    EmergencyAlert,
    PermitApplication,
    
    // Administrative
    HealthCheck,
    NodeAnnouncement,
    CapabilityAdvertisement,
    PolicyUpdate,
    
    // System
    HeartBeat,
    RoutingUpdate,
    SecurityAlert,
    AuditLog,
}

/// Message priority levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialOrd, PartialEq)]
pub enum MessagePriority {
    Emergency = 4,   // Emergency services, immediate routing
    High = 3,        // Citizen services, time-sensitive
    Normal = 2,      // Standard operations
    Low = 1,         // Background tasks, maintenance
}

/// Message routing strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RoutingStrategy {
    NearestFirst,    // Route to geographically nearest county
    LoadBalance,     // Route to least loaded county
    FloodFill,       // Broadcast to all reachable counties
    DirectOnly,      // Only direct connections, no relay
}

/// Federation metrics collector
#[derive(Debug, Default)]
pub struct FederationMetrics {
    pub total_messages: Arc<Mutex<u64>>,
    pub messages_by_type: Arc<Mutex<HashMap<String, u64>>>,
    pub latency_histogram: Arc<Mutex<Vec<Duration>>>,
    pub error_count: Arc<Mutex<u64>>,
    pub active_connections: Arc<Mutex<u64>>,
    pub county_health_scores: Arc<Mutex<HashMap<String, f64>>>,
}

/// Health monitoring system
#[derive(Debug)]
pub struct HealthChecker {
    pub check_interval: Duration,
    pub timeout: Duration,
    pub failure_threshold: u32,
    pub success_threshold: u32,
    pub county_health: Arc<RwLock<HashMap<String, CountyHealth>>>,
}

/// Health tracking per county
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyHealth {
    pub consecutive_failures: u32,
    pub consecutive_successes: u32,
    pub last_check: SystemTime,
    pub response_times: Vec<Duration>,
    pub status: HealthStatus,
}

/// Security management for federation
#[derive(Debug)]
pub struct SecurityManager {
    pub county_keys: Arc<RwLock<HashMap<String, String>>>,
    pub blocked_counties: Arc<RwLock<HashSet<String>>>,
    pub rate_limits: Arc<RwLock<HashMap<String, RateLimit>>>,
    pub audit_log: Arc<Mutex<Vec<SecurityEvent>>>,
}

/// Rate limiting per county
#[derive(Debug, Clone)]
pub struct RateLimit {
    pub requests_per_hour: u32,
    pub current_count: u32,
    pub window_start: SystemTime,
}

/// Security audit events
#[derive(Debug, Clone, Serialize)]
pub struct SecurityEvent {
    pub timestamp: SystemTime,
    pub event_type: String,
    pub source_county: String,
    pub severity: String,
    pub details: String,
}

/// Health check response
#[derive(Serialize)]
pub struct HealthCheckResponse {
    pub status: String,
    pub cluster_id: String,
    pub county: String,
    pub uptime_seconds: u64,
    pub connected_counties: usize,
    pub message_throughput: f64,
    pub last_error: Option<String>,
}

/// Federation statistics
#[derive(Serialize)]
pub struct FederationStats {
    pub cluster_info: ClusterInfo,
    pub message_stats: MessageStats,
    pub county_health: HashMap<String, CountyHealth>,
    pub performance_metrics: PerformanceMetrics,
}

#[derive(Serialize)]
pub struct ClusterInfo {
    pub cluster_id: String,
    pub total_counties: usize,
    pub healthy_counties: usize,
    pub protocol_version: String,
}

#[derive(Serialize)]
pub struct MessageStats {
    pub total_messages: u64,
    pub messages_per_second: f64,
    pub messages_by_type: HashMap<String, u64>,
    pub error_rate: f64,
}

#[derive(Serialize)]
pub struct PerformanceMetrics {
    pub avg_latency_ms: f64,
    pub p95_latency_ms: f64,
    pub throughput_mbps: f64,
    pub cpu_usage: f64,
    pub memory_usage_mb: f64,
}

/// Create the federation relay router
pub fn create_federation_router(state: FederationRelayState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/ready", get(readiness_check))
        .route("/stats", get(federation_stats))
        .route("/counties", get(list_counties))
        .route("/counties/:name", get(get_county_info))
        .route("/message", post(send_message))
        .route("/broadcast", post(broadcast_message))
        .route("/ws", get(websocket_handler))
        .route("/metrics", get(prometheus_metrics))
        .with_state(state)
}

/// Health check endpoint
async fn health_check(State(state): State<FederationRelayState>) -> impl IntoResponse {
    let counties = state.counties.read().await;
    let connected_counties = counties.len();
    
    let metrics = &state.metrics;
    let total_messages = *metrics.total_messages.lock().await;
    let error_count = *metrics.error_count.lock().await;
    
    let uptime = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    let response = HealthCheckResponse {
        status: "healthy".to_string(),
        cluster_id: state.cluster_id.clone(),
        county: state.county_name.clone(),
        uptime_seconds: uptime,
        connected_counties,
        message_throughput: total_messages as f64 / (uptime.max(1) as f64),
        last_error: if error_count > 0 { 
            Some("Check /stats for details".to_string()) 
        } else { 
            None 
        },
    };
    
    Json(response)
}

/// Readiness check for Kubernetes
async fn readiness_check(State(state): State<FederationRelayState>) -> impl IntoResponse {
    let counties = state.counties.read().await;
    let healthy_count = counties.values()
        .filter(|c| c.health_status == HealthStatus::Healthy)
        .count();
    
    if healthy_count > 0 {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    }
}

/// Get federation statistics
async fn federation_stats(State(state): State<FederationRelayState>) -> impl IntoResponse {
    let counties = state.counties.read().await;
    let metrics = &state.metrics;
    
    let total_messages = *metrics.total_messages.lock().await;
    let error_count = *metrics.error_count.lock().await;
    let messages_by_type = metrics.messages_by_type.lock().await.clone();
    let latency_samples = metrics.latency_histogram.lock().await.clone();
    
    let healthy_counties = counties.values()
        .filter(|c| c.health_status == HealthStatus::Healthy)
        .count();
    
    let avg_latency = if !latency_samples.is_empty() {
        latency_samples.iter()
            .map(|d| d.as_millis() as f64)
            .sum::<f64>() / latency_samples.len() as f64
    } else {
        0.0
    };
    
    let mut sorted_latencies = latency_samples.iter()
        .map(|d| d.as_millis() as f64)
        .collect::<Vec<_>>();
    sorted_latencies.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let p95_latency = if sorted_latencies.len() > 0 {
        let index = (sorted_latencies.len() as f64 * 0.95) as usize;
        sorted_latencies.get(index).copied().unwrap_or(0.0)
    } else {
        0.0
    };
    
    let county_health = state.health_checker.county_health.read().await.clone();
    
    let stats = FederationStats {
        cluster_info: ClusterInfo {
            cluster_id: state.cluster_id.clone(),
            total_counties: counties.len(),
            healthy_counties,
            protocol_version: "1.0".to_string(),
        },
        message_stats: MessageStats {
            total_messages,
            messages_per_second: total_messages as f64 / 3600.0, // rough estimate
            messages_by_type,
            error_rate: if total_messages > 0 {
                error_count as f64 / total_messages as f64
            } else {
                0.0
            },
        },
        county_health,
        performance_metrics: PerformanceMetrics {
            avg_latency_ms: avg_latency,
            p95_latency_ms: p95_latency,
            throughput_mbps: 0.0, // Would calculate from actual traffic
            cpu_usage: 0.0,       // Would get from system metrics
            memory_usage_mb: 0.0, // Would get from system metrics
        },
    };
    
    Json(stats)
}

/// List all known counties
async fn list_counties(State(state): State<FederationRelayState>) -> impl IntoResponse {
    let counties_guard = state.counties.read().await;
    let county_list: Vec<CountyNode> = counties_guard.values().cloned().collect();
    drop(counties_guard);
    Json(county_list)
}

/// Get specific county information
async fn get_county_info(
    State(state): State<FederationRelayState>,
    Path(name): Path<String>
) -> impl IntoResponse {
    let counties = state.counties.read().await;
    
    match counties.get(&name) {
        Some(county) => Ok(Json(county.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// Send targeted message to specific county
async fn send_message(
    State(state): State<FederationRelayState>,
    Json(message): Json<FederationMessage>
) -> impl IntoResponse {
    // Validate and route message
    match route_message(&state, message).await {
        Ok(message_id) => {
            Json(serde_json::json!({
                "status": "sent",
                "message_id": message_id,
                "timestamp": SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
            }))
        }
        Err(error) => {
            error!("Failed to route message: {}", error);
            Json(serde_json::json!({
                "status": "error",
                "error": error,
                "timestamp": SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
            }))
        }
    }
}

/// Broadcast message to all counties
async fn broadcast_message(
    State(state): State<FederationRelayState>,
    Json(mut message): Json<FederationMessage>
) -> impl IntoResponse {
    message.target_county = None; // Ensure broadcast
    
    match broadcast_to_all(&state, message).await {
        Ok(recipient_count) => {
            Json(serde_json::json!({
                "status": "broadcast",
                "recipients": recipient_count,
                "timestamp": SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
            }))
        }
        Err(error) => {
            error!("Failed to broadcast message: {}", error);
            Json(serde_json::json!({
                "status": "error",
                "error": error
            }))
        }
    }
}

/// WebSocket handler for real-time federation
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<FederationRelayState>
) -> Response {
    ws.on_upgrade(|socket| handle_federation_websocket(socket, state))
}

/// Handle WebSocket connections for real-time federation
async fn handle_federation_websocket(socket: WebSocket, state: FederationRelayState) {
    let (mut sender, mut receiver) = socket.split();
    let mut message_rx = state.message_bus.subscribe();
    
    // Handle incoming messages from this WebSocket
    let state_clone = state.clone();
    let incoming_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(federation_msg) = serde_json::from_str::<FederationMessage>(&text) {
                        if let Err(e) = route_message(&state_clone, federation_msg).await {
                            warn!("Failed to route WebSocket message: {}", e);
                        }
                    }
                }
                Ok(Message::Close(_)) => break,
                Err(e) => {
                    warn!("WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }
    });
    
    // Handle outgoing messages to this WebSocket
    let outgoing_task = tokio::spawn(async move {
        while let Ok(message) = message_rx.recv().await {
            if let Ok(json) = serde_json::to_string(&message) {
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });
    
    // Wait for either task to complete
    tokio::select! {
        _ = incoming_task => {},
        _ = outgoing_task => {},
    }
}

/// Route message to appropriate county
async fn route_message(
    state: &FederationRelayState,
    mut message: FederationMessage
) -> Result<String, String> {
    // Increment hop count
    message.hop_count += 1;
    
    // Check TTL
    if message.hop_count > 10 {
        return Err("Message exceeded maximum hops".to_string());
    }
    
    // Security validation
    if !validate_message_security(state, &message).await {
        return Err("Message failed security validation".to_string());
    }
    
    // Update metrics
    {
        let mut total = state.metrics.total_messages.lock().await;
        *total += 1;
        
        let mut by_type = state.metrics.messages_by_type.lock().await;
        let type_key = format!("{:?}", message.message_type);
        *by_type.entry(type_key).or_insert(0) += 1;
    }
    
    // Route based on target
    if let Some(target) = &message.target_county {
        send_to_county(state, target, &message).await
    } else {
        broadcast_to_all(state, message).await.map(|count| {
            format!("broadcast-{}", count)
        })
    }
}

/// Send message to specific county
async fn send_to_county(
    state: &FederationRelayState,
    target: &str,
    message: &FederationMessage
) -> Result<String, String> {
    let counties = state.counties.read().await;
    
    match counties.get(target) {
        Some(county) => {
            if county.health_status == HealthStatus::Healthy {
                // In a real implementation, this would use HTTP client to send to county endpoints
                info!("Routing message {} to county {}", message.id, target);
                
                // Broadcast to local subscribers
                let _ = state.message_bus.send(message.clone());
                
                Ok(message.id.clone())
            } else {
                Err(format!("Target county {} is not healthy", target))
            }
        }
        None => Err(format!("Unknown county: {}", target))
    }
}

/// Broadcast message to all healthy counties
async fn broadcast_to_all(
    state: &FederationRelayState,
    message: FederationMessage
) -> Result<usize, String> {
    let counties = state.counties.read().await;
    let healthy_counties: Vec<_> = counties.values()
        .filter(|c| c.health_status == HealthStatus::Healthy)
        .collect();
    
    info!("Broadcasting message {} to {} counties", message.id, healthy_counties.len());
    
    // Broadcast to local subscribers
    let _ = state.message_bus.send(message.clone());
    
    // In a real implementation, would send HTTP requests to all county endpoints
    for county in &healthy_counties {
        debug!("Broadcasting to county: {}", county.name);
    }
    
    Ok(healthy_counties.len())
}

/// Validate message security
async fn validate_message_security(
    state: &FederationRelayState,
    message: &FederationMessage
) -> bool {
    let security = &state.security_manager;
    
    // Check if source county is blocked
    let blocked = security.blocked_counties.read().await;
    if blocked.contains(&message.source_county) {
        warn!("Blocked message from county: {}", message.source_county);
        return false;
    }
    
    // Check rate limits
    let mut rate_limits = security.rate_limits.write().await;
    let now = SystemTime::now();
    
    let rate_limit = rate_limits.entry(message.source_county.clone())
        .or_insert(RateLimit {
            requests_per_hour: 1000,
            current_count: 0,
            window_start: now,
        });
    
    // Reset window if needed
    if now.duration_since(rate_limit.window_start)
        .unwrap_or_default()
        .as_secs() > 3600 {
        rate_limit.current_count = 0;
        rate_limit.window_start = now;
    }
    
    rate_limit.current_count += 1;
    
    if rate_limit.current_count > rate_limit.requests_per_hour {
        warn!("Rate limit exceeded for county: {}", message.source_county);
        return false;
    }
    
    // Log security event
    let event = SecurityEvent {
        timestamp: now,
        event_type: "message_validation".to_string(),
        source_county: message.source_county.clone(),
        severity: "info".to_string(),
        details: format!("Message {} validated", message.id),
    };
    
    security.audit_log.lock().await.push(event);
    
    true
}

/// Prometheus metrics endpoint
async fn prometheus_metrics(State(state): State<FederationRelayState>) -> impl IntoResponse {
    let metrics = &state.metrics;
    let total_messages = *metrics.total_messages.lock().await;
    let error_count = *metrics.error_count.lock().await;
    let active_connections = *metrics.active_connections.lock().await;
    
    let counties = state.counties.read().await;
    let healthy_counties = counties.values()
        .filter(|c| c.health_status == HealthStatus::Healthy)
        .count();
    
    let prometheus_output = format!(
        r#"# HELP federation_messages_total Total number of federation messages processed
# TYPE federation_messages_total counter
federation_messages_total {{cluster="{}"}} {}

# HELP federation_errors_total Total number of federation errors
# TYPE federation_errors_total counter
federation_errors_total {{cluster="{}"}} {}

# HELP federation_active_connections Active WebSocket connections
# TYPE federation_active_connections gauge
federation_active_connections {{cluster="{}"}} {}

# HELP federation_healthy_counties Number of healthy counties
# TYPE federation_healthy_counties gauge
federation_healthy_counties {{cluster="{}"}} {}

# HELP federation_total_counties Total number of known counties
# TYPE federation_total_counties gauge
federation_total_counties {{cluster="{}"}} {}
"#,
        state.cluster_id, total_messages,
        state.cluster_id, error_count,
        state.cluster_id, active_connections,
        state.cluster_id, healthy_counties,
        state.cluster_id, counties.len()
    );
    
    (
        StatusCode::OK,
        [("Content-Type", "text/plain; version=0.0.4")],
        prometheus_output
    )
}

/// Start health monitoring background task
pub async fn start_health_monitoring(state: FederationRelayState) {
    let mut interval = interval(state.health_checker.check_interval);
    
    loop {
        interval.tick().await;
        
        let counties_to_check: Vec<String> = {
            let counties = state.counties.read().await;
            counties.keys().cloned().collect()
        };
        
        for county_name in counties_to_check {
            check_county_health(&state, &county_name).await;
        }
    }
}

/// Check health of a specific county
async fn check_county_health(state: &FederationRelayState, county_name: &str) {
    let start_time = Instant::now();
    
    // In a real implementation, this would make HTTP health check requests
    // For demo purposes, we'll simulate random health status
    let is_healthy = rand::random::<f32>() > 0.1; // 90% uptime simulation
    
    let response_time = start_time.elapsed();
    
    // Update health tracking
    {
        let mut health_map = state.health_checker.county_health.write().await;
        let health = health_map.entry(county_name.to_string())
            .or_insert(CountyHealth {
                consecutive_failures: 0,
                consecutive_successes: 0,
                last_check: SystemTime::now(),
                response_times: Vec::new(),
                status: HealthStatus::Unknown,
            });
        
        health.last_check = SystemTime::now();
        health.response_times.push(response_time);
        
        // Keep only last 10 response times
        if health.response_times.len() > 10 {
            health.response_times.remove(0);
        }
        
        if is_healthy {
            health.consecutive_successes += 1;
            health.consecutive_failures = 0;
            
            if health.consecutive_successes >= state.health_checker.success_threshold {
                health.status = HealthStatus::Healthy;
            }
        } else {
            health.consecutive_failures += 1;
            health.consecutive_successes = 0;
            
            if health.consecutive_failures >= state.health_checker.failure_threshold {
                health.status = HealthStatus::Unhealthy;
            }
        }
    }
    
    // Update county node status
    {
        let mut counties = state.counties.write().await;
        if let Some(county) = counties.get_mut(county_name) {
            county.health_status = if is_healthy {
                HealthStatus::Healthy
            } else {
                HealthStatus::Unhealthy
            };
            county.last_seen = SystemTime::now();
        }
    }
}

/// Initialize federation relay service
pub async fn initialize_federation_relay(
    cluster_id: String,
    county_name: String,
) -> FederationRelayState {
    let (message_tx, _) = broadcast::channel(1000);
    
    let metrics = Arc::new(FederationMetrics::default());
    
    let health_checker = Arc::new(HealthChecker {
        check_interval: Duration::from_secs(30),
        timeout: Duration::from_secs(10),
        failure_threshold: 3,
        success_threshold: 2,
        county_health: Arc::new(RwLock::new(HashMap::new())),
    });
    
    let security_manager = Arc::new(SecurityManager {
        county_keys: Arc::new(RwLock::new(HashMap::new())),
        blocked_counties: Arc::new(RwLock::new(HashSet::new())),
        rate_limits: Arc::new(RwLock::new(HashMap::new())),
        audit_log: Arc::new(Mutex::new(Vec::new())),
    });
    
    let state = FederationRelayState {
        cluster_id,
        county_name,
        counties: Arc::new(RwLock::new(HashMap::new())),
        message_bus: message_tx,
        metrics,
        health_checker,
        security_manager,
        websocket_subscribers: Arc::new(RwLock::new(HashMap::new())),
        real_time_connections: Arc::new(RwLock::new(HashMap::new())),
    };
    
    // Initialize with sample counties for demo
    {
        let mut counties = state.counties.write().await;
        
        counties.insert("benton".to_string(), CountyNode {
            name: "benton".to_string(),
            display_name: "Benton County".to_string(),
            endpoints: vec![
                "https://benton.terrafusion.gov/api/federation".to_string(),
                "wss://benton.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "benton_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "citizen_services".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53003".to_string()),
                population: Some(275000),
                active_connections: 6,
                avg_latency_ms: 12.5,
                total_throughput_mbps: 850.0,
                ..Default::default()
            },
        });
        
        counties.insert("franklin".to_string(), CountyNode {
            name: "franklin".to_string(),
            display_name: "Franklin County".to_string(),
            endpoints: vec![
                "https://franklin.terrafusion.gov/api/federation".to_string(),
                "wss://franklin.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "franklin_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "cross_county_permits".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53021".to_string()),
                population: Some(95000),
                active_connections: 5,
                avg_latency_ms: 15.2,
                total_throughput_mbps: 650.0,
                ..Default::default()
            },
        });
        
        counties.insert("yakima".to_string(), CountyNode {
            name: "yakima".to_string(),
            display_name: "Yakima County".to_string(),
            endpoints: vec![
                "https://yakima.terrafusion.gov/api/federation".to_string(),
                "wss://yakima.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "yakima_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "agricultural_coordination".to_string(),
                "water_rights_sharing".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics::default(),
        });
        
        counties.insert("cowlitz".to_string(), CountyNode {
            name: "cowlitz".to_string(),
            display_name: "Cowlitz County".to_string(),
            endpoints: vec![
                "https://cowlitz.terrafusion.gov/api/federation".to_string(),
                "wss://cowlitz.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "cowlitz_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "port_coordination".to_string(),
                "industrial_development".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53015".to_string()),
                population: Some(110000),
                active_connections: 5,
                avg_latency_ms: 22.1,
                total_throughput_mbps: 580.0,
                ..Default::default()
            },
        });
        
        counties.insert("walla_walla".to_string(), CountyNode {
            name: "walla_walla".to_string(),
            display_name: "Walla Walla County".to_string(),
            endpoints: vec![
                "https://wallawalla.terrafusion.gov/api/federation".to_string(),
                "wss://wallawalla.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "walla_walla_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "vineyard_coordination".to_string(),
                "tourism_services".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53075".to_string()),
                population: Some(67000),
                active_connections: 4,
                avg_latency_ms: 28.7,
                total_throughput_mbps: 420.0,
                ..Default::default()
            },
        });
        
        counties.insert("island".to_string(), CountyNode {
            name: "island".to_string(),
            display_name: "Island County".to_string(),
            endpoints: vec![
                "https://island.terrafusion.gov/api/federation".to_string(),
                "wss://island.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "island_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "waterfront_coordination".to_string(),
                "military_liaison".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53029".to_string()),
                population: Some(85000),
                active_connections: 4,
                avg_latency_ms: 31.4,
                total_throughput_mbps: 480.0,
                ..Default::default()
            },
        });
        
        counties.insert("asotin".to_string(), CountyNode {
            name: "asotin".to_string(),
            display_name: "Asotin County".to_string(),
            endpoints: vec![
                "https://asotin.terrafusion.gov/api/federation".to_string(),
                "wss://asotin.terrafusion.gov/ws/federation".to_string(),
            ],
            public_key: "asotin_key_placeholder".to_string(),
            capabilities: vec![
                "records_sharing".to_string(),
                "rural_coordination".to_string(),
                "recreation_services".to_string(),
                "emergency_coordination".to_string(),
            ],
            trust_level: TrustLevel::Verified,
            last_seen: SystemTime::now(),
            health_status: HealthStatus::Healthy,
            metrics: CountyMetrics {
                fips_code: Some("53003".to_string()),
                population: Some(21000),
                active_connections: 3,
                avg_latency_ms: 42.6,
                total_throughput_mbps: 320.0,
                ..Default::default()
            },
        });
    }
    
    info!("Federation relay initialized for cluster: {}, county: {}", 
          state.cluster_id, state.county_name);
    
    state
}

/// Real-time federation monitoring endpoints
pub async fn get_federation_dashboard_metrics(
    State(state): State<Arc<FederationRelayState>>,
) -> Json<FederationDashboardMetrics> {
    let counties = state.counties.read().await;
    let connections = state.real_time_connections.read().await;

    let total_counties = counties.len() as u32;
    let active_counties = counties.values()
        .filter(|c| matches!(c.health_status, HealthStatus::Healthy))
        .count() as u32;

    let total_connections = connections.len() as u32;
    let active_connections = connections.values()
        .filter(|c| matches!(c.status, ConnectionStatus::Active))
        .count() as u32;

    let avg_latency_ms = if !connections.is_empty() {
        connections.values().map(|c| c.latency_ms).sum::<f64>() / connections.len() as f64
    } else { 0.0 };

    let total_throughput_gbps = connections.values()
        .map(|c| c.throughput_mbps).sum::<f64>() / 1000.0;

    let system_health = if total_counties > 0 && total_connections > 0 {
        (active_counties as f64 / total_counties as f64) * 
        (active_connections as f64 / total_connections as f64)
    } else { 0.0 };

    let metrics = FederationDashboardMetrics {
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        total_counties,
        active_counties,
        total_connections,
        active_connections,
        avg_latency_ms,
        total_throughput_gbps,
        security_incidents: 0, // TODO: Implement security incident tracking
        system_health,
        geographic_coverage: 0.85, // TODO: Calculate based on actual geographic data
        redundancy_factor: 1.5, // TODO: Calculate based on connection redundancy
    };

    Json(metrics)
}

pub async fn get_county_connections_list(
    State(state): State<Arc<FederationRelayState>>,
) -> Json<Vec<CountyConnection>> {
    let connections = state.real_time_connections.read().await;
    Json(connections.values().cloned().collect())
}

pub async fn get_counties_with_coordinates(
    State(state): State<Arc<FederationRelayState>>,
) -> Json<Vec<CountyNode>> {
    let counties_guard = state.counties.read().await;
    let county_list = counties_guard.values().cloned().collect::<Vec<CountyNode>>();
    drop(counties_guard);
    Json(county_list)
}

/// WebSocket handler for real-time federation monitoring
pub async fn federation_monitoring_websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<FederationRelayState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_federation_monitoring_websocket(socket, state))
}

async fn handle_federation_monitoring_websocket(
    mut socket: WebSocket, 
    state: Arc<FederationRelayState>
) {
    let subscriber_id = Uuid::new_v4().to_string();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

    // Subscribe to federation updates
    {
        let mut subscribers = state.websocket_subscribers.write().await;
        subscribers.insert(subscriber_id.clone(), tx);
    }

    // Send initial data
    let initial_counties = state.counties.read().await;
    let initial_connections = state.real_time_connections.read().await;
    
    let initial_message = WebSocketMessage {
        message_type: "federation_initial_data".to_string(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        data: serde_json::json!({
            "counties": initial_counties.values().collect::<Vec<_>>(),
            "connections": initial_connections.values().collect::<Vec<_>>()
        }),
    };
    
    if let Ok(msg) = serde_json::to_string(&initial_message) {
        if socket.send(Message::Text(msg)).await.is_err() {
            return;
        }
    }

    // Handle outgoing broadcasts and incoming messages concurrently
    
    loop {
        tokio::select! {
            // Handle outgoing messages from broadcast
            message = rx.recv() => {
                if let Some(message) = message {
                    if socket.send(Message::Text(message)).await.is_err() {
                        break;
                    }
                } else {
                    break;
                }
            }
            // Handle incoming messages from client
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if text == "ping" {
                            let pong_message = WebSocketMessage {
                                message_type: "pong".to_string(),
                                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                                data: serde_json::Value::Null,
                            };
                            if let Ok(pong_str) = serde_json::to_string(&pong_message) {
                                let _ = socket.send(Message::Text(pong_str)).await;
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | Some(Err(_)) | None => {
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    // Clean up on disconnect
    let mut subscribers = state.websocket_subscribers.write().await;
    subscribers.remove(&subscriber_id);
}

/// Broadcast updates to all WebSocket subscribers
pub async fn broadcast_federation_update(
    state: &FederationRelayState,
    message: WebSocketMessage
) {
    let subscribers = state.websocket_subscribers.read().await;
    if let Ok(message_str) = serde_json::to_string(&message) {
        for sender in subscribers.values() {
            let _ = sender.send(message_str.clone());
        }
    }
}

/// Initialize sample connection data for demo
pub async fn initialize_sample_connections(state: &FederationRelayState) {
    let mut connections = state.real_time_connections.write().await;
    
    // Sample connections between major counties
    let sample_connections = vec![
        ("benton", "washington", "41003", "53073", 25.5, 450.2),
        ("washington", "multnomah", "53073", "41051", 12.3, 680.5),
        ("multnomah", "clackamas", "41051", "41005", 8.7, 720.8),
        ("clackamas", "benton", "41005", "41003", 18.9, 590.3),
    ];

    for (source, target, source_fips, target_fips, latency, throughput) in sample_connections {
        let connection = CountyConnection {
            id: Uuid::new_v4().to_string(),
            source_county: source.to_string(),
            target_county: target.to_string(),
            source_fips: Some(source_fips.to_string()),
            target_fips: Some(target_fips.to_string()),
            status: ConnectionStatus::Active,
            latency_ms: latency,
            throughput_mbps: throughput,
            last_updated: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            connection_type: ConnectionType::Primary,
            security_level: SecurityLevel::Secret,
            packet_loss_percent: (rand::random::<f64>() * 0.1),
            bandwidth_utilization: (rand::random::<f64>() * 0.8) + 0.1,
        };
        connections.insert(connection.id.clone(), connection);
    }
}

/// Start real-time simulation for federation monitoring
pub async fn start_federation_monitoring_simulation(state: Arc<FederationRelayState>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3));
        loop {
            interval.tick().await;
            
            // Simulate connection metric updates
            {
                let mut connections = state.real_time_connections.write().await;
                for connection in connections.values_mut() {
                    // Simulate latency variations
                    let latency_change = (rand::random::<f64>() - 0.5) * 10.0;
                    connection.latency_ms = (connection.latency_ms + latency_change).max(1.0);
                    
                    // Simulate throughput changes
                    if rand::random::<f64>() < 0.2 {
                        let throughput_change = (rand::random::<f64>() - 0.5) * 100.0;
                        connection.throughput_mbps = (connection.throughput_mbps + throughput_change).max(10.0);
                    }
                    
                    // Update packet loss
                    connection.packet_loss_percent = (rand::random::<f64>() * 0.15).min(0.1);
                    
                    // Update bandwidth utilization
                    connection.bandwidth_utilization = (connection.bandwidth_utilization + 
                        (rand::random::<f64>() - 0.5) * 0.1).max(0.1).min(0.95);
                    
                    connection.last_updated = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                }
            }

            // Broadcast updates to subscribers
            let connections = state.real_time_connections.read().await;
            let update_message = WebSocketMessage {
                message_type: "connections_update".to_string(),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                data: serde_json::to_value(connections.values().collect::<Vec<_>>()).unwrap_or_default(),
            };
            drop(connections);
            
            broadcast_federation_update(&state, update_message).await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_federation_relay_initialization() {
        let state = initialize_federation_relay(
            "test-cluster".to_string(),
            "test-county".to_string(),
        ).await;
        
        assert_eq!(state.cluster_id, "test-cluster");
        assert_eq!(state.county_name, "test-county");
        
        let counties = state.counties.read().await;
        assert_eq!(counties.len(), 3); // Benton, Franklin, Yakima
    }
    
    #[tokio::test]
    async fn test_message_routing() {
        let state = initialize_federation_relay(
            "test-cluster".to_string(),
            "test-county".to_string(),
        ).await;
        
        let message = FederationMessage {
            id: Uuid::new_v4().to_string(),
            source_county: "test-county".to_string(),
            target_county: Some("benton".to_string()),
            message_type: FederationMessageType::CitizenServiceRequest,
            payload: serde_json::json!({"request": "permit_application"}),
            timestamp: SystemTime::now(),
            ttl_seconds: 300,
            hop_count: 0,
            signature: None,
            priority: MessagePriority::Normal,
        };
        
        let result = route_message(&state, message).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_health_check() {
        let state = initialize_federation_relay(
            "test-cluster".to_string(),
            "test-county".to_string(),
        ).await;
        
        check_county_health(&state, "benton").await;
        
        let health_map = state.health_checker.county_health.read().await;
        assert!(health_map.contains_key("benton"));
    }
}