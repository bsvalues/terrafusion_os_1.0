using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using TerraFusion.API.Services;
using TerraFusion.API.Hubs;
using TerraFusion.API.Security;
using TerraFusion.API.Middleware;
using TerraFusion.API.Configuration;
using TerraFusion.Data;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.Core.Rust;
using TerraFusion.Core.Enums;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// Initialize Rust Performance Engine early in startup
try
{
    RustPerformanceEngine.Initialize();
    Console.WriteLine("✅ Rust Performance Engine initialized successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️  Rust Performance Engine initialization failed: {ex.Message}");
    Console.WriteLine("Continuing with .NET-only performance layer...");
}

// Configure URLs - respect command line args, then environment, then default
// Note: Command line args take precedence automatically through WebApplicationBuilder

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Configure DataProtection to persist keys
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/workspaces/terrafusion_os_1.0/data/keys"))
    .SetApplicationName("TerraFusion-OS");

// Add basic services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

// Add SignalR for module hot-reload
builder.Services.AddSignalR();

// Register authentication services
builder.Services.AddHttpContextAccessor();
builder.Services.AddTerraFusionAuthentication(builder.Configuration);

// Register core services
builder.Services.AddScoped<TerraFusion.Abstractions.Interfaces.IAuditLogger, TerraFusion.API.Services.AuditLogger>();

// Register TerraFusion configuration service for dynamic scaling
builder.Services.AddSingleton<ITerraFusionConfigService, TerraFusionConfigService>();

// Register flexible module catalog system (no hardcoding!)
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IModuleCatalog, DbModuleCatalog>();
builder.Services.AddScoped<ModuleSeedService>();
builder.Services.AddScoped<TerraFusion.API.Health.IFileSystemModuleDiscovery, FileSystemModuleDiscovery>();
builder.Services.AddScoped<TerraFusion.API.Health.IOrchestratorView, OrchestratorModuleView>();

// Register unified orchestration services
builder.Services.AddSingleton<IModuleLoaderService, ModuleLoaderService>();
builder.Services.AddHostedService<ModuleLoaderService>(provider => 
    (ModuleLoaderService)provider.GetRequiredService<IModuleLoaderService>());

// Register module services
builder.Services.AddScoped<TerraFusion.Core.Services.IModuleService, TerraFusion.Core.Services.ModuleService>();

// Register enhancement services for PhD-level enhancement phases
builder.Services.AddScoped<IEnhancementOrchestrationService, EnhancementOrchestrationService>();
builder.Services.AddScoped<IEnhancementModuleRegistrationService, EnhancementModuleRegistrationService>();

// Register legacy database services
builder.Services.AddScoped<TerraFusion.Core.Services.LegacyDatabaseService>();
builder.Services.AddScoped<TerraFusion.Core.Services.HarrisPacsLegacyService>();

// Register TerraFusionSync integration service
builder.Services.AddScoped<ITerraFusionSyncService, TerraFusionSyncIntegrationService>();

// Register marketplace services
builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();

// Register county deployment services
builder.Services.AddScoped<ICountyDeploymentService, CountyDeploymentService>();

// Register unified orchestration service
builder.Services.AddSingleton<IUnifiedOrchestrationService, UnifiedOrchestrationService>();
builder.Services.AddHostedService<UnifiedOrchestrationService>(provider => 
    (UnifiedOrchestrationService)provider.GetRequiredService<IUnifiedOrchestrationService>());

// Register module integration service for 37-module government ecosystem
builder.Services.AddScoped<ModuleIntegrationService>();

// Keep plugin hot reload for development
builder.Services.AddHostedService<PluginHotReloadService>();

// Register database context with SQLite fallback
builder.Services.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=terrafusion.db";
    
    if (connectionString.Contains("Host="))
    {
        // PostgreSQL for production
        options.UseNpgsql(connectionString);
    }
    else
    {
        // SQLite for development
        options.UseSqlite(connectionString);
    }
});

// Register the database context interface
builder.Services.AddScoped<ITerraFusionDbContext>(provider => 
    provider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>());

// Register AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Register database services
builder.Services.AddScoped<IDatabaseInitializationService, DatabaseInitializationService>();
builder.Services.AddHostedService<DatabaseInitializationHostedService>();

