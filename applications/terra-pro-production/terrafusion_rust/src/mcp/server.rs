use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::{mpsc, RwLock};
use tracing::{info, warn, error};
use dashmap::DashMap;

pub struct MCPServer {
    pub server_id: String,
    pub clients: Arc<DashMap<String, mpsc::Sender<MCPMessage>>>,
    pub message_history: Arc<RwLock<Vec<MCPMessage>>>,
    pub stats: Arc<RwLock<ServerStats>>,
}

#[derive(Default)]
pub struct ServerStats {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub active_clients: u64,
    pub errors: u64,
}

impl MCPServer {
    pub fn new(server_id: &str) -> Self {
        Self {
            server_id: server_id.to_string(),
            clients: Arc::new(DashMap::new()),
            message_history: Arc::new(RwLock::new(Vec::new())),
            stats: Arc::new(RwLock::new(ServerStats::default())),
        }
    }

    pub async fn register_client(&self, client_id: String, tx: mpsc::Sender<MCPMessage>) {
        info!("Registering client: {}", client_id);
        self.clients.insert(client_id, tx);
        
        let mut stats = self.stats.write().await;
        stats.active_clients = self.clients.len() as u64;
    }

    pub async fn unregister_client(&self, client_id: &str) {
        info!("Unregistering client: {}", client_id);
        self.clients.remove(client_id);
        
        let mut stats = self.stats.write().await;
        stats.active_clients = self.clients.len() as u64;
    }

    pub async fn route_message(&self, msg: MCPMessage) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if msg.is_expired() {
            warn!("Message {} has expired, dropping", msg.message_id);
            return Ok(());
        }

        self.message_history.write().await.push(msg.clone());

        if let Some(client_ref) = self.clients.get(&msg.recipient) {
            match client_ref.send(msg.clone()).await {
                Ok(_) => {
                    info!("Message {} routed to {}", msg.message_id, msg.recipient);
                    self.stats.write().await.messages_sent += 1;
                }
                Err(e) => {
                    error!("Failed to route message to {}: {}", msg.recipient, e);
                    self.stats.write().await.errors += 1;
                    return Err(Box::new(e));
                }
            }
        } else {
            warn!("Client {} not found for message {}", msg.recipient, msg.message_id);
            self.stats.write().await.errors += 1;
        }

        Ok(())
    }

    pub async fn broadcast_message(&self, msg: MCPMessage) {
        info!("Broadcasting message {} to all clients", msg.message_id);
        
        for client_ref in self.clients.iter() {
            let mut broadcast_msg = msg.clone();
            broadcast_msg.recipient = client_ref.key().clone();
            
            if let Err(e) = client_ref.send(broadcast_msg).await {
                warn!("Failed to broadcast to {}: {}", client_ref.key(), e);
            }
        }
    }

    pub async fn get_stats(&self) -> ServerStats {
        self.stats.read().await.clone()
    }

    pub async fn get_message_history(&self, limit: Option<usize>) -> Vec<MCPMessage> {
        let history = self.message_history.read().await;
        match limit {
            Some(n) => history.iter().rev().take(n).cloned().collect(),
            None => history.clone(),
        }
    }
}

impl Clone for ServerStats {
    fn clone(&self) -> Self {
        Self {
            messages_sent: self.messages_sent,
            messages_received: self.messages_received,
            active_clients: self.active_clients,
            errors: self.errors,
        }
    }
}