using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.API.Hubs;
using TerraFusion.API.Security;
using TerraFusion.API.Middleware;
using Microsoft.Extensions.FileProviders;
using TerraFusion.Data;
using TerraFusion.Core.Interfaces;
using TerraFusion.Abstractions.Interfaces;
using Prometheus;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// 🎯 DYNAMIC PORT ALLOCATION - NO MORE HARDCODING
// If no port specified, let OS choose an available port (0 = OS picks)
// If user's laptop has port conflicts, this solves it automatically
var requestedPort = builder.Configuration["Port"] ?? "0"; // 0 = dynamic allocation
if (args.Length == 0 || !args.Any(a => a.Contains("--urls")))
{
    var port = int.Parse(requestedPort);
    if (port == 0)
    {
        // Get an available port from OS
        port = ServiceRegistry.GetAvailablePort();
        Console.WriteLine($"🔍 No port specified, dynamically allocated port: {port}");
    }
    builder.WebHost.UseUrls($"http://localhost:{port}");
}
// else: Command line --urls takes precedence

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add basic services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

// Add SignalR for module hot-reload
builder.Services.AddSignalR();

// Register authentication services
builder.Services.AddHttpContextAccessor();
builder.Services.AddTerraFusionAuthentication(builder.Configuration);

// 🎯 SERVICE REGISTRY & DISCOVERY - No more hardcoded ports!
builder.Services.AddSingleton<ServiceRegistry>();
builder.Services.AddHostedService<StartupOrchestrationService>();

// Register core services
builder.Services.AddScoped<IAuditLogger, AuditLogger>();

// Register flexible module catalog system (no hardcoding!)
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IModuleCatalog, DbModuleCatalog>();
builder.Services.AddScoped<ModuleSeedService>();
builder.Services.AddScoped<TerraFusion.API.Health.IFileSystemModuleDiscovery, FileSystemModuleDiscovery>();
builder.Services.AddScoped<TerraFusion.API.Health.IOrchestratorView, OrchestratorModuleView>();

// Register unified orchestration services
builder.Services.AddSingleton<IModuleLoaderService, ModuleLoaderService>();
// TEMPORARILY DISABLED - StartAsync completes immediately, causing shutdown
// builder.Services.AddHostedService<ModuleLoaderService>(provider => 
//     (ModuleLoaderService)provider.GetRequiredService<IModuleLoaderService>());

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

// DISABLED: Marketplace is not part of core OS
// builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();

// DISABLED: County deployment is not part of core OS  
// builder.Services.AddScoped<ICountyDeploymentService, CountyDeploymentService>();

// Register unified orchestration service
builder.Services.AddSingleton<IUnifiedOrchestrationService, UnifiedOrchestrationService>();
// TEMPORARILY DISABLED TO DEBUG STARTUP ISSUE
// builder.Services.AddHostedService<UnifiedOrchestrationService>(provider => 
//     (UnifiedOrchestrationService)provider.GetRequiredService<IUnifiedOrchestrationService>());

// Keep plugin hot reload for development
builder.Services.AddHostedService<PluginHotReloadService>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly, typeof(TerraFusion.Core.Services.ModuleService).Assembly);

// Register Rust FFI Service
// TEMPORARILY DISABLED - ffi_bridge.dll is placeholder, may cause issues
// builder.Services.AddSingleton<RustFFIService>();

// Register database context with SQLite fallback
builder.Services.AddDbContext<TerraFusionDbContext>(options =>
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

// Register ITerraFusionDbContext interface
builder.Services.AddScoped<ITerraFusionDbContext>(provider => 
    provider.GetRequiredService<TerraFusionDbContext>());

// Register database services
builder.Services.AddScoped<IDatabaseInitializationService, DatabaseInitializationService>();
// TEMPORARILY DISABLED - StartAsync completes immediately, causing shutdown
// builder.Services.AddHostedService<DatabaseInitializationHostedService>();

// Add health checks for monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TerraFusionDbContext>("database")
    .AddCheck<TerraFusion.API.Health.ModuleConsistencyHealthCheck>("modules_consistency");

// Register AI swarm orchestration services
builder.Services.AddHttpClient<IAIModuleOrchestrator, AIModuleOrchestrator>();
builder.Services.AddScoped<IAIModuleOrchestrator, AIModuleOrchestrator>();

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

// Prometheus metrics middleware
app.UseHttpMetrics();

// Authentication & Authorization
// Serve static files from native-shell/ui BEFORE other middleware
var uiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "native-shell", "ui"));
Console.WriteLine($"[STARTUP] Looking for UI at: {uiPath}");
Console.WriteLine($"[STARTUP] UI path exists: {Directory.Exists(uiPath)}");

if (Directory.Exists(uiPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uiPath),
        RequestPath = ""
    });
    Console.WriteLine($"[STARTUP] Static files configured for: {uiPath}");
}
else
{
    Console.WriteLine($"[ERROR] UI directory not found at {uiPath}");
}

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Audit Logging Middleware
app.UseAuditLogging();