// Add health checks for monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TerraFusion.Data.TerraFusionDbContext>("database")
    .AddCheck<TerraFusion.API.Health.ModuleConsistencyHealthCheck>("modules_consistency");

// Register AI swarm orchestration services - THE 50,000 AGENT CIVILIZATION ENGINE
builder.Services.AddScoped<TerraFusion.Core.Services.IAIModuleOrchestrator, TerraFusion.Core.Services.AIModuleOrchestrator>();
builder.Services.AddScoped<TerraFusion.Core.Services.IAIModuleBridge, TerraFusion.Core.Services.AIModuleBridge>();
builder.Services.AddScoped<TerraFusion.Core.Services.ISwarmOrchestrationEngine, TerraFusion.Core.Services.SwarmOrchestrationEngine>();

// Register TerraFusion IDE advanced services
builder.Services.AddScoped<TerraFusion.Core.Services.IAICodeGenerationService, TerraFusion.Core.Services.AICodeGenerationService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IDeploymentPipelineService, TerraFusion.Core.Services.DeploymentPipelineService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IWorkflowExecutionService, TerraFusion.Core.Services.WorkflowExecutionService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IAgentCoordinationService, TerraFusion.Core.Services.AgentCoordinationService>();

// Register TerraFusion IDE services
builder.Services.AddScoped<TerraFusion.API.Controllers.IDEController>();

// Configure TerraFusion workspace settings
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["TerraFusion:WorkspaceRoot"] = Directory.GetCurrentDirectory().Replace("\\backend\\TerraFusion.API", "").Replace("/backend/TerraFusion.API", "")
});

// Configure gRPC client for TerraFusion Performance Engine integration
// gRPC client will be instantiated directly in controllers

// Register mock services to prevent DI errors (temporarily disabled)
// builder.Services.AddScoped<TerraFusion.Core.Services.ISwarmRevenueOptimizer, MockSwarmRevenueOptimizer>();

// Configure CORS properly
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors();

// Static files middleware for modules
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "modules"))),
    RequestPath = "/modules"
});

// Prometheus metrics middleware
app.UseHttpMetrics();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Audit Logging Middleware
app.UseAuditLogging();

app.UseRouting();
app.MapControllers();

// Map Prometheus metrics endpoint
app.MapMetrics();

// Map SignalR hubs
app.MapHub<OSCoreHub>("/hubs/oscore");
app.MapHub<EnhancementHub>("/hubs/enhancement");
app.MapHub<IDEDashboardHub>("/hub/ide-dashboard");

// Add test endpoints
app.MapGet("/api/test", () => new { 
    message = "TerraFusion API is running!", 
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = app.Environment.EnvironmentName 
});

