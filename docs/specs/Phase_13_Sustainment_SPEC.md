# Phase 13: Sovereign Sustainment (The Shield & The Keeper)

## Objective
Establish a production-grade perimeter and maintenance cycle for the Sovereign deployment.
1.  **Secure Access:** Replace direct exposed ports with a Reverse Proxy (Caddy).
2.  **Operational Hygiene:** Implement log rotation to prevent disk exhaustion.
3.  **Data Preservation:** Automated backup of the sovereign database file (`terrafusion.db`) and audit trails.

## Strategy

### 1. The Shield (Reverse Proxy)
Use **Caddy** as the edge gateway.
-   **Port 80/443**: Exposed to Host.
-   **Routing**:
    -   `/api/*` -> `terrafusion-iron:5000` (Internal)
    -   `/*` -> `terrafusion-soul:80` (Internal)
-   **Security**: Removes direct access to API port 5000 from the outside world. Solves CORS and Mixed Content issues.

### 2. The Hygiene (Log Rotation)
Configure Docker `json-file` logging driver with `max-size: "10m"` and `max-file: "3"`.

### 3. The Memory (Backup)
A PowerShell script `ops/scripts/backup_sovereign.ps1`:
-   Source: `data/terrafusion.db` (SQLite) & `artifacts/audit/`
-   Destination: `C:\TerraFusion_Backups\`
-   Format: Timestamped Zip (`yyyyMMdd_HHmm`)
-   Retention: 30 Days

## Implementation Details

### Caddyfile (`ops/proxy/Caddyfile`)
```caddy
:80 {
    reverse_proxy /api/* terrafusion-iron:5000
    reverse_proxy /* terrafusion-soul:80
}
```

### Docker Compose Updates (`ops/prod/docker-compose.prod.server.yml`)
-   Service `proxy` added.
-   Service `backend` (iron): Remove `ports: - 5000:5000`.
-   Service `frontend` (soul): Update `VITE_API_URL` to `/api` (or relative path if supported, otherwise http://localhost/api). **Note: If image is static, this might require rebuild, but we will set ENV for now.**
-   All services: Add `logging` configuration.

## Verification
1.  `docker compose up -d`
2.  Browse `http://localhost`.
3.  Verify API calls go to `http://localhost/api/...`.
4.  Run `ops/scripts/backup_sovereign.ps1` and verify zip file creation.
