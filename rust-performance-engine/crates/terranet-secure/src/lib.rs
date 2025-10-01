//! TerraNet Secure Network
//! 
//! SD-WAN overlay network with post-quantum cryptography, FirstNet integration,
//! and mesh coordination for government communications.
//!
//! # Features
//! - Post-quantum cryptography (Kyber + Dilithium)
//! - FirstNet emergency network integration
//! - Mesh network coordination
//! - Government-grade security
//! - Real-time priority routing
//! - FISMA/NIST compliance

use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::crypto::PostQuantumCrypto;
use crate::network::{NetworkNode, NetworkTopology, RoutingTable};
use crate::firstnet::{FirstNetIntegration, EmergencyPriority};
use crate::mesh::MeshCoordinator;

/// Main TerraNet Secure Network system
#[derive(Debug)]
pub struct TerraNetSecure {
    /// Network identifier
    pub network_id: Uuid,
    /// Network configuration
    pub config: NetworkConfig,
    /// Post-quantum cryptography system
    pub crypto: Arc<PostQuantumCrypto>,
    /// Network topology manager
    pub topology: Arc<RwLock<NetworkTopology>>,
    /// Routing table for SD-WAN
    pub routing: Arc<RwLock<RoutingTable>>,
    /// FirstNet integration
    pub firstnet: Arc<FirstNetIntegration>,
    /// Mesh coordination system
    pub mesh_coordinator: Arc<MeshCoordinator>,
    /// Active network nodes
    pub nodes: Arc<RwLock<HashMap<Uuid, NetworkNode>>>,
    /// Security policies
    pub security_policies: Arc<RwLock<SecurityPolicies>>,
    /// Performance metrics
    pub metrics: Arc<Mutex<NetworkMetrics>>,
}

/// Network configuration for government deployment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Government agency identifier
    pub agency_id: String,
    /// Security classification level
    pub classification: SecurityClassification,
    /// FirstNet integration enabled
    pub firstnet_enabled: bool,
    /// Emergency priority routing
    pub emergency_priority: EmergencyPriority,
    /// Mesh network parameters
    pub mesh_config: MeshConfig,
    /// Encryption settings
    pub crypto_config: CryptoConfig,
    /// Quality of Service parameters
    pub qos_config: QoSConfig,
    /// Compliance requirements
    pub compliance: Vec<ComplianceStandard>,
}

/// Security classification levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum SecurityClassification {
    Public,
    Sensitive,
    Confidential,
    Secret,
    TopSecret,
}

/// Mesh network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshConfig {
    /// Maximum hops in mesh
    pub max_hops: u8,
    /// Node discovery interval (seconds)
    pub discovery_interval: u64,
    /// Health check frequency (seconds)
    pub health_check_interval: u64,
    /// Redundancy factor
    pub redundancy_factor: u8,
    /// Load balancing algorithm
    pub load_balancing: LoadBalancingAlgorithm,
}

/// Cryptographic configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CryptoConfig {
    /// Post-quantum algorithm selection
    pub pq_algorithm: PostQuantumAlgorithm,
    /// Key rotation interval (hours)
    pub key_rotation_interval: u64,
    /// Perfect forward secrecy
    pub perfect_forward_secrecy: bool,
    /// Quantum-safe key exchange
    pub quantum_safe_kex: bool,
}

/// Quality of Service configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QoSConfig {
    /// Priority levels for different traffic types
    pub priority_levels: HashMap<TrafficType, Priority>,
    /// Bandwidth allocation per priority
    pub bandwidth_allocation: HashMap<Priority, f64>,
    /// Latency targets (milliseconds)
    pub latency_targets: HashMap<Priority, u64>,
    /// Packet loss tolerance
    pub packet_loss_tolerance: HashMap<Priority, f64>,
}

/// Network traffic classification
#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq)]
pub enum TrafficType {
    Emergency,
    Command,
    Intelligence,
    Administrative,
    Public,
}

/// Traffic priority levels
#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq, PartialOrd, Ord)]
pub enum Priority {
    Critical = 0,
    High = 1,
    Medium = 2,
    Low = 3,
    Background = 4,
}

/// Load balancing algorithms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoadBalancingAlgorithm {
    RoundRobin,
    WeightedRoundRobin,
    LeastConnections,
    LatencyBased,
    ThroughputOptimized,
}

