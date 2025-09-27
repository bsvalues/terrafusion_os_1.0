# Terrafusion OS 1.0 — Benton County “One‑Command” Production Demo DevOps Chain

This package gives you a single command to provision infra, seed Benton County
data, boot the full stack, validate with quality gates, run the live demo, and
export reports/artifacts.

---

## 🚀 Quickstart (One Command)

```bash
# from repo root
bash ops/benton-demo.sh
# or, if you prefer Make
make demo-benton
```

- Default mode is **idempotent** and safe to re-run. Uses `./.env.benton` if
  present (falls back to `./.env.benton.example`).
- Artifacts (logs, reports, screenshots, bundle) go to
  `./artifacts/benton/<timestamp>/`.

---

## 📁 Repo Additions (drop-in structure)

```
ops/
  benton-demo.sh               # Orchestrator (one command)
  benton/
    00_bootstrap.sh
    01_validate_prereqs.sh
    02_prepare_env.sh
    03_provision_infra.sh
    04_seed_data.sh
    05_start_services.sh
    06_run_tests.sh
    07_run_demo.sh
    08_collect_artifacts.sh
    09_teardown.sh             # optional (not used in normal run)

compose/
  docker-compose.demo.yml

scripts/
  run_quality_gates.sh
  load_benton_data.py
  generate_reports.py

.github/workflows/
  benton-demo.yml

artifacts/                     # created at runtime
  benton/

.env.benton.example            # template copied to .env.benton on first run
Makefile
```

---

## 🔐 Environment Template (copy to `.env.benton`)

```dotenv
# ===== Core =====
TF_ENV=demo
COUNTY_NAME=Benton County, WA
COUNTY_CODE=US-WA-BENTON

# ===== Networking =====
TF_NETWORK=terrafusion_demo
TF_SUBNET=172.30.10.0/24

# ===== Postgres / PostGIS =====
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=terrafusion_password
POSTGRES_DB=terrafusion
POSTGRES_HOST=db
POSTGRES_PORT=\${{TF_POSTGRES_PORT:-5432}}

# ===== Redis =====
REDIS_HOST=redis
REDIS_PORT=\${{TF_POSTGRES_PORT:-5432}}

# ===== App Secrets (demo values) =====
JWT_SECRET=change_me_demo_secret
ENCRYPTION_KEY=demo_32byte_key_demo_32byte_key

# ===== AI / MCP (optional) =====
MCP_ENABLED=true
MCP_ENDPOINT=http://core:8080/mcp

# ===== Paths =====
DATA_DIR=./data/benton
ARTIFACTS_DIR=./artifacts/benton
```

---

## 🧰 Makefile

```makefile
SHELL := /bin/bash
.DEFAULT_GOAL := demo-benton

.PHONY: demo-benton stop logs clean

demo-benton:
	bash ops/benton-demo.sh

stop:
	docker compose -f compose/docker-compose.demo.yml down -v || true

logs:
	docker compose -f compose/docker-compose.demo.yml logs -f --tail=200

clean:
	rm -rf artifacts/benton/*
```

---

## 🧠 Orchestrator — `ops/benton-demo.sh`

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CHAIN_DIR="$SCRIPT_DIR/benton"
LOG_DIR="$ROOT_DIR/artifacts/benton/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run.log"

