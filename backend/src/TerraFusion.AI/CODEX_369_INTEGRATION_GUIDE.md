# CODEX 3-6-9 FRAMEWORK - Integration Guide for Program.cs

## Service Registration for TerraFusion.API or TerraFusion.AI

Add these registrations to `Program.cs`:

```csharp
// ═══════════════════════════════════════════════════════════════
// CODEX 3-6-9 FRAMEWORK SERVICES
// ═══════════════════════════════════════════════════════════════

// Core Codex 3-6-9 Framework Service
builder.Services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>();

// AI Agent Integration with Codex 369
builder.Services.AddScoped<ICodex369AgentIntegrationService, Codex369AgentIntegrationService>();

// Background broadcast service for real-time updates
builder.Services.AddHostedService<Codex369BroadcastService>();

// SignalR for real-time Codex 3-6-9 updates
builder.Services.AddSignalR();

// Health check integration
builder.Services.AddHealthChecks()
    .AddCheck<Codex369HealthCheck>("codex-369-framework");

// ═══════════════════════════════════════════════════════════════
```

## SignalR Hub Mapping

Add after `app.MapControllers()`:

```csharp
// Map Codex 3-6-9 SignalR Hub
app.MapHub<Codex369Hub>("/hubs/codex369");
```

## Health Check Endpoint

```csharp
app.MapHealthChecks("/health/codex369", new HealthCheckOptions
{
    Predicate = check => check.Name == "codex-369-framework",
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";

        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            })
        });

        await context.Response.WriteAsync(result);
    }
});
```

## Logging Configuration

Add to appsettings.json:

```json
{
  "Logging": {
    "LogLevel": {
      "TerraFusion.AI.Services.Codex369FrameworkService": "Information",
      "TerraFusion.AI.Services.Codex369AgentIntegrationService": "Information",
      "TerraFusion.AI.Hubs.Codex369Hub": "Information",
      "TerraFusion.AI.Hubs.Codex369BroadcastService": "Information"
    }
  }
}
```

## API Endpoints Available

Once integrated, these endpoints will be available:

### Codex 3-6-9 Framework Endpoints

```
POST   /api/codex369/status              - Get complete framework status
GET    /api/codex369/realtime             - Real-time dashboard data
GET    /api/codex369/foundation           - Foundation metrics only
GET    /api/codex369/amplification        - Amplification metrics
GET    /api/codex369/ultimate-power       - Ultimate power score
GET    /api/codex369/validate-safeguard   - Validate against 666
GET    /api/codex369/health-summary       - Quick health summary
```

### SignalR Hub Endpoints

```
WS     /hubs/codex369                     - Real-time WebSocket connection
```

#### Hub Methods (Client → Server)

```typescript
// Subscribe to updates
connection.invoke("SubscribeToFrameworkUpdates", countyId);

// Get current status
const status = await connection.invoke("GetCurrentStatus", countyId);

// Request manual recalculation
connection.invoke("RequestBalanceRecalculation", countyId);
```

#### Hub Events (Server → Client)

```typescript
// Framework status update (every 30 seconds)
connection.on("FrameworkStatusUpdate", (status) => {
    console.log("Ultimate Power:", status.currentPowerScore);
});

// Divine balance achieved
connection.on("DivineBalanceAchieved", (data) => {
    console.log("🌟 DIVINE BALANCE:", data.score);
});

// 666 safeguard warning
connection.on("SafeguardWarning", (data) => {
    console.warn("⚠️ WARNING:", data.message);
});

// Health summary update
connection.on("HealthSummaryUpdate", (summary) => {
    console.log("Health Status:", summary.healthStatus);
});
```

## Usage Examples

### Example 1: Get Real-Time Status

```csharp
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ICodex369FrameworkService _codexService;

    public DashboardController(ICodex369FrameworkService codexService)
    {
        _codexService = codexService;
    }

    [HttpGet("divine-balance")]
    public async Task<ActionResult> GetDivineBalanceStatus()
    {
        var status = await _codexService.GetRealtimeFrameworkStatusAsync();

        return Ok(new
        {
            ultimatePower = status.CurrentPowerScore,
            target = 12.0,
            proximity = status.UltimatePower.BalanceProximity,
            divineBalance = status.UltimatePower.InDivineBalance,
            healthStatus = status.UltimatePower.HealthStatus,
            recommendations = status.SystemRecommendations
        });
    }
}
```

### Example 2: Monitor AI Agents

