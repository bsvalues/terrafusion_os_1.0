//! End-to-end smoke test: tonic Server with ControlPlaneService on one
//! side, tonic Client on the other, exchanging a real GetStatus RPC.
//!
//! This test exists to catch wiring regressions that the construction-only
//! smoke tests miss — component_states populated correctly, audit backend
//! reported honestly, version reflected from the crate.

use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

use terra_sync_audit::NullAudit;
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::control::control_plane_client::ControlPlaneClient;
use terra_sync_proto::control::control_plane_server::ControlPlaneServer;
use terra_sync_proto::control::GetStatusRequest;
use tonic::transport::Server;

// The control crate keeps its modules private to the binary; the test
// harness can't see them. Pull in the server module directly by path.
#[path = "../src/server.rs"]
#[allow(dead_code)]
mod server;

fn manifest_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml")
}

#[tokio::test(flavor = "multi_thread")]
async fn get_status_end_to_end_reports_degraded_null_audit() {
    // Pick an ephemeral port by binding a probe listener, reading the
    // assigned port, then dropping it before tonic binds the real one.
    // There is a tiny race window but it is acceptable for a smoke test.
    let probe = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = probe.local_addr().unwrap().port();
    drop(probe);
    let addr: std::net::SocketAddr = format!("127.0.0.1:{}", port).parse().unwrap();

    let manifest = ContractManifest::load_from_path(&manifest_path()).unwrap();
    let policy = Arc::new(PolicyEvaluator::new(manifest));
    let audit = Arc::new(NullAudit::new());
    let metrics_healthy = Arc::new(AtomicBool::new(true));

    let svc = server::ControlPlaneService {
        policy,
        audit,
        start_time: chrono::Utc::now(),
        metrics_healthy,
    };

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    let server_handle = tokio::spawn(async move {
        Server::builder()
            .add_service(ControlPlaneServer::new(svc))
            .serve_with_shutdown(addr, async {
                let _ = shutdown_rx.await;
            })
            .await
    });

    // Let the server reach accept loop.
    tokio::time::sleep(Duration::from_millis(200)).await;

    let mut client = ControlPlaneClient::connect(format!("http://{}", addr))
        .await
        .expect("client connect");

    let resp = client
        .get_status(GetStatusRequest {})
        .await
        .expect("get_status rpc")
        .into_inner();

    assert_eq!(resp.version, env!("CARGO_PKG_VERSION"));
    assert!(
        resp.healthy,
        "metrics_healthy started true, healthy should be true"
    );
    assert_eq!(
        resp.component_states
            .get("audit_backend")
            .map(String::as_str),
        Some("null")
    );
    assert_eq!(
        resp.component_states
            .get("audit_transport")
            .map(String::as_str),
        Some("degraded-null")
    );

    let _ = shutdown_tx.send(());
    let _ = server_handle.await;
}
