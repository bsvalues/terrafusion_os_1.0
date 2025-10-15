// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to TerraCollections!", name)
}

#[tauri::command]
fn get_collection_stats() -> serde_json::Value {
    serde_json::json!({
        "total_due": 525000,
        "total_collected": 380000,
        "collection_rate": 72.4,
        "delinquent_count": 45,
        "pending_count": 120
    })
}

#[tauri::command]
fn search_tax_records(_term: String, _status: String) -> serde_json::Value {
    // Mock implementation for demo purposes
    serde_json::json!([
        {
            "id": "1",
            "property_id": "PROP-001",
            "property_address": "123 Main St, Springfield, IL",
            "owner_name": "John Smith",
            "tax_year": 2024,
            "amount_due": 5250.00,
            "amount_paid": 5250.00,
            "status": "paid",
            "due_date": "2024-12-31",
            "payment_date": "2024-11-15"
        }
    ])
}

#[tauri::command]
fn process_payment(record_id: String, amount: f64) -> serde_json::Value {
    // Mock implementation - in real app this would update database
    serde_json::json!({
        "success": true,
        "message": format!("Payment of ${:.2} processed for record {}", amount, record_id),
        "transaction_id": format!("TXN-{}", chrono::Utc::now().timestamp())
    })
}

#[tauri::command]
fn send_collection_notice(record_id: String, notice_type: String) -> serde_json::Value {
    // Mock implementation - in real app this would send actual notices
    serde_json::json!({
        "success": true,
        "message": format!("{} notice sent for record {}", notice_type, record_id),
        "notice_id": format!("NOTICE-{}", chrono::Utc::now().timestamp())
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, get_collection_stats, search_tax_records, process_payment, send_collection_notice])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
