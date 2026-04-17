mod config;
mod observability;
mod server;

use std::sync::atomic::{AtomicBool, Ordering};
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

    // Health flag for the metrics sidecar. Flipped to false if the axum
    // server fails to bind or serve; read by `get_status` to report
    // component health honestly.
    let metrics_healthy = Arc::new(AtomicBool::new(true));

    let svc = server::ControlPlaneService {
        policy,
        audit,
        start_time: chrono::Utc::now(),
        metrics_healthy: Arc::clone(&metrics_healthy),
    };

    let metrics_addr = cfg.metrics.listen_addr;
    let metrics_healthy_for_task = Arc::clone(&metrics_healthy);
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
        match tokio::net::TcpListener::bind(metrics_addr).await {
            Err(e) => {
                tracing::error!(addr = %metrics_addr, error = %e, "metrics bind failed");
                metrics_healthy_for_task.store(false, Ordering::SeqCst);
            }
            Ok(listener) => {
                if let Err(e) = axum::serve(listener, app).await {
                    tracing::error!(error = %e, "metrics serve failed");
                    metrics_healthy_for_task.store(false, Ordering::SeqCst);
                }
            }
        }
    });

    tracing::info!(addr = %cfg.grpc.listen_addr, "gRPC server listening");

    let shutdown = async {
        let _ = tokio::signal::ctrl_c().await;
        tracing::info!("shutdown signal received");
    };

    Server::builder()
        .add_service(ControlPlaneServer::new(svc))
        .serve_with_shutdown(cfg.grpc.listen_addr, shutdown)
        .await?;

    tracing::info!("gRPC server stopped");
    observability::shutdown();
    Ok(())
}

// Compile-time guarantee: exactly one build_audit_transport definition.
// If a future feature (e.g., "pulsar") is added, add a mutually-exclusive
// cfg arm and update these assertions.
#[cfg(all(feature = "kafka", not(feature = "kafka")))]
compile_error!("build_audit_transport cfg branches are not exclusive");

#[cfg(not(any(feature = "kafka", not(feature = "kafka"))))]
compile_error!("build_audit_transport has no applicable cfg branch");

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
    Ok(Arc::new(NullAudit::new()))
}
