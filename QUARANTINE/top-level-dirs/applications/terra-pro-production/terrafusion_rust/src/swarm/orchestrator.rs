use crate::agents::base::{Agent, AgentHealth};
use crate::mcp::{protocol::MCPMessage, server::MCPServer};
use std::collections::HashMap;
use tokio::sync::mpsc;
use tracing::{info, warn, error};
use std::sync::Arc;

pub struct SwarmOrchestrator {
    pub agents: HashMap<String, Box<dyn Agent>>,
    pub mcp_server: Arc<MCPServer>,
    pub message_bus: Option<mpsc::Sender<SwarmMessage>>,
    pub orchestrator_stats: OrchestratorStats,
}

impl SwarmOrchestrator {
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            mcp_server: Arc::new(MCPServer::new("terrafusion-swarm")),
            message_bus: None,
            orchestrator_stats: OrchestratorStats::default(),
        }
    }

    pub async fn register(&mut self, agent: Box<dyn Agent>) {
        let agent_id = agent.id().to_string();
        info!("Registering agent: {}", agent_id);
        
        self.agents.insert(agent_id.clone(), agent);
        self.orchestrator_stats.registered_agents += 1;
        
        info!("Agent {} registered successfully. Total agents: {}", agent_id, self.agents.len());
    }

    pub async fn run(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("🚀 Starting TerraFusion Agent Swarm Orchestrator");
        
        self.initialize_message_bus().await?;
        self.initialize_agents().await?;
        self.start_health_monitoring().await?;
        
        info!("✅ Swarm orchestrator running with {} agents", self.agents.len());
        
        self.message_processing_loop().await
    }

    async fn initialize_message_bus(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let (tx, mut rx) = mpsc::channel::<SwarmMessage>(1000);
        self.message_bus = Some(tx);
        
        let mcp_server = Arc::clone(&self.mcp_server);
        
        tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                match message {
                    SwarmMessage::Route(mcp_msg) => {
                        if let Err(e) = mcp_server.route_message(mcp_msg).await {
                            error!("Failed to route message: {}", e);
                        }
                    }
                    SwarmMessage::Broadcast(mcp_msg) => {
                        mcp_server.broadcast_message(mcp_msg).await;
                    }
                    SwarmMessage::HealthCheck => {
                        info!("Health check message received");
                    }
                }
            }
        });
        
        Ok(())
    }

    async fn initialize_agents(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Initializing {} agents...", self.agents.len());
        
        for (agent_id, agent) in &mut self.agents {
            match agent.initialize().await {
                Ok(_) => {
                    info!("✅ Agent {} initialized successfully", agent_id);
                    self.orchestrator_stats.initialized_agents += 1;
                }
                Err(e) => {
                    error!("❌ Failed to initialize agent {}: {}", agent_id, e);
                    self.orchestrator_stats.failed_initializations += 1;
                }
            }
        }
        
        Ok(())
    }

    async fn start_health_monitoring(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let agent_ids: Vec<String> = self.agents.keys().cloned().collect();
        
        for agent_id in agent_ids {
            let agent_id_clone = agent_id.clone();
            
            tokio::spawn(async move {
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
                
                loop {
                    interval.tick().await;
                    info!("Health check for agent: {}", agent_id_clone);
                }
            });
        }
        
        Ok(())
    }

    async fn message_processing_loop(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting message processing loop...");
        
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            
            self.orchestrator_stats.loop_iterations += 1;
            
            if self.orchestrator_stats.loop_iterations % 600 == 0 {
                info!("Swarm orchestrator active - {} loop iterations completed", self.orchestrator_stats.loop_iterations);
                self.log_agent_health().await;
            }
        }
    }

    async fn log_agent_health(&self) {
        info!("=== Agent Health Status ===");
        for (agent_id, agent) in &self.agents {
            let health = agent.health_check().await;
            info!("Agent {}: {:?} - {}", agent_id, health.status, health.message);
        }
        info!("=== End Health Status ===");
    }

    pub async fn route_message(&mut self, msg: MCPMessage) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(agent) = self.agents.get_mut(&msg.recipient) {
            let response = agent.handle(msg).await;
            self.orchestrator_stats.messages_processed += 1;
            
            if let Some(message_bus) = &self.message_bus {
                let _ = message_bus.send(SwarmMessage::Route(response.message)).await;
            }
        } else {
            warn!("No agent found for recipient: {}", msg.recipient);
            self.orchestrator_stats.routing_errors += 1;
        }
        
        Ok(())
    }

    pub async fn broadcast_to_agents(&self, msg: MCPMessage) {
        info!("Broadcasting message to all {} agents", self.agents.len());
        
        if let Some(message_bus) = &self.message_bus {
            let _ = message_bus.send(SwarmMessage::Broadcast(msg)).await;
        }
    }

    pub async fn get_agent_capabilities(&self) -> HashMap<String, Vec<String>> {
        let mut capabilities = HashMap::new();
        
        for (agent_id, agent) in &self.agents {
            capabilities.insert(agent_id.clone(), agent.capabilities());
        }
        
        capabilities
    }

    pub async fn get_orchestrator_stats(&self) -> &OrchestratorStats {
        &self.orchestrator_stats
    }

    pub async fn shutdown(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Shutting down swarm orchestrator...");
        
        for (agent_id, agent) in &mut self.agents {
            match agent.shutdown().await {
                Ok(_) => info!("✅ Agent {} shutdown successfully", agent_id),
                Err(e) => error!("❌ Failed to shutdown agent {}: {}", agent_id, e),
            }
        }
        
        info!("Swarm orchestrator shutdown completed");
        Ok(())
    }
}

#[derive(Debug)]
pub enum SwarmMessage {
    Route(MCPMessage),
    Broadcast(MCPMessage),
    HealthCheck,
}

#[derive(Default, Debug)]
pub struct OrchestratorStats {
    pub registered_agents: u64,
    pub initialized_agents: u64,
    pub failed_initializations: u64,
    pub messages_processed: u64,
    pub routing_errors: u64,
    pub loop_iterations: u64,
}

impl OrchestratorStats {
    pub fn success_rate(&self) -> f64 {
        if self.messages_processed == 0 {
            return 100.0;
        }
        
        let successful = self.messages_processed - self.routing_errors;
        (successful as f64 / self.messages_processed as f64) * 100.0
    }

    pub fn initialization_rate(&self) -> f64 {
        if self.registered_agents == 0 {
            return 100.0;
        }
        
        (self.initialized_agents as f64 / self.registered_agents as f64) * 100.0
    }
}