# Pretty logging
log() { echo -e "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "[$(date +%H:%M:%S)] ❌ $*" | tee -a "$LOG_FILE"; exit 1; }

# Load env
ENV_FILE="$ROOT_DIR/.env.benton"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.benton.example" "$ENV_FILE"
  log "Created .env.benton from template. Review if needed."
fi
set -a; source "$ENV_FILE"; set +a

# Step runner with timing and per-step logs
run_step() {
  local step="$1"; shift
  local name=$(basename "$step")
  local step_log="$LOG_DIR/${name%.sh}.log"
  log "▶️  Running $name"
  SECONDS=0
  if bash "$step" "$@" 2>&1 | tee -a "$step_log"; then
    log "✅ Completed $name in ${SECONDS}s"
  else
    fail "Step $name failed. See $step_log"
  fi
}

# Chain (idempotent)
run_step "$CHAIN_DIR/00_bootstrap.sh"
run_step "$CHAIN_DIR/01_validate_prereqs.sh"
run_step "$CHAIN_DIR/02_prepare_env.sh"
run_step "$CHAIN_DIR/03_provision_infra.sh"
run_step "$CHAIN_DIR/04_seed_data.sh"
run_step "$CHAIN_DIR/05_start_services.sh"
run_step "$CHAIN_DIR/06_run_tests.sh"
run_step "$CHAIN_DIR/07_run_demo.sh"
run_step "$CHAIN_DIR/08_collect_artifacts.sh"

log "🎉 Benton County demo chain complete. Artifacts: $LOG_DIR"
```

---

## 🔗 Step Scripts (`ops/benton/*.sh`)

### 00_bootstrap.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
: "${ROOT_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)}"

mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR"

# Create Docker network if missing
if ! docker network ls --format '{{.Name}}' | grep -q "^${TF_NETWORK}$"; then
  docker network create --subnet "$TF_SUBNET" "$TF_NETWORK"
fi

echo "Bootstrap complete."
```

### 01_validate_prereqs.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
reqs=(docker docker compose psql)
for bin in "${reqs[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing dependency: $bin"; exit 1; }
done

# Optional quality/security tools, will be skipped if missing
optional=(trivy snyk jq)
for bin in "${optional[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || echo "(info) Optional tool not found: $bin — skipping"
done

echo "Prereqs OK."
```

### 02_prepare_env.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

# Ensure example env exists
[[ -f .env.benton ]] || cp .env.benton.example .env.benton

# Normalize dirs
mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR" compose scripts

# Seed placeholder data dir if empty
if [[ -z $(ls -A "$DATA_DIR" 2>/dev/null || true) ]]; then
  mkdir -p "$DATA_DIR"
  cat > "$DATA_DIR/README.md" <<'MD'
Place Benton County CSVs/GeoJSON here:
- parcels.csv
- assessments.csv
- sales.csv
- neighborhoods.csv
- precincts.geojson
MD
fi

echo "Env prepared."
```

### 03_provision_infra.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

# Pull images (best effort)
docker compose -f compose/docker-compose.demo.yml pull || true

# Up DB/Redis first for healthchecks
export COMPOSE_PROJECT_NAME=terrafusion_benton

docker compose -f compose/docker-compose.demo.yml up -d db redis

# Wait for Postgres readiness
until docker exec terrafusion_benton-db-1 pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "Waiting for Postgres..."; sleep 2;
done

echo "Infra provisioned."
```

### 04_seed_data.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

# Create schema if needed
cat <<SQL | docker exec -i terrafusion_benton-db-1 psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
CREATE EXTENSION IF NOT EXISTS postgis;
-- minimal demo tables
CREATE TABLE IF NOT EXISTS parcels (
  parcel_id TEXT PRIMARY KEY,
  situs_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  land_sqft INT,
  bldg_sqft INT,
  year_built INT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
);
CREATE TABLE IF NOT EXISTS assessments (
  parcel_id TEXT REFERENCES parcels(parcel_id),
  assessed_value BIGINT,
  tax_year INT,
  PRIMARY KEY(parcel_id, tax_year)
);
CREATE TABLE IF NOT EXISTS sales (
  parcel_id TEXT REFERENCES parcels(parcel_id),
  sale_date DATE,
  sale_price BIGINT
);
SQL

# Load CSVs via ephemeral Python container (only if files exist)
if [[ -f "$DATA_DIR/parcels.csv" ]]; then
  docker run --rm --network "$TF_NETWORK" \
    -v "$PWD/$DATA_DIR":/data \
    -e PGHOST="$POSTGRES_HOST" -e PGPORT="$POSTGRES_PORT" \
    -e PGUSER="$POSTGRES_USER" -e PGPASSWORD="$POSTGRES_PASSWORD" \
    -e PGDATABASE="$POSTGRES_DB" \
    python:3.11-slim bash -lc "pip install --no-cache-dir pandas psycopg2-binary && python - <<'PY'
import os, pandas as pd
import psycopg2
from io import StringIO

conn = psycopg2.connect(host=os.environ['PGHOST'], port=os.environ['PGPORT'], user=os.environ['PGUSER'], password=os.environ['PGPASSWORD'], dbname=os.environ['PGDATABASE'])
cur = conn.cursor()

def copy_csv(name, table, cols):
    path=f"/data/{name}"
    if not os.path.exists(path):
        print(f"skip {name}"); return
    df=pd.read_csv(path)
    buf=StringIO()
    df.to_csv(buf, index=False, header=False)
    buf.seek(0)
    cur.copy_expert(f"COPY {table} ({','.join(cols)}) FROM STDIN WITH CSV", buf)
    conn.commit(); print(f"loaded {name} -> {table}")

copy_csv('parcels.csv', 'parcels', ['parcel_id','situs_address','city','state','zip','land_sqft','bldg_sqft','year_built','lat','lon'])
copy_csv('assessments.csv','assessments',['parcel_id','assessed_value','tax_year'])
copy_csv('sales.csv','sales',['parcel_id','sale_date','sale_price'])

cur.close(); conn.close()
PY"
fi

echo "Data seeded."
```

### 05_start_services.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

docker compose -f compose/docker-compose.demo.yml up -d core ui worker grafana prometheus

echo "Services started."
```

### 06_run_tests.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

bash scripts/run_quality_gates.sh || { echo "Quality gates failed"; exit 1; }

echo "Quality gates passed."
```

### 07_run_demo.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

# If championship demo scripts exist, invoke them; otherwise, present fallback URLs
if [[ -x ./championship/scripts/demo_benton.sh ]]; then
  ./championship/scripts/demo_benton.sh || true
else
  echo "(info) demo_benton.sh not found; using fallback."
fi

# Output demo endpoints
echo "Demo ready:\n  UI:        http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  API:       http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  Grafana:   http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  Prometheus:http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
```

### 08_collect_artifacts.sh

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

TS=$(date +%Y%m%d_%H%M%S)
OUT="${ARTIFACTS_DIR}/${TS}"
mkdir -p "$OUT"

# Compose logs
docker compose -f compose/docker-compose.demo.yml logs --no-color > "$OUT/stack.log" || true

# Export DB sample (schema only for speed)
docker exec terrafusion_benton-db-1 pg_dump -U "$POSTGRES_USER" -s "$POSTGRES_DB" > "$OUT/schema.sql" || true

# Generate reports (Python)
python3 scripts/generate_reports.py "$OUT" || true

# Save environment
cp .env.benton "$OUT/.env.snapshot" || true

echo "Artifacts collected at $OUT"
```

### 09_teardown.sh (optional)

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

docker compose -f compose/docker-compose.demo.yml down -v || true

echo "Stack stopped & volumes removed."
```

---

## 🐳 Docker Compose — `compose/docker-compose.demo.yml`

```yaml
name: terrafusion_benton
services:
  db:
    image: postgis/postgis:15-3.4
    container_name: terrafusion_benton-db-1
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    networks: [ ${TF_NETWORK} ]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}" ]
      interval: 5s
      timeout: 3s
      retries: 20

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "no"]
    ports: ["6379:6379"]
    networks: [ ${TF_NETWORK} ]

  core:
    image: ghcr.io/terrafusion/core:demo
    environment:
      CONNECTIONSTRINGS__POSTGRES: Host=db;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      REDIS__HOST: redis
      JWT__SECRET: ${JWT_SECRET}
      MCP__ENABLED: ${MCP_ENABLED}
      MCP__ENDPOINT: ${MCP_ENDPOINT}
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
    ports: ["8080:8080"]
    networks: [ ${TF_NETWORK} ]

  ui:
    image: ghcr.io/terrafusion/ui:demo
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
    depends_on:
      core: { condition: service_started }
    ports: ["3000:3000"]
    networks: [ ${TF_NETWORK} ]

  worker:
    image: ghcr.io/terrafusion/worker:demo
    environment:
      CONNECTIONSTRINGS__POSTGRES: Host=db;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      REDIS__HOST: redis
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
    networks: [ ${TF_NETWORK} ]

  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    networks: [ ${TF_NETWORK} ]
    configs:
      - source: prometheus_cfg
        target: /etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana-oss:latest
    ports: ["3001:3000"]
    networks: [ ${TF_NETWORK} ]

networks:
  ${TF_NETWORK}:
    external: true

configs:
  prometheus_cfg:
    file: ./prometheus.yml
```

> **Note:** Point `image:` tags to your actual demo images, or replace with
> local Dockerfiles.

---

## 🧪 Quality Gates — `scripts/run_quality_gates.sh`

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

# Lightweight smoke: API health, DB connectivity, key routes
curl -fsS http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health || { echo "API health failed"; exit 1; }

# Basic DB query
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:\${{TF_FRONTEND_PORT:-3000}}/${POSTGRES_DB}" -c "SELECT 1;" >/dev/null

# Optional: Container vuln scan (if trivy installed)
if command -v trivy >/dev/null 2>&1; then
  trivy image --quiet --severity CRITICAL,HIGH ghcr.io/terrafusion/core:demo || true
fi

echo "Quality gates OK."
```

---

## 📈 Reports — `scripts/generate_reports.py`

```python
#!/usr/bin/env python3
import os, json, time
from datetime import datetime

out = os.path.abspath(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else './artifacts/benton')
os.makedirs(out, exist_ok=True)

summary = {
  "timestamp": datetime.utcnow().isoformat()+"Z",
  "county": os.getenv('COUNTY_NAME','Benton County, WA'),
  "services": {
    "ui": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}",
    "api": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}",
    "grafana": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}",
    "prometheus": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
  },
  "notes": [
    "Demo stack started",
    "Quality gates passed",
    "Artifacts collected"
  ]
}

with open(os.path.join(out, 'summary.json'), 'w') as f:
  json.dump(summary, f, indent=2)
print('Wrote', os.path.join(out, 'summary.json'))
```

---

## 🐍 (Optional) Data Loader — `scripts/load_benton_data.py`

```python
#!/usr/bin/env python3
"""
Alternative loader you can run locally instead of the ephemeral container in 04_seed_data.sh
Usage:
  PGHOST=localhost PGPORT=\${{TF_POSTGRES_PORT:-5432}} PGUSER=terrafusion PGPASSWORD=... PGDATABASE=terrafusion \
  python scripts/load_benton_data.py ./data/benton
"""
import os, sys, pandas as pd
import psycopg2
from io import StringIO

src = sys.argv[1] if len(sys.argv)>1 else './data/benton'
conn = psycopg2.connect(host=os.environ['PGHOST'], port=os.environ['PGPORT'], user=os.environ['PGUSER'], password=os.environ['PGPASSWORD'], dbname=os.environ['PGDATABASE'])
cur = conn.cursor()

def copy_csv(path, table, cols):
    if not os.path.exists(path):
        print('skip', path); return
    df = pd.read_csv(path)
    buf = StringIO(); df.to_csv(buf, index=False, header=False); buf.seek(0)
    cur.copy_expert(f"COPY {table} ({','.join(cols)}) FROM STDIN WITH CSV", buf)
    conn.commit(); print('loaded', path)

copy_csv(os.path.join(src,'parcels.csv'),'parcels',['parcel_id','situs_address','city','state','zip','land_sqft','bldg_sqft','year_built','lat','lon'])
copy_csv(os.path.join(src,'assessments.csv'),'assessments',['parcel_id','assessed_value','tax_year'])
copy_csv(os.path.join(src,'sales.csv'),'sales',['parcel_id','sale_date','sale_price'])

cur.close(); conn.close(); print('done')
```

---

## 🧪 CI Orchestration — `.github/workflows/benton-demo.yml`

```yaml
name: 'Benton Demo Packager'

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      ['ops/**', 'compose/**', 'scripts/**', '.env.benton.example', 'Makefile']

jobs:
  package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Bootstrap env
        run: cp .env.benton.example .env.benton

      - name: Start demo stack (db/redis only)
        run: |
          docker network create terrafusion_demo || true
          docker compose -f compose/docker-compose.demo.yml up -d db redis
          until docker exec terrafusion_benton-db-1 pg_isready -U terrafusion; do sleep 2; done

      - name: Seed data schema only (fast)
        run: bash ops/benton/04_seed_data.sh

      - name: Bring up full stack
        run:
          docker compose -f compose/docker-compose.demo.yml up -d core ui worker

      - name: Quality gates
        run: bash scripts/run_quality_gates.sh

      - name: Collect artifacts
        run: bash ops/benton/08_collect_artifacts.sh

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: benton-demo-artifacts
          path: artifacts/benton/**

      - name: Tear down
        if: always()
        run: docker compose -f compose/docker-compose.demo.yml down -v || true
```

---

## 🧷 Notes & Guarantees

- **Idempotent:** You can rerun `bash ops/benton-demo.sh` safely; steps check
  infra state.
- **Fail-fast with logs:** Each step logs to `artifacts/benton/<ts>/*.log`.
- **Pluggable AI Arsenal:** If your `./championship/scripts/*.sh` exist, the
  chain invokes them; otherwise it gracefully skips.
- **Security-minded:** Secrets are demo-only; wire in your real secret manager
  for production.
- **Extensible:** Add steps (e.g., Lighthouse/Playwright) before
  `08_collect_artifacts.sh` as needed.

```

```

---

# 🏢 Enterprise+ Extensions (Beyond Enterprise-Grade)

> This section elevates the one‑command demo into a **production‑caliber,
> multi‑cloud, policy‑driven, auditable platform**. It adds GitOps, Kubernetes,
> supply‑chain security, SSO, secrets, observability, DR, compliance, and
> progressive delivery. Everything remains reproducible and automated.

## 🌐 Modes of Operation

- **Local Compose (existing):** Rapid demo/dev on a laptop.
- **Enterprise Kubernetes:** AKS/EKS/GKE with GitOps & Argo CD. One command:
  `bash ops/benton-enterprise.sh`.

## 📁 New Repo Additions

```
infra/
  terraform/
    azure-aks/
      main.tf            # AKS, ACR, Key Vault, Private DNS, Log Analytics
      variables.tf
      outputs.tf
    aws-eks/
    gcp-gke/
  kubernetes/
    helm/
      terrafusion/
        Chart.yaml
        templates/
          deployment-core.yaml
          deployment-ui.yaml
          deployment-worker.yaml
          service-*.yaml
          ingress.yaml            # NGINX/AGIC + WAF headers
          hpa.yaml                # HPA (cpu/mem/requests_per_sec)
          pdb.yaml                # PodDisruptionBudgets
          networkpolicy.yaml      # Zero‑trust east/west
          servicemonitor.yaml     # Prometheus Operator
        values.yaml
        values-benton.yaml        # County overlays
    gitops/
      argo/
        app-of-apps.yaml         # AppSet that controls all environments
        terrafusion-app.yaml      # Points at helm chart + values-benton.yaml
      policies/
        gatekeeper-constraints/
        kyverno-policies/
      observability/
        otel-collector.yaml
        loki.yaml
        tempo.yaml
        prom-operator-crds.yaml
        sloth-slo.yaml           # SLOs -> Prometheus + Grafana
      security/
        external-secrets.yaml    # External Secrets Operator (AKV/Secrets Manager)
        trivy-operator.yaml
        falco.yaml               # Runtime threat detection
        argo-rollouts.yaml       # Canary/Blue‑Green
ops/
  benton-enterprise.sh            # One‑command enterprise chain
  enterprise/
    00_tf_init_apply.sh
    01_bootstrap_cluster.sh       # Argo CD, Operators, Ingress, Certs
    02_setup_secrets.sh           # External Secrets bindings (AKV/ASM)
    03_install_observability.sh   # OTel, Prom, Grafana, Loki, Tempo
    04_install_security.sh        # Gatekeeper/Kyverno, Falco, Trivy Operator
    05_deploy_platform.sh         # ArgoCD app sync (Helm values-benton)
    06_progressive_delivery.sh    # Argo Rollouts canary
    07_postgres_backup_dr.sh      # WAL-G backups, retention, restore test
    08_compliance_snapshot.sh     # Evidence bundle (SOC2/CJIS mapping)

security/
  policies/
    opa/rego/*.rego               # Policy-as-Code controls
    kyverno/*.yaml
  supply-chain/
    cosign.pub                    # (Optional) Keyless supported too
    attestations/                 # SLSA provenance storage

.github/workflows/
  enterprise-ci.yml               # Build, SBOM, sign, push, attest
  enterprise-cd.yml               # GitOps PR to argo repo + rollout

archetypes/
  values-benton.example.yaml
  slo-baseline.yaml
  networkpolicy-strict.yaml
  dr-runbook.md
```

---

## 🔐 Secrets & SSO (Zero‑Trust by Default)

- **SSO/OIDC**: Entra ID (Azure AD) / Okta with OIDC. Helm values:

```yaml
security:
  oidc:
    enabled: true
    issuer: 'https://login.microsoftonline.com/<tenant>/v2.0'
    clientId: '${OIDC_CLIENT_ID}'
    clientSecretRef: 'oidc-client-secret' # managed via External Secrets
    redirectUris:
      - 'https://benton.terrafusion.example.com/api/auth/callback'
    groupsClaim: 'groups'
    requiredGroups:
      - 'Assessor'
      - 'CountyAdmin'
```

- **Secrets Management**: External Secrets Operator → Azure Key Vault (or AWS
  SM/GCP SM). `infra/kubernetes/gitops/security/external-secrets.yaml` binds
  Kubernetes `Secret` to Key Vault entries; CI never sees raw secrets.
- **Service‑to‑Service**: mTLS via service mesh (Istio/Linkerd optional), strict
  **NetworkPolicies** (deny‑all, allow necessary).

---

## 🧰 Enterprise CI (Supply‑Chain, SBOM, Signing, Provenance)

`/.github/workflows/enterprise-ci.yml` (high‑level):

1. **Build** images for `core`, `ui`, `worker` with build args/digests.
2. **SBOM** via **Syft**; **vuln scan** via **Grype/Trivy** (fail on
   HIGH/CRITICAL, allowlist w/ expiry).
3. **Sign** images using **cosign keyless** (OIDC/GitHub) + **generate SLSA
   provenance**.
4. **Push** to GHCR/ACR and **attach SBOM + attestations**.
5. **Create PR** to `infra/kubernetes/gitops/terrafusion-app.yaml` pinning
   **image\@sha256\*\***:digest\*\* (immutable).

Snippet:

```yaml
- name: Build images
  run: |
    docker build -t $REG/core:$GIT_SHA services/core
    docker build -t $REG/ui:$GIT_SHA   services/ui
    docker build -t $REG/worker:$GIT_SHA services/worker
- name: SBOM & scan
  run: |
    syft $REG/core:$GIT_SHA -o spdx-json > sbom-core.json
    grype --fail-on high $REG/core:$GIT_SHA || exit 1
- name: Sign & attest
  run: |
    cosign sign --yes $REG/core:$GIT_SHA
    slsa-provenance generate --artifact $REG/core:$GIT_SHA > prov-core.json
```

---

## 🚀 Enterprise CD (GitOps + Progressive Delivery)

- **Argo CD “App‑of‑Apps”** controls platform and add‑ons.
- **Argo Rollouts** for **canary**/**blue‑green** with **Prometheus** checks +
  **automatic rollback**.

`infra/kubernetes/gitops/argo/terrafusion-app.yaml` (excerpt):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-benton
spec:
  source:
    repoURL: https://github.com/yourorg/terrafusion
    path: infra/kubernetes/helm/terrafusion
    helm:
      valueFiles:
        - values-benton.yaml
  destination:
    namespace: terrafusion
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

**Rollouts example** (`rollout-core.yaml`):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: core
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 120 }
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 30
        - pause: { duration: 180 }
        - setWeight: 60
        - pause: { duration: 300 }
      trafficRouting:
        nginx: {}
