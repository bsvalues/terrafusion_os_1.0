use crate::mcp::protocol::{MCPMessage, MCPResponseMessage, ResponseStatus};
use tokio::sync::mpsc;
use uuid::Uuid;
use std::collections::HashMap;
use tracing::{info, warn, error};
use std::time::Duration;

pub struct MCPClient {
    pub client_id: String,
    pub sender: mpsc::Sender<MCPMessage>,
    pub receiver: mpsc::Receiver<MCPMessage>,
    pub pending_responses: HashMap<String, mpsc::Sender<MCPResponseMessage>>,
}

impl MCPClient {
    pub fn new(client_id: String, sender: mpsc::Sender<MCPMessage>, receiver: mpsc::Receiver<MCPMessage>) -> Self {
        Self { 
            client_id, 
            sender, 
            receiver,
            pending_responses: HashMap::new(),
        }
    }

    pub async fn send_message(&self, msg: MCPMessage) -> Result<(), mpsc::error::SendError<MCPMessage>> {
        info!("Client {} sending message {} to {}", self.client_id, msg.message_id, msg.recipient);
        self.sender.send(msg).await
    }

    pub async fn send_request(&mut self, msg: MCPMessage) -> Result<MCPResponseMessage, Box<dyn std::error::Error + Send + Sync>> {
        let message_id = msg.message_id.clone();
        let (response_tx, mut response_rx) = mpsc::channel(1);
        
        self.pending_responses.insert(message_id.clone(), response_tx);
        self.send_message(msg).await?;

        tokio::select! {
            response = response_rx.recv() => {
                self.pending_responses.remove(&message_id);
                response.ok_or_else(|| "Response channel closed".into())
            }
            _ = tokio::time::sleep(Duration::from_secs(30)) => {
                self.pending_responses.remove(&message_id);
                Err("Request timeout".into())
            }
        }
    }

    pub async fn receive_message(&mut self) -> Option<MCPMessage> {
        self.receiver.recv().await
    }

    pub async fn handle_response(&mut self, response: MCPResponseMessage) {
        if let Some(response_tx) = self.pending_responses.remove(&response.in_response_to) {
            if let Err(_) = response_tx.send(response).await {
                warn!("Failed to send response for message {}", response.in_response_to);
            }
        } else {
            warn!("Received response for unknown message: {}", response.in_response_to);
        }
    }

    pub async fn start_message_loop(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting message loop for client {}", self.client_id);
        
        while let Some(message) = self.receive_message().await {
            info!("Client {} received message: {}", self.client_id, message.message_id);
            
            match message.content_type.as_str() {
                "response" => {
                    if let Ok(response) = serde_json::from_value::<MCPResponseMessage>(message.content) {
                        self.handle_response(response).await;
                    }
                }
                _ => {
                    info!("Processing message type: {}", message.content_type);
                }
            }
        }
        
        Ok(())
    }
}