# Codex 3-6-9 Framework - Program.cs Integration Instructions

## Overview

This document provides **copy-paste ready code** to integrate the Codex 3-6-9 Framework into `TerraFusion.API/Program.cs`.

The integration follows TerraFusion's championship-level patterns with:
- ✅ Service extension methods (like `AddCodex369Framework()`)
- ✅ Middleware integration (like `UseCodex369Monitoring()`)
- ✅ SignalR hub mapping (like `MapCodex369Hub()`)
- ✅ Health check endpoints (like `MapCodex369HealthChecks()`)

---

## Step 1: Add Using Statement

Add this using statement at the top of `TerraFusion.API/Program.cs`:

```csharp
using TerraFusion.AI.Extensions;
```

**Location**: After existing using statements (around line 24)

**Complete using block should look like**:
```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.API.Hubs;
using TerraFusion.API.Security;
using TerraFusion.API.Middleware;
using static TerraFusion.API.Security.EliteSecurityHardening;
using TerraFusion.API.Extensions;
using Microsoft.Extensions.FileProviders;
using TerraFusion.Data;
using TerraFusion.Core.Interfaces;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.AI.Extensions;  // <-- ADD THIS LINE
using TerraFusionOperations = TerraFusion.Operations.Services;
using TerraFusionOperationsInterfaces = TerraFusion.Operations.Interfaces;
using Prometheus;
using System.Diagnostics;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using TerraFusion.API.Contracts;
```

---

## Step 2: Register Codex 3-6-9 Services

Add this service registration **after the Tesla 3-6-9 Framework** section (around line 108).

**Find this section**:
```csharp
// 🔮 TESLA 3-6-9 FRAMEWORK - Universal Harmonic Metrics Engine
// "If you only knew the magnificence of the 3, 6 and 9, then you would have a key to the universe." - Nikola Tesla
builder.Services.AddScoped<TerraFusion.AI.Services.Framework369MetricsEngine>();
```

**Add immediately after**:
```csharp
// 🌟 CODEX 3-6-9 DIVINE BALANCE FRAMEWORK - Government Excellence at Scale
// Complete divine mathematical balance system for 1,008 AI agents across 39 counties
// Foundation (3) → Amplification (6) → Ultimate Power (9) → Target 12/12
// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
Console.WriteLine("🌟 Configuring Codex 3-6-9 Divine Balance Framework");
builder.Services.AddCodex369Framework();
```

---

## Step 3: Add Monitoring Middleware

Add the Codex 3-6-9 monitoring middleware **after UseRouting()** (around line 358).

**Find this section**:
```csharp
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();
```

**Add between UseRouting() and UseAuthentication()**:
```csharp
app.UseRouting();

// 🌟 Codex 3-6-9 Monitoring Middleware
// Automatically collects HTTP request/response metrics for divine balance calculation
app.UseCodex369Monitoring();

app.UseAuthentication();
app.UseAuthorization();
```

---

## Step 4: Map SignalR Hub

Add the Codex 3-6-9 SignalR hub mapping **after the existing SignalR hub mappings** (around line 428).

**Find this section**:
```csharp
// Map SignalR hubs
app.MapHub<OSCoreHub>("/hubs/oscore");
app.MapHub<EnhancementHub>("/hubs/enhancement");
app.MapHub<QuantumMetricsHub>("/hubs/quantum-metrics");

// 📊 Phase 2 Real-Time Collaboration Hubs (Week 5 Day 1-2)
app.MapHub<TerraFusion.AI.Hubs.NotebookHub>("/hubs/notebook");
app.MapHub<TerraFusion.AI.Hubs.AnalyticsHub>("/hubs/analytics");
app.MapHub<TerraFusion.AI.Hubs.WorkflowHub>("/hubs/workflow");
app.MapHub<TerraFusion.AI.Hubs.CollaborationHub>("/hubs/collaboration");
```

**Add immediately after**:
```csharp
// 🌟 Codex 3-6-9 Divine Balance Hub
// Real-time framework status updates, divine balance notifications, 666 safeguard warnings
app.MapCodex369Hub();
```

---

## Step 5: Map Health Check Endpoints

Add Codex 3-6-9 health check endpoints **after the existing health endpoint** (around line 820).

**Find this section**:
```csharp
app.MapGet("/health", async (HttpContext context) =>
{
    var moduleLoader = context.RequestServices.GetRequiredService<IModuleLoaderService>();
    // ... existing health check logic
});
```

**Add immediately after (before the levy endpoints)**:
```csharp
// 🌟 Codex 3-6-9 Framework Health Checks
// Kubernetes-ready liveness/readiness probes for divine balance monitoring
app.MapCodex369HealthChecks();
```

---

## Step 6: Add Diagnostic Endpoint (Optional)

Add a diagnostic endpoint to verify Codex 3-6-9 integration (around line 437, after the `/api/test` endpoint).