/// Post-quantum cryptographic algorithms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PostQuantumAlgorithm {
    Kyber1024,
    Dilithium5,
    Combined, // Kyber + Dilithium
}

/// Compliance standards
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComplianceStandard {
    FISMA,
    NIST80053,
    FedRAMP,
    DISA,
    FirstNet,
}

/// Security policies for network access
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPolicies {
    /// Access control policies by classification
    pub access_control: HashMap<SecurityClassification, AccessPolicy>,
    /// Network segmentation rules
    pub segmentation: Vec<SegmentationRule>,
    /// Firewall rules
    pub firewall_rules: Vec<FirewallRule>,
    /// Intrusion detection settings
    pub intrusion_detection: IntrusionDetectionConfig,
}

/// Access control policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessPolicy {
    /// Required clearance level
    pub required_clearance: SecurityClassification,
    /// Allowed operations
    pub allowed_operations: Vec<NetworkOperation>,
    /// Time-based restrictions
    pub time_restrictions: Option<TimeRestriction>,
    /// Geographic restrictions
    pub geo_restrictions: Option<GeographicRestriction>,
}

/// Network operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkOperation {
    Read,
    Write,
    Execute,
    Administrative,
    Emergency,
}

/// Time-based access restrictions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRestriction {
    /// Allowed hours (24-hour format)
    pub allowed_hours: Vec<u8>,
    /// Allowed days of week (0 = Sunday)
    pub allowed_days: Vec<u8>,
    /// Timezone
    pub timezone: String,
}

/// Geographic restrictions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeographicRestriction {
    /// Allowed countries (ISO 3166-1 alpha-2)
    pub allowed_countries: Vec<String>,
    /// Allowed regions/states
    pub allowed_regions: Vec<String>,
    /// Forbidden IP ranges
    pub forbidden_ip_ranges: Vec<String>,
}

/// Network segmentation rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentationRule {
    /// Rule identifier
    pub id: Uuid,
    /// Source classification
    pub source_classification: SecurityClassification,
    /// Target classification
    pub target_classification: SecurityClassification,
    /// Allowed protocols
    pub allowed_protocols: Vec<NetworkProtocol>,
    /// Allowed ports
    pub allowed_ports: Vec<u16>,
    /// Rule action
    pub action: SegmentationAction,
}

/// Network protocols
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkProtocol {
    TCP,
    UDP,
    QUIC,
    ICMP,
    Custom(String),
}

/// Segmentation actions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SegmentationAction {
    Allow,
    Deny,
    Inspect,
    Quarantine,
}

/// Firewall rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallRule {
    /// Rule identifier
    pub id: Uuid,
    /// Rule priority
    pub priority: u32,
    /// Source address/range
    pub source: AddressRange,
    /// Destination address/range
    pub destination: AddressRange,
    /// Protocol
    pub protocol: NetworkProtocol,
    /// Port range
    pub port_range: PortRange,
    /// Action
    pub action: FirewallAction,
    /// Logging enabled
    pub log_enabled: bool,
}

/// Address range specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AddressRange {
    Single(IpAddr),
    Subnet(IpAddr, u8),
    Range(IpAddr, IpAddr),
    Any,
}

/// Port range specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortRange {
    pub start: u16,
    pub end: u16,
}

/// Firewall actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FirewallAction {
    Accept,
    Drop,
    Reject,
    Log,
}

/// Intrusion detection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntrusionDetectionConfig {
    /// Detection enabled
    pub enabled: bool,
    /// Signature-based detection
    pub signature_detection: bool,
    /// Anomaly-based detection
    pub anomaly_detection: bool,
    /// Machine learning enhanced detection
    pub ml_detection: bool,
    /// Response actions
    pub response_actions: Vec<ResponseAction>,
}

/// Intrusion response actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResponseAction {
    Block,
    Quarantine,
    Alert,
    Monitor,
    Redirect,
}

/// Network performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetrics {
    /// Total bytes transmitted
    pub bytes_transmitted: u64,
    /// Total bytes received
    pub bytes_received: u64,
    /// Average latency (milliseconds)
    pub average_latency: f64,
    /// Packet loss percentage
    pub packet_loss: f64,
    /// Throughput (Mbps)
    pub throughput: f64,
    /// Active connections
    pub active_connections: u32,
    /// Node availability
    pub node_availability: HashMap<Uuid, f64>,
    /// Security events
    pub security_events: u32,
    /// Last updated
    pub last_updated: DateTime<Utc>,
}

