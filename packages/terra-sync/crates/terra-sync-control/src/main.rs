mod config;
mod observability;
mod server;

use std::sync::Arc;
use terra_sync_audit::{Audit, NullAudit};
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::control::control_plane_server::ControlPlaneServer;
use tonic::transport::Server;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config_path =
        std::env::var("SYNC_CONTROL_CONFIG").unwrap_or_else(|_| "config/control-plane.yaml".into());
    let cfg = config::Config::from_file(std::path::Path::new(&config_path))?;

    observability::init(&cfg.observability)?;
    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        "terra-sync-control starting"
    );

    let manifest = ContractManifest::load_from_path(&cfg.manifest_path)?;
    let policy = Arc::new(PolicyEvaluator::new(manifest));

    let audit: Arc<dyn Audit> = build_audit_transport(&cfg.kafka)?;

    let svc = server::ControlPlaneService {
        policy,
        audit,
        start_time: chrono::Utc::now(),
    };

    let metrics_addr = cfg.metrics.listen_addr;
    tokio::spawn(async move {
        let app = axum::Router::new()
            .route("/health", axum::routing::get(|| async { "ok" }))
            .route("/ready", axum::routing::get(|| async { "ok" }))
            .route(
                "/metrics",
                axum::routing::get(|| async {
                    let encoder = prometheus::TextEncoder::new();
                    let metric_families = prometheus::gather();
                    encoder
                        .encode_to_string(&metric_families)
                        .unwrap_or_default()
                }),
            );
        let listener = tokio::net::TcpListener::bind(metrics_addr)
            .await
            .expect("metrics bind");
        axum::serve(listener, app).await.expect("metrics serve");
    });

    tracing::info!(addr = %cfg.grpc.listen_addr, "gRPC server listening");
    Server::builder()
        .add_service(ControlPlaneServer::new(svc))
        .serve(cfg.grpc.listen_addr)
        .await?;

    Ok(())
}

#[cfg(feature = "kafka")]
fn build_audit_transport(cfg: &config::KafkaConfig) -> anyhow::Result<Arc<dyn Audit>> {
    use terra_sync_audit::AuditEmitter;
    let emitter = AuditEmitter::new(&cfg.bootstrap_servers, &cfg.audit_topic)?;
    tracing::info!(
        bootstrap = %cfg.bootstrap_servers,
        topic = %cfg.audit_topic,
        "audit transport: kafka"
    );
    Ok(Arc::new(emitter))
}

#[cfg(not(feature = "kafka"))]
fn build_audit_transport(_cfg: &config::KafkaConfig) -> anyhow::Result<Arc<dyn Audit>> {
    tracing::warn!("audit transport: NullAudit (kafka feature disabled; events are dropped)");
    Ok(Arc::new(NullAudit))
}
