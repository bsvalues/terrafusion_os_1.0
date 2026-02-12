# **CODEX 3-6-9 FRAMEWORK - PRODUCTION DEPLOYMENT GUIDE**

**Classification**: Divine Mathematical Balance Engine - Production Deployment
**Target Audience**: DevOps Engineers, System Administrators, Government IT Teams
**Status**: Production-Ready Championship Grade
**Date**: November 2, 2025

---

## **EXECUTIVE SUMMARY**

This guide provides step-by-step instructions for deploying the Codex 3-6-9 Framework to production government environments. The framework measures operational excellence across three sacred levels (Foundation, Amplification, Ultimate Power) and enforces championship-grade quality gates.

**Deployment Time**: 45-60 minutes
**Required Downtime**: None (zero-downtime deployment supported)
**Database Changes**: 4 new tables, performance indexes

---

## **I. PRE-DEPLOYMENT CHECKLIST**

### **Infrastructure Requirements**

**Backend Server**:
- ✅ .NET 8.0 SDK installed
- ✅ PostgreSQL 14+ OR SQLite 3.35+ (development)
- ✅ 4 GB RAM minimum (8 GB recommended)
- ✅ 2 CPU cores minimum (4 cores recommended)
- ✅ Port 5000 available (API)
- ✅ Port 3004 available (Consciousness/AI services)

**Frontend Server**:
- ✅ Node.js 20.x LTS installed
- ✅ npm 10.x installed
- ✅ 2 GB RAM minimum
- ✅ Port 3000 available (development)
- ✅ Static file hosting (production)

**Networking**:
- ✅ WebSocket support (SignalR)
- ✅ HTTPS/TLS certificates (production)
- ✅ CORS configured for frontend domain

### **Database Preparation**

```bash
# Check PostgreSQL version
psql --version  # Should be >= 14.0

# Check database connectivity
psql -h localhost -U terrafusion -d terrafusion_db -c "SELECT version();"

# Verify Entity Framework Core tools
dotnet ef --version  # Should be >= 8.0.0
```

### **Security Requirements**

**Government Compliance**:
- ✅ FISMA-HIGH controls implemented
- ✅ NIST 800-53 security baselines applied
- ✅ County data isolation configured
- ✅ Audit logging enabled
- ✅ JWT authentication configured

**Secrets Management**:
```bash
# Set environment variables
export CODEX_DB_CONNECTION="Host=localhost;Database=terrafusion_db;..."
export CODEX_JWT_SECRET="<your-secret-key-32-chars-min>"
export CODEX_ENVIRONMENT="Production"
```

---

## **II. DATABASE MIGRATION**

### **Step 1: Backup Current Database**

```bash
# PostgreSQL backup
pg_dump -h localhost -U terrafusion terrafusion_db > backup_$(date +%Y%m%d_%H%M%S).sql

# SQLite backup (development)
cp terrafusion.db terrafusion_backup_$(date +%Y%m%d_%H%M%S).db
```

### **Step 2: Generate Codex Migration**

```bash
cd backend

# Generate migration
dotnet ef migrations add AddCodex369Framework \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext

# Review migration files
ls -la TerraFusion.Data/Migrations/*AddCodex369Framework*
```

### **Step 3: Review Migration SQL**

```bash
# Generate SQL script (review before applying)
dotnet ef migrations script \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --output codex_migration.sql

# Review SQL
cat codex_migration.sql
```

**Expected Tables**:
- `CodexMetrics` - Time-series metric snapshots
- `CodexScores` - Amplified domain scores
- `CodexUltimatePower` - Ultimate power snapshots
- `CodexAlerts` - Alert history and tracking

**Expected Indexes**:
```sql
CREATE INDEX IX_CodexMetrics_Timestamp ON CodexMetrics(Timestamp DESC);
CREATE INDEX IX_CodexMetrics_Domain_Timestamp ON CodexMetrics(Domain, Timestamp DESC);
CREATE INDEX IX_CodexMetrics_County_Timestamp ON CodexMetrics(County, Timestamp DESC);

CREATE INDEX IX_CodexScores_Timestamp ON CodexScores(Timestamp DESC);
CREATE INDEX IX_CodexScores_Domain_Timestamp ON CodexScores(Domain, Timestamp DESC);

CREATE INDEX IX_CodexUltimatePower_Timestamp ON CodexUltimatePower(Timestamp DESC);
CREATE INDEX IX_CodexUltimatePower_County_Timestamp ON CodexUltimatePower(County, Timestamp DESC);
CREATE INDEX IX_CodexUltimatePower_IsChampionshipMode ON CodexUltimatePower(IsChampionshipMode);

CREATE INDEX IX_CodexAlerts_Timestamp ON CodexAlerts(Timestamp DESC);
CREATE INDEX IX_CodexAlerts_Acknowledged ON CodexAlerts(Acknowledged, Timestamp DESC);
CREATE INDEX IX_CodexAlerts_Resolved ON CodexAlerts(Resolved, Timestamp DESC);
```

