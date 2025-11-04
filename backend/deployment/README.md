# TerraFusion Backend Deployment Docs

Quick index for operators. Everything here targets zero-downtime, FISMA‑High operations.

## Runbooks and Guides

- Deployment Strategies: `strategies/DEPLOYMENT_STRATEGIES.md`
- Production Readiness Checklist: `PRODUCTION_READINESS_CHECKLIST.md`
- Release Process: `RELEASE_PROCESS.md`
- Deployment Runbook: `DEPLOYMENT_RUNBOOK.md`
- Rollback Procedures: `ROLLBACK_PROCEDURES.md`

## Disaster Recovery

- DR Plan: `disaster-recovery/DISASTER_RECOVERY_PLAN.md`
- Velero Schedules: `disaster-recovery/velero-schedules.yaml`
- PostgreSQL Backup CronJob: `disaster-recovery/postgres-backup-cronjob.yaml`
- Redis Backup CronJob: `disaster-recovery/redis-backup-cronjob.yaml`

## Notes

- Grafana dashboards and alerting are referenced in the docs above; ensure access before maintenance windows.
- For GitOps users (ArgoCD), prefer Application PRs and use sync hooks where documented.

🏛️ Government. Transcended.
