# 🚀 TERRAFUSION DEVOPS QUICK REFERENCE CARD

## 🔥 EMERGENCY CONTACTS

```
ON-CALL HOTLINE:     1-800-TERRA-911
Slack Emergency:     #incident-response
PagerDuty:          terrafusion.pagerduty.com
Status Page:        status.terrafusion.io
```

## 🎯 THE 14 APPS AT A GLANCE

| #   | App Name             | Port | Purpose         | Health Check |
| --- | -------------------- | ---- | --------------- | ------------ |
| 01  | TerraAgent           | 3001 | AI Assistant    | `/health`    |
| 02  | TerraFlow            | 3002 | Workflow Engine | `/health`    |
| 03  | WebAuditTracker      | 3003 | Compliance      | `/health`    |
| 04  | TerraLevy            | 3004 | Tax System      | `/health`    |
| 05  | TerraMiner           | 3005 | Data Analytics  | `/health`    |
| 06  | TerraFusionSync      | 3006 | Data Sync       | `/health`    |
| 07  | GISPRO               | 3007 | GIS Mapping     | `/health`    |
| 08  | CostForgeAI          | 3008 | Budget AI       | `/health`    |
| 09  | PropertyWorkbench    | 3009 | Property Mgmt   | `/health`    |
| 10  | TerraInsight         | 3010 | BI Dashboard    | `/health`    |
| 11  | TerraFusionDashboard | 3011 | Executive View  | `/health`    |
| 12  | TerraFusionAssessor  | 3012 | AI Assessment   | `/health`    |
| 13  | Marketplace          | 3013 | Master Control  | `/health`    |
| 14  | TerraCollections     | 3014 | Revenue Mgmt    | `/health`    |

## ⚡ MOST USED COMMANDS

```bash
# CHECK EVERYTHING
./scripts/championship-audit.sh

# BUILD ALL
./scripts/championship-build-all.sh

# DEPLOY TO PRODUCTION
./deploy-to-production.sh

# EMERGENCY ROLLBACK
./scripts/emergency-rollback.sh

# VIEW LOGS (replace XX with app number)
kubectl logs -f terrafusion-app-XX

# RESTART APP (replace XX with app number)
kubectl rollout restart deployment/terrafusion-app-XX

# SCALE UP (emergency traffic)
kubectl scale deployment/terrafusion-app-XX --replicas=5

# CHECK STATUS
kubectl get pods | grep terrafusion

# DATABASE BACKUP
./scripts/backup-database.sh

# CLEAR CACHE
redis-cli FLUSHALL
```

## 🔴 INCIDENT RESPONSE FLOWCHART

```
ALERT RECEIVED
     ↓
Is it P1? (Complete Outage)
  YES → Page entire team NOW
   NO ↓
Is it P2? (Major Degradation)
  YES → Page on-call + backup
   NO ↓
Is it P3? (Minor Issue)
  YES → Notify on-call
   NO → Log ticket for tomorrow
```

## 🏁 DEPLOYMENT CHECKLIST

```
□ Tests pass locally
□ Tests pass in CI
□ Security scan clean
□ Performance benchmark passed
□ Staging deployment successful
□ Change ticket approved
□ Rollback plan ready
□ Team notified in Slack
□ DEPLOY
□ Monitor for 30 minutes
□ Update status page
□ Close change ticket
```

## 📊 KEY METRICS TO WATCH

| Metric        | Normal | Warning   | Critical |
| ------------- | ------ | --------- | -------- |
| CPU           | <60%   | 60-80%    | >80%     |
| Memory        | <70%   | 70-85%    | >85%     |
| Disk          | <75%   | 75-90%    | >90%     |
| Response Time | <200ms | 200-500ms | >500ms   |
| Error Rate    | <0.1%  | 0.1-1%    | >1%      |
| Queue Depth   | <100   | 100-500   | >500     |

## 🔧 TROUBLESHOOTING MATRIX

| Symptom         | Likely Cause  | Quick Fix                 |
| --------------- | ------------- | ------------------------- |
| All apps down   | Cluster issue | Check master node         |
| Single app down | Pod crashed   | `kubectl rollout restart` |
| Slow response   | High CPU      | Scale up replicas         |
| 502 errors      | Backend down  | Check health endpoints    |
| 504 errors      | Timeout       | Check database            |
| Memory spikes   | Memory leak   | Restart affected pod      |
| Disk full       | Logs overflow | Clear old logs            |
| Can't connect   | Network issue | Check security groups     |

## 🎯 GOLDEN SIGNALS

**Monitor these 4 signals for each app:**

1. **Latency** - How long requests take
2. **Traffic** - Requests per second
3. **Errors** - Error rate percentage
4. **Saturation** - Resource utilization

## 🔐 SECURITY QUICK CHECKS

```bash
# Check SSL expiry
echo | openssl s_client -connect terrafusionmarket.io:443 2>/dev/null | openssl x509 -noout -dates

# Scan for vulnerabilities
./scripts/security-scan.sh

# Check for exposed secrets
git secrets --scan

# Verify backups are encrypted
./scripts/verify-backup-encryption.sh
```

## 📈 PERFORMANCE OPTIMIZATION

**Quick Wins:**

- Enable caching: `redis-cli SET cache:enable 1`
- Increase workers: `kubectl scale --replicas=3`
- Clean old data: `./scripts/cleanup-old-data.sh`
- Optimize queries: Check slow query log
- CDN cache purge: `./scripts/purge-cdn.sh`

## 🚨 DO NOT EVER

❌ Deploy on Friday afternoon ❌ Skip testing "just this once" ❌ Ignore warning
alerts ❌ Make production changes without approval ❌ Store secrets in code ❌
Disable monitoring "temporarily" ❌ Skip the post-deployment check ❌ Blame
teammates in post-mortems

## ✅ ALWAYS REMEMBER

✓ Test in staging first ✓ Have a rollback plan ✓ Communicate with the team ✓
Document your changes ✓ Monitor after deployment ✓ Update runbooks ✓ Learn from
incidents ✓ Help teammates

## 🏆 THE CHAMPIONSHIP WAY

**"Do Your Job"** - Focus on your responsibilities **"Next Man Up"** - Be ready
to cover for teammates **"No Days Off"** - Continuous improvement **"We're On To
Cincinnati"** - Focus on the next task **"Just Execute"** - Follow the playbook

---

**Master Control Center**: https://terrafusionmarket.io **Documentation**: /docs
**Runbooks**: /runbooks **Slack**: #terrafusion-devops

_Print this. Keep it handy. You'll need it._
