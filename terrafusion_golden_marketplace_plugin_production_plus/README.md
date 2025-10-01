# TerraFusion Marketplace Plugin: Golden Optimization Suite

This bundle wraps the **Golden Ratio Engine** as a Marketplace plugin with **RBAC**, **billing hooks**, and **UI stubs**.

## Structure
- `plugin.manifest.json` — registration metadata (service URL, RBAC, billing).
- `config/rbac.json` — JWT/JWKS config and route-to-role mappings.
- `ui/` — Next.js UI with API routes that enforce RBAC and proxy to the Rust service.
  - `/api/billing/webhook` — billing event receiver.
  - `/api/billing/usage` — usage metering stub.
  - `/api/opt/golden-section` — RBAC-protected optimizer proxy.
  - `/api/graph/golden-laplacian` — RBAC-protected graph proxy.

## Configure
Set env var `GOLDEN_SERVICE_URL` (defaults to `http://localhost:8080`). Ensure the Rust service is reachable in-cluster, e.g., `http://grfe.golden:8080`.

## Run UI
```bash
cd ui && npm install && npm run dev
# http://localhost:4000
```

## Deploy
- Build UI container: `docker build -t terrafusion/golden-ui:latest ui/`
- Configure JWKS/JWT issuer in `config/rbac.json` to match TerraFusion auth.
- Register `plugin.manifest.json` with the Marketplace registry.

## Notes
- Replace `<JWT>` in example pages with a real token.
- Webhook signature verification and durable event storage should be added for production.
- The eigensolver in the Rust service is a toy; switch to a BLAS-backed solver for large graphs.
