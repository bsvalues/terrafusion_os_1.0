# Wiring Redis quotas into golden-service

1) Cargo.toml (golden-service):
--------------------------------
[dependencies]
redis = { version = "0.25", features = ["tokio-comp"] }
once_cell = "1.19"

2) Add module file:
-------------------
- Place `redis_quota.rs` into `crates/golden-service/src/redis_quota.rs`.

3) main.rs changes (simplified sketch):
---------------------------------------
use once_cell::sync::OnceCell;
use crate::redis_quota::RedisQuota;
static QUOTA: OnceCell<RedisQuota> = OnceCell::new();

#[tokio::main]
async fn main() {
    let url = std::env::var("REDIS_URL").unwrap_or("redis://127.0.0.1:6379/0".into());
    let limit: u32 = std::env::var("QUOTA_LIMIT_PER_MIN").ok().and_then(|v| v.parse().ok()).unwrap_or(100);
    QUOTA.set(RedisQuota::new(&url, limit).expect("redis")).ok();
    // ... build router and serve
}

use axum::http::HeaderMap;
fn tenant_id(headers: &HeaderMap) -> String {
    headers.get("x-tenant-id").and_then(|v| v.to_str().ok()).unwrap_or("public").to_string()
}

async fn some_handler(headers: HeaderMap, Json(req): Json<Req>) -> Result<Json<Res>, StatusCode> {
    let tenant = tenant_id(&headers);
    if let Some(q) = QUOTA.get() {
        let ok = q.check(&tenant, 3).await.map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
        if !ok { return Err(StatusCode::TOO_MANY_REQUESTS); }
    }
    // ... handle request
    Ok(Json(res))
}

4) Deploy Redis via Helmfile:
-----------------------------
- `helmfile -e production sync` will install Bitnami Redis in the target namespace.
- Set `REDIS_URL` automatically via Helmfile values (`env` for grfe-service).