```csharp
[ApiController]
[Route("api/[controller]")]
public class AgentMonitoringController : ControllerBase
{
    private readonly ICodex369AgentIntegrationService _agentIntegration;

    public AgentMonitoringController(ICodex369AgentIntegrationService agentIntegration)
    {
        _agentIntegration = agentIntegration;
    }

    [HttpGet("swarm-balance")]
    public async Task<ActionResult> GetSwarmBalance()
    {
        var balance = await _agentIntegration.MonitorAgentSwarmBalanceAsync();

        return Ok(new
        {
            totalAgents = balance.TotalAgents,
            agentsInDivineBalance = balance.AgentsInDivineBalance,
            swarmScore = balance.SwarmUltimatePowerScore,
            inBalance = balance.SwarmInDivineBalance
        });
    }

    [HttpPost("auto-rebalance")]
    public async Task<ActionResult> AutoRebalance()
    {
        var result = await _agentIntegration.AutoRebalanceAgentSwarmAsync();

        return Ok(new
        {
            success = result.Success,
            improvement = result.ImprovementScore,
            divineBalanceAchieved = result.DivineBalanceAchieved,
            actionsExecuted = result.ActionsExecuted
        });
    }
}
```

### Example 3: Frontend SignalR Integration (TypeScript)

```typescript
import * as signalR from '@microsoft/signalr';

// Create connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/codex369')
    .withAutomaticReconnect()
    .build();

// Subscribe to events
connection.on('FrameworkStatusUpdate', (status) => {
    updateDashboard(status);
});

connection.on('DivineBalanceAchieved', (data) => {
    showNotification(`🌟 DIVINE BALANCE: ${data.score}/12`);
});

connection.on('SafeguardWarning', (warning) => {
    showAlert(`⚠️ ${warning.message}`);
});

// Start connection
await connection.start();

// Subscribe to updates for specific county
await connection.invoke('SubscribeToFrameworkUpdates', 'benton');

// Get current status
const status = await connection.invoke('GetCurrentStatus', 'benton');
console.log('Ultimate Power:', status.currentPowerScore);
```

## Health Check Implementation

```csharp
public class Codex369HealthCheck : IHealthCheck
{
    private readonly ICodex369FrameworkService _codexService;

    public Codex369HealthCheck(ICodex369FrameworkService codexService)
    {
        _codexService = codexService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync();

            var data = new Dictionary<string, object>
            {
                { "ultimatePowerScore", status.CurrentPowerScore },
                { "divineBalance", status.UltimatePower.InDivineBalance },
                { "healthStatus", status.UltimatePower.HealthStatus.ToString() },
                { "totalMetrics", status.TotalFoundationMetrics },
                { "totalAmplifications", status.TotalAmplifications }
            };

            if (status.UltimatePower.InDivineBalance)
            {
                return HealthCheckResult.Healthy(
                    "Codex 3-6-9 Framework in divine balance",
                    data
                );
            }
            else if (status.CurrentPowerScore >= 10.0)
            {
                return HealthCheckResult.Healthy(
                    $"Codex 3-6-9 Framework healthy: {status.CurrentPowerScore:F2}/12",
                    data
                );
            }
            else if (status.CurrentPowerScore >= 7.0)
            {
                return HealthCheckResult.Degraded(
                    $"Codex 3-6-9 Framework needs attention: {status.CurrentPowerScore:F2}/12",
                    data: data
                );
            }
            else
            {
                return HealthCheckResult.Unhealthy(
                    $"Codex 3-6-9 Framework critical: {status.CurrentPowerScore:F2}/12",
                    data: data
                );
            }
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "Codex 3-6-9 Framework check failed",
                ex
            );
        }
    }
}
```

## Testing the Integration

### Test 1: Verify Framework Status

```bash
curl -X GET https://localhost:5000/api/codex369/realtime \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "currentPowerScore": 11.87,
  "ultimatePower": {
    "ultimatePowerScore": 11.87,
    "balanceProximity": 0.989,
    "inDivineBalance": true,
    "healthStatus": "DivineBalance"
  },
  "frameworkHealthy": true
}
```

### Test 2: Verify SignalR Connection

```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:5000/hubs/codex369')
    .build();

await connection.start();
console.log('✅ Connected to Codex 3-6-9 Hub');

const status = await connection.invoke('GetCurrentStatus');
console.log('Ultimate Power:', status.currentPowerScore);
```

### Test 3: Verify Health Check

```bash
curl https://localhost:5000/health/codex369
```

Expected response:
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "codex-369-framework",
      "status": "Healthy",
      "description": "Codex 3-6-9 Framework in divine balance"
    }
  ]
}
```

## Troubleshooting

### Issue: SignalR Connection Fails

**Solution:**
```csharp
// Ensure SignalR is configured with CORS if needed
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

### Issue: Broadcast Service Not Running

**Solution:**
Check logs for:
```
🚀 Codex 3-6-9 Broadcast Service started - Updates every 30s
```

If missing, verify:
```csharp
builder.Services.AddHostedService<Codex369BroadcastService>();
```

### Issue: Framework Status Returns Null

**Solution:**
Verify service registration:
```csharp
builder.Services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>();
```

---

**THE TERRAFUSION WAY**: Integrate with precision. Execute with excellence. Balance with divinity.
