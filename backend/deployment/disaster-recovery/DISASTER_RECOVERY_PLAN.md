# TerraFusion Platform — Disaster Recovery Plan

Government. Transcended. This plan ensures restoration of TerraFusion OS to operational state within:

- RTO: 4 hours (max downtime to restore services)
- RPO: 1 hour (max acceptable data loss window)

## 1) Scope & Assumptions

- Scope: Core namespaces — `terrafusion`, `monitoring`, `ingress-nginx`
- Backups: Velero schedules (hourly + daily) capture Kubernetes resources and volumes
- Databases: PostgreSQL logical backups every 6h (CronJob); Redis RDB backups every 6h (CronJob)
- Secrets: Managed by External Secrets/Key Vault; not stored in Git

## 2) Backup Architecture

- Velero
  - Hourly namespace backups (RPO 1h) — `velero-schedules.yaml`
  - Daily full backup with 30-day retention
  - Volume snapshots where supported; FS backup fallback enabled
- PostgreSQL
  - `postgres-backup-cronjob.yaml` produces gzip-compressed dumps under PVC `db-backups`
  - Suggested off-cluster sync to object storage via backup sidecar or CSI snapshots
- Redis
  - `redis-backup-cronjob.yaml` captures RDB files under PVC `redis-backups`
  - Prefer managed provider snapshots if available; RDB used for portability

## 3) Restore Runbook (Kubernetes + Velero)

1. Validate target cluster readiness
   - Kubernetes version, node pools, storage classes, ingress controller ready
2. Recreate Velero with same storage credentials and location (read-only ok)
3. List available backups
   
   ```bash
   velero backup get
   ```

4. Choose backup (prefer most recent hourly) and perform restore
   
   ```bash
   velero restore create --from-backup <backup-name> \
     --restore-volumes=true \
     --wait
   ```

5. Verify namespace health
   
   ```bash
   kubectl get pods -n terrafusion
   kubectl get pods -n monitoring
   kubectl get ingress -A
   ```

6. Validate secrets and external integrations (External Secrets sync)

## 4) Database Restore (PostgreSQL)

1. Provision a replacement database or verify existing instance is empty/ready
2. Identify the desired dump file from PVC `db-backups`
3. Restore
   
   ```bash
   # From a privileged toolbox pod with psql
   export PGPASSWORD=$POSTGRES_PASSWORD
   gunzip -c /backups/<db>-YYYYMMDD-HHMMSS.sql.gz | \
     psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $POSTGRES_DB
   ```

4. Run integrity checks (counts, constraints, key tables)
5. Point application to restored DB and test application flows

## 5) Cache Restore (Redis)

- If using managed Redis with provider snapshots, restore from provider console
- If using RDB files:
  
  1. Deploy a Redis instance (or scale down app to avoid writes)
  2. Place the RDB from PVC `redis-backups` at the appropriate data path
  3. Start Redis; verify keys and TTLs

## 6) Validation Checklist (Post-Restore)

- [ ] Health endpoints responding: `/health`, `/health/ready`
- [ ] Gateway routes healthy and latency within SLO
- [ ] Consciousness Engine agent health ≥ 99.5%
- [ ] Operations county syncs operational across all 39 counties
- [ ] Grafana dashboards display metrics; Prometheus scraping targets OK
- [ ] Logs (Loki) and traces (Jaeger) flowing
- [ ] No elevated 5xx or error rates in the last 30 minutes

## 7) DR Test Cadence

- Quarterly DR exercises in staging: full restore from Velero + DB/Redis
- Annual production-readiness DR drill with executive sign-off
- Capture metrics: time to restore (RTO), data currency (RPO), gaps and action items

## 8) Roles & Communications

- SRE On‑Call: executes runbook and coordinates restore
- Engineering Lead: application validation and data integrity sign-off
- Security/Compliance: audit capture and reporting
- Communications: updates to `#terrafusion-critical`, stakeholder emails, status page

## 9) Failover Options (Optional)

- Warm standby cluster in paired region with periodic backup sync
- Database replicas with controlled promotion (ensure split-brain avoidance)
- Global DNS traffic steering (weighted or failover policies)

## 10) Post‑Incident Review

- Within 48 hours, perform a blameless postmortem
- Document timeline, root causes, contributing factors
- Prioritize corrective actions and resilience improvements

---

Supporting manifests:

- `velero-schedules.yaml`
- `postgres-backup-cronjob.yaml`
- `redis-backup-cronjob.yaml`

## 11) Periodic Restore Test (Staging)

To continuously validate RPO/RTO, perform a quarterly restore test in staging.

1. Select latest hourly backup and restore to isolated namespaces

  ```bash
  # Map prod namespaces to staging test namespaces
  BACKUP_NAME=$(velero backup get -o json | jq -r '.items | sort_by(.status.startTimestamp) | last.metadata.name')
  velero restore create dr-test-$(date +%Y%m%d-%H%M%S) \
    --from-backup "$BACKUP_NAME" \
    --namespace-mappings terrafusion:terrafusion-drtest,monitoring:monitoring-drtest \
    --restore-volumes=true \
    --wait
  ```

1. Restore PostgreSQL dump to staging database instance

  ```bash
  # Point to staging DB target
  export PGPASSWORD=$STAGING_DB_PASSWORD
  gunzip -c /backups/<db>-LATEST.sql.gz | \
    psql -h $STAGING_DB_HOST -p $STAGING_DB_PORT -U $STAGING_DB_USER $STAGING_DB_NAME
  ```

1. Restore Redis RDB to staging cache (optional if managed provider snapshots are used)

  ```bash
  # Copy RDB into staging Redis data path and restart
  kubectl -n terrafusion-drtest cp /backups/dump-latest.rdb redis-0:/data/dump.rdb
  kubectl -n terrafusion-drtest rollout restart statefulset/redis
  ```

1. Run smoke tests against restored services

  ```bash
  kubectl -n terrafusion-drtest run curl --image=curlimages/curl:8.5.0 -it --rm -- \
    curl -sSf http://terrafusion-api:5000/health && \
    curl -sSf http://terrafusion-gateway:80/health
  ```

1. Verify metrics/logs and document outcomes

- [ ] Health endpoints OK; baseline latency within SLO
- [ ] No elevated 5xx; logs/traces flowing in monitoring-drtest
- [ ] Data integrity checks (row counts, key tables) passed
- [ ] Measured RTO and RPO recorded in DR log

1. Cleanup

  ```bash
  # Remove test namespaces and resources
  kubectl delete ns terrafusion-drtest monitoring-drtest || true
  ```