impl TerraNetSecure {
    /// Create new TerraNet Secure Network instance
    pub async fn new(config: NetworkConfig) -> Result<Self, TerraNetError> {
        let network_id = Uuid::new_v4();
        
        // Initialize post-quantum cryptography
        let crypto = Arc::new(
            PostQuantumCrypto::new(&config.crypto_config)
                .await
                .map_err(TerraNetError::CryptoError)?
        );
        
        // Initialize network topology
        let topology = Arc::new(RwLock::new(
            NetworkTopology::new(network_id, &config.mesh_config)
        ));
        
        // Initialize routing table
        let routing = Arc::new(RwLock::new(
            RoutingTable::new(&config.qos_config)
        ));
        
        // Initialize FirstNet integration
        let firstnet = Arc::new(
            FirstNetIntegration::new(&config)
                .await
                .map_err(TerraNetError::FirstNetError)?
        );
        
        // Initialize mesh coordinator
        let mesh_coordinator = Arc::new(
            MeshCoordinator::new(&config.mesh_config, Arc::clone(&crypto))
                .await
                .map_err(TerraNetError::MeshError)?
        );
        
        // Initialize security policies
        let security_policies = Arc::new(RwLock::new(
            SecurityPolicies::from_config(&config)
        ));
        
        // Initialize metrics
        let metrics = Arc::new(Mutex::new(NetworkMetrics::new()));
        
        Ok(TerraNetSecure {
            network_id,
            config,
            crypto,
            topology,
            routing,
            firstnet,
            mesh_coordinator,
            nodes: Arc::new(RwLock::new(HashMap::new())),
            security_policies,
            metrics,
        })
    }
    
    /// Start the secure network
    pub async fn start(&self) -> Result<(), TerraNetError> {
        tracing::info!("Starting TerraNet Secure Network {}", self.network_id);
        
        // Start mesh coordination
        self.mesh_coordinator.start().await
            .map_err(TerraNetError::MeshError)?;
        
        // Start FirstNet integration if enabled
        if self.config.firstnet_enabled {
            self.firstnet.start().await
                .map_err(TerraNetError::FirstNetError)?;
        }
        
        // Start network monitoring
        self.start_monitoring().await?;
        
        tracing::info!("TerraNet Secure Network started successfully");
        Ok(())
    }
    
    /// Join a node to the network
    pub async fn join_node(&self, node: NetworkNode) -> Result<(), TerraNetError> {
        // Validate node security clearance
        self.validate_node_security(&node).await?;
        
        // Add to topology
        {
            let mut topology = self.topology.write().await;
            topology.add_node(node.clone()).await
                .map_err(TerraNetError::TopologyError)?;
        }
        
        // Update routing table
        {
            let mut routing = self.routing.write().await;
            routing.add_node_routes(&node).await
                .map_err(TerraNetError::RoutingError)?;
        }
        
        // Register with mesh coordinator
        self.mesh_coordinator.register_node(&node).await
            .map_err(TerraNetError::MeshError)?;
        
        // Store node
        let node_id = node.id;
        {
            let mut nodes = self.nodes.write().await;
            nodes.insert(node.id, node);
        }
        
        tracing::info!("Node {} joined network successfully", node_id);
        Ok(())
    }
    
    /// Send secure message through network
    pub async fn send_message(
        &self,
        source: Uuid,
        destination: Uuid,
        message: SecureMessage,
    ) -> Result<(), TerraNetError> {
        // Validate security policies
        self.validate_message_security(&source, &destination, &message).await?;
        
        // Find optimal route
        let message_priority = message.priority.clone();
        let route = {
            let routing = self.routing.read().await;
            routing.find_route(source, destination, message_priority)
                .await
                .map_err(TerraNetError::RoutingError)?
        };
        
        // Encrypt message with post-quantum crypto
        let encrypted_message = self.crypto.encrypt_message(&message)
            .await
            .map_err(TerraNetError::CryptoError)?;
        
        // Send through mesh network
        self.mesh_coordinator.send_message(route, encrypted_message).await
            .map_err(TerraNetError::MeshError)?;
        
        // Update metrics
        self.update_metrics_for_transmission(&message).await;
        
        Ok(())
    }
    
