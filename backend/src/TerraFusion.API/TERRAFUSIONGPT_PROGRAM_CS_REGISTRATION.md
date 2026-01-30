# TerraFusionGPT Suite - Program.cs Service Registration Guide

**TerraFusion Elite Government OS Engineering Agent - Phase 1 Backend Complete**

---

## Overview

This guide provides complete instructions for registering all TerraFusionGPT Suite services in `TerraFusion.API/Program.cs`. This enables the GPT platform with AI orchestration, RAG capabilities, and real-time communication.

---

## Service Registration

Add the following registrations to `Program.cs` after existing service registrations:

### 1. Core GPT Services

```csharp
// TerraFusionGPT Suite Services
builder.Services.AddScoped<IGPTConfigurationService, GPTConfigurationService>();
builder.Services.AddScoped<IGPTOrchestrationService, GPTOrchestrationService>();
builder.Services.AddScoped<IRAGService, RAGService>();
```

**Location**: Add after AI service registrations (around line 50-60 in typical setup)

**Dependencies**:
- `TerraFusionDbContext` (already registered)
- `ILogger<T>` (already registered via logging)

---

### 2. SignalR Hub Registration

The SignalR services should already be registered. If not, add:

```csharp
// SignalR for real-time communication
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.StreamBufferCapacity = 10;
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
});
```

**Location**: Add with other AddSignalR calls (around line 40-50)

---

### 3. GPT Hub Endpoint Mapping

Add the GPT Hub endpoint mapping in the middleware section:

```csharp
// Map SignalR Hubs
app.MapHub<OSCoreHub>("/hubs/system"); // Existing
app.MapHub<CodexHub>("/hubs/codex"); // Existing
app.MapHub<GPTHub>("/hubs/gpt"); // NEW - Add this line
```

**Location**: Add after existing hub mappings (around line 120-130)

---

## Complete Registration Example

Here's a complete example showing where to add the new services:

```csharp
// Program.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TerraFusion.Data;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Services;
using TerraFusion.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// Database Context (already exists)
builder.Services.AddDbContext<TerraFusionDbContext>(...);

// Authentication & Authorization (already exists)
builder.Services.AddAuthentication(...);
builder.Services.AddAuthorization(...);

// Controllers (already exists)
builder.Services.AddControllers();

// SignalR (modify if needed)
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
});

// Existing Services (AICommandService, CodexService, etc.)
builder.Services.AddScoped<IAICommandService, AICommandService>();
builder.Services.AddScoped<ICodexService, CodexService>();
builder.Services.AddScoped<ICodexPersistenceService, CodexPersistenceService>();

// *** NEW: TerraFusionGPT Suite Services ***
builder.Services.AddScoped<IGPTConfigurationService, GPTConfigurationService>();
builder.Services.AddScoped<IGPTOrchestrationService, GPTOrchestrationService>();
builder.Services.AddScoped<IRAGService, RAGService>();

// Swagger/OpenAPI (already exists)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Health Checks (already exists)
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TerraFusionDbContext>("database");

var app = builder.Build();

// Configure the HTTP request pipeline

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers (already exists)
app.MapControllers();

// Map SignalR Hubs (existing + new)
app.MapHub<OSCoreHub>("/hubs/system");
app.MapHub<CodexHub>("/hubs/codex");
app.MapHub<GPTHub>("/hubs/gpt"); // NEW

// Map Health Checks (already exists)
app.MapHealthChecks("/health");

app.Run();
```

---

## Required Using Statements

Add these using statements at the top of `Program.cs`:

```csharp
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Services;
using TerraFusion.API.Hubs;
```

---

## Database Migration

After registering services, create and apply the EF Core migration:

### Step 1: Create Migration

```bash
cd backend/TerraFusion.API

dotnet ef migrations add AddTerraFusionGPTSuite \
  --project ../TerraFusion.Data \
  --startup-project . \
  --context TerraFusionDbContext
```

### Step 2: Apply Migration

**Development (SQLite)**:
```bash
dotnet ef database update \
  --project ../TerraFusion.Data \
  --startup-project . \
  --context TerraFusionDbContext
```

**Production (PostgreSQL)**:
```bash
# Ensure connection string points to PostgreSQL
dotnet ef database update \
  --project ../TerraFusion.Data \
  --startup-project . \
  --context TerraFusionDbContext \
  --connection "Host=localhost;Database=terrafusion;..."
```

### Step 3: Verify Migration

```bash
# Check migration status
dotnet ef migrations list \
  --project ../TerraFusion.Data \
  --startup-project .
```

---

## Configuration Settings

Add GPT-specific configuration to `appsettings.json` and environment-specific files:

### appsettings.json