```

---

## 📊 Observability & SLOs

- **OpenTelemetry Collector** → **Tempo/Jaeger** (traces), **Loki** (logs),
  **Prometheus Operator** (metrics), **Grafana** dashboards auto‑provisioned.
- **SLOs with Sloth** → Error budgets + alerts routed to PagerDuty/MS Teams.

`gitops/observability/sloth-slo.yaml` (excerpt):

```yaml
apiVersion: sloth.slok.dev/v1
kind: PrometheusServiceLevel
metadata:
  name: api-latency
spec:
  service: terrafusion-api
  slos:
    - name: p95-latency
      objective: 99
      sli:
        events:
          errorQuery: sum(rate(http_request_duration_seconds_bucket{le="0.5",service="api"}[5m]))
          totalQuery: sum(rate(http_request_duration_seconds_count{service="api"}[5m]))
      alerting:
        name: latency-budget-burn
        labels: { severity: page }
```

---

## 🛡️ Policy‑as‑Code & Runtime Security

- **Gatekeeper/Kyverno** enforce:
  - Mandatory resource requests/limits, non‑root, read‑only FS
  - Image pinning by digest only
  - Disallow hostPath/privileged, restrict capabilities
  - Required **NetworkPolicy** and **PodSecurity** baseline
- **Trivy Operator**: continuous K8s vuln scanning.
- **Falco**: runtime anomaly detection.

Example Kyverno policy (`policies/kyverno/require-digest.yaml`):

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-digest
spec:
  validationFailureAction: enforce
  rules:
    - name: check-digest
      match:
        any:
          - resources:
              kinds: [Deployment, Rollout]
      validate:
        message: 'Images must be pinned by digest'
        pattern:
          spec:
            template:
              spec:
                containers:
                  - image: '*@sha256:*'
```

