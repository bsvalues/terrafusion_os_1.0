// Tesla Performance Monitoring
use std::time::Duration;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct PerformanceMonitor {
    startup_time: Arc<Mutex<Option<Duration>>>,
    command_times: Arc<Mutex<Vec<(String, Duration)>>>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub async fn record_startup(&self, duration: Duration) {
        *self.startup_time.lock().await = Some(duration);
    }
    
    pub async fn record_command(&self, name: String, duration: Duration) {
        self.command_times.lock().await.push((name, duration));
    }
    
    pub async fn get_stats(&self) -> (Option<Duration>, Vec<(String, Duration)>) {
        let startup = *self.startup_time.lock().await;
        let commands = self.command_times.lock().await.clone();
        (startup, commands)
    }
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agents;
mod ai_service;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub status: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentsResponse {
    pub agents: Vec<Agent>,
    pub total: usize,
    pub active: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppState {
    pub agents: Vec<Agent>,
    pub conversation_history: Vec<String>,
}

type AppStateType = Mutex<AppState>;

// Initialize the application state with mock agents (porting from Node.js)
fn initialize_agents() -> Vec<Agent> {
    vec![
        Agent {
            id: "agent-001".to_string(),
            name: "Property Analyzer Agent".to_string(),
            r#type: "analysis".to_string(),
            status: "active".to_string(),
            description: "Analyzes property data and market trends".to_string(),
        },
        Agent {
            id: "agent-002".to_string(),
            name: "Market Predictor Agent".to_string(),
            r#type: "prediction".to_string(),
            status: "active".to_string(),
            description: "Predicts market trends and property values".to_string(),
        },
        Agent {
            id: "agent-003".to_string(),
            name: "Risk Assessment Agent".to_string(),
            r#type: "assessment".to_string(),
            status: "active".to_string(),
            description: "Evaluates investment risks and opportunities".to_string(),
        },
    ]
}

// Tauri command to get all agents (ported from GET /api/agents)
#[tauri::command]
async fn get_agents(state: State<'_, AppStateType>) -> Result<AgentsResponse, String> {
    let app_state = state.lock().await;
    let active_count = app_state.agents.iter().filter(|a| a.status == "active").count();
    
    Ok(AgentsResponse {
        agents: app_state.agents.clone(),
        total: app_state.agents.len(),
        active: active_count,
    })
}

// Tauri command to get specific agent (ported from GET /api/agents/:id)
#[tauri::command]
async fn get_agent(id: String, state: State<'_, AppStateType>) -> Result<Agent, String> {
    let app_state = state.lock().await;
    
    app_state
        .agents
        .iter()
        .find(|agent| agent.id == id)
        .cloned()
        .ok_or_else(|| format!("Agent with id '{}' not found", id))
}

// Tauri command to process AI queries (new functionality for desktop)
#[tauri::command]
async fn process_query(query: String, state: State<'_, AppStateType>) -> Result<String, String> {
    let mut app_state = state.lock().await;
    
    // Add query to conversation history
    app_state.conversation_history.push(query.clone());
    
    // Simulate AI processing (in a real implementation, this would call an AI service)
    let response = ai_service::process_ai_query(&query).await?;
    
    // Add response to conversation history
    app_state.conversation_history.push(response.clone());
    
    Ok(response)
}

// Tauri command to get system status (ported from GET /api/status)
#[tauri::command]
async fn get_system_status() -> Result<HashMap<String, serde_json::Value>, String> {
    let mut status = HashMap::new();
    
    status.insert("service".to_string(), serde_json::Value::String("TerraAgent Desktop".to_string()));
    status.insert("version".to_string(), serde_json::Value::String("1.0.0".to_string()));
    status.insert("description".to_string(), serde_json::Value::String("Native desktop AI assistant for property analysis".to_string()));
    status.insert("ready".to_string(), serde_json::Value::Bool(true));
    
    let features = vec![
        "ai-assistant",
        "property-analysis", 
        "market-intelligence",
        "offline-capability",
        "native-performance"
    ];
    status.insert("features".to_string(), serde_json::Value::Array(
        features.into_iter().map(|f| serde_json::Value::String(f.to_string())).collect()
    ));
    
    status.insert("tier".to_string(), serde_json::Value::String("Desktop Native".to_string()));
    status.insert("category".to_string(), serde_json::Value::String("AI & Analytics".to_string()));
    
    Ok(status)
}

// Tauri command to clear conversation history
#[tauri::command]
async fn clear_conversation(state: State<'_, AppStateType>) -> Result<String, String> {
    let mut app_state = state.lock().await;
    app_state.conversation_history.clear();
    Ok("Conversation history cleared".to_string())
}

fn main() {
    let initial_state = AppState {
        agents: initialize_agents(),
        conversation_history: Vec::new(),
    };

    tauri::Builder::default()
        .manage(AppStateType::new(initial_state))
        .invoke_handler(tauri::generate_handler![
            get_agents,
            get_agent,
            process_query,
            get_system_status,
            clear_conversation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}