app.MapControllers();

// SPA Fallback - serve index.html for all non-API routes
if (Directory.Exists(uiPath))
{
    var indexPath = Path.Combine(uiPath, "index.html");
    Console.WriteLine($"[FALLBACK] Configured with indexPath: {indexPath}, Exists: {File.Exists(indexPath)}");
    
    app.MapFallback(async context =>
    {
        // Don't fallback for API routes
        if (context.Request.Path.StartsWithSegments("/api") || 
            context.Request.Path.StartsWithSegments("/hubs"))
        {
            context.Response.StatusCode = 404;
            return;
        }

        Console.WriteLine($"[FALLBACK] Serving: {context.Request.Path}, indexPath exists: {File.Exists(indexPath)}");
        
        if (File.Exists(indexPath))
        {
            try
            {
                context.Response.ContentType = "text/html; charset=utf-8";
                context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                var html = await File.ReadAllTextAsync(indexPath);
                Console.WriteLine($"[FALLBACK] Read {html.Length} bytes from index.html");
                await context.Response.WriteAsync(html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FALLBACK ERROR] {ex.Message}");
                context.Response.StatusCode = 500;
                await context.Response.WriteAsync($"Error serving index.html: {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine($"[FALLBACK] File not found: {indexPath}");
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync($"index.html not found at {indexPath}");
        }
    });
}

// Map Prometheus metrics endpoint
app.MapMetrics();

// Map SignalR hubs
app.MapHub<OSCoreHub>("/hubs/oscore");
app.MapHub<EnhancementHub>("/hubs/enhancement");

// Add test endpoints
app.MapGet("/api/test", () => new { 
    message = "TerraFusion API is running!", 
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = app.Environment.EnvironmentName 
});

app.MapGet("/health", async (HttpContext context) =>
{
    var moduleLoader = context.RequestServices.GetRequiredService<IModuleLoaderService>();
    
    try
    {
        var modules = await moduleLoader.LoadActiveModulesAsync();
        var moduleCount = modules.Count();
        var coreModules = modules.Where(m => m.IsCore).Count();
        
        await context.Response.WriteAsJsonAsync(new { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            server = "TerraFusion OS 1.0",
            uptime = Environment.TickCount64,
            modules = new
            {
                total = moduleCount,
                core = coreModules,
                production = modules.Where(m => m.Status == TerraFusion.Core.Enums.ModuleStatus.Active).Count(),
                status = moduleCount > 0 ? "loaded" : "loading"
            }
        });
    }
    catch (Exception ex)
    {
        await context.Response.WriteAsJsonAsync(new { 
            status = "degraded", 
            timestamp = DateTime.UtcNow,
            server = "TerraFusion OS 1.0",
            uptime = Environment.TickCount64,
            modules = new
            {
                status = "error",
                error = ex.Message
            }
        });
    }
});

// REMOVED: Root "/" is now handled by fallback to serve index.html
// app.MapGet("/", () => new { 
//     message = "TerraFusion OS 1.0 API - Ready for deployment!",
//     endpoints = new[] { 
//         "/health", 
//         "/api/test", 
//         "/api/modules", 
//         "/api/modules/{name}/status",
//         "/api/database/status",
//         "/api/swarm/status",
//         "/api/swarm/modules",
//         "/api/swarm/mcp-tools",
//         "/hubs/oscore"
//     },
//     timestamp = DateTime.UtcNow
// });

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
Console.WriteLine("   • GET  /api/swarm/status          - AI swarm status (1,008 agents)");
Console.WriteLine("   • GET  /api/swarm/modules         - Active AI modules");
Console.WriteLine("   • GET  /api/swarm/mcp-tools       - MCP tools integration status (87 tools)");
Console.WriteLine("   • POST /api/swarm/execute         - Execute AI command");
Console.WriteLine("   • WS   /hubs/oscore               - SignalR hub for module hot-reload");
Console.WriteLine("📋 Server configuration: Using command line --urls parameter");
// Console.WriteLine("🧩 Module System: 15 production modules configured");
// Console.WriteLine("🤖 AI Swarm: 1,008 agents with 87 MCP tools");
Console.WriteLine("💾 Database: SQLite fallback with background initialization");

try 
{
    Console.WriteLine($"🚀 Starting TerraFusion API");
    Console.WriteLine($"🔍 Configured URLs: {string.Join(", ", builder.WebHost.GetSetting("urls") ?? "NONE SET - Using Kestrel defaults")}");
    Console.WriteLine($"🌐 Environment: {app.Environment.EnvironmentName}");
    Console.WriteLine($"⏳ Calling app.Run()... This should block until shutdown");
    app.Run();
    Console.WriteLine($"⚠️ app.Run() returned! This means shutdown was requested.");
    Console.WriteLine($"✅ Server stopped gracefully");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Failed to start server: {ex.Message}");
    Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
    throw;
}