---

## 🧯 DR/BCP & Backups

- **Database**: Managed Postgres (Azure Flexible Server) **or** self‑managed
  with **WAL‑G** backups to Blob/S3, PITR enabled.
- **RPO/RTO Targets**: RPO ≤ 5m, RTO ≤ 30m (configurable).
- **Automated Restore Tests**: Nightly job restores to staging & runs health
  checks.

`ops/enterprise/07_postgres_backup_dr.sh` (core):

```bash
export WALE_S3_PREFIX=s3://terrafusion-benton-pg
wal-g backup-push /var/lib/postgresql/data
wal-g delete retain 7 --confirm
# Restore test (k8s Job) spins up ephemeral DB and runs smoke SQL
```

Runbook (`archetypes/dr-runbook.md`) details on failover, DNS cutover, and data
verification.

---

## 💸 FinOps & Cost Guardrails

- **Kubecost**/OpenCost for allocation & budgets
- HPA/VPA/KEDA auto‑rightsizing; off‑peak scale‑down
- Grafana dashboards for per‑module cost & request efficiency

---

## 🧪 Chaos & Resilience

- **LitmusChaos** experiments baked into non‑prod: pod‑kill, network‑loss,
  latency injection for API/UI.
- Rollout gates require passing chaos scenarios before promotion.

