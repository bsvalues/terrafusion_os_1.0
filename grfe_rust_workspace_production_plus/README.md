# Golden Ratio Fibonacci Engine (Rust)

Production-ready Rust workspace for TerraFusion:
- `golden-core`: φ constants, fast Fibonacci (fast-doubling), utilities
- `golden-graph`: Golden Laplacian Lφ, spectral filters, simple eigen routines (toy)
- `golden-opt`: Golden section & Fibonacci search
- `golden-tn`: Minimal Fibonacci anyon tensors (educational)
- `golden-service`: Axum HTTP service exposing /health, /fib, /opt/golden-section, /graph/golden-laplacian

## Quickstart
```bash
# Build & test
cargo build
cargo test

# Run service
cargo run -p golden-service
# -> http://127.0.0.1:8080/health
```

## Endpoints
- `GET /health` → service status + φ constants
- `GET /fib?n=40` → nth Fibonacci (u128; fast doubling)
- `POST /opt/golden-section` with JSON:
  `{ "func": "quadratic", "params": { "a": 1.0, "b": -4.0, "c": 5.0 }, "bounds": [0.0, 5.0], "tol": 1e-6 }`
- `POST /graph/golden-laplacian` with JSON:
  `{ "adjacency": [[0,1,0],[1,0,1],[0,1,0]], "filter": "golden_lowpass" }`

> Note: Eigen is a toy power-iteration/Lanczos-like routine for small graphs (<= 256 nodes). For production, wire BLAS/LAPACK in a feature flag.

## Docker
```bash
docker build -t terrafusion/grfe:latest .
docker run -p 8080:8080 terrafusion/grfe:latest
```

## Kubernetes
See `deploy/k8s/*.yaml` (Deployment, Service, HPA).
