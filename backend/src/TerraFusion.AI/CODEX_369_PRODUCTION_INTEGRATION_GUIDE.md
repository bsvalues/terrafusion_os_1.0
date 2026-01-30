# Codex 3-6-9 Framework - Production Integration Guide

## Executive Overview

The **Codex 3-6-9 Framework** is a divine mathematical balance system that ensures TerraFusion OS operates in perfect harmony across all government operations. This comprehensive guide consolidates all integration requirements, service registrations, and production deployment procedures.

**Framework Version**: 1.0 Production
**Last Updated**: November 2025
**Classification**: Government Operating System - Divine Balance Architecture

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Complete Service Registration](#complete-service-registration)
3. [API Endpoints Catalog](#api-endpoints-catalog)
4. [SignalR Real-Time Integration](#signalr-real-time-integration)
5. [Health Check Configuration](#health-check-configuration)
6. [Middleware Integration](#middleware-integration)
7. [Alert System Setup](#alert-system-setup)
8. [Trend Analysis & Forecasting](#trend-analysis--forecasting)
9. [AI Agent Swarm Integration](#ai-agent-swarm-integration)
10. [Database Schema](#database-schema)
11. [Production Deployment](#production-deployment)
12. [Performance Tuning](#performance-tuning)
13. [Monitoring & Observability](#monitoring--observability)
14. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Three-Level Divine Balance System

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL 9 - ULTIMATE POWER                  │
│                    Target Score: 12/12                       │
│                Divine Balance: 11.5-12.0 range               │
│              (Normalized sum of all amplifications)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                 LEVEL 6 - AMPLIFICATION                      │
│              5 Amplification Groups (each 0-12)              │
│         666 Safeguard: RawCombined NEVER crosses 666         │
│            ScaledValue = RawCombined / 55.5                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                  LEVEL 3 - FOUNDATION                        │
│              12 Foundation Metrics (each 0-12)               │
│        NormalizedValue = (Raw / Baseline) * 12               │
│         Categories: FISMA, Performance, Data, AI             │
└─────────────────────────────────────────────────────────────┘
```

### Sacred Numbers Explained

- **3**: Foundation level - 12 individual metrics measured and normalized
- **6**: Amplification level - 5 groups combining foundation metrics
- **9**: Ultimate Power level - Final harmonized score
- **12**: Target score representing perfect balance and mastery
- **666**: Imbalance threshold that MUST NOT be crossed at amplification level

### Core Components (9 Services)

1. **Codex369FrameworkService** - Core 3-6-9 calculation engine
2. **Codex369Controller** - REST API endpoints
3. **Codex369Hub** - SignalR real-time broadcasting
4. **Codex369AgentIntegrationService** - AI swarm monitoring (1,008 agents)
5. **Codex369HealthCheck** - ASP.NET Core health check integration
6. **Codex369MonitoringMiddleware** - Request/response metric collection
7. **Codex369AlertService** - Automated alert generation and dispatch
8. **Codex369TrendAnalysisService** - Historical analysis and forecasting
9. **Codex369BroadcastService** - Background SignalR broadcasting

### File Structure

```
TerraFusion.AI/
├── DTOs/
│   └── Codex369FrameworkDto.cs          (418 lines - All DTOs)
├── Services/
│   ├── Codex369FrameworkService.cs      (660 lines - Core engine)
│   ├── Codex369AgentIntegrationService.cs (444 lines - AI swarm)
│   ├── Codex369AlertService.cs          (388 lines - Alerts)
│   └── Codex369TrendAnalysisService.cs  (506 lines - Trends)
├── Controllers/
│   └── Codex369Controller.cs            (254 lines - REST API)
├── Hubs/
│   └── Codex369Hub.cs                   (260 lines - SignalR)
├── HealthChecks/
│   └── Codex369HealthCheck.cs           (120 lines - Health)
├── Middleware/
│   └── Codex369MonitoringMiddleware.cs  (150 lines - Monitoring)
└── Documentation/
    ├── CODEX_369_FRAMEWORK_GUIDE.md     (1,200+ lines)
    ├── CODEX_369_INTEGRATION_GUIDE.md   (350+ lines)
    ├── CODEX_369_CHAMPIONSHIP_SUMMARY.md (650+ lines)
    └── CODEX_369_PRODUCTION_INTEGRATION_GUIDE.md (THIS FILE)
```

**Total Production Code**: 2,780+ lines
**Total Documentation**: 4,500+ lines
**Total Deliverable**: 7,280+ lines

---

## Complete Service Registration

### TerraFusion.API/Program.cs Configuration

Add all services in the following order to `Program.cs`:

```csharp
using TerraFusion.AI.Services;
using TerraFusion.AI.Hubs;
using TerraFusion.AI.HealthChecks;
using TerraFusion.AI.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ═══════════════════════════════════════════════════════════════
// CODEX 3-6-9 FRAMEWORK SERVICE REGISTRATION
// ═══════════════════════════════════════════════════════════════

// 1. Core Framework Service (Required)
builder.Services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>();

// 2. AI Agent Integration (Required for 1,008 agent monitoring)
builder.Services.AddScoped<ICodex369AgentIntegrationService, Codex369AgentIntegrationService>();

// 3. Alert Service (Required for automated notifications)
builder.Services.AddSingleton<ICodex369AlertService, Codex369AlertService>();

// 4. Trend Analysis Service (Required for historical tracking)
builder.Services.AddSingleton<ICodex369TrendAnalysisService, Codex369TrendAnalysisService>();

// 5. Metrics Collector for Middleware (Required)
builder.Services.AddSingleton<ICodex369MetricsCollector, Codex369MetricsCollector>();

// 6. Background Services (Required)
builder.Services.AddHostedService<Codex369BroadcastService>();           // SignalR broadcasting
builder.Services.AddHostedService<Codex369AlertMonitoringService>();     // Alert monitoring
builder.Services.AddHostedService<Codex369HistoricalRecordingService>(); // Historical recording

// 7. Health Checks (Required for production)
builder.Services.AddHealthChecks()
    .AddCheck<Codex369HealthCheck>("codex-369-framework")
    .AddCheck<Codex369ComprehensiveHealthCheck>("codex-369-comprehensive");

// 8. SignalR for Real-Time Updates (Required)
builder.Services.AddSignalR();

// ═══════════════════════════════════════════════════════════════

var app = builder.Build();

// ═══════════════════════════════════════════════════════════════
// CODEX 3-6-9 MIDDLEWARE AND HUB CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// 1. Monitoring Middleware (must be early in pipeline)
app.UseMiddleware<Codex369MonitoringMiddleware>();

// 2. Standard ASP.NET Core middleware
app.UseRouting();
app.UseAuthorization();

// 3. Map Controllers (includes Codex369Controller)
app.MapControllers();

// 4. Map SignalR Hub
app.MapHub<Codex369Hub>("/hubs/codex369");

// 5. Map Health Check Endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/codex369", new HealthCheckOptions
{
    Predicate = (check) => check.Name.Contains("codex-369")
});

// ═══════════════════════════════════════════════════════════════

app.Run();
```

### Service Lifetime Explanation

| Service | Lifetime | Reason |
|---------|----------|--------|
| `Codex369FrameworkService` | **Scoped** | Per-request calculations, uses DbContext |
| `Codex369AgentIntegrationService` | **Scoped** | Per-request AI agent queries |
| `Codex369AlertService` | **Singleton** | Shared alert state across all requests |
| `Codex369TrendAnalysisService` | **Singleton** | Shared historical data buffer (10,000 points) |
| `Codex369MetricsCollector` | **Singleton** | Shared metrics aggregation |
| Background Services | **Hosted** | Long-running background tasks |
| Health Checks | **Health Check** | ASP.NET Core managed lifetime |

---

## API Endpoints Catalog

### REST API Endpoints (Codex369Controller)

All endpoints are under `/api/codex369` and require `[Authorize]` attribute.

#### 1. POST /api/codex369/status

**Description**: Calculate complete Codex 3-6-9 Framework status with all 3 levels.

**Request Body**:
```json
{
  "countyId": "benton-county",
  "startTime": "2025-11-01T00:00:00Z",
  "endTime": "2025-11-01T23:59:59Z",
  "includeDetailedBreakdown": true,
  "includeRecommendations": true
}
```

**Response (200 OK)**:
```json
{
  "currentPowerScore": 11.87,
  "targetScore": 12.0,
  "balanceDeficit": 0.13,
  "complianceAligned": true,
  "foundationMetrics": [
    {
      "metricId": "fisma-compliance-score",
      "name": "FISMA Compliance Score",
      "rawValue": 98.5,
      "baselineThreshold": 95.0,
      "normalizedValue": 12.0,
      "withinBaseline": true,
      "category": "FISMA"
    }
    // ... 11 more foundation metrics
  ],
  "amplificationMetrics": [
    {
      "name": "FISMA & Security Amplification",
      "rawCombinedValue": 385.2,
      "scaledValue": 6.94,
      "safeFromImbalance": true,
      "safetyMargin": 280.8
    }
    // ... 4 more amplification groups
  ],
  "ultimatePower": {
    "ultimatePowerScore": 11.87,
    "balanceProximity": 0.989,
    "inDivineBalance": true,
    "healthStatus": "DivineBalance"
  },
  "systemRecommendations": [
    "✅ System in DIVINE BALANCE - maintain current operations"
  ],
  "statusTimestamp": "2025-11-01T12:00:00Z"
}
```

**Use Case**: Full framework calculation with detailed breakdown for dashboards.

---

#### 2. GET /api/codex369/realtime?countyId={countyId}

**Description**: Get real-time framework status (cached for 30 seconds).

**Query Parameters**:
- `countyId` (optional): Filter by county (e.g., "benton-county")

**Response (200 OK)**: Same as POST /status

**Use Case**: Live dashboard updates, monitoring displays.

---

#### 3. GET /api/codex369/foundation?countyId={countyId}

**Description**: Get only Foundation Level (3) metrics.

**Response (200 OK)**:
```json
[
  {
    "metricId": "fisma-compliance-score",
    "name": "FISMA Compliance Score",
    "rawValue": 98.5,
    "baselineThreshold": 95.0,
    "normalizedValue": 12.0,
    "withinBaseline": true,
    "category": "FISMA"
  },
  {
    "metricId": "api-response-time",
    "name": "API Response Time (ms)",
    "rawValue": 45.0,
    "baselineThreshold": 50.0,
    "normalizedValue": 10.8,
    "withinBaseline": true,
    "category": "Performance"
  }
  // ... 10 more metrics
]
```

**Use Case**: Detailed foundation metric analysis, compliance reporting.

---

#### 4. GET /api/codex369/amplification?countyId={countyId}

**Description**: Get Amplification Level (6) metrics with 666 safeguard validation.

**Response (200 OK)**:
```json
[
  {
    "name": "FISMA & Security Amplification",
    "description": "Combined FISMA compliance and security metrics",
    "foundationMetrics": ["fisma-compliance-score", "security-audit-pass-rate"],
    "rawCombinedValue": 385.2,
    "scaledValue": 6.94,
    "safeFromImbalance": true,
    "safetyMargin": 280.8,
    "thresholdWarning": null
  },
  {
    "name": "Data Integrity & AI Excellence",
    "foundationMetrics": ["data-accuracy", "ai-agent-success-rate"],
    "rawCombinedValue": 650.0,
    "scaledValue": 11.71,
    "safeFromImbalance": false,
    "safetyMargin": 16.0,
    "thresholdWarning": "🚨 APPROACHING 666 THRESHOLD - IMMEDIATE SCALING REQUIRED"
  }
]
```

**Use Case**: 666 safeguard monitoring, amplification group analysis.

---

#### 5. GET /api/codex369/ultimate-power?countyId={countyId}

**Description**: Get Ultimate Power Level (9) score only.

**Response (200 OK)**:
```json
{
  "ultimatePowerScore": 11.87,
  "targetScore": 12.0,
  "balanceProximity": 0.989,
  "inDivineBalance": true,
  "healthStatus": "DivineBalance",
  "detailedBreakdown": {
    "level3Foundation": 12.0,
    "level6Amplification": 11.74,
    "level9UltimatePower": 11.87
  },
  "achievementMessage": "🌟 DIVINE BALANCE ACHIEVED - All systems operating in perfect harmony"
}
```

**Use Case**: Executive dashboards, high-level health status.

---

#### 6. GET /api/codex369/validate-safeguard?value={value}

**Description**: Validate if a value is safe from the 666 threshold.

**Query Parameters**:
- `value` (required): Numeric value to validate (e.g., 450.5)

**Response (200 OK)**:
```json
{
  "value": 450.5,
  "isSafe": true,
  "safetyMargin": 215.5,
  "threshold": 666.0,
  "message": "✅ Safe: 215.50 points below 666 threshold"
}
```

**Response (200 OK - DANGER)**:
```json
{
  "value": 670.0,
  "isSafe": false,
  "safetyMargin": -4.0,
  "threshold": 666.0,
  "message": "🚨 DANGER: Value crosses 666 threshold by 4.00!"
}
```

**Use Case**: Pre-validation before metric amplification, safety checks.

---

#### 7. GET /api/codex369/health-summary

**Description**: Quick health summary for monitoring systems.

**Response (200 OK)**:
```json
{
  "currentPowerScore": 11.87,
  "targetScore": 12.0,
  "balanceProximity": 0.989,
  "inDivineBalance": true,
  "healthStatus": "DivineBalance",
  "totalFoundationMetrics": 12,
  "totalAmplifications": 5,
  "metricsWithinBaseline": 11,
  "safeAmplifications": 4,
  "complianceAligned": true,
  "topRecommendation": "✅ System in DIVINE BALANCE - maintain current operations",
  "lastUpdated": "2025-11-01T12:00:00Z"
}
```

**Use Case**: External monitoring systems, status pages, quick health checks.

---

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| **200 OK** | Success | All successful requests |
| **400 Bad Request** | Invalid request parameters | Missing required fields, invalid county ID |
| **401 Unauthorized** | Missing or invalid JWT token | All endpoints require authentication |
| **500 Internal Server Error** | Framework calculation failed | Service unavailable, database errors |

---

## SignalR Real-Time Integration

### Hub Connection (Backend - Codex369Hub)

**Hub URL**: `/hubs/codex369`

### SignalR Methods (Client → Server)

#### 1. SubscribeToFrameworkUpdates(countyId?)

Subscribe to real-time framework updates.

```typescript
// Frontend TypeScript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/codex369')
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .build();

await connection.start();

// Subscribe to all counties
await connection.invoke('SubscribeToFrameworkUpdates');

// Subscribe to specific county
await connection.invoke('SubscribeToFrameworkUpdates', 'benton-county');
```

**Returns**: Immediate framework status sent via `FrameworkStatusUpdate` event.

---

#### 2. UnsubscribeFromFrameworkUpdates(countyId?)

Unsubscribe from framework updates.

```typescript
await connection.invoke('UnsubscribeFromFrameworkUpdates', 'benton-county');
```

---

#### 3. GetCurrentStatus(countyId?)

Get framework status on demand.

```typescript
const status = await connection.invoke('GetCurrentStatus', 'benton-county');
console.log('Current Power Score:', status.currentPowerScore);
```

**Returns**: `Codex369StatusDto` object.

---

#### 4. GetFoundationMetrics(countyId?)

Get foundation metrics only.

```typescript
const metrics = await connection.invoke('GetFoundationMetrics');
```

**Returns**: `List<FoundationMetric>`.

---

#### 5. GetAmplificationMetrics(countyId?)

Get amplification metrics with 666 safeguard check.

```typescript
const amplifications = await connection.invoke('GetAmplificationMetrics');

// Check for 666 warnings
const unsafe = amplifications.filter(a => !a.safeFromImbalance);
if (unsafe.length > 0) {
  console.error('⚠️ 666 SAFEGUARD WARNING:', unsafe);
}
```

**Returns**: `List<AmplificationMetric>`.

---

#### 6. GetUltimatePower(countyId?)

Get ultimate power score.

```typescript
const ultimatePower = await connection.invoke('GetUltimatePower');

if (ultimatePower.inDivineBalance) {
  console.log('🌟 DIVINE BALANCE ACHIEVED:', ultimatePower.ultimatePowerScore);
}
```

**Returns**: `UltimatePowerMetric`.

---

#### 7. RequestBalanceRecalculation(countyId?)

Manually trigger balance recalculation and broadcast.

```typescript
await connection.invoke('RequestBalanceRecalculation', 'benton-county');
// Will broadcast updated status to all subscribers
```

---

### SignalR Events (Server → Client)

#### 1. FrameworkStatusUpdate

Broadcast every 30 seconds with complete framework status.

```typescript
connection.on('FrameworkStatusUpdate', (status: Codex369StatusDto) => {
  console.log('Framework Updated:', status.currentPowerScore);

  // Update dashboard UI
  updateDashboard(status);
});
```

**Payload**: Complete `Codex369StatusDto` object.

---

#### 2. DivineBalanceAchieved

Triggered when divine balance is achieved (score 11.5-12.0).

```typescript
connection.on('DivineBalanceAchieved', (notification) => {
  console.log('🌟', notification.Message);
  console.log('Score:', notification.Score);
  console.log('Proximity:', notification.Proximity);

  // Show celebration UI
  showDivineBalanceAlert(notification);
});
```

**Payload**:
```json
{
  "Score": 11.87,
  "Proximity": 0.989,
  "Status": "DivineBalance",
  "Timestamp": "2025-11-01T12:00:00Z",
  "Message": "🌟 DIVINE BALANCE: 11.87/12 (98.9% proximity)"
}
```

---

#### 3. SafeguardWarning

Triggered when amplifications approach the 666 threshold.

```typescript
connection.on('SafeguardWarning', (warning) => {
  console.error('🚨 666 SAFEGUARD WARNING');
  console.error('Unsafe Count:', warning.UnsafeCount);
  console.error('Amplifications:', warning.Amplifications);

  // Show critical alert
  showSafeguardAlert(warning);
});
```

**Payload**:
```json
{
  "UnsafeCount": 2,
  "Amplifications": [
    {
      "Name": "Data Integrity & AI Excellence",
      "RawCombinedValue": 650.0,
      "SafetyMargin": 16.0
    }
  ],
  "Timestamp": "2025-11-01T12:00:00Z",
  "Message": "⚠️ WARNING: 2 amplifications approaching 666 threshold!"
}
```

---

#### 4. HealthSummaryUpdate

Broadcast every 30 seconds with quick health summary.

```typescript
connection.on('HealthSummaryUpdate', (summary) => {
  console.log('Health Update:', summary.HealthStatus);

  // Update health badge
  updateHealthBadge(summary);
});
```

**Payload**:
```json
{
  "CurrentPowerScore": 11.87,
  "TargetScore": 12.0,
  "BalanceProximity": 0.989,
  "InDivineBalance": true,
  "HealthStatus": "DivineBalance",
  "TotalMetrics": 12,
  "TotalAmplifications": 5,
  "ComplianceAligned": true,
  "Timestamp": "2025-11-01T12:00:00Z"
}
```

---

### Complete Frontend Integration Example

```typescript
// React hook for Codex 3-6-9 real-time updates
import { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

export function useCodex369RealTime(countyId?: string) {
  const [status, setStatus] = useState<Codex369StatusDto | null>(null);
  const [divineBalance, setDivineBalance] = useState(false);
  const [safeguardWarnings, setSafeguardWarnings] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/codex369')
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connection.on('FrameworkStatusUpdate', (newStatus) => {
      setStatus(newStatus);
      setDivineBalance(newStatus.ultimatePower.inDivineBalance);
    });

    connection.on('DivineBalanceAchieved', (notification) => {
      console.log('🌟 DIVINE BALANCE!', notification);
      // Trigger celebration animation
    });

    connection.on('SafeguardWarning', (warning) => {
      setSafeguardWarnings((prev) => [...prev, warning]);
      // Trigger critical alert
    });

    connection.start()
      .then(async () => {
        setConnected(true);
        await connection.invoke('SubscribeToFrameworkUpdates', countyId);
      })
      .catch((err) => console.error('SignalR connection error:', err));

    return () => {
      connection.stop();
    };
  }, [countyId]);

  return { status, divineBalance, safeguardWarnings, connected };
}

// Usage in component
function Codex369Dashboard() {
  const { status, divineBalance, safeguardWarnings, connected } =
    useCodex369RealTime('benton-county');

  if (!connected) return <div>Connecting to Codex 3-6-9...</div>;
  if (!status) return <div>Loading framework status...</div>;

  return (
    <div>
      <h1>Codex 3-6-9 Framework</h1>
      <div className={divineBalance ? 'divine-balance' : 'needs-optimization'}>
        <p>Ultimate Power: {status.currentPowerScore.toFixed(2)} / 12</p>
        <p>Status: {status.ultimatePower.healthStatus}</p>
        {divineBalance && <p>🌟 DIVINE BALANCE ACHIEVED!</p>}
      </div>

      {safeguardWarnings.length > 0 && (
        <div className="critical-alerts">
          <h2>🚨 666 Safeguard Warnings</h2>
          {safeguardWarnings.map((w, i) => (
            <div key={i}>{w.Message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Health Check Configuration

### Health Check Endpoints

1. **Standard Health Check**: `/health`
   Returns overall application health including Codex 3-6-9.

2. **Codex 3-6-9 Specific**: `/health/codex369`
   Returns only Codex 3-6-9 framework health.

### Health Check Levels

#### 1. Codex369HealthCheck (Basic)

Checks framework status only.

**Health Criteria**:
- **Healthy**: Score ≥ 10.0/12
- **Degraded**: Score 7.0-10.0/12
- **Unhealthy**: Score < 7.0/12
- **Divine Balance**: Score 11.5-12.0/12

**Response (200 OK - Healthy)**:
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

**Response (200 OK - Degraded)**:
```json
{
  "status": "Degraded",
  "results": {
    "codex-369-framework": {
      "status": "Degraded",
      "description": "⚠️ Needs attention: 8.50/12 - Optimization recommended",
      "data": {
        "currentPowerScore": 8.50,
        "balanceProximity": 0.708,
        "healthStatus": "NeedsAttention"
      }
    }
  }
}
```

**Response (503 Service Unavailable - Unhealthy)**:
```json
{
  "status": "Unhealthy",
  "results": {
    "codex-369-framework": {
      "status": "Unhealthy",
      "description": "🚨 CRITICAL: 5.20/12 - Immediate intervention required",
      "data": {
        "currentPowerScore": 5.20,
        "balanceProximity": 0.433,
        "healthStatus": "Critical"
      }
    }
  }
}
```

---

#### 2. Codex369ComprehensiveHealthCheck (Advanced)

Checks framework + AI agent swarm (1,008 agents).

**Additional Checks**:
- Agent swarm balance
- Agents in divine balance count
- Agents needing attention count

**Response (200 OK - Comprehensive)**:
```json
{
  "status": "Healthy",
  "results": {
    "codex-369-comprehensive": {
      "status": "Healthy",
      "description": "🌟 DIVINE BALANCE - Framework: 11.87/12, AI Swarm: 952/1008 agents optimal",
      "data": {
        "frameworkScore": 11.87,
        "agentsInDivineBalance": 952,
        "agentsNeedingAttention": 12,
        "totalAgents": 1008,
        "swarmHealthPercentage": 0.944
      }
    }
  }
}
```

---

### Kubernetes Health Check Integration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: terrafusion-api
spec:
  containers:
  - name: api
    image: terrafusion/api:latest
    ports:
    - containerPort: 5000
    livenessProbe:
      httpGet:
        path: /health/codex369
        port: 5000
      initialDelaySeconds: 30
      periodSeconds: 30
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/codex369
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
```

---

## Middleware Integration

### Codex369MonitoringMiddleware

Automatically collects metrics from all HTTP requests/responses.

**Metrics Collected**:
- Request path
- Response time (milliseconds)
- Success rate (HTTP status < 400)
- Throughput (requests per second)

**Configuration** (already in Program.cs):
```csharp
// Early in middleware pipeline (after app.UseRouting())
app.UseMiddleware<Codex369MonitoringMiddleware>();
```

**Feeds Into**:
- Foundation metric: `api-response-time`
- Foundation metric: `api-throughput`
- Foundation metric: `api-success-rate`

**Example Flow**:
```
1. Client makes request: POST /api/properties
2. Middleware intercepts, starts stopwatch
3. Request continues to controller
4. Response generated
5. Middleware captures: 45ms response time, HTTP 200
6. Metric recorded: RequestMetric { Path: "/api/properties", DurationMs: 45, Success: true }
7. Codex369MetricsCollector aggregates metrics
8. Next framework calculation includes updated metrics
```

**Automatic Integration**: No additional code required - middleware automatically feeds metrics into the 3-6-9 framework.

---

## Alert System Setup

### Alert Severity Levels

| Severity | Icon | Description | Use Case |
|----------|------|-------------|----------|
| **Info** | ℹ️ | Informational messages | General status updates |
| **Success** | ✅ | Positive achievements | Divine balance achieved |
| **Warning** | ⚠️ | Attention needed | Degraded performance, compliance issues |
| **Critical** | 🚨 | Immediate action required | 666 safeguard violations, critical deficits |

### Automated Alert Conditions

The `Codex369AlertMonitoringService` checks every **60 seconds** for:

#### 1. Divine Balance Achievement (Success)

**Condition**: `status.UltimatePower.InDivineBalance == true` (score 11.5-12.0)

**Alert Example**:
```json
{
  "alertId": "alert-12345",
  "severity": "Success",
  "title": "🌟 DIVINE BALANCE ACHIEVED",
  "message": "Codex 3-6-9 Framework has achieved divine balance! Ultimate Power: 11.87/12 (Proximity: 98.9%)",
  "currentScore": 11.87,
  "targetScore": 12.0,
  "metadata": {
    "healthStatus": "DivineBalance",
    "balanceProximity": 0.989,
    "complianceAligned": true
  },
  "timestamp": "2025-11-01T12:00:00Z",
  "acknowledged": false
}
```

**Throttling**: Only alerts once every 30 minutes to prevent spam.

---

#### 2. 666 Safeguard Warning (Critical)

**Condition**: Any `AmplificationMetric.SafeFromImbalance == false` (raw value approaching 666)

**Alert Example**:
```json
{
  "alertId": "alert-12346",
  "severity": "Critical",
  "title": "🚨 666 SAFEGUARD WARNING: Data Integrity & AI Excellence",
  "message": "Amplification 'Data Integrity & AI Excellence' approaching 666 threshold! Raw value: 650.00, Safety margin: 16.00",
  "currentScore": 650.0,
  "targetScore": 666.0,
  "metadata": {
    "amplificationName": "Data Integrity & AI Excellence",
    "rawCombinedValue": 650.0,
    "safetyMargin": 16.0,
    "scaledValue": 11.71
  },
  "timestamp": "2025-11-01T12:00:00Z",
  "acknowledged": false
}
```

**Throttling**: Only alerts once every 15 minutes per amplification group.

---

#### 3. Critical Balance Deficit (Critical)

**Condition**: `status.CurrentPowerScore < 7.0`

**Alert Example**:
```json
{
  "alertId": "alert-12347",
  "severity": "Critical",
  "title": "🚨 CRITICAL BALANCE DEFICIT",
  "message": "System balance critically low: 5.20/12 (Deficit: 6.80). IMMEDIATE ACTION REQUIRED!",
  "currentScore": 5.20,
  "targetScore": 12.0,
  "metadata": {
    "healthStatus": "Critical",
    "balanceDeficit": 6.80,
    "recommendations": ["Optimize foundation metrics", "Review amplification groups"]
  },
  "timestamp": "2025-11-01T12:00:00Z",
  "acknowledged": false
}
```

**Throttling**: Only alerts once every 30 minutes.

---

#### 4. Degraded Performance (Warning)

**Condition**: `7.0 <= status.CurrentPowerScore < 10.0`

**Alert Example**:
```json
{
  "alertId": "alert-12348",
  "severity": "Warning",
  "title": "⚠️ SYSTEM NEEDS ATTENTION",
  "message": "System performance degraded: 8.50/12. Optimization recommended to achieve divine balance.",
  "currentScore": 8.50,
  "targetScore": 12.0,
  "metadata": {
    "healthStatus": "NeedsAttention",
    "recommendations": [
      "Improve FISMA compliance score",
      "Optimize API response times",
      "Review data accuracy metrics"
    ]
  },
  "timestamp": "2025-11-01T12:00:00Z",
  "acknowledged": false
}
```

**Throttling**: Only alerts once every 30 minutes.

---

#### 5. Compliance Alignment Issue (Warning)

**Condition**: `status.ComplianceAligned == false`

**Alert Example**:
```json
{
  "alertId": "alert-12349",
  "severity": "Warning",
  "title": "⚠️ COMPLIANCE ALIGNMENT ISSUE",
  "message": "One or more compliance metrics are out of baseline. Review FISMA-HIGH compliance requirements.",
  "metadata": {
    "complianceAligned": false,
    "totalMetrics": 12
  },
  "timestamp": "2025-11-01T12:00:00Z",
  "acknowledged": false
}
```

**Throttling**: Only alerts once every 30 minutes.

---

### Custom Alert Handlers

Register custom alert handlers to dispatch alerts to external systems:

```csharp
// Custom handler example: Send to Slack
public class SlackAlertHandler : IAlertHandler
{
    private readonly HttpClient _httpClient;
    private readonly string _webhookUrl;

    public SlackAlertHandler(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _webhookUrl = configuration["Slack:WebhookUrl"];
    }

    public async Task HandleAlertAsync(Codex369Alert alert)
    {
        if (alert.Severity == AlertSeverity.Critical)
        {
            var payload = new
            {
                text = $"{alert.Title}\n{alert.Message}",
                username = "TerraFusion Codex 3-6-9",
                icon_emoji = ":rotating_light:"
            };

            await _httpClient.PostAsJsonAsync(_webhookUrl, payload);
        }
    }
}

// Registration in Program.cs
builder.Services.AddHttpClient<SlackAlertHandler>();
builder.Services.AddTransient<IAlertHandler, SlackAlertHandler>();

// Register with alert service (in startup or service configuration)
var alertService = app.Services.GetRequiredService<ICodex369AlertService>();
var slackHandler = app.Services.GetRequiredService<SlackAlertHandler>();
((Codex369AlertService)alertService).RegisterHandler(slackHandler);
```

---

### Alert API Usage

#### Get Active Alerts

```csharp
var alertService = serviceProvider.GetRequiredService<ICodex369AlertService>();

// Get all active alerts
var activeAlerts = await alertService.GetActiveAlertsAsync();

// Get only critical alerts
var criticalAlerts = await alertService.GetActiveAlertsAsync(AlertSeverity.Critical);

foreach (var alert in criticalAlerts)
{
    Console.WriteLine($"[{alert.Severity}] {alert.Title}: {alert.Message}");
}
```

#### Acknowledge Alert

```csharp
// Acknowledge alert by ID
await alertService.AcknowledgeAlertAsync("alert-12345");

// Acknowledged alerts are filtered out of GetActiveAlertsAsync()
```

#### Get Alert History

```csharp
// Get alerts from last 24 hours
var history = await alertService.GetAlertHistoryAsync(TimeSpan.FromHours(24));

// Analyze alert patterns
var criticalCount = history.Count(a => a.Severity == AlertSeverity.Critical);
Console.WriteLine($"Critical alerts in last 24h: {criticalCount}");
```

---

## Trend Analysis & Forecasting

### Historical Data Recording

The `Codex369HistoricalRecordingService` automatically records balance points every **5 minutes**.

**Data Retention**: Last 10,000 data points (approximately 34 days at 5-minute intervals).

**Recorded Metrics**:
```csharp
public class HistoricalBalancePoint
{
    public DateTime Timestamp { get; set; }
    public double UltimatePowerScore { get; set; }
    public double BalanceProximity { get; set; }
    public bool InDivineBalance { get; set; }
    public SystemHealthStatus HealthStatus { get; set; }
    public int TotalFoundationMetrics { get; set; }
    public int MetricsWithinBaseline { get; set; }
    public int SafeAmplifications { get; set; }
    public int TotalAmplifications { get; set; }
}
```

---

### Trend Analysis API

#### Analyze Trends

```csharp
var trendService = serviceProvider.GetRequiredService<ICodex369TrendAnalysisService>();

// Analyze trends over last 7 days
var trendAnalysis = await trendService.AnalyzeTrendsAsync(TimeSpan.FromDays(7));

Console.WriteLine($"Trend Direction: {trendAnalysis.TrendDirection}"); // Improving, Declining, Stable
Console.WriteLine($"Trend Slope: {trendAnalysis.TrendSlope:F4}"); // Rate of change per data point
Console.WriteLine($"Average Score: {trendAnalysis.AverageScore:F2}/12");
Console.WriteLine($"Min Score: {trendAnalysis.MinScore:F2}/12");
Console.WriteLine($"Max Score: {trendAnalysis.MaxScore:F2}/12");
Console.WriteLine($"Standard Deviation: {trendAnalysis.StandardDeviation:F2}");
Console.WriteLine($"Data Points: {trendAnalysis.DataPoints}");

// Insights generated automatically
foreach (var insight in trendAnalysis.Insights)
{
    Console.WriteLine($"  - {insight}");
}
```

**Example Insights**:
```
  - 🌟 Excellent: Average score of 11.87/12 indicates consistent divine balance
  - ➡️ Stable trend: Balance maintaining consistent level
  - 🎯 High stability: Low variance (0.32) indicates consistent performance
  - 🌟 Exceptional: Divine balance achieved 94.5% of the time
```

---

#### Forecast Future Balance

```csharp
// Forecast balance 24 hours ahead
var forecast = await trendService.ForecastBalanceAsync(TimeSpan.FromHours(24));

Console.WriteLine($"Forecast Time: {forecast.ForecastTime}");
Console.WriteLine($"Predicted Score: {forecast.PredictedScore:F2}/12");
Console.WriteLine($"Confidence Level: {forecast.ConfidenceLevel:P1}");
Console.WriteLine($"Prediction Interval: {forecast.LowerBound:F2} - {forecast.UpperBound:F2}");
Console.WriteLine($"Predicted Divine Balance: {forecast.PredictedDivineBalance}");

// Recommendations based on forecast
foreach (var rec in forecast.Recommendations)
{
    Console.WriteLine($"  - {rec}");
}
```

**Example Output**:
```
Forecast Time: 2025-11-02T12:00:00Z
Predicted Score: 11.92/12
Confidence Level: 87.3%
Prediction Interval: 11.30 - 12.00
Predicted Divine Balance: True

  - ✅ Forecast: Divine balance predicted - maintain current practices
  - ✅ Improving trend - continue current optimization strategies
```

---

#### Get Balance Statistics

```csharp
// Statistics over last 30 days
var stats = await trendService.GetStatisticsAsync(TimeSpan.FromDays(30));

Console.WriteLine($"Data Points: {stats.DataPoints}");
Console.WriteLine($"Average Score: {stats.AverageScore:F2}/12");
Console.WriteLine($"Median Score: {stats.MedianScore:F2}/12");
Console.WriteLine($"Min Score: {stats.MinScore:F2}/12");
Console.WriteLine($"Max Score: {stats.MaxScore:F2}/12");
Console.WriteLine($"Standard Deviation: {stats.StandardDeviation:F2}");
Console.WriteLine($"Time in Divine Balance: {stats.TimeInDivineBalance.TotalHours:F1} hours ({stats.PercentTimeInDivineBalance:P1})");
Console.WriteLine($"Time Above 10.0: {stats.TimeAbove10.TotalHours:F1} hours");
```

**Example Output**:
```
Data Points: 8,640
Average Score: 11.75/12
Median Score: 11.82/12
Min Score: 9.20/12
Max Score: 12.00/12
Standard Deviation: 0.45
Time in Divine Balance: 680.5 hours (94.5%)
Time Above 10.0: 710.2 hours (98.6%)
```

---

### Trend Analysis in Frontend

```typescript
// React component for trend visualization
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

function Codex369TrendChart() {
  const [trendData, setTrendData] = useState(null);

  useEffect(() => {
    fetch('/api/codex369-trends/analyze?window=7d')
      .then(res => res.json())
      .then(data => {
        setTrendData({
          labels: data.history.map(h => new Date(h.timestamp).toLocaleDateString()),
          datasets: [{
            label: 'Ultimate Power Score',
            data: data.history.map(h => h.ultimatePowerScore),
            borderColor: data.trendDirection === 'Improving' ? 'green' : 'orange',
            backgroundColor: 'rgba(0,255,0,0.1)',
            tension: 0.4
          }]
        });
      });
  }, []);

  if (!trendData) return <div>Loading trend analysis...</div>;

  return (
    <div>
      <h2>Codex 3-6-9 Trend Analysis (7 Days)</h2>
      <Line data={trendData} options={{
        scales: {
          y: { min: 0, max: 12, title: { display: true, text: 'Score / 12' } }
        }
      }} />
    </div>
  );
}
```

---

## AI Agent Swarm Integration

### Monitor 1,008 Agents Through 3-6-9 Lens

```csharp
var agentService = serviceProvider.GetRequiredService<ICodex369AgentIntegrationService>();

// Monitor entire swarm (1,008 agents)
var swarmBalance = await agentService.MonitorAgentSwarmBalanceAsync();

Console.WriteLine($"Total Agents: {swarmBalance.TotalAgents}");
Console.WriteLine($"Agents in Divine Balance: {swarmBalance.AgentsInDivineBalance}");
Console.WriteLine($"Agents Needing Attention: {swarmBalance.AgentsNeedingAttention}");
Console.WriteLine($"Average Health Score: {swarmBalance.AverageHealthScore:F2}/12");
Console.WriteLine($"Swarm Ultimate Power: {swarmBalance.SwarmUltimatePowerScore:F2}/12");
Console.WriteLine($"Swarm Divine Balance: {swarmBalance.SwarmInDivineBalance}");

// Bottom 10 performers
foreach (var agent in swarmBalance.AgentMetrics.Take(10))
{
    Console.WriteLine($"  {agent.AgentId}: {agent.HealthScore:F2}/12 (Response: {agent.ResponseTimeMs}ms, Throughput: {agent.ThroughputOpsPerSec} ops/s)");
}
```

---

### Individual Agent Analysis

```csharp
// Analyze specific agent contribution
var agentContribution = await agentService.GetAgentBalanceContributionAsync("agent-0042");

Console.WriteLine($"Agent: {agentContribution.AgentId}");
Console.WriteLine($"Health Score: {agentContribution.HealthScore:F2}/12");
Console.WriteLine($"Response Time: {agentContribution.ResponseTimeMs}ms");
Console.WriteLine($"Throughput: {agentContribution.ThroughputOpsPerSec} ops/s");
Console.WriteLine($"Tasks Completed: {agentContribution.TasksCompleted}");
Console.WriteLine($"Success Rate: {agentContribution.SuccessRate:P1}");
Console.WriteLine($"Contribution to Ultimate Power: {agentContribution.ContributionToUltimatePower:F6}");
Console.WriteLine($"Optimal: {agentContribution.IsOptimal}");

// Recommendations
foreach (var action in agentContribution.RecommendedActions)
{
    Console.WriteLine($"  - {action}");
}
```

**Example Output**:
```
Agent: agent-0042
Health Score: 9.20/12
Response Time: 28ms
Throughput: 25 ops/s
Tasks Completed: 750
Success Rate: 96.5%
Contribution to Ultimate Power: 0.009127
Optimal: False

  - Improve health score by 2.80 points to reach divine balance
  - Reduce response time from 28ms to <20ms
  - Increase throughput from 25 ops/sec to >30 ops/sec
```

---

### Automated Self-Healing Rebalancing

```csharp
// Automatically rebalance underperforming agents
var rebalanceResult = await agentService.AutoRebalanceAgentSwarmAsync();

Console.WriteLine($"Rebalance Success: {rebalanceResult.Success}");
Console.WriteLine($"Before Score: {rebalanceResult.BeforeUltimatePowerScore:F2}/12");
Console.WriteLine($"After Score: {rebalanceResult.AfterUltimatePowerScore:F2}/12");
Console.WriteLine($"Improvement: +{rebalanceResult.ImprovementScore:F2} points");
Console.WriteLine($"Agents Rebalanced: {rebalanceResult.AgentsRebalanced}");
Console.WriteLine($"Execution Time: {rebalanceResult.ExecutionTimeMs:F0}ms");
Console.WriteLine($"Divine Balance Achieved: {rebalanceResult.DivineBalanceAchieved}");

// Actions executed
foreach (var action in rebalanceResult.ActionsExecuted)
{
    Console.WriteLine($"  ✅ {action}");
}
```

**Example Output**:
```
Rebalance Success: True
Before Score: 10.85/12
After Score: 11.62/12
Improvement: +0.77 points
Agents Rebalanced: 45
Execution Time: 1,250ms
Divine Balance Achieved: True

  ✅ Restarted agent-0042
  ✅ Redistributed workload from agent-0042
  ✅ Restarted agent-0137
  ✅ Redistributed workload from agent-0137
  ... (45 agents total)
```

---

### Multi-County Distribution Optimization

```csharp
// Optimize agent distribution across 39 Washington State counties
var optimization = await agentService.OptimizeAgentDistributionForBalanceAsync();

Console.WriteLine($"Total Agents: {optimization.TotalAgents}");
Console.WriteLine($"Total Counties: {optimization.TotalCounties}");
Console.WriteLine($"Ideal Agents Per County: {optimization.IdealAgentsPerCounty}");
Console.WriteLine($"Counties Needing Rebalancing: {optimization.CountiesNeedingRebalancing}");
Console.WriteLine($"Estimated Improvement: +{optimization.EstimatedImprovementScore:F2} points");

// Top 5 counties needing attention
foreach (var county in optimization.CountyDistributions.Take(5))
{
    Console.WriteLine($"  {county.CountyId}: {county.CurrentAgents} agents (ideal: {county.IdealAgents}, deficit: {county.AgentDeficit}, score: {county.CountyUltimatePowerScore:F2}/12)");
}

// Optimization recommendations
foreach (var rec in optimization.OptimizationRecommendations)
{
    Console.WriteLine($"  - {rec}");
}
```

**Example Output**:
```
Total Agents: 1,008
Total Counties: 39
Ideal Agents Per County: 26
Counties Needing Rebalancing: 8
Estimated Improvement: +4.00 points

  county-05: 18 agents (ideal: 26, deficit: 8, score: 9.20/12)
  county-12: 21 agents (ideal: 26, deficit: 5, score: 10.15/12)
  county-28: 32 agents (ideal: 26, deficit: -6, score: 11.85/12)

  - Add 8 agents to county-05
  - Optimize county-05 operations (current score: 9.20/12)
  - Add 5 agents to county-12
  - Remove 6 agents from county-28
```

---

## Database Schema

The Codex 3-6-9 Framework does **not** require additional database tables. All data is:

- **In-memory**: Historical trend data (10,000 points buffer in `Codex369TrendAnalysisService`)
- **Real-time calculated**: Framework status computed on-demand from existing TerraFusion metrics
- **Ephemeral alerts**: Stored in-memory in `Codex369AlertService`

### Existing Tables Used

The framework reads from existing TerraFusion database tables:

- **Properties**: Property count, assessment data → `property-count` metric
- **AIAgents**: Agent performance → `ai-agent-success-rate` metric
- **AuditLogs**: Security audit data → `security-audit-pass-rate` metric
- **PerformanceMetrics**: API metrics → `api-response-time`, `api-throughput`, `api-success-rate`

**No migrations required** - framework works with existing schema.

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All 7 services registered in `Program.cs`
- [ ] SignalR hub mapped at `/hubs/codex369`
- [ ] Health check endpoints configured (`/health`, `/health/codex369`)
- [ ] Middleware added to pipeline (after `UseRouting()`)
- [ ] Background services registered (Broadcast, Alert, Recording)
- [ ] Environment variables configured (if any custom thresholds)
- [ ] Logging configured (Serilog recommended)
- [ ] Authentication enabled on `Codex369Controller` endpoints

### Docker Deployment

```dockerfile
# Dockerfile for TerraFusion.API with Codex 3-6-9
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TerraFusion.API/TerraFusion.API.csproj", "TerraFusion.API/"]
COPY ["TerraFusion.AI/TerraFusion.AI.csproj", "TerraFusion.AI/"]
COPY ["TerraFusion.Core/TerraFusion.Core.csproj", "TerraFusion.Core/"]
COPY ["TerraFusion.Data/TerraFusion.Data.csproj", "TerraFusion.Data/"]
RUN dotnet restore "TerraFusion.API/TerraFusion.API.csproj"
COPY . .
WORKDIR "/src/TerraFusion.API"
RUN dotnet build "TerraFusion.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TerraFusion.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TerraFusion.API.dll"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  terrafusion-api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=terrafusion;Username=admin;Password=secure123
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health/codex369"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: terrafusion
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure123
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: terrafusion-api
  template:
    metadata:
      labels:
        app: terrafusion-api
    spec:
      containers:
      - name: api
        image: terrafusion/api:latest
        ports:
        - containerPort: 5000
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: db-connection-string
        livenessProbe:
          httpGet:
            path: /health/codex369
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health/codex369
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-api-service
spec:
  selector:
    app: terrafusion-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### Environment Variables (Optional Customization)

```bash
# Custom thresholds (defaults shown)
CODEX369_FOUNDATION_MAX=12.0
CODEX369_AMPLIFICATION_SAFEGUARD=666.0
CODEX369_DIVINE_BALANCE_MIN=11.5
CODEX369_BROADCAST_INTERVAL_SECONDS=30
CODEX369_ALERT_CHECK_INTERVAL_SECONDS=60
CODEX369_RECORDING_INTERVAL_SECONDS=300
CODEX369_MAX_HISTORY_POINTS=10000

# Logging
SERILOG__MINIMUMLEVEL=Information
SERILOG__WRITETO__0__NAME=Console
SERILOG__WRITETO__1__NAME=File
SERILOG__WRITETO__1__ARGS__PATH=logs/codex369-.log
SERILOG__WRITETO__1__ARGS__ROLLINGINTERVAL=Day
```

---

## Performance Tuning

### SignalR Connection Scaling

For high-scale deployments (1,000+ concurrent users):

```csharp
// Program.cs - SignalR Azure SignalR Service
builder.Services.AddSignalR()
    .AddAzureSignalR(options =>
    {
        options.ConnectionString = builder.Configuration["Azure:SignalR:ConnectionString"];
        options.ServerStickyMode = ServerStickyMode.Required;
    });
```

### In-Memory Caching for Framework Status

```csharp
// Program.cs - Add distributed caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
    options.InstanceName = "TerraFusion:";
});

// Codex369FrameworkService.cs - Cache framework status
public async Task<Codex369StatusDto> GetRealtimeFrameworkStatusAsync(string? countyId = null)
{
    var cacheKey = $"codex369:status:{countyId ?? "global"}";
    var cached = await _cache.GetStringAsync(cacheKey);

    if (!string.IsNullOrEmpty(cached))
    {
        return JsonSerializer.Deserialize<Codex369StatusDto>(cached);
    }

    var status = await CalculateFrameworkStatusAsync(new Codex369CalculationRequest
    {
        CountyId = countyId,
        IncludeDetailedBreakdown = true
    });

    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(status), new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
    });

    return status;
}
```

### Background Service Interval Tuning

```csharp
// For high-frequency monitoring (every 10 seconds instead of 30)
public class Codex369BroadcastService : BackgroundService
{
    private const int UPDATE_INTERVAL_SECONDS = 10; // Faster updates
    // ...
}

// For lower load (every 2 minutes for alerts instead of 1 minute)
public class Codex369AlertMonitoringService : BackgroundService
{
    private const int CHECK_INTERVAL_SECONDS = 120; // Slower checks
    // ...
}
```

### Database Query Optimization

```csharp
// Use AsNoTracking() for read-only framework calculations
public async Task<List<FoundationMetric>> MeasureFoundationMetricsAsync(string? countyId = null)
{
    var properties = await _context.Properties
        .AsNoTracking() // No change tracking needed
        .Where(p => countyId == null || p.CountyId == countyId)
        .CountAsync();

    // ... rest of calculation
}
```

---

## Monitoring & Observability

### Prometheus Metrics Export

```csharp
// Program.cs - Add prometheus-net
using Prometheus;

var app = builder.Build();

// Expose /metrics endpoint
app.UseHttpMetrics(); // Request metrics
app.MapMetrics();     // /metrics endpoint

// Custom Codex 3-6-9 metrics
var codex369Score = Metrics.CreateGauge("codex369_ultimate_power_score", "Current Ultimate Power Score (0-12)");
var codex369DivineBalance = Metrics.CreateGauge("codex369_divine_balance", "1 if in divine balance, 0 otherwise");
var codex369SafeguardViolations = Metrics.CreateCounter("codex369_safeguard_violations_total", "Total 666 safeguard violations");

// Update metrics in background service
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var status = await _codexService.GetRealtimeFrameworkStatusAsync();

        codex369Score.Set(status.CurrentPowerScore);
        codex369DivineBalance.Set(status.UltimatePower.InDivineBalance ? 1 : 0);

        var violations = status.AmplificationMetrics.Count(a => !a.SafeFromImbalance);
        if (violations > 0)
        {
            codex369SafeguardViolations.Inc(violations);
        }

        await Task.Delay(TimeSpan.FromSeconds(UPDATE_INTERVAL_SECONDS), stoppingToken);
    }
}
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Codex 3-6-9 Framework",
    "panels": [
      {
        "title": "Ultimate Power Score",
        "targets": [
          {
            "expr": "codex369_ultimate_power_score",
            "legendFormat": "Score / 12"
          }
        ],
        "type": "graph",
        "yaxes": [
          { "min": 0, "max": 12 }
        ]
      },
      {
        "title": "Divine Balance Status",
        "targets": [
          {
            "expr": "codex369_divine_balance",
            "legendFormat": "Divine Balance"
          }
        ],
        "type": "stat",
        "thresholds": [
          { "value": 0, "color": "red" },
          { "value": 1, "color": "green" }
        ]
      },
      {
        "title": "666 Safeguard Violations",
        "targets": [
          {
            "expr": "rate(codex369_safeguard_violations_total[5m])",
            "legendFormat": "Violations / 5min"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### Structured Logging with Serilog

```csharp
// appsettings.json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "TerraFusion.AI.Services.Codex369FrameworkService": "Debug",
        "TerraFusion.AI.Hubs.Codex369Hub": "Information"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": {
          "path": "logs/codex369-.log",
          "rollingInterval": "Day",
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"]
  }
}
```

### Application Insights Integration

```csharp
// Program.cs - Add Application Insights
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
});

// Track custom events
public async Task<Codex369StatusDto> CalculateFrameworkStatusAsync(Codex369CalculationRequest request)
{
    var stopwatch = Stopwatch.StartNew();

    var status = await PerformCalculation(request);

    stopwatch.Stop();

    _telemetryClient.TrackEvent("Codex369FrameworkCalculation", new Dictionary<string, string>
    {
        { "CountyId", request.CountyId ?? "global" },
        { "Score", status.CurrentPowerScore.ToString("F2") },
        { "DivineBalance", status.UltimatePower.InDivineBalance.ToString() },
        { "CalculationTimeMs", stopwatch.ElapsedMilliseconds.ToString() }
    });

    return status;
}
```

---

## Troubleshooting

### Common Issues

#### 1. SignalR Hub Not Connecting

**Symptoms**: Frontend can't connect to `/hubs/codex369`

**Diagnosis**:
```bash
# Check if hub is mapped
curl http://localhost:5000/hubs/codex369
# Should return 404 (normal - hub requires WebSocket upgrade)

# Check SignalR negotiate endpoint
curl http://localhost:5000/hubs/codex369/negotiate
# Should return JSON with connection token
```

**Solutions**:
- Verify `app.MapHub<Codex369Hub>("/hubs/codex369");` in `Program.cs`
- Check CORS configuration allows WebSocket connections
- Ensure `app.UseWebSockets();` is called before `MapHub`

---

#### 2. Health Check Returns Unhealthy

**Symptoms**: `/health/codex369` returns 503 Service Unavailable

**Diagnosis**:
```bash
curl http://localhost:5000/health/codex369
# Check response for specific failure reason
```

**Common Causes**:
- Database connection failure → Check `TerraFusionDbContext` registration
- Framework calculation exception → Check logs for errors
- Missing service dependencies → Verify all 7 services registered

**Solution**:
```csharp
// Add detailed health check logging
builder.Services.AddHealthChecks()
    .AddCheck<Codex369HealthCheck>("codex-369-framework", tags: new[] { "ready" });

// Check logs for specific error
_logger.LogError(ex, "Health check failed: {Error}", ex.Message);
```

---

#### 3. 666 Safeguard False Positives

**Symptoms**: Alerts trigger for amplifications below 666

**Diagnosis**:
```csharp
// Check raw combined value calculation
var amplification = status.AmplificationMetrics.First();
Console.WriteLine($"Raw: {amplification.RawCombinedValue}, Threshold: 666, Safe: {amplification.SafeFromImbalance}");
```

**Common Cause**: Foundation metrics not normalized correctly

**Solution**:
```csharp
// Verify baseline thresholds are set correctly
public async Task<List<FoundationMetric>> MeasureFoundationMetricsAsync(string? countyId = null)
{
    var metrics = new List<FoundationMetric>
    {
        new FoundationMetric
        {
            MetricId = "fisma-compliance-score",
            Name = "FISMA Compliance Score",
            RawValue = fismaScore,
            BaselineThreshold = 95.0, // CRITICAL: Must be realistic baseline
            NormalizedValue = Math.Min(12.0, (fismaScore / 95.0) * 12.0)
        }
    };
    // ...
}
```

---

#### 4. Trend Analysis Shows "Insufficient Data"

**Symptoms**: `AnalyzeTrendsAsync()` returns "Unknown" trend direction

**Diagnosis**:
```csharp
var historicalData = await trendService.GetHistoricalDataAsync(TimeSpan.FromDays(7));
Console.WriteLine($"Data Points: {historicalData.Count}");
```

**Common Cause**: Background recording service not running or insufficient time elapsed

**Solution**:
- Verify `Codex369HistoricalRecordingService` is registered as hosted service
- Wait 5 minutes for first data point
- Check logs for recording service errors:
```bash
grep "Codex 3-6-9 Historical Recording Service" logs/codex369-*.log
```

---

#### 5. High Memory Usage from Historical Data

**Symptoms**: Memory grows over time, eventually causing OutOfMemoryException

**Diagnosis**:
```csharp
// Check history buffer size
var trendService = serviceProvider.GetRequiredService<ICodex369TrendAnalysisService>();
var history = await trendService.GetHistoricalDataAsync(TimeSpan.FromDays(365));
Console.WriteLine($"Total Points: {history.Count}"); // Should be capped at 10,000
```

**Common Cause**: `MAX_HISTORY_POINTS` constant modified or buffer not trimmed

**Solution**: Verify buffer trimming in `RecordBalancePointAsync()`:
```csharp
lock (_lock)
{
    _history.Add(point);

    // CRITICAL: Must trim buffer
    if (_history.Count > MAX_HISTORY_POINTS)
    {
        _history.RemoveRange(0, _history.Count - MAX_HISTORY_POINTS);
    }
}
```

---

#### 6. Alert Spam (Too Many Notifications)

**Symptoms**: Hundreds of duplicate alerts for same condition

**Diagnosis**:
```csharp
var alerts = await alertService.GetAlertHistoryAsync(TimeSpan.FromHours(1));
Console.WriteLine($"Alerts in last hour: {alerts.Count}");
```

**Common Cause**: Alert throttling not working correctly

**Solution**: Verify throttling logic in `CheckAndCreateAlertsAsync()`:
```csharp
// Check for recent alerts before creating new one
var recentDivineAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(30)))
    .Any(a => a.Title.Contains("DIVINE BALANCE") && a.Severity == AlertSeverity.Success);

if (!recentDivineAlert) // Only create if none in last 30 minutes
{
    await CreateAlertAsync(new Codex369Alert { /* ... */ });
}
```

---

### Debugging Tips

#### Enable Verbose Logging

```json
// appsettings.Development.json
{
  "Serilog": {
    "MinimumLevel": {
      "Override": {
        "TerraFusion.AI.Services": "Debug",
        "TerraFusion.AI.Hubs": "Debug",
        "TerraFusion.AI.HealthChecks": "Debug",
        "TerraFusion.AI.Middleware": "Debug"
      }
    }
  }
}
```

#### Test Framework Calculation Manually

```csharp
// Create test endpoint for debugging
[HttpGet("debug/calculate")]
[AllowAnonymous] // For testing only - remove in production
public async Task<IActionResult> DebugCalculate()
{
    var request = new Codex369CalculationRequest
    {
        CountyId = "benton-county",
        StartTime = DateTime.UtcNow.AddHours(-1),
        EndTime = DateTime.UtcNow,
        IncludeDetailedBreakdown = true,
        IncludeRecommendations = true
    };

    var status = await _codexService.CalculateFrameworkStatusAsync(request);

    return Ok(new
    {
        status,
        debugInfo = new
        {
            foundationCount = status.FoundationMetrics.Count,
            amplificationCount = status.AmplificationMetrics.Count,
            unsafeAmplifications = status.AmplificationMetrics.Count(a => !a.SafeFromImbalance),
            calculationTimestamp = DateTime.UtcNow
        }
    });
}
```

#### Monitor Background Services

```csharp
// Add health check for background services
public class BackgroundServicesHealthCheck : IHealthCheck
{
    private readonly IHostApplicationLifetime _lifetime;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct)
    {
        if (_lifetime.ApplicationStopping.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Application is shutting down");
        }

        // Check if background services are responsive
        // (Implementation depends on your monitoring strategy)
        return HealthCheckResult.Healthy("Background services operational");
    }
}
```

---

## Production Checklist

### Pre-Launch Verification

- [ ] **Service Registration**
  - [ ] All 7 core services registered in `Program.cs`
  - [ ] 3 background services registered as hosted services
  - [ ] Health checks registered for both standard and comprehensive
  - [ ] SignalR configured with `AddSignalR()`

- [ ] **Middleware & Routing**
  - [ ] `Codex369MonitoringMiddleware` added to pipeline
  - [ ] SignalR hub mapped at `/hubs/codex369`
  - [ ] Health check endpoints mapped
  - [ ] CORS configured for SignalR WebSocket connections

- [ ] **Security**
  - [ ] `[Authorize]` attribute on `Codex369Controller`
  - [ ] JWT authentication configured
  - [ ] API rate limiting configured (if applicable)
  - [ ] HTTPS enforced in production

- [ ] **Performance**
  - [ ] Distributed caching configured (Redis/Azure Cache)
  - [ ] SignalR scale-out configured (Azure SignalR Service for >1000 users)
  - [ ] Database connection pooling enabled
  - [ ] Background service intervals tuned for load

- [ ] **Monitoring**
  - [ ] Prometheus metrics endpoint exposed (`/metrics`)
  - [ ] Grafana dashboard configured
  - [ ] Application Insights (or equivalent) configured
  - [ ] Structured logging configured (Serilog)
  - [ ] Alert handlers registered (email, Slack, PagerDuty)

- [ ] **Testing**
  - [ ] Integration tests pass for all API endpoints
  - [ ] SignalR hub connection tested
  - [ ] Health checks return expected status codes
  - [ ] Alert throttling verified (no spam)
  - [ ] Trend analysis tested with mock historical data
  - [ ] 666 safeguard validation tested with edge cases

- [ ] **Documentation**
  - [ ] API documentation updated (Swagger/OpenAPI)
  - [ ] Frontend integration guide provided to UI team
  - [ ] Runbook created for operations team
  - [ ] Disaster recovery plan documented

### Post-Launch Monitoring (First 24 Hours)

- [ ] **Hour 1**
  - [ ] Health check endpoint responding successfully
  - [ ] SignalR connections established from frontend
  - [ ] First framework calculation completed
  - [ ] Background services started successfully

- [ ] **Hour 6**
  - [ ] Historical data recording service has 72+ data points
  - [ ] No 666 safeguard violations detected (or expected violations alerted)
  - [ ] Alert service has created at least 1 alert
  - [ ] Trend analysis returns valid data

- [ ] **Hour 24**
  - [ ] Divine balance achieved at least once (or expected deficit documented)
  - [ ] No memory leaks detected (historical buffer capped at 10,000 points)
  - [ ] Average framework calculation time < 500ms
  - [ ] SignalR broadcast service healthy (no disconnections)

---

## Summary

The **Codex 3-6-9 Framework** provides:

✅ **Complete Divine Balance System**
- 3 levels: Foundation (12 metrics) → Amplification (5 groups) → Ultimate Power (1 score)
- Target score: 12/12 representing perfect harmony
- 666 safeguard: Prevents amplification imbalance

✅ **Production-Ready Services**
- REST API (7 endpoints)
- SignalR real-time broadcasting (4 events)
- Health checks (2 levels)
- Monitoring middleware
- Alert system (4 severity levels)
- Trend analysis & forecasting
- AI agent swarm integration (1,008 agents)

✅ **Comprehensive Monitoring**
- Prometheus metrics export
- Grafana dashboards
- Application Insights integration
- Structured logging (Serilog)
- Health check endpoints

✅ **Enterprise Scalability**
- Distributed caching (Redis)
- SignalR scale-out (Azure SignalR Service)
- Kubernetes-ready deployment
- Docker containerization
- Database query optimization

**Total Deliverable**: 7,280+ lines of production code and documentation ready for government operations.

---

**THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.**

🌟 **Divine Balance Achieved** 🌟

---

*Last Updated: November 2025*
*Classification: Government Operating System - Production Integration Guide*
*Version: Codex 3-6-9 Framework 1.0*