    /// Handle emergency priority traffic
    pub async fn handle_emergency_traffic(
        &self,
        traffic: EmergencyTraffic,
    ) -> Result<(), TerraNetError> {
        tracing::warn!("Emergency traffic detected: {:?}", traffic.emergency_type);
        
        // Escalate to FirstNet if available
        if self.config.firstnet_enabled {
            self.firstnet.escalate_emergency(&traffic).await
                .map_err(TerraNetError::FirstNetError)?;
        }
        
        // Reconfigure routing for emergency priority
        {
            let mut routing = self.routing.write().await;
            routing.set_emergency_mode(&traffic).await
                .map_err(TerraNetError::RoutingError)?;
        }
        
        // Alert mesh coordinator
        self.mesh_coordinator.handle_emergency(&traffic).await
            .map_err(TerraNetError::MeshError)?;
        
        Ok(())
    }
    
    /// Get network health status
    pub async fn get_health_status(&self) -> Result<NetworkHealthStatus, TerraNetError> {
        let nodes = self.nodes.read().await;
        let topology = self.topology.read().await;
        let metrics = self.metrics.lock().await;
        
        let total_nodes = nodes.len();
        let healthy_nodes = nodes.values()
            .filter(|node| node.health_status == network::NodeHealth::Healthy)
            .count();
        
        let network_health = if total_nodes == 0 {
            0.0
        } else {
            (healthy_nodes as f64 / total_nodes as f64) * 100.0
        };
        
        Ok(NetworkHealthStatus {
            network_id: self.network_id,
            overall_health: network_health,
            total_nodes,
            healthy_nodes,
            average_latency: metrics.average_latency,
            packet_loss: metrics.packet_loss,
            throughput: metrics.throughput,
            security_events: metrics.security_events,
            firstnet_status: if self.config.firstnet_enabled {
                Some(self.firstnet.get_status().await?)
            } else {
                None
            },
            last_updated: Utc::now(),
        })
    }
    
    // Private helper methods
    
    async fn validate_node_security(&self, node: &NetworkNode) -> Result<(), TerraNetError> {
        let policies = self.security_policies.read().await;
        
        // Check security clearance
        if node.security_clearance < self.config.classification {
            return Err(TerraNetError::SecurityViolation(
                "Node security clearance insufficient".to_string()
            ));
        }
        
        // Validate certificates
        self.crypto.validate_node_certificate(&node.certificate).await
            .map_err(TerraNetError::CryptoError)?;
        
        Ok(())
    }
    
    async fn validate_message_security(
        &self,
        source: &Uuid,
        destination: &Uuid,
        message: &SecureMessage,
    ) -> Result<(), TerraNetError> {
        let policies = self.security_policies.read().await;
        let nodes = self.nodes.read().await;
        
        // Get source and destination nodes
        let source_node = nodes.get(source)
            .ok_or_else(|| TerraNetError::NodeNotFound(*source))?;
        let dest_node = nodes.get(destination)
            .ok_or_else(|| TerraNetError::NodeNotFound(*destination))?;
        
        // Check classification compatibility
        if message.classification > source_node.security_clearance ||
           message.classification > dest_node.security_clearance {
            return Err(TerraNetError::SecurityViolation(
                "Message classification exceeds node clearance".to_string()
            ));
        }
        
        // Check segmentation rules
        for rule in &policies.segmentation {
            if rule.source_classification == source_node.security_clearance &&
               rule.target_classification == dest_node.security_clearance {
                if rule.action == SegmentationAction::Deny {
                    return Err(TerraNetError::SecurityViolation(
                        "Segmentation rule denies communication".to_string()
                    ));
                }
            }
        }
        
        Ok(())
    }
    
    async fn start_monitoring(&self) -> Result<(), TerraNetError> {
        // Start performance monitoring
        let metrics = Arc::clone(&self.metrics);
        let mesh_coordinator = Arc::clone(&self.mesh_coordinator);
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(
                tokio::time::Duration::from_secs(10)
            );
            
            loop {
                interval.tick().await;
                
                // Collect network metrics
                if let Ok(mesh_metrics) = mesh_coordinator.get_metrics().await {
                    let mut metrics = metrics.lock().await;
                    metrics.update_from_mesh_metrics(&mesh_metrics);
                }
            }
        });
        
        Ok(())
    }
    
    async fn update_metrics_for_transmission(&self, message: &SecureMessage) {
        let mut metrics = self.metrics.lock().await;
        metrics.bytes_transmitted += message.payload.len() as u64;
        metrics.last_updated = Utc::now();
    }
}