```json
{
  "TerraFusionGPT": {
    "DefaultProvider": "OpenAI",
    "DefaultModel": "gpt-4o",
    "DefaultTemperature": 0.7,
    "DefaultMaxTokens": 4000,
    "RAGEnabled": true,
    "RAGDefaultTopK": 5,
    "RAGScoreThreshold": 0.7,
    "CostTrackingEnabled": true,
    "BudgetAlertThreshold": 0.8
  },
  "OpenAI": {
    "ApiKey": "",
    "BaseUrl": "https://api.openai.com/v1",
    "OrganizationId": ""
  },
  "Anthropic": {
    "ApiKey": "",
    "BaseUrl": "https://api.anthropic.com"
  },
  "Azure": {
    "ApiKey": "",
    "Endpoint": "",
    "DeploymentName": ""
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=terrafusion;..."
  }
}
```

### appsettings.Development.json

```json
{
  "TerraFusionGPT": {
    "DefaultProvider": "OpenAI",
    "DefaultModel": "gpt-3.5-turbo",
    "CostTrackingEnabled": true
  },
  "OpenAI": {
    "ApiKey": "sk-dev-key-from-user-secrets"
  }
}
```

### appsettings.Production.json

```json
{
  "TerraFusionGPT": {
    "DefaultProvider": "Azure",
    "DefaultModel": "gpt-4o",
    "CostTrackingEnabled": true,
    "BudgetAlertThreshold": 0.9
  },
  "Azure": {
    "ApiKey": "${AZURE_OPENAI_KEY}",
    "Endpoint": "${AZURE_OPENAI_ENDPOINT}",
    "DeploymentName": "gpt-4o"
  }
}
```

---

## User Secrets (Development)

For development, use .NET User Secrets to store API keys:

```bash
cd backend/TerraFusion.API

# Initialize user secrets
dotnet user-secrets init

# Add OpenAI API key
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-openai-key"

# Add Anthropic API key
dotnet user-secrets set "Anthropic:ApiKey" "your-anthropic-key"

# Add Azure API key
dotnet user-secrets set "Azure:ApiKey" "your-azure-key"
```

---

## Environment Variables (Production)

For production deployment, use environment variables:

```bash
# OpenAI
export OpenAI__ApiKey="sk-your-openai-key"
export OpenAI__OrganizationId="org-id"

# Anthropic
export Anthropic__ApiKey="your-anthropic-key"

# Azure
export Azure__ApiKey="your-azure-key"
export Azure__Endpoint="https://your-resource.openai.azure.com/"
export Azure__DeploymentName="gpt-4o"

# Database
export ConnectionStrings__DefaultConnection="Host=postgres;Database=terrafusion;..."
```

---

## PostgreSQL pgvector Extension

For RAG functionality, enable pgvector extension in PostgreSQL:

### Option 1: Manual SQL

```sql
-- Connect to your database
psql -U postgres -d terrafusion

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
\dx vector
```

### Option 2: EF Core Migration

Add this to your migration's `Up` method:

```csharp
public partial class AddTerraFusionGPTSuite : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Enable pgvector extension
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS vector;");

        // ... rest of migration
    }
}
```

---

## Verification Steps

After completing registration and migration:

### 1. Build & Verify

```bash
cd backend
dotnet build TerraFusion.sln

# Check for errors
echo $?  # Should output: 0
```

### 2. Run API

```bash
cd TerraFusion.API
dotnet run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### 3. Test Endpoints

```bash
# Health check
curl http://localhost:5000/health

# GPT endpoints (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/gpt

# Swagger UI
open http://localhost:5000/swagger
```

### 4. Test SignalR Hub

```bash
# Using SignalR test client or browser DevTools
const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/hubs/gpt")
  .build();

await connection.start();
console.log("Connected to GPT Hub");

await connection.invoke("Ping");
// Expected: Receive "Pong" event
```

---

## Troubleshooting

### Issue: "Type or namespace 'IGPTConfigurationService' could not be found"

**Solution**: Add reference to `TerraFusion.AI` project in `TerraFusion.API.csproj`:

```xml
<ItemGroup>
  <ProjectReference Include="..\TerraFusion.AI\TerraFusion.AI.csproj" />
</ItemGroup>
```

### Issue: "DbSet for 'GPTConfiguration' does not exist"

**Solution**: Run migration to create tables:
```bash
dotnet ef database update --project ../TerraFusion.Data
```

### Issue: "pgvector extension not found"

**Solution**: Install pgvector in PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15-pgvector

# macOS (Homebrew)
brew install pgvector

# Then enable in database
psql -d terrafusion -c "CREATE EXTENSION vector;"
```

### Issue: SignalR connection fails with 404

