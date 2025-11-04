use axum::{routing::post, Router, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct UploadRequest {
    property_id: String,
    file_name: String,
    file_data: String, // Base64 encoded for demo
    user_context: serde_json::Value,
}

#[derive(Serialize)]
struct UploadResponse {
    success: bool,
    message: String,
}

async fn upload_document(Json(req): Json<UploadRequest>) -> Json<UploadResponse> {
    // Stub: In real implementation, save file to S3 or disk
    Json(UploadResponse {
        success: true,
        message: format!("Document '{}' uploaded for property {}", req.file_name, req.property_id),
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/upload_document", post(upload_document));
    println!("Document service running on 0.0.0.0:8400");
    axum::Server::bind(&"0.0.0.0:8400".parse().unwrap())
        .serve(app.into_make_service())
        .await.unwrap();
}