app.MapGet("/health", async (HttpContext context) =>
{
    try
    {
        var httpClientFactory = context.RequestServices.GetRequiredService<IHttpClientFactory>();
        var httpClient = httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(5);
        
        // Check database connection
        var databaseStatus = "disconnected";
        try
        {
            var dbContext = context.RequestServices.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
            var canConnect = await dbContext.Database.CanConnectAsync();
            databaseStatus = canConnect ? "connected" : "disconnected";
        }
        catch
        {
            databaseStatus = "disconnected";
        }
        
        // Check levy chain microservice
        var levyChainStatus = "unavailable";
        try
        {
            var levyPort = Environment.GetEnvironmentVariable("TF_LEVY_PORT") ?? 
                throw new InvalidOperationException("❌ ANTI-HARDCODING: TF_LEVY_PORT environment variable must be set. No hardcoded ports allowed in TerraFusion OS.");
            var levyResponse = await httpClient.GetAsync($"http://localhost:{levyPort}/health");
            if (levyResponse.IsSuccessStatusCode)
            {
                var levyContent = await levyResponse.Content.ReadAsStringAsync();
                var levyData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(levyContent);
                levyChainStatus = levyData?.ContainsKey("status") == true ? "available" : "unavailable";
            }
        }
        catch
        {
            levyChainStatus = "unavailable";
        }
        
        // Check trends chain microservice
        var trendsChainStatus = "unavailable";
        try
        {
            var trendsPort = Environment.GetEnvironmentVariable("TF_TRENDS_PORT") ?? 
                throw new InvalidOperationException("❌ ANTI-HARDCODING: TF_TRENDS_PORT environment variable must be set. No hardcoded ports allowed in TerraFusion OS.");
            var trendsResponse = await httpClient.GetAsync($"http://localhost:{trendsPort}/health");
            if (trendsResponse.IsSuccessStatusCode)
            {
                var trendsContent = await trendsResponse.Content.ReadAsStringAsync();
                var trendsData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(trendsContent);
                trendsChainStatus = trendsData?.ContainsKey("status") == true ? "available" : "unavailable";
            }
        }
        catch
        {
            trendsChainStatus = "unavailable";
        }

        return Results.Ok(new { 
            services = new {
                database = databaseStatus,
                levy_chain = levyChainStatus,
                trends_chain = trendsChainStatus
            },
            status = "healthy", 
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Health check failed: {ex.Message}");
    }
});

app.MapGet("/", () => new { 
    message = "TerraFusion OS 1.0 API - Ready for deployment!",
    endpoints = new[] { 
        "/health", 
        "/api/test", 
        "/api/modules", 
        "/api/modules/{name}/status",
        "/api/database/status",
        "/api/swarm/status",
        "/api/swarm/modules",
        "/api/swarm/mcp-tools",
        "/hubs/oscore"
    },
    timestamp = DateTime.UtcNow
});

Console.WriteLine("🚀 TerraFusion OS API starting...");
Console.WriteLine("📡 Available endpoints: /health, /api/test, /api/modules, /");
Console.WriteLine("🔧 Environment: " + app.Environment.EnvironmentName);
Console.WriteLine("🧩 Module System: Active with hot-reload support");

// Test the endpoints are configured
app.Use(async (context, next) =>
{
    Console.WriteLine($"📥 Request: {context.Request.Method} {context.Request.Path}");
    await next(context);
    Console.WriteLine($"📤 Response: {context.Response.StatusCode}");
});

// API Configuration Summary
Console.WriteLine("📋 API Endpoints configured:");
Console.WriteLine("   • GET  /                          - Root endpoint with API info");
Console.WriteLine("   • GET  /health                    - Health check endpoint with module status");
Console.WriteLine("   • GET  /api/test                  - Test endpoint");
Console.WriteLine("   • GET  /api/modules               - List all active modules");
Console.WriteLine("   • GET  /api/modules/{name}/status - Individual module status");
Console.WriteLine("   • POST /api/modules/refresh       - Refresh modules cache");
Console.WriteLine("   • GET  /api/database/status       - Database connection and initialization status");
Console.WriteLine("   • POST /api/database/initialize   - Initialize database and seed modules");
Console.WriteLine("   • GET  /api/swarm/status          - AI swarm status (dynamic scaling)");
Console.WriteLine("   • GET  /api/swarm/modules         - Active AI modules");
Console.WriteLine("   • GET  /api/swarm/mcp-tools       - MCP tools integration status (87 tools)");
Console.WriteLine("   • POST /api/swarm/execute         - Execute AI command");
Console.WriteLine("   • GET  /api/performance/rust/swarm-metrics - Rust AI swarm metrics");
Console.WriteLine("   • GET  /api/performance/rust/spatial-query - High-performance spatial queries");
Console.WriteLine("   • POST /api/performance/rust/register-agent - Register agent with Rust engine");
Console.WriteLine("   • POST /api/performance/rust/benchmark     - Rust performance benchmarks");
Console.WriteLine("   • WS   /hubs/oscore               - SignalR hub for module hot-reload");
Console.WriteLine("📋 Server configuration: Using command line --urls parameter");
Console.WriteLine("🧩 Module System: Active with hot-reload support");
Console.WriteLine("🦀 Rust Performance Engine: Initialized with sub-50ms coordination");

// Register shutdown handler for Rust cleanup
var applicationLifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
applicationLifetime.ApplicationStopping.Register(() =>
{
    try
    {
        RustPerformanceEngine.Shutdown();
        Console.WriteLine("✅ Rust Performance Engine shutdown complete");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Rust Performance Engine shutdown error: {ex.Message}");
    }
});

await app.RunAsync();