# TerraFusion Platform — Production Readiness Checklist

Government. Transcended. This checklist validates that the TerraFusion OS platform (API, Consciousness, Gateway, Operations) is safe to go live at championship standards: 99.99% uptime, <10ms P95 (service-dependent), and FISMA-High compliance across 39 WA counties and 50,000+ AI agents.

## 1) Infrastructure Readiness

- [ ] Kubernetes 1.27+ cluster has ≥ 3 control-plane and ≥ 6 worker nodes
- [ ] Node pools sized for peak: CPU, memory, ephemeral, and network egress
- [ ] GPU node pool (if required for Consciousness) with NVIDIA drivers validated
- [ ] Storage classes: fast-ssd (RWX for logs/metrics), premium-ssd (RWO for db/cache)
- [ ] Ingress controller (NGINX) with TLS 1.3 and mTLS to internal backends (where applicable)
- [ ] ExternalDNS/cert-manager configured; cert renewal tested in staging
- [ ] PodSecurity/PSP replacement and seccomp profiles enabled
- [ ] NetworkPolicies isolate namespaces and restrict egress by service
- [ ] HPA/VPA policies enabled; PodDisruptionBudgets defined for all services

## 2) Security & Compliance (FISMA-High)

- [ ] Identity: SSO (Azure AD/Okta) enforced; RBAC roles mapped (admin/operator/viewer)
- [ ] Secrets: Stored in External Secrets/Key Vault; no secrets in Git
- [ ] SBOM generated for all images; images signed (cosign) and verified at deploy
- [ ] Container hardening: non-root, read-only rootfs, drop ALL capabilities, seccomp
- [ ] Supply chain: Provenance attestations; policy enforcement (e.g., OPA/Gatekeeper)
- [ ] Audit logging enabled for API, ingress, and cluster events; retention ≥ 365 days
- [ ] Data isolation by tenant; per-county connection strings validated
- [ ] Encryption in transit (TLS 1.3) and at rest (database/storage)
- [ ] Vulnerability scan (container + IaC) shows no HIGH/CRITICAL open findings

## 3) Observability & Alerting

- [ ] Prometheus scraping all targets; ServiceMonitors present for each service
- [ ] Grafana dashboards: Deployment, Service Health, AI Agents, Gateway, Database
- [ ] Jaeger tracing: spans flowing from Gateway → API → Consciousness/Operations
- [ ] Loki/Promtail logs: JSON structured; correlation IDs emitted end-to-end
- [ ] SLIs/SLOs defined per service (success rate, latency, error budget)
- [ ] Alert rules: error-rate, latency, 5xx, pod restarts, crashloop, PDB violations
- [ ] Alert routing: Slack (#terrafusion-critical), PagerDuty, Email (sre-team@terrafusion.gov)

## 4) Application Validation

- [ ] Helm charts render and install cleanly with values-{dev,staging,prod}.yaml
- [ ] ConfigMaps/Secrets validated; no missing required keys
- [ ] Health endpoints respond: /health, /health/ready, service-specific checks
- [ ] Contracts stable: Gateway → API routes; API → Consciousness/Operations RPCs
- [ ] Schema changes backward compatible or gated behind feature flags
- [ ] Feature flags reviewed; scoped by county/tenant where relevant

## 5) Data & Integrations

- [ ] Database connectivity validated (primary + replicas)
- [ ] Migration plan prepared; rollback/feature-flag fallback defined
- [ ] County integrations: Harris PACS, Tyler, Aumentum endpoints reachable from cluster
- [ ] Per-county throttling/SLAs configured; sync intervals validated
- [ ] Caches (Redis) sized and warmed; eviction policy acceptable

## 6) Performance & Scale

- [ ] Load test at 1.5× expected peak passes (error rate <1%, P95 latency targets)
- [ ] Gateway RPS limits and circuit breakers verified under stress
- [ ] Consciousness Engine initializes 50,000 agents within SLO; warmup measured
- [ ] HPA scales to max and recovers; no thrashing; cooldown tuned
- [ ] API and Operations handle county mix (39 tenants) without noisy-neighbor impact

## 7) Release & Rollback Readiness

- [ ] Blue-Green and Canary scripts tested in staging with realistic data
- [ ] Rollback criteria documented and rehearsed; dry-run succeeded
- [ ] Immutable images (ghcr.io/terrafusion/*:@sha256) referenced by digest
- [ ] Git tags and release notes prepared; CHANGELOG updated
- [ ] ArgoCD Applications healthy; sync policies match desired strategy

## 8) Runbooks & On-Call

- [ ] Deployment Runbook updated and accessible
- [ ] Rollback Procedures updated and tested
- [ ] On-call rotation (PagerDuty) active; escalation policy verified
- [ ] Communication templates for planned/unplanned events approved

## 9) Final Dry-Run Commands (staging)

```powershell
# Render Helm umbrella with staging values
helm template terrafusion ./charts/terrafusion-umbrella -f values-staging.yaml | Out-Null

# Blue-Green dry-run for API (staging)
$env:NAMESPACE="terrafusion-staging"
$env:SERVICE="terrafusion-api"
$env:IMAGE_TAG="vNEXT"
./backend/deployment/strategies/deploy-blue-green.sh

# Canary dry-run for Gateway (staging)
$env:NAMESPACE="terrafusion-staging"
$env:SERVICE="terrafusion-gateway"
$env:IMAGE_TAG="vNEXT"
./backend/deployment/strategies/deploy-canary.sh
```

## Sign‑off (two-person rule)

- [ ] Engineering Lead: __________________ Date: __________
- [ ] SRE Lead: _________________________ Date: __________
- [ ] Security/Compliance: ______________ Date: __________
