use axum::{routing::post, Router, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct MarketRequest {
    property_id: String,
    comps: Vec<serde_json::Value>,
    user_context: serde_json::Value,
}

#[derive(Serialize)]
struct MarketResponse {
    summary: String,
    trend_chart: serde_json::Value,
    suggestions: Vec<String>,
}

async fn analyze_market(Json(req): Json<MarketRequest>) -> Json<MarketResponse> {
    Json(MarketResponse {
        summary: format!("Market analysis for property {}", req.property_id),
        trend_chart: serde_json::json!({"type": "line", "data": [1,2,3]}),
        suggestions: vec!["Consider adjusting GLA upward".to_string()],
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/analyze_market", post(analyze_market));
    println!("Analytics microservice running on 0.0.0.0:8200");
    axum::Server::bind(&"0.0.0.0:8200".parse().unwrap())
        .serve(app.into_make_service())
        .await.unwrap();
}
