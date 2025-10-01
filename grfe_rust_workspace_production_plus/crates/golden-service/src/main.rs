
use axum::{extract::Query, routing::{get, post}, Json, Router};
use prometheus::{Encoder, TextEncoder, IntCounterVec, Registry, opts};
use lazy_static::lazy_static;
use dashmap::DashMap;
use std::time::{Instant, Duration};
use axum::http::{HeaderMap, StatusCode};

lazy_static!{
    static ref REGISTRY: Registry = Registry::new();
    static ref COUNTER: IntCounterVec = IntCounterVec::new(opts!("grfe_requests","requests"), &["route"]).unwrap();
    static ref TENANT_BUCKETS: DashMap<String, (u32, Instant)> = DashMap::new();
}

fn init_metrics(){
    REGISTRY.register(Box::new(COUNTER.clone())).ok();
}

async fn metrics() -> (StatusCode, String) {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buf = Vec::new();
    encoder.encode(&metric_families, &mut buf).unwrap();
    (StatusCode::OK, String::from_utf8(buf).unwrap())
}

fn check_quota(headers: &HeaderMap, cost: u32, limit: u32, window: Duration) -> bool {
    let tenant = headers.get("x-tenant-id").and_then(|v| v.to_str().ok()).unwrap_or("public").to_string();
    let mut entry = TENANT_BUCKETS.entry(tenant).or_insert((limit, Instant::now()));
    let (ref mut tokens, ref mut ts) = *entry;
    // refill
    if ts.elapsed() > window {
        *tokens = limit;
        *ts = Instant::now();
    }
    if *tokens >= cost {
        *tokens -= cost;
        true
    } else {
        false
    }
}

use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tracing_subscriber::{fmt, EnvFilter};

use golden_core::{PhiConstants, fib_u128};
use golden_opt::golden_section_search;
use golden_graph::{golden_laplacian, toy_symmetric_eigs, golden_lowpass};
use ndarray::Array2;

#[derive(Serialize)]
struct Health {
    status: &'static str,
    phi: f64,
    psi: f64,
    sqrt5: f64,
    golden_angle_deg: f64,
}

#[derive(Deserialize)]
struct FibQ { n: Option<u64> }

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum FunctionKind {
    Quadratic,
}

#[derive(Deserialize)]
struct GoldenSectionReq {
    func: FunctionKind,
    params: serde_json::Value,      // depends on func
    bounds: (f64, f64),
    tol: Option<f64>,
    max_iter: Option<usize>,
}

#[derive(Serialize)]
struct GoldenSectionRes {
    method: &'static str,
    x: f64,
    fx: f64,
    iterations: usize,
}

#[derive(Deserialize)]
struct GoldenGraphReq {
    adjacency: Vec<Vec<f64>>,
    filter: Option<String>,
    k: Option<usize>,
    iters: Option<usize>,
}

#[derive(Serialize)]
struct GoldenGraphRes {
    eigenvalues: Vec<f64>,
    filtered_demo_signal_energy: Option<f64>,
}

#[tokio::main]
async fn main() {
    let filter = EnvFilter::from_default_env()
        .add_directive("info".parse().unwrap());
    fmt().with_env_filter(filter).init();

    init_metrics();
    let app = Router::new()
        .route("/health", get(health))
        .route("/fib", get(fib))
        .route("/opt/golden-section", post(opt_gs))
        .route("/graph/golden-laplacian", post(graph_lphi))
        .route("/metrics", get(metrics));

    let addr: SocketAddr = "0.0.0.0:8080".parse().unwrap();
    tracing::info!("Starting Golden Ratio Service on {}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await.unwrap();
}

async fn health() -> Json<Health> {
    let c = PhiConstants::default();
    Json(Health {
        status: "operational",
        phi: c.phi,
        psi: c.psi,
        sqrt5: c.sqrt5,
        golden_angle_deg: c.golden_angle_deg,
    })
}

async fn fib(Query(q): Query<FibQ>) -> Json<serde_json::Value> {
    let n = q.n.unwrap_or(40);
    let value = fib_u128(n);
    Json(serde_json::json!({ "n": n, "value": value.to_string() }))
}

async fn opt_gs(Json(req): Json<GoldenSectionReq>) -> Json<GoldenSectionRes> {
    let (a, b) = req.bounds;
    let tol = req.tol.unwrap_or(1e-6);
    let max_iter = req.max_iter.unwrap_or(20_000);

    let f = match req.func {
        FunctionKind::Quadratic => {
            let a_q = req.params.get("a").and_then(|x| x.as_f64()).unwrap_or(1.0);
            let b_q = req.params.get("b").and_then(|x| x.as_f64()).unwrap_or(0.0);
            let c_q = req.params.get("c").and_then(|x| x.as_f64()).unwrap_or(0.0);
            move |x: f64| a_q*x*x + b_q*x + c_q
        }
    };

    let r = golden_section_search(f, a, b, tol, max_iter);
    Json(GoldenSectionRes { method: r.method, x: r.x, fx: r.fx, iterations: r.iterations })
}

async fn graph_lphi(Json(req): Json<GoldenGraphReq>) -> Json<GoldenGraphRes> {
    let n = req.adjacency.len();
    let mut a = Array2::<f64>::zeros((n, n));
    for i in 0..n {
        for j in 0..n {
            a[(i, j)] = req.adjacency[i][j];
        }
    }
    let lphi = golden_laplacian(&a);
    let k = req.k.unwrap_or(3).min(n.max(1));
    let iters = req.iters.unwrap_or(50);
    let spec = toy_symmetric_eigs(&lphi, k, iters).unwrap_or_else(|_| super::panic_any("eigs failed"));
    let eigenvalues = spec.eigenvalues;

    // demo filter on a constant signal
    let demo_signal = vec![1.0; n];
    // project and filter in the span of computed eigenvectors
    // filtered_energy is just a proxy metric
    let mut filtered_energy = 0.0;
    for (idx, lam) in eigenvalues.iter().enumerate() {
        let coeff = demo_signal.iter().sum::<f64>() / (n as f64); // crude
        let h = if req.filter.as_deref() == Some("golden_lowpass") { golden_lowpass(*lam) } else { 1.0 };
        filtered_energy += (coeff * h).powi(2);
        let _ = idx; // silence
    }

    Json(GoldenGraphRes { eigenvalues, filtered_demo_signal_energy: Some(filtered_energy) })
}