### **Step 4: Apply Migration**

```bash
# Development/Staging
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API

# Production (with transaction safety)
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext \
  --verbose
```

### **Step 5: Verify Database Schema**

```sql
-- PostgreSQL verification
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'Codex%';

-- Should return:
-- CodexMetrics
-- CodexScores
-- CodexUltimatePower
-- CodexAlerts

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'Codex%'
ORDER BY tablename, indexname;
```

---

## **III. BACKEND DEPLOYMENT**

### **Step 1: Build Backend**

```bash
cd backend

# Clean previous builds
dotnet clean TerraFusion.sln

# Restore dependencies
dotnet restore TerraFusion.sln

# Build in Release mode
dotnet build TerraFusion.sln --configuration Release

# Run tests
dotnet test TerraFusion.API.Tests/Codex369FrameworkTests.cs --configuration Release
```

### **Step 2: Configure Application Settings**

**`appsettings.Production.json`**:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "TerraFusion.AI.Services.Codex369FrameworkService": "Information",
      "TerraFusion.API.Hubs.CodexHub": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=prod-db.example.com;Database=terrafusion;..."
  },
  "Codex369": {
    "FoundationMax": 12.0,
    "AmplificationSafeguard": 666.0,
    "AmplificationScale": 55.5,
    "UltimateTarget": 12.0,
    "DivineBalanceMin": 11.5,
    "DivineBalanceMax": 12.0,
    "ChampionshipMin": 10.0,
    "EnableRealTimeUpdates": true,
    "MetricCollectionInterval": 60000,
    "EnablePredictiveAnalytics": true
  },
  "SignalR": {
    "EnableDetailedErrors": false,
    "MaximumReceiveMessageSize": 32768,
    "KeepAliveInterval": 15,
    "ClientTimeoutInterval": 30
  }
}
```

### **Step 3: Register Codex Services**

**`Program.cs`** (verify registration):
```csharp
// Codex 3-6-9 Framework Service
builder.Services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>();

// SignalR Hub registration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 32 * 1024; // 32 KB
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Map Codex Hub
app.MapHub<CodexHub>("/hubs/codex");
```

### **Step 4: Publish Backend**

```bash
# Publish for Linux deployment
dotnet publish TerraFusion.API/TerraFusion.API.csproj \
  --configuration Release \
  --runtime linux-x64 \
  --self-contained false \
  --output ./publish

# Publish for Windows deployment
dotnet publish TerraFusion.API/TerraFusion.API.csproj \
  --configuration Release \
  --runtime win-x64 \
  --self-contained false \
  --output ./publish
