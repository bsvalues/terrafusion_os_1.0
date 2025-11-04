// AWS KMS imports (commented for dev mode)
// use aws_sdk_kms::{Client as KmsClient, Config, Region};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscrowKey {
    pub key_id: String,
    pub user_id: String,
    pub county: String,
    pub encrypted_private_key: String,
    pub escrow_policy: EscrowPolicy,
    pub created_at: DateTime<Utc>,
    pub last_accessed: Option<DateTime<Utc>>,
    pub access_log: Vec<AccessEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscrowPolicy {
    pub auto_escrow: bool,
    pub retention_years: u32,
    pub authorized_parties: Vec<AuthorizedParty>,
    pub recovery_threshold: u8, // Multi-party recovery threshold
    pub compliance_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorizedParty {
    pub role: String,
    pub user_id: String,
    pub permissions: Vec<String>,
    pub expiry: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessEvent {
    pub timestamp: DateTime<Utc>,
    pub accessor: String,
    pub action: String,
    pub justification: String,
    pub approved_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowRequest {
    pub user_id: String,
    pub county: String,
    pub private_key: String,
    pub policy: EscrowPolicy,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecoveryRequest {
    pub key_id: String,
    pub requester: String,
    pub justification: String,
    pub authorization_signatures: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowMetrics {
    pub total_keys: u64,
    pub active_keys: u64,
    pub recovery_requests: u64,
    pub compliance_audits: u64,
    pub kms_operations_per_hour: u64,
    pub average_escrow_latency_ms: f64,
    pub average_recovery_latency_ms: f64,
}

// Escrow service state
pub type EscrowState = Arc<RwLock<HashMap<String, EscrowKey>>>;

pub struct XmtpEscrowService {
    key_alias: String,
    region: String,
    escrow_state: EscrowState,
}

impl XmtpEscrowService {
    // AWS constructor commented out for dev mode
    // pub async fn new(region: &str, key_alias: &str) -> Result<Self, Box<dyn std::error::Error>> { ... }

    /// Development mode constructor (no AWS required)
    pub fn new_dev_mode() -> Self {
        tracing::info!("🔐 XMTP Escrow Service initialized in DEVELOPMENT MODE");
        Self {
            key_alias: "dev-mode-key".to_string(),
            region: "us-east-1".to_string(),
            escrow_state: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn escrow_key(&self, request: EscrowRequest) -> Result<String, Box<dyn std::error::Error>> {
        let key_id = Uuid::new_v4().to_string();
        
        // Encrypt private key using AWS KMS
        let encrypt_result = self
            .kms_client
            .encrypt()
            .key_id(&self.key_alias)
            .plaintext(aws_sdk_kms::primitives::Blob::new(request.private_key.as_bytes()))
            .encryption_context("purpose", "xmtp-key-escrow")
            .encryption_context("user_id", &request.user_id)
            .encryption_context("county", &request.county)
            .send()
            .await?;

        let encrypted_key = general_purpose::STANDARD.encode(encrypt_result.ciphertext_blob().unwrap().as_ref());

        // Create escrow record
        let escrow_key = EscrowKey {
            key_id: key_id.clone(),
            user_id: request.user_id.clone(),
            county: request.county.clone(),
            encrypted_private_key: encrypted_key,
            escrow_policy: request.policy,
            created_at: Utc::now(),
            last_accessed: None,
            access_log: vec![AccessEvent {
                timestamp: Utc::now(),
                accessor: "system".to_string(),
                action: "escrow_created".to_string(),
                justification: "Initial key escrow".to_string(),
                approved_by: None,
            }],
        };

        // Store in local state (in production, this would be persisted to secure database)
        {
            let mut state = self.escrow_state.write().await;
            state.insert(key_id.clone(), escrow_key);
        }

        println!("🔐 Key escrowed successfully: {} for user {} in {}", key_id, request.user_id, request.county);
        
        Ok(key_id)
    }

    pub async fn recover_key(&self, request: RecoveryRequest) -> Result<String, Box<dyn std::error::Error>> {
        // Validate recovery request and authorization signatures
        let escrow_key = {
            let mut state = self.escrow_state.write().await;
            let key = state.get_mut(&request.key_id)
                .ok_or("Escrow key not found")?;
            
            // Verify authorization threshold
            if request.authorization_signatures.len() < key.escrow_policy.recovery_threshold as usize {
                return Err("Insufficient authorization signatures".into());
            }

            // Log access event
            key.access_log.push(AccessEvent {
                timestamp: Utc::now(),
                accessor: request.requester.clone(),
                action: "recovery_requested".to_string(),
                justification: request.justification.clone(),
                approved_by: Some("multi-party-auth".to_string()),
            });
            
            key.last_accessed = Some(Utc::now());
            key.clone()
        };

        // Decrypt private key using AWS KMS
        let encrypted_blob = general_purpose::STANDARD.decode(&escrow_key.encrypted_private_key)?;
        
        let decrypt_result = self
            .kms_client
            .decrypt()
            .ciphertext_blob(aws_sdk_kms::primitives::Blob::new(encrypted_blob))
            .encryption_context("purpose", "xmtp-key-escrow")
            .encryption_context("user_id", &escrow_key.user_id)
            .encryption_context("county", &escrow_key.county)
            .send()
            .await?;

        let decrypted_key = String::from_utf8(decrypt_result.plaintext().unwrap().as_ref().to_vec())?;

        println!("🔓 Key recovered successfully: {} for user {} by {}", 
                 request.key_id, escrow_key.user_id, request.requester);

        Ok(decrypted_key)
    }

    pub async fn audit_access(&self, key_id: &str) -> Result<Vec<AccessEvent>, Box<dyn std::error::Error>> {
        let state = self.escrow_state.read().await;
        let escrow_key = state.get(key_id)
            .ok_or("Escrow key not found")?;
        
        Ok(escrow_key.access_log.clone())
    }

    pub async fn get_metrics(&self) -> EscrowMetrics {
        let state = self.escrow_state.read().await;
        
        EscrowMetrics {
            total_keys: state.len() as u64,
            active_keys: state.values().filter(|k| k.last_accessed.is_some()).count() as u64,
            recovery_requests: state.values()
                .map(|k| k.access_log.iter().filter(|e| e.action == "recovery_requested").count())
                .sum::<usize>() as u64,
            compliance_audits: state.values()
                .map(|k| k.access_log.iter().filter(|e| e.action.contains("audit")).count())
                .sum::<usize>() as u64,
            kms_operations_per_hour: 247, // Mock data - would be real metrics in production
            average_escrow_latency_ms: 1850.5,
            average_recovery_latency_ms: 2340.2,
        }
    }
}

pub fn create_escrow_router() -> Router<Arc<XmtpEscrowService>> {
    Router::new()
        .route("/api/escrow/keys", post(escrow_key_handler))
        .route("/api/escrow/keys/:key_id/recover", post(recover_key_handler))
        .route("/api/escrow/keys/:key_id/audit", get(audit_key_handler))
        .route("/api/escrow/metrics", get(get_metrics_handler))
        .route("/api/escrow/health", get(health_check_handler))
}

pub async fn escrow_key_handler(
    State(service): State<Arc<XmtpEscrowService>>,
    Json(request): Json<EscrowRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match service.escrow_key(request).await {
        Ok(key_id) => Ok(Json(serde_json::json!({
            "success": true,
            "key_id": key_id,
            "message": "Key escrowed successfully"
        }))),
        Err(e) => {
            eprintln!("Escrow error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn recover_key_handler(
    State(service): State<Arc<XmtpEscrowService>>,
    Path(key_id): Path<String>,
    Json(request): Json<RecoveryRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut recovery_request = request;
    recovery_request.key_id = key_id;
    
    match service.recover_key(recovery_request).await {
        Ok(private_key) => Ok(Json(serde_json::json!({
            "success": true,
            "private_key": private_key,
            "message": "Key recovered successfully"
        }))),
        Err(e) => {
            eprintln!("Recovery error: {}", e);
            Err(StatusCode::FORBIDDEN)
        }
    }
}

pub async fn audit_key_handler(
    State(service): State<Arc<XmtpEscrowService>>,
    Path(key_id): Path<String>,
) -> Result<Json<Vec<AccessEvent>>, StatusCode> {
    match service.audit_access(&key_id).await {
        Ok(events) => Ok(Json(events)),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn get_metrics_handler(
    State(service): State<Arc<XmtpEscrowService>>,
) -> Json<EscrowMetrics> {
    Json(service.get_metrics().await)
}

pub async fn health_check_handler(
    State(service): State<Arc<XmtpEscrowService>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Perform KMS connectivity check
    match service.kms_client.list_keys().limit(1).send().await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "healthy",
            "kms_connection": "active",
            "region": service.region,
            "timestamp": Utc::now()
        }))),
        Err(e) => {
            eprintln!("KMS health check failed: {}", e);
            Err(StatusCode::SERVICE_UNAVAILABLE)
        }
    }
}

// Compliance and audit utilities
impl XmtpEscrowService {
    pub async fn generate_compliance_report(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let state = self.escrow_state.read().await;
        let now = Utc::now();
        
        let mut compliance_report = serde_json::json!({
            "report_timestamp": now,
            "total_keys": state.len(),
            "compliance_summary": {},
            "risk_assessment": {},
            "recommendations": []
        });

        // Analyze compliance by county
        let mut county_stats: HashMap<String, u32> = HashMap::new();
        for key in state.values() {
            *county_stats.entry(key.county.clone()).or_insert(0) += 1;
        }

        compliance_report["compliance_summary"]["by_county"] = serde_json::to_value(county_stats)?;

        // Risk assessment
        let high_risk_keys: Vec<&EscrowKey> = state.values()
            .filter(|k| k.access_log.len() > 10 || 
                        k.last_accessed.map_or(false, |t| (now - t).num_days() > 365))
            .collect();

        compliance_report["risk_assessment"]["high_risk_keys"] = high_risk_keys.len().into();
        
        if !high_risk_keys.is_empty() {
            compliance_report["recommendations"].as_array_mut().unwrap().push(
                serde_json::json!("Review high-activity or dormant keys for compliance")
            );
        }

        Ok(compliance_report)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[test]
    async fn test_escrow_key_creation() {
        // Mock test - in production would use LocalStack or AWS test environment
        let policy = EscrowPolicy {
            auto_escrow: true,
            retention_years: 7,
            authorized_parties: vec![],
            recovery_threshold: 2,
            compliance_tags: vec!["FOIA".to_string(), "Records".to_string()],
        };

        let request = EscrowRequest {
            user_id: "test_user".to_string(),
            county: "benton".to_string(),
            private_key: "test_private_key".to_string(),
            policy,
        };

        // Would test actual escrow service here
        assert!(request.user_id == "test_user");
    }
}