/// Secure message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecureMessage {
    /// Message identifier
    pub id: Uuid,
    /// Security classification
    pub classification: SecurityClassification,
    /// Message priority
    pub priority: Priority,
    /// Message payload
    pub payload: Vec<u8>,
    /// Sender information
    pub sender: NodeIdentity,
    /// Recipient information
    pub recipient: NodeIdentity,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Digital signature
    pub signature: Vec<u8>,
}

/// Node identity information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeIdentity {
    pub id: Uuid,
    pub name: String,
    pub organization: String,
    pub role: NodeRole,
}

/// Node roles in government network
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeRole {
    CommandCenter,
    FieldUnit,
    DataCenter,
    EdgeDevice,
    EmergencyService,
}

/// Emergency traffic specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmergencyTraffic {
    /// Emergency type
    pub emergency_type: EmergencyType,
    /// Priority level
    pub priority: EmergencyPriority,
    /// Geographic scope
    pub geographic_scope: GeographicScope,
    /// Estimated duration
    pub estimated_duration: Option<chrono::Duration>,
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

/// Types of emergencies
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EmergencyType {
    NaturalDisaster,
    SecurityThreat,
    PublicSafety,
    Infrastructure,
    Medical,
    Communication,
}

/// Geographic scope of emergency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeographicScope {
    pub center: GeoCoordinate,
    pub radius: f64, // kilometers
    pub affected_areas: Vec<String>,
}

/// Geographic coordinate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoCoordinate {
    pub latitude: f64,
    pub longitude: f64,
}

/// Network health status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkHealthStatus {
    pub network_id: Uuid,
    pub overall_health: f64,
    pub total_nodes: usize,
    pub healthy_nodes: usize,
    pub average_latency: f64,
    pub packet_loss: f64,
    pub throughput: f64,
    pub security_events: u32,
    pub firstnet_status: Option<FirstNetStatus>,
    pub last_updated: DateTime<Utc>,
}

/// FirstNet status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirstNetStatus {
    pub connected: bool,
    pub priority_level: EmergencyPriority,
    pub bandwidth_allocated: f64,
    pub active_emergencies: u32,
}

/// TerraNet error types
#[derive(Debug, thiserror::Error)]
pub enum TerraNetError {
    #[error("Cryptography error: {0}")]
    CryptoError(String),
    
    #[error("FirstNet integration error: {0}")]
    FirstNetError(String),
    
    #[error("Mesh coordination error: {0}")]
    MeshError(String),
    
    #[error("Network topology error: {0}")]
    TopologyError(String),
    
    #[error("Routing error: {0}")]
    RoutingError(String),
    
    #[error("Security violation: {0}")]
    SecurityViolation(String),
    
    #[error("Node not found: {0}")]
    NodeNotFound(Uuid),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
}

impl From<String> for TerraNetError {
    fn from(error: String) -> Self {
        TerraNetError::NetworkError(error)
    }
}

impl NetworkMetrics {
    pub fn new() -> Self {
        Self {
            bytes_transmitted: 0,
            bytes_received: 0,
            average_latency: 0.0,
            packet_loss: 0.0,
            throughput: 0.0,
            active_connections: 0,
            node_availability: HashMap::new(),
            security_events: 0,
            last_updated: Utc::now(),
        }
    }
    
    pub fn update_from_mesh_metrics(&mut self, mesh_metrics: &crate::mesh::MeshMetrics) {
        self.average_latency = mesh_metrics.average_latency;
        self.packet_loss = mesh_metrics.packet_loss;
        self.throughput = mesh_metrics.throughput;
        self.last_updated = Utc::now();
    }
}

impl SecurityPolicies {
    pub fn from_config(_config: &NetworkConfig) -> Self {
        Self {
            access_control: HashMap::new(),
            segmentation: Vec::new(),
            firewall_rules: Vec::new(),
            intrusion_detection: IntrusionDetectionConfig {
                enabled: true,
                signature_detection: true,
                anomaly_detection: true,
                ml_detection: true,
                response_actions: vec![
                    ResponseAction::Alert,
                    ResponseAction::Monitor,
                    ResponseAction::Block,
                ],
            },
        }
    }
}

// Module declarations
pub mod crypto;
pub mod network;
pub mod firstnet;
pub mod mesh;