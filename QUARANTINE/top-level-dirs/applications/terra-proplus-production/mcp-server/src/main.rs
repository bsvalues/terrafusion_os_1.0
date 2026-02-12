use axum::{routing::{post, get}, Router, Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
mod plugin;
use plugin::{AgentPlugin, PluginRegistry};
use serde_json::json;
use reqwest;


#[derive(Clone)]
struct AppState {
    context: Arc<Mutex<serde_json::Value>>,
    plugins: Arc<Mutex<PluginRegistry>>,
}

impl Default for AppState {
    fn default() -> Self {
        let mut registry = PluginRegistry::new();
        // Register Analytics Plugin
        registry.register(Box::new(AnalyticsPlugin));
        // Register Compliance Plugin
        registry.register(Box::new(CompliancePlugin));
        // Register Document Plugin
        registry.register(Box::new(DocumentPlugin));
        AppState {
            context: Arc::new(Mutex::new(json!({}))),
            plugins: Arc::new(Mutex::new(registry)),
        }
    }
}

// --- Plugin Implementations ---

struct AnalyticsPlugin;
impl AgentPlugin for AnalyticsPlugin {
    fn name(&self) -> &'static str { "analytics" }
    fn can_handle(&self, intent: &str) -> bool { intent == "analyze_market" }
    fn handle(&self, _intent: &str, context: &serde_json::Value) -> serde_json::Value {
        let client = reqwest::blocking::Client::new();
        let resp = client.post("http://localhost:8200/analyze_market").json(context).send();
        match resp {
            Ok(r) => r.json().unwrap_or(json!({"error": "bad response"})),
            Err(e) => json!({"error": format!("failed to call analytics: {}", e)}),
        }
    }
}

struct CompliancePlugin;
impl AgentPlugin for CompliancePlugin {
    fn name(&self) -> &'static str { "compliance" }
    fn can_handle(&self, intent: &str) -> bool { intent == "check_compliance" }
    fn handle(&self, _intent: &str, context: &serde_json::Value) -> serde_json::Value {
        let client = reqwest::blocking::Client::new();
        let resp = client.post("http://localhost:8300/check_compliance").json(context).send();
        match resp {
            Ok(r) => r.json().unwrap_or(json!({"error": "bad response"})),
            Err(e) => json!({"error": format!("failed to call compliance: {}", e)}),
        }
    }
}

struct DocumentPlugin;
impl AgentPlugin for DocumentPlugin {
    fn name(&self) -> &'static str { "document" }
    fn can_handle(&self, intent: &str) -> bool { intent == "upload_document" }
    fn handle(&self, _intent: &str, context: &serde_json::Value) -> serde_json::Value {
        let client = reqwest::blocking::Client::new();
        let resp = client.post("http://localhost:8400/upload_document").json(context).send();
        match resp {
            Ok(r) => r.json().unwrap_or(json!({"error": "bad response"})),
            Err(e) => json!({"error": format!("failed to call document: {}", e)}),
        }
    }
}


#[derive(Deserialize)]
struct IntentRequest { input: String, context: serde_json::Value }
#[derive(Serialize)]
struct IntentResponse { intent: String, confidence: f32 }

#[derive(Deserialize)]
struct SuggestRequest { context: serde_json::Value }
#[derive(Serialize)]
struct SuggestResponse { suggestions: Vec<String>, rationale: String }

#[derive(Deserialize)]
struct ExecuteRequest { action: String, context: serde_json::Value }
#[derive(Serialize)]
struct ExecuteResponse { result: String, success: bool }

#[derive(Deserialize)]
struct FeedbackRequest { feedback: String, context: serde_json::Value }
#[derive(Serialize)]
struct FeedbackResponse { accepted: bool }

async fn parse_intent(Json(req): Json<IntentRequest>, State(state): State<AppState>) -> Json<IntentResponse> {
    // For demo, route by keywords
    let input = req.input.to_lowercase();
    let (intent, confidence) = if input.contains("market") {
        ("analyze_market".to_string(), 0.99)
    } else if input.contains("compliance") {
        ("check_compliance".to_string(), 0.98)
    } else if input.contains("upload") {
        ("upload_document".to_string(), 0.97)
    } else {
        ("unknown".to_string(), 0.5)
    };
    println!("[TRACE] Parsed intent: {} (confidence: {})", intent, confidence);
    Json(IntentResponse { intent, confidence })
}

async fn suggest_action(Json(req): Json<SuggestRequest>, State(state): State<AppState>) -> Json<SuggestResponse> {
    // For demo, try analytics plugin
    let plugins = state.plugins.lock().await;
    if let Some(plugin) = plugins.get_handler("analyze_market") {
        let result = plugin.handle("analyze_market", &req.context);
        let suggestions = result.get("suggestions").and_then(|s| s.as_array()).map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()).unwrap_or_else(|| vec!["No suggestions".to_string()]);
        let rationale = result.get("summary").and_then(|s| s.as_str()).unwrap_or("").to_string();
        println!("[TRACE] Suggestion via analytics plugin: {:?}", suggestions);
        Json(SuggestResponse { suggestions, rationale })
    } else {
        Json(SuggestResponse { suggestions: vec!["No plugin available".to_string()], rationale: "".to_string() })
    }
}

async fn execute_action(Json(req): Json<ExecuteRequest>, State(state): State<AppState>) -> Json<ExecuteResponse> {
    let plugins = state.plugins.lock().await;
    let intent = req.action.as_str();
    if let Some(plugin) = plugins.get_handler(intent) {
        let result = plugin.handle(intent, &req.context);
        println!("[TRACE] Executed action '{}' via plugin '{}'.", intent, plugin.name());
        Json(ExecuteResponse {
            result: result.to_string(),
            success: true,
        })
    } else {
        println!("[WARN] No plugin found for action '{}'.", intent);
        Json(ExecuteResponse {
            result: format!("No plugin found for action: {}", intent),
            success: false,
        })
    }
}

async fn get_context(State(state): State<AppState>) -> Json<serde_json::Value> {
    let ctx = state.context.lock().await.clone();
    Json(ctx)
}

async fn set_context(State(state): State<AppState>, Json(ctx): Json<serde_json::Value>) -> StatusCode {
    *state.context.lock().await = ctx;
    StatusCode::NO_CONTENT
}

async fn feedback(Json(req): Json<FeedbackRequest>) -> Json<FeedbackResponse> {
    println!("User feedback: {}", req.feedback);
    Json(FeedbackResponse { accepted: true })
}

#[tokio::main]
async fn main() {
    let state = AppState::default();
    let app = Router::new()
        .route("/agent/intent", post(parse_intent))
        .route("/agent/suggest", post(suggest_action))
        .route("/agent/execute", post(execute_action))
        .route("/agent/context", get(get_context).post(set_context))
        .route("/agent/feedback", post(feedback))
        .with_state(state);

    println!("MCP Server running on http://0.0.0.0:8100");
    axum::Server::bind(&"0.0.0.0:8100".parse().unwrap())
        .serve(app.into_make_service())
        .await.unwrap();
}
