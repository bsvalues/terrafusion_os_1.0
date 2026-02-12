use axum::{routing::post, Router, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ComplianceRequest {
    property_id: String,
    fields: serde_json::Value,
    user_context: serde_json::Value,
}

#[derive(Serialize)]
struct ComplianceResponse {
    compliant: bool,
    issues: Vec<String>,
    rationale: String,
}

async fn check_compliance(Json(req): Json<ComplianceRequest>) -> Json<ComplianceResponse> {
    // Stub: Replace with real rules/logic
    let compliant = req.fields.get("GLA").map_or(false, |v| v.as_i64().unwrap_or(0) > 1000);
    let issues = if compliant { vec![] } else { vec!["GLA too low for this property type".to_string()] };
    let rationale = if compliant { "All fields meet compliance.".to_string() } else { "GLA below threshold.".to_string() };
    Json(ComplianceResponse { compliant, issues, rationale })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/check_compliance", post(check_compliance));
    println!("Compliance microservice running on 0.0.0.0:8300");
    axum::Server::bind(&"0.0.0.0:8300".parse().unwrap())
        .serve(app.into_make_service())
        .await.unwrap();
}