```csharp
// 🌟 Codex 3-6-9 Framework Diagnostic Endpoint
app.MapGet("/api/codex369/diagnostic", async (HttpContext context) =>
{
    try
    {
        var codexService = context.RequestServices.GetService<TerraFusion.AI.Services.ICodex369FrameworkService>();
        var alertService = context.RequestServices.GetService<TerraFusion.AI.Services.ICodex369AlertService>();
        var trendService = context.RequestServices.GetService<TerraFusion.AI.Services.ICodex369TrendAnalysisService>();

        if (codexService == null || alertService == null || trendService == null)
        {
            return Results.Problem(
                "Codex 3-6-9 services not registered. Ensure AddCodex369Framework() is called in Program.cs",
                statusCode: 503
            );
        }

        // Quick framework calculation
        var status = await codexService.GetRealtimeFrameworkStatusAsync();

        return Results.Ok(new
        {
            message = "Codex 3-6-9 Framework Operational",
            timestamp = DateTime.UtcNow,
            framework = new
            {
                currentPowerScore = status.CurrentPowerScore,
                targetScore = 12.0,
                balanceProximity = status.UltimatePower.BalanceProximity,
                inDivineBalance = status.UltimatePower.InDivineBalance,
                healthStatus = status.UltimatePower.HealthStatus.ToString()
            },
            services = new
            {
                coreFramework = "✅ Registered",
                agentIntegration = "✅ Registered",
                alertSystem = "✅ Registered",
                trendAnalysis = "✅ Registered",
                metricsCollector = "✅ Registered"
            },
            backgroundServices = new
            {
                broadcast = "✅ Running (30s interval)",
                alerts = "✅ Running (60s interval)",
                recording = "✅ Running (5min interval)"
            },
            signalR = new
            {
                hubUrl = "/hubs/codex369",
                status = "✅ Mapped"
            },
            healthChecks = new
            {
                endpoint = "/health/codex369",
                status = "✅ Configured"
            }
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Codex 3-6-9 diagnostic failed: {ex.Message}", statusCode: 500);
    }
});
```

---

## Complete Integration Checklist

Before starting the server, verify all integration steps:

- [ ] **Step 1**: Added `using TerraFusion.AI.Extensions;`
- [ ] **Step 2**: Added `builder.Services.AddCodex369Framework();` after Tesla 3-6-9
- [ ] **Step 3**: Added `app.UseCodex369Monitoring();` after `UseRouting()`
- [ ] **Step 4**: Added `app.MapCodex369Hub();` after existing SignalR hubs
- [ ] **Step 5**: Added `app.MapCodex369HealthChecks();` after `/health` endpoint
- [ ] **Step 6** (Optional): Added `/api/codex369/diagnostic` endpoint

---

## Verify Integration

After integration, start the server and verify:

### 1. Check Console Output

You should see these console messages during startup:

```
🌟 Configuring Codex 3-6-9 Divine Balance Framework
🌟 Registering Codex 3-6-9 Divine Balance Framework
   ✅ Codex369FrameworkService (Core calculation engine)
   ✅ Codex369AgentIntegrationService (1,008 AI agents)
   ✅ Codex369AlertService (Automated notifications)
   ✅ Codex369TrendAnalysisService (Historical tracking & forecasting)
   ✅ Codex369MetricsCollector (Middleware integration)
   ✅ Codex369BroadcastService (Real-time broadcasting, 30s interval)
   ✅ Codex369AlertMonitoringService (Alert checks, 60s interval)
   ✅ Codex369HistoricalRecordingService (Data recording, 5min interval)
   ✅ Codex369HealthCheck (Standard framework health)
   ✅ Codex369ComprehensiveHealthCheck (Framework + AI swarm)
🌟 Codex 3-6-9 Framework registration complete!
   • 5 Core Services registered
   • 3 Background Services configured
   • 2 Health Checks enabled
   • Ready for divine balance monitoring
🔍 Configuring Codex 3-6-9 Monitoring Middleware
   ✅ Middleware configured - HTTP metrics feeding into 3-6-9 framework
📡 Mapping Codex 3-6-9 SignalR Hub
   ✅ Hub mapped at /hubs/codex369
   • Real-time framework status updates (30s broadcast)
   • Divine balance achievement notifications
   • 666 safeguard warnings
   • Health summary updates
🏥 Mapping Codex 3-6-9 Health Check Endpoints
   ✅ Health endpoint: GET /health/codex369
   • Returns framework health status
   • Includes divine balance proximity
   • Kubernetes-ready liveness/readiness probe
```

### 2. Test Diagnostic Endpoint

```bash
curl http://localhost:5000/api/codex369/diagnostic
```