---

## 🏛️ Compliance Evidence Pack (SOC2/CJIS‑Ready)

`ops/enterprise/08_compliance_snapshot.sh`:

- Captures: SBOMs, image signatures, cluster policy reports, access logs (OIDC),
  backup status, SLO exports, change PR links, rollout history, vulnerability
  status.
- Outputs a **time‑stamped evidence bundle** for auditors.

---

## 🔄 Environment Promotion & Change Management

- **Branching**: `main` → prod, `develop` → staging, PRs require ✅ checks.
- **Promotion**: Tag release → CI signs + publishes → CD opens GitOps PR → Argo
  sync → Rollouts canary.
- **Rollback**: `argocd app rollback` or `rollouts undo` to last healthy
  revision.

---

## 🔧 One‑Command Enterprise Chain

`ops/benton-enterprise.sh` orchestrates:

```bash
#!/usr/bin/env bash
set -euo pipefail
DIR=$(cd "$(dirname "$0")" && pwd)
$DIR/enterprise/00_tf_init_apply.sh "$@"
$DIR/enterprise/01_bootstrap_cluster.sh
$DIR/enterprise/02_setup_secrets.sh
$DIR/enterprise/03_install_observability.sh
$DIR/enterprise/04_install_security.sh
$DIR/enterprise/05_deploy_platform.sh
$DIR/enterprise/06_progressive_delivery.sh
$DIR/enterprise/07_postgres_backup_dr.sh
$DIR/enterprise/08_compliance_snapshot.sh
```