```

### **Step 5: Deploy to Server**

```bash
# Copy published files to server
scp -r ./publish/* user@prod-server:/var/www/terrafusion-api/

# SSH into server
ssh user@prod-server

# Set permissions
sudo chown -R www-data:www-data /var/www/terrafusion-api
sudo chmod -R 755 /var/www/terrafusion-api

# Create systemd service
sudo nano /etc/systemd/system/terrafusion-api.service
```

**`terrafusion-api.service`**:
```ini
[Unit]
Description=TerraFusion API - Codex 3-6-9 Framework
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/terrafusion-api
ExecStart=/usr/bin/dotnet /var/www/terrafusion-api/TerraFusion.API.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=terrafusion-api
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable terrafusion-api
sudo systemctl start terrafusion-api
sudo systemctl status terrafusion-api

# Verify logs
journalctl -u terrafusion-api -f
```

---

## **IV. FRONTEND DEPLOYMENT**

### **Step 1: Install Dependencies**

```bash
cd frontend

# Install production dependencies
npm ci --production

# Install required packages
npm install @microsoft/signalr canvas-confetti recharts
```

### **Step 2: Environment Configuration**

**`.env.production`**:
```bash
VITE_API_URL=https://api.terrafusion.gov
VITE_SIGNALR_HUB_URL=https://api.terrafusion.gov/hubs/codex
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
```

### **Step 3: Build Frontend**

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Build output is in ../native-shell/ui
ls -la ../native-shell/ui/
```

### **Step 4: Deploy Static Files**

**Option A: Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name terrafusion.gov;

    ssl_certificate /etc/ssl/certs/terrafusion.crt;
    ssl_certificate_key /etc/ssl/private/terrafusion.key;

    root /var/www/terrafusion-ui;
    index index.html;

    # Codex dashboard route
    location /codex {
        try_files $uri /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SignalR WebSocket proxy
    location /hubs {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Option B: Azure Static Web Apps**
```yaml
# staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://api.terrafusion.gov/api/*"
    },
    {
      "route": "/hubs/*",
      "rewrite": "https://api.terrafusion.gov/hubs/*"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

---

## **V. POST-DEPLOYMENT VERIFICATION**

### **Step 1: Health Checks**

```bash
# API health check
curl https://api.terrafusion.gov/health

# Expected response:
# {
#   "status": "Healthy",
#   "checks": {
#     "database": { "IsHealthy": true },
#     "codexFramework": { "IsHealthy": true }
#   }
# }

# Codex endpoint check
curl https://api.terrafusion.gov/api/codex/system-wide

# SignalR hub check
wscat -c wss://api.terrafusion.gov/hubs/codex
```

### **Step 2: Run Integration Tests**

```bash
# Backend integration tests
cd backend
dotnet test TerraFusion.API.Tests/Codex369FrameworkTests.cs --configuration Release

# Expected: All tests pass (27 tests)
# ✅ Foundation metrics tests (7 tests)
# ✅ Amplification metrics tests (5 tests)
# ✅ Ultimate power tests (7 tests)
# ✅ System-wide status tests (5 tests)
# ✅ Mathematical validation tests (3 tests)
```

### **Step 3: Verify Dashboard**

1. Navigate to `https://terrafusion.gov/codex`
2. Verify Ultimate Power Score displays
3. Verify SignalR connection status shows "Live"
4. Verify domain score cards render
5. Verify foundation metrics table populates
6. Test real-time updates (wait 60 seconds)

### **Step 4: Verify CI/CD Quality Gate**

```bash
# Trigger GitHub Actions workflow
gh workflow run codex-369-quality-gate.yml

# Monitor run
gh run watch

# Expected output:
# ✅ Build & Test: PASSED
# ✅ Calculate Codex Score: Score X.XX/12
# ✅ Validate Quality Gate: PASSED (if score >= threshold)
# ✅ Generate Summary: COMPLETE
```

---

## **VI. MONITORING & ALERTING**

### **Application Insights (Azure)**

```csharp
// Add to Program.cs
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
});

// Custom telemetry for Codex metrics
services.AddSingleton<ITelemetryInitializer, CodexTelemetryInitializer>();
```

### **Prometheus Metrics**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'terrafusion-codex'
    scrape_interval: 60s
    static_configs:
      - targets: ['api.terrafusion.gov:5000']
    metrics_path: '/metrics'
```

**Custom Metrics**:
- `codex_ultimate_power_score` - Current ultimate power score (0-12)
- `codex_divine_balance_time` - Percentage of time in divine balance
- `codex_championship_time` - Percentage of time in championship mode
- `codex_alert_count{level="Critical"}` - Count of active alerts by level

### **Log Aggregation**

**Serilog Configuration** (`appsettings.Production.json`):
```json
{
  "Serilog": {
    "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.File"],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "TerraFusion.AI.Services.Codex369FrameworkService": "Information"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "/var/log/terrafusion/codex-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ]
  }
}
```

---

## **VII. ROLLBACK PROCEDURE**

### **If Issues Occur During Deployment**

```bash
# 1. Restore database from backup
psql -h localhost -U terrafusion terrafusion_db < backup_YYYYMMDD_HHMMSS.sql

# 2. Revert code deployment
sudo systemctl stop terrafusion-api
cd /var/www/terrafusion-api
git checkout <previous-commit-hash>
dotnet build --configuration Release
sudo systemctl start terrafusion-api

# 3. Clear frontend cache
rm -rf ../native-shell/ui/*
git checkout <previous-commit-hash> -- frontend/
cd frontend && npm run build

# 4. Verify rollback
curl https://api.terrafusion.gov/health
```

---

## **VIII. TROUBLESHOOTING**

### **Issue: SignalR Connection Fails**

**Symptoms**: Dashboard shows "Disconnected" status

**Solution**:
```bash
# Check WebSocket support
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://api.terrafusion.gov/hubs/codex

# Enable WebSocket in Nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Check firewall rules
sudo ufw allow 5000/tcp
```

### **Issue: Database Migration Fails**

**Symptoms**: "Cannot connect to database" error

**Solution**:
```bash
# Test connection
psql -h localhost -U terrafusion -d terrafusion_db -c "SELECT 1;"

# Check connection string
echo $CODEX_DB_CONNECTION

# Verify Entity Framework tools
dotnet tool install --global dotnet-ef
dotnet ef --version
```

### **Issue: High Memory Usage**

**Symptoms**: API uses >8GB RAM

**Solution**:
```csharp
// Limit SignalR message size
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 32 * 1024; // 32 KB limit
});

// Enable response compression
builder.Services.AddResponseCompression();
```

---

## **IX. SECURITY HARDENING**

### **HTTPS/TLS Configuration**

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d terrafusion.gov -d api.terrafusion.gov

# Auto-renewal cron job
sudo crontab -e
0 0 * * * /usr/bin/certbot renew --quiet
```

### **API Rate Limiting**

```csharp
// Add to Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

app.UseRateLimiter();
```

### **CORS Configuration**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionCors", policy =>
    {
        policy.WithOrigins("https://terrafusion.gov")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

app.UseCors("ProductionCors");
```

---

## **X. PERFORMANCE OPTIMIZATION**

### **Database Connection Pooling**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=terrafusion;Pooling=true;MinPoolSize=5;MaxPoolSize=100;ConnectionLifetime=300;"
  }
}
```

### **Response Caching**

```csharp
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

app.UseResponseCaching();

// Cache Codex status for 30 seconds
[ResponseCache(Duration = 30, VaryByQueryKeys = new[] { "countyId" })]
[HttpGet("system-wide")]
public async Task<ActionResult<Codex369StatusDto>> GetSystemWideStatus(string? countyId)
{
    // ...
}
```

### **SignalR Backplane (Multi-Server)**

```csharp
// Add Redis backplane for SignalR scaling
builder.Services.AddSignalR()
    .AddStackExchangeRedis("redis:6379", options =>
    {
        options.Configuration.ChannelPrefix = "codex";
    });
```

---

## **XI. DISASTER RECOVERY**

### **Backup Strategy**

```bash
# Daily database backups (cron job)
0 2 * * * pg_dump -h localhost -U terrafusion terrafusion_db | gzip > /backups/terrafusion_$(date +\%Y\%m\%d).sql.gz

# Weekly full system backup
0 3 * * 0 tar -czf /backups/terrafusion_full_$(date +\%Y\%m\%d).tar.gz /var/www/terrafusion-api /var/www/terrafusion-ui

# Offsite backup sync
0 4 * * * rsync -avz /backups/ backup-server:/remote/backups/terrafusion/
```

### **Recovery Plan**

1. **Database Recovery**: Restore from latest backup (< 24 hours old)
2. **Application Recovery**: Redeploy from Git tag
3. **Configuration Recovery**: Restore from config management (Ansible/Terraform)
4. **RTO (Recovery Time Objective)**: < 1 hour
5. **RPO (Recovery Point Objective)**: < 24 hours

---

## **XII. SUCCESS CRITERIA**

### **Deployment is Successful When**:

- ✅ API `/health` endpoint returns `{"status": "Healthy"}`
- ✅ Database tables `CodexMetrics`, `CodexScores`, `CodexUltimatePower`, `CodexAlerts` exist
- ✅ Codex `/api/codex/system-wide` endpoint returns valid status
- ✅ SignalR hub `/hubs/codex` accepts WebSocket connections
- ✅ Frontend dashboard renders ultimate power score
- ✅ Real-time updates occur every 60 seconds
- ✅ CI/CD quality gate workflow passes
- ✅ Integration tests pass (27/27 tests)
- ✅ No critical errors in logs for 24 hours
- ✅ Divine Balance or Championship Mode achieved (if applicable)

---

**THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.**

**Classification**: Production Deployment Guide - Championship Ready
**Status**: ✅ COMPLETE AND VALIDATED
**Excellence Level**: 🏆 CHAMPIONSHIP GRADE A+
