# TerraFusion Platform — Rollback Procedures

This guide defines fast, safe rollback to restore service health while preserving compliance and auditability.

## Triggers (Rollback Now)

- Error rate > 5% sustained 5 minutes
- P99 latency > 2× baseline sustained 10 minutes
- AI agent health < 99.5% or agent initialization stalls
- County sync failures or data integrity issues
- Security regressions or critical vulnerabilities

## Immediate Rollback (Previous Revision)

```powershell
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-api"  # or terrafusion-gateway / -operations / -consciousness
$env:AUTO_CONFIRM="true"
./backend/deployment/strategies/rollback.sh
```

- Verifies rollout success and health checks
- Prints recent pod events for diagnosis

## Targeted Rollback (Specific Revision)

```powershell
$env:NAMESPACE="terrafusion"
$env:SERVICE="terrafusion-api"
$env:REVISION="42"
$env:AUTO_CONFIRM="true"
./backend/deployment/strategies/rollback.sh
```

## Database Migration Policy

- Prefer backward‑compatible migrations with feature flags
- If irreversible migration is required:
  - Gate feature off by default
  - Deploy schema ahead of code; enable feature post‑deploy
  - Rollback toggles feature off; code rollback proceeds safely
- Keep short migration windows; capture backups before running

## Verification After Rollback

- Health endpoints:
  - /health, /health/ready, service‑specific checks
- Metrics: success rate, latency, error rate
- AI agent health ≥ 99.5% (Consciousness)
- County sync healthy for all 39 counties (Operations)
- Logs: no new ERROR spikes; restarts stable

## Communications & Audit

- Declare incident in #terrafusion-critical; page on‑call SRE
- Post rollback status, root symptoms, and current risk
- Record timestamps, commands executed, and approvers for audit trail
- Schedule postmortem within 48 hours; capture action items

## Decision Tree (Summary)

1) Is there user or county impact now? → Yes → Roll back immediately
2) Are metrics breaching SLOs for >5 minutes? → Yes → Roll back
3) Is the issue isolated to Gateway routing? → Prefer Canary abort → Roll back
4) Is DB migration involved? → Disable flag; verify; then roll back code
5) After rollback: monitor 60–120 minutes and freeze further changes
