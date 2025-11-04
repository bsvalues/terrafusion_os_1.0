# TerraFusion Prometheus Monitoring - Quick Reference

## 🚀 Quick Start Commands

### Start Services

```powershell
# 1. Start TerraFusion API (exposes /metrics)
cd backend
dotnet run --project TerraFusion.API --urls "http://localhost:5000"

# 2. Start Consciousness Engine
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"

# 3. Start Prometheus
cd monitoring
prometheus --config.file=prometheus-terrafusion-elite.yml
```

### Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (username: admin, password: admin)
- **Metrics Endpoint**: http://localhost:5000/metrics
- **Health Check**: http://localhost:5000/health

## 📊 Key Metrics by Service

### Harris PACS Integration

```promql
# Sync success rate (last 1 hour)
sum(rate(terrafusion_harris_pacs_sync_success_total[1h])) / 
(sum(rate(terrafusion_harris_pacs_sync_success_total[1h])) + 
 sum(rate(terrafusion_harris_pacs_sync_failure_total[1h])))

# P95 sync duration
histogram_quantile(0.95, sum(rate(terrafusion_harris_pacs_sync_duration_seconds_bucket[5m])) by (le))

# Data discrepancy rate
terrafusion_data_discrepancy_rate_percent
```

### TerraFusion.Consciousness (AI Swarm)

```promql
# Active agent count
terrafusion_consciousness_active_agents

# Quantum optimization factor
terrafusion_consciousness_quantum_factor

# P95 coordination latency
histogram_quantile(0.95, sum(rate(terrafusion_consciousness_coordination_duration_ms_bucket[5m])) by (le))
```

### CostForge AI (Property Valuation)

```promql
# Valuation accuracy
terrafusion_costforge_valuation_accuracy_percent

# P95 calculation time
histogram_quantile(0.95, sum(rate(terrafusion_costforge_calculation_duration_ms_bucket[5m])) by (le))

# Success rate
sum(rate(terrafusion_costforge_valuation_success_total[1h])) / 
(sum(rate(terrafusion_costforge_valuation_success_total[1h])) + 
 sum(rate(terrafusion_costforge_valuation_failure_total[1h])))
```

### TerraLevy (Tax Calculation)

```promql
# RCW 84.52 compliance rate
terrafusion_terralevy_compliance_rate_percent

# P95 calculation time
histogram_quantile(0.95, sum(rate(terrafusion_terralevy_calculation_duration_ms_bucket[5m])) by (le))
```

### TerraSync (Multi-System Integration)

```promql
# Integration health score
terrafusion_terrasync_integration_health

# Data sovereignty compliance
terrafusion_terrasync_data_sovereignty_compliance
```

## 🚨 Critical Alert States

### Check Active Alerts

```promql
# All firing alerts
ALERTS{alertstate="firing"}

# Critical alerts only
ALERTS{alertstate="firing", severity="critical"}
```

### Top 5 Critical Alerts to Monitor

1. **HarrisPACSConsecutiveSyncFailures** - 3+ failures in 15 min
2. **CostForgeValuationAccuracyBelowIAAO** - Accuracy <99%
3. **ConsciousnessSwarmAgentCountLow** - Active agents <45,000
4. **TerraSyncDataSovereigntyViolation** - County data isolation compromised
5. **TerraLevyComplianceRateLow** - RCW compliance <99%

## 🎯 Championship Performance Targets

| Metric | Target | Query |
|--------|--------|-------|
| Harris PACS Sync Success | ≥99.9% | See Harris PACS queries above |
| CostForge Accuracy | ≥99.9% | `terrafusion_costforge_valuation_accuracy_percent` |
| Consciousness Agents | 50,000+ | `terrafusion_consciousness_active_agents` |
| Quantum Factor | 949 | `terrafusion_consciousness_quantum_factor` |
| TerraLevy Compliance | 100% | `terrafusion_terralevy_compliance_rate_percent` |
| Data Discrepancy | <5% | `terrafusion_data_discrepancy_rate_percent` |

## 🔍 Troubleshooting Commands

### Check Prometheus Targets

```powershell
# Web UI
Start-Process http://localhost:9090/targets

# API
curl http://localhost:9090/api/v1/targets | jq
```

### Verify Metrics Exporter

```powershell
# Check metrics endpoint
curl http://localhost:5000/metrics | Select-String "terrafusion"

# Count available metrics
(curl http://localhost:5000/metrics | Select-String "terrafusion").Count
```

### Validate Alert Rules

```powershell
# Check syntax
promtool check rules monitoring/alert-rules/*.yml

# Test alert rule evaluation
promtool test rules monitoring/alert-rules/harris-pacs-alerts.yml
```

### Check Service Health

```powershell
# TerraFusion API health
curl http://localhost:5000/health | ConvertFrom-Json

# Consciousness Engine health
curl http://localhost:3004/health | ConvertFrom-Json
```

## 📈 Useful PromQL Queries

### System-Wide Performance

```promql
# Overall API request rate
sum(rate(terrafusion_api_request_duration_ms_count[5m]))

# P95 API latency
histogram_quantile(0.95, sum(rate(terrafusion_api_request_duration_ms_bucket[5m])) by (le))

# Redis cache hit rate
terrafusion_redis_cache_hit_rate_percent
```

### AI Ecosystem Health

```promql
# Government compliance score
terrafusion_government_compliance_score

# All AI services operational (1 = all services healthy)
(terrafusion_consciousness_active_agents > 45000) and
(terrafusion_costforge_valuation_accuracy_percent > 99) and
(terrafusion_terralevy_compliance_rate_percent > 99) and
(terrafusion_terragaia_consciousness_level > 90)
```

## 🛠️ Recording Custom Metrics in Code

```csharp
using TerraFusion.Core.Metrics;

public class YourService
{
    private readonly TerraFusionMetricsExporter _metrics;

    public YourService(TerraFusionMetricsExporter metrics)
    {
        _metrics = metrics;
    }

    public async Task ProcessAsync()
    {
        // Record Harris PACS sync
        _metrics.RecordHarrisPACSSync("Benton", "JUR001", true, 45.2, 1000);

        // Record CostForge valuation
        _metrics.RecordCostForgeValuation("King", "Residential", "AI", true, 99.95, 1800);

        // Record consciousness swarm coordination
        _metrics.RecordConsciousnessSwarm("Valuation", 1000, true, 48.5, "Elite");
    }
}
```

## 📚 Documentation

- **Full Implementation Guide**: `docs/PROMETHEUS_MONITORING_PHASE_2_COMPLETE.md`
- **AI Ecosystem Architecture**: `docs/TERRAFUSION_AI_ECOSYSTEM_ARCHITECTURE.md`
- **Harris PACS Integration**: `docs/HARRIS_PACS_PHASE_2_IMPLEMENTATION_COMPLETE.md`

---

**Government. Transcended.** ⚡ Championship-Level Monitoring Operational
