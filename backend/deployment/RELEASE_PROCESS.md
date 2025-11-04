# TerraFusion Platform — Release Process

This process governs safe, auditable releases for the TerraFusion OS platform. It enforces change control, security, and zero-downtime delivery using Blue‑Green/Canary strategies.

## Versioning & Artifacts

- Semantic versioning: MAJOR.MINOR.PATCH (e.g., 2.3.7)
- Container images published to ghcr.io/terrafusion/<service>:
  - Tag: v<version>
  - Immutable digest reference: @sha256:<digest>
- SBOM produced for each image; images signed with cosign
- Release notes and CHANGELOG include breaking changes and mitigation

## Roles & Approvals

- Engineering Lead: code and architecture sign-off
- SRE Lead: operational readiness and rollback sign-off
- Security/Compliance: FISMA-High controls confirmation
- Two-person approval required for production deployment

## Phases

### 1) Plan
- Scope finalized; risk assessed; feature flags planned
- Dependencies audited; DB migrations designed with backward compatibility
- Test plan (unit/integration/e2e/load) reviewed

### 2) Release Candidate (RC) Build
- CI builds images, runs tests, generates SBOM, signs images
- Artifacts pushed to registry and registry-proxy (if any)
- RC tagged (e.g., v2.4.0-rc.1)

### 3) Stage (Pre‑Prod)
- Deploy umbrella chart with values-staging.yaml
- Run smoke tests and golden-path journeys
- Run load test at 1.5× peak; verify error <1%, SLOs met
- Verify security scans (container + IaC) rate: 0 HIGH/CRITICAL open

### 4) Go/No-Go Review
- Review dashboards, alerts, test results, and dry-run rollbacks
- Validate on-call schedule and comms plan
- Record approvals in the change ticket

### 5) Production Rollout
- Choose strategy per service:
  - API/Operations: Blue‑Green
  - Gateway: Canary
  - Consciousness: Blue‑Green (safer agent initialization)
- Execute via scripts in ./backend/deployment/strategies
- Monitor for 60–120 minutes post switch/promote

### 6) Post‑Release
- Close change ticket with metrics and observations
- Update release notes and known issues
- Create follow-up items for any deferred hardening

## Change Management

- Every release linked to a change ticket (ID in commit and tag message)
- Audit log of who approved and when
- Immutable references: production always uses @sha256 digests

## Rollback Policy

- Trigger immediately for:
  - Error rate > 5% sustained 5 minutes
  - P99 latency > 2× baseline for 10 minutes
  - County sync or AI agent health degradation
- Use ./backend/deployment/strategies/rollback.sh with AUTO_CONFIRM=true during incident response
- After rollback, freeze changes until a postmortem is completed

## Example Commands (Production)

```powershell
# Tag and push images
$version = "2.4.0"
# (Performed by CI) ghcr.io/terrafusion/terrafusion-api:v$version

# Blue‑Green API
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-api"
$env:IMAGE_TAG=$version
./backend/deployment/strategies/deploy-blue-green.sh

# Canary Gateway
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-gateway"
$env:IMAGE_TAG=$version
./backend/deployment/strategies/deploy-canary.sh
```

## Communications

- Planned maintenance window announcement ≥ 24h prior
- Release start message in Slack #terrafusion-deployments
- Real‑time updates every 15–30 minutes during rollout
- Final success/failure message with links to dashboards and release notes