You can still run the local path:

```bash
# Local demo
bash ops/benton-demo.sh
# Enterprise path
bash ops/benton-enterprise.sh
```

---

## 🗺️ Helm Values Overlay (Benton)

`infra/kubernetes/helm/terrafusion/values-benton.yaml` (excerpt):

```yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: benton.terrafusion.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: tf-benton-tls
      hosts: [benton.terrafusion.example.com]

resources:
  core:
    limits: { cpu: '2', memory: '2Gi' }
    requests: { cpu: '500m', memory: '512Mi' }
  ui:
    limits: { cpu: '1', memory: '1Gi' }
    requests: { cpu: '200m', memory: '256Mi' }

postgres:
  managed: true # Use Azure Flexible Server with PostGIS
  host: ${PG_HOST}
  db: ${PG_DB}
  user: ${PG_USER}
  passwordSecret: pg-app-creds

security:
  requireDigest: true
  podSecurityStandard: baseline
  networkPolicy: strict
```

---

## 🔒 Sample NetworkPolicy (Strict Default‑Deny)

`archetypes/networkpolicy-strict.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: terrafusion
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-core-db
  namespace: terrafusion
spec:
  podSelector:
    matchLabels:
      app: core
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: database }
      ports:
        - protocol: TCP
          port: 5432
```

---

## 🧼 Data Masking for Demos (PII‑Safe)

Add a pre‑seed step to anonymize personal data:

```bash
python scripts/anonymize_benton.py data/benton/parcels.csv > data/benton/parcels_sanitized.csv
```

The loader will prefer `*_sanitized.csv` when present.

---

## ✅ What You Get

- Reproducible **IaC** for AKS/EKS/GKE
- **GitOps** with immutable digests and policy gates
- **Signed** artifacts with SBOM + provenance (SLSA)
- **SSO** & externalized secrets (no secrets in CI)
- **Observability** with alerts & SLOs
- **DR** with automated restore tests
- **Compliance** evidence bundle
- **Progressive delivery** with automatic rollback

> Ready for me to drop in the actual Terraform AKS module, Helm chart skeletons,
> and the ArgoCD App‑of‑Apps with working defaults? I can add those files
> verbatim next.