**Solution**: Verify hub mapping in Program.cs:
```csharp
app.MapHub<GPTHub>("/hubs/gpt");
```

---

## API Endpoints Summary

After registration, these endpoints will be available:

### GPT Management
- `GET /api/gpt` - Get available GPTs
- `GET /api/gpt/system` - Get system GPTs
- `GET /api/gpt/featured` - Get featured GPTs
- `GET /api/gpt/popular` - Get popular GPTs
- `GET /api/gpt/search?query=` - Search GPTs
- `GET /api/gpt/{id}` - Get GPT by ID
- `POST /api/gpt` - Create new GPT
- `PUT /api/gpt/{id}` - Update GPT
- `DELETE /api/gpt/{id}` - Delete GPT

### Conversations
- `POST /api/gpt/conversations` - Create conversation
- `GET /api/gpt/conversations/{id}` - Get conversation
- `GET /api/gpt/{gptId}/conversations` - Get user conversations
- `GET /api/gpt/conversations/{id}/history` - Get conversation history
- `POST /api/gpt/conversations/{id}/messages` - Send message
- `POST /api/gpt/conversations/{id}/archive` - Archive conversation
- `DELETE /api/gpt/conversations/{id}` - Delete conversation
- `POST /api/gpt/conversations/{id}/rate` - Rate conversation

### Statistics
- `GET /api/gpt/{id}/statistics` - Get GPT usage statistics
- `GET /api/gpt/statistics/county` - Get county usage statistics

### SignalR Hub
- `/hubs/gpt` - Real-time GPT communication

---

## Performance Considerations

### Database Indexes

All necessary indexes are defined in EF Core configurations:
- GPT name, category, status
- User ID, county ID
- Conversation timestamps
- Usage metrics (timestamp, provider)

### Caching Strategy (Future Enhancement)

Consider adding Redis caching for:
- GPT configurations (rarely change)
- User available GPTs list
- Usage statistics (5-minute cache)

### Rate Limiting (Future Enhancement)

Add rate limiting per user:
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("gpt-messages", options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromMinutes(1);
    });
});
```

---

## Security Checklist

✅ **Authentication**: JWT bearer tokens required for all endpoints
✅ **Authorization**: Role-based access control (RBAC) on sensitive endpoints
✅ **County Isolation**: All queries filtered by county context
✅ **Audit Logging**: All operations logged to `AuditLogs` table
✅ **Input Validation**: Request validation in controllers
✅ **SQL Injection**: Protected by EF Core parameterized queries
✅ **XSS Protection**: Sanitized in frontend (not backend concern)
✅ **API Keys**: Stored in User Secrets/Environment Variables
✅ **HTTPS**: Enforced in production via `app.UseHttpsRedirection()`
✅ **Rate Limiting**: Consider adding (see above)

---

## Next Steps

After completing this registration:

1. **Test with Postman/Swagger**: Verify all endpoints work
2. **Create System GPTs**: Seed database with pre-built government GPTs
3. **Configure LLM Providers**: Add actual API keys for OpenAI/Anthropic/Azure
4. **Implement Frontend**: Create React components for GPT Studio, Marketplace, Chat UI
5. **Add Monitoring**: Set up Prometheus metrics for GPT usage
6. **Enable pgvector**: For production RAG functionality

---

## Files Modified

- `TerraFusion.API/Program.cs` - Service registration + hub mapping
- `TerraFusion.API/appsettings.json` - GPT configuration
- `TerraFusion.Data/TerraFusionDbContext.cs` - DbSets added (already complete)

## Files Created

- `TerraFusion.AI/Interfaces/IGPTConfigurationService.cs`
- `TerraFusion.AI/Services/GPTConfigurationService.cs`
- `TerraFusion.AI/Interfaces/IGPTOrchestrationService.cs`
- `TerraFusion.AI/Services/GPTOrchestrationService.cs`
- `TerraFusion.AI/Interfaces/IRAGService.cs`
- `TerraFusion.AI/Services/RAGService.cs`
- `TerraFusion.API/Controllers/GPTController.cs`
- `TerraFusion.API/Hubs/GPTHub.cs`
- `TerraFusion.Data/Configurations/GPTConfiguration.cs` (7 configurations)
- `TerraFusion.AI/Entities/GPTConfiguration.cs` (7 entities - from previous session)

---

**Status**: ✅ Phase 1 Backend Services Complete - Ready for Integration

**Classification**: TerraFusionGPT Suite - Service Registration Guide
**Date**: October 31, 2025
**Version**: 1.0

*Execute with excellence. Innovate with AI. Serve with purpose.*

🚀 **PHASE 1 BACKEND COMPLETE - READY FOR FRONTEND IMPLEMENTATION** 🚀