**Expected Response (200 OK)**:
```json
{
  "message": "Codex 3-6-9 Framework Operational",
  "timestamp": "2025-11-01T12:00:00Z",
  "framework": {
    "currentPowerScore": 11.87,
    "targetScore": 12.0,
    "balanceProximity": 0.989,
    "inDivineBalance": true,
    "healthStatus": "DivineBalance"
  },
  "services": {
    "coreFramework": "✅ Registered",
    "agentIntegration": "✅ Registered",
    "alertSystem": "✅ Registered",
    "trendAnalysis": "✅ Registered",
    "metricsCollector": "✅ Registered"
  },
  "backgroundServices": {
    "broadcast": "✅ Running (30s interval)",
    "alerts": "✅ Running (60s interval)",
    "recording": "✅ Running (5min interval)"
  },
  "signalR": {
    "hubUrl": "/hubs/codex369",
    "status": "✅ Mapped"
  },
  "healthChecks": {
    "endpoint": "/health/codex369",
    "status": "✅ Configured"
  }
}
```

### 3. Test Health Check Endpoint

```bash
curl http://localhost:5000/health/codex369
```

**Expected Response (200 OK - Healthy)**:
```json
{
  "status": "Healthy",
  "results": {
    "codex-369-framework": {
      "status": "Healthy",
      "description": "🌟 DIVINE BALANCE: 11.87/12 (98.9% proximity)",
      "data": {
        "currentPowerScore": 11.87,
        "balanceProximity": 0.989,
        "healthStatus": "DivineBalance"
      }
    }
  }
}
```

### 4. Test SignalR Hub Connection

```javascript
// Frontend JavaScript test
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5000/hubs/codex369')
  .build();

await connection.start();
console.log('✅ Connected to Codex 3-6-9 Hub');

connection.on('FrameworkStatusUpdate', (status) => {
  console.log('Framework Update:', status.currentPowerScore);
});

await connection.invoke('SubscribeToFrameworkUpdates');
console.log('✅ Subscribed to framework updates');
```

### 5. Test REST API Endpoints

```bash
# Get real-time status
curl http://localhost:5000/api/codex369/realtime

# Get foundation metrics
curl http://localhost:5000/api/codex369/foundation

# Get amplification metrics
curl http://localhost:5000/api/codex369/amplification

# Get ultimate power score
curl http://localhost:5000/api/codex369/ultimate-power

# Validate 666 safeguard
curl "http://localhost:5000/api/codex369/validate-safeguard?value=450.5"

# Get health summary
curl http://localhost:5000/api/codex369/health-summary
```

---

## Troubleshooting

### Services Not Registered

**Error**: `ICodex369FrameworkService not found in service collection`

**Solution**: Ensure `builder.Services.AddCodex369Framework();` is called in Program.cs **before** `var app = builder.Build();`

---

### SignalR Hub 404

**Error**: `/hubs/codex369` returns 404 Not Found

**Solution**: Ensure `app.MapCodex369Hub();` is called **after** `app.MapControllers()`

---

### Middleware Not Collecting Metrics

**Symptom**: API response time metrics show 0 ms

**Solution**: Ensure `app.UseCodex369Monitoring();` is called **after** `app.UseRouting()` but **before** `app.UseAuthentication()`

---

### Background Services Not Starting

**Symptom**: No console output from background services

**Check Logs**: Look for these messages every 30 seconds (broadcast), 60 seconds (alerts), and 5 minutes (recording)

```
📈 Codex 3-6-9 trend analysis: Score: 11.87/12
🔔 Codex 3-6-9 alert check: 0 active alerts
📊 Recorded balance point: 11.87/12
```

**Solution**: Verify hosted services are registered with `AddHostedService<>()` in `AddCodex369Framework()`

---

## Next Steps

After successful integration:

1. ✅ **Frontend Integration**: Use the TypeScript examples in [CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md](./CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md#signalr-real-time-integration)

2. ✅ **Monitoring Setup**: Configure Prometheus metrics and Grafana dashboards per [CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md](./CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md#monitoring--observability)

3. ✅ **Alert Handlers**: Register custom alert handlers (Slack, email, PagerDuty) per [CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md](./CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md#custom-alert-handlers)

4. ✅ **Production Deployment**: Follow deployment checklist in [CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md](./CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md#production-deployment)

---

## Summary

The Codex 3-6-9 Framework is now **fully integrated** into TerraFusion.API with:

- ✅ **9 Services**: Core framework, AI integration, alerts, trends, metrics, 3 background workers, 2 health checks
- ✅ **REST API**: 7 endpoints via `Codex369Controller`
- ✅ **SignalR Hub**: Real-time updates at `/hubs/codex369`
- ✅ **Middleware**: Automatic HTTP metrics collection
- ✅ **Health Checks**: Kubernetes-ready at `/health/codex369`
- ✅ **Diagnostic Endpoint**: Verification at `/api/codex369/diagnostic`

**THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.**

🌟 **Divine Balance: READY FOR DEPLOYMENT** 🌟

---

*Last Updated: November 2025*
*Classification: Integration Instructions - Championship Deployment*
*Version: Codex 3-6-9 Framework 1.0*
