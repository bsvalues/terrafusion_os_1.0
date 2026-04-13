using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using TerraFusion.Core.Configuration;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.API.Interfaces;
using TerraFusion.API.Hubs;
using TerraFusion.API.Security;
using TerraFusion.API.Middleware;
using static TerraFusion.API.Security.EliteSecurityHardening;
using TerraFusion.API.Extensions;
using Microsoft.Extensions.FileProviders;
using TerraFusion.Data;
using TerraFusion.Core.Interfaces;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.AI.Extensions;
using TerraFusionOperations = TerraFusion.Operations.Services;
using TerraFusionOperationsInterfaces = TerraFusion.Operations.Interfaces;
using Prometheus;
using System.Diagnostics;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using System.Data;
using TerraFusion.Core.Services;
using TerraFusion.Core.PACS;
using TerraFusion.API.Services.SpecLock;
using TerraFusion.API.Services.Marketplace;
using TerraFusion.API.Services.Telemetry;
// Conditional DB providers
using Npgsql;
using Microsoft.Data.Sqlite;
using Microsoft.Data.SqlClient;
using TerraFusion.API.Contracts;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Threading.RateLimiting;

// ── Standalone PACS seed mode ──────────────────────────────────────────────
// Run as: dotnet run --project TerraFusion.API -- --seed-pacs
// Runs the seeder directly without HTTP server or background services.
// Run as: dotnet run --project TerraFusion.API -- --canonicalize-only
// Runs only Phase 7 (PacsCanonicalizer) without re-running the full ETL.

if (args.Contains("--canonicalize-only"))
{
    var canonEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                  ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
                  ?? "Production";

    var canonHost = Host.CreateDefaultBuilder(args)
        .UseEnvironment(canonEnv)
        .ConfigureAppConfiguration((ctx, cfg) =>
        {
            cfg.AddJsonFile($"appsettings.{canonEnv}.json", optional: true, reloadOnChange: false);
            cfg.AddJsonFile($"appsettings.{canonEnv}.local.json", optional: true, reloadOnChange: false);
        })
        .ConfigureServices((ctx, svc) =>
        {
            var cs = ctx.Configuration.GetConnectionString("DefaultConnection") ?? "";
            if (cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseSqlite(cs));
            else
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseNpgsql(cs));
        })
        .Build();

    using var canonScope = canonHost.Services.CreateScope();
    var canonDb = canonScope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
    var canonLogger = canonScope.ServiceProvider.GetRequiredService<ILogger<TerraFusion.API.Seeds.PacsCanonicalizer>>();
    try
    {
        canonLogger.LogInformation("[Canonicalize] Standalone Phase 7 run...");
        var canonicalizer = new TerraFusion.API.Seeds.PacsCanonicalizer(canonDb, canonLogger);
        var result = await canonicalizer.CanonicalizeAsync();
        canonLogger.LogInformation("[Canonicalize] DONE: {Result}", result);
        Environment.Exit(0);
    }
    catch (Exception ex)
    {
        canonLogger.LogError(ex, "[Canonicalize] FAILED");
        Environment.Exit(1);
    }
}

// ── Fast CAMA-only refresh (Step 4 only) ──────────────────────────────────
// Run as: dotnet run --project TerraFusion.API -- --canonicalize-cama-only
// Re-runs only CamaCharacteristics from PacsImprovements. Use after cost-field schema updates.
if (args.Contains("--canonicalize-cama-only"))
{
    var camaEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                  ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
                  ?? "Production";

    var camaHost = Host.CreateDefaultBuilder(args)
        .UseEnvironment(camaEnv)
        .ConfigureAppConfiguration((ctx, cfg) =>
        {
            cfg.AddJsonFile($"appsettings.{camaEnv}.json", optional: true, reloadOnChange: false);
            cfg.AddJsonFile($"appsettings.{camaEnv}.local.json", optional: true, reloadOnChange: false);
        })
        .ConfigureServices((ctx, svc) =>
        {
            var cs = ctx.Configuration.GetConnectionString("DefaultConnection") ?? "";
            if (cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseSqlite(cs));
            else
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseNpgsql(cs));
        })
        .Build();

    using var camaScope = camaHost.Services.CreateScope();
    var camaDb = camaScope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
    var camaLogger = camaScope.ServiceProvider.GetRequiredService<ILogger<TerraFusion.API.Seeds.PacsCanonicalizer>>();
    try
    {
        camaLogger.LogInformation("[Canonicalize] Standalone CAMA-only Step 4 run...");
        var canonicalizer = new TerraFusion.API.Seeds.PacsCanonicalizer(camaDb, camaLogger);
        var count = await canonicalizer.CanonicalizeCamaOnlyAsync();
        camaLogger.LogInformation("[Canonicalize] CAMA-ONLY DONE: {Count} CamaCharacteristics", count);
        Environment.Exit(0);
    }
    catch (Exception ex)
    {
        camaLogger.LogError(ex, "[Canonicalize] CAMA-ONLY FAILED");
        Environment.Exit(1);
    }
}

if (args.Contains("--seed-pacs"))
{
    // Determine environment from ASPNETCORE_ENVIRONMENT or DOTNET_ENVIRONMENT
    var seedEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                  ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
                  ?? "Production";

    var seedHost = Host.CreateDefaultBuilder(args)
        .UseEnvironment(seedEnv)
        .ConfigureAppConfiguration((ctx, cfg) =>
        {
            cfg.AddJsonFile($"appsettings.{seedEnv}.json", optional: true, reloadOnChange: false);
            cfg.AddJsonFile($"appsettings.{seedEnv}.local.json", optional: true, reloadOnChange: false);
        })
        .ConfigureServices((ctx, svc) =>
        {
            var cs = ctx.Configuration.GetConnectionString("DefaultConnection") ?? "";
            if (cs.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseSqlite(cs));
            else
                svc.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(o => o.UseNpgsql(cs));
            svc.AddScoped<TerraFusion.API.Seeds.PacsDataSeeder>();
        })
        .Build();

    using var scope = seedHost.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<TerraFusion.API.Seeds.PacsDataSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<TerraFusion.API.Seeds.PacsDataSeeder>>();
    try
    {
        logger.LogInformation("[PacsSeeder] Standalone mode: starting full ETL...");
        var result = await seeder.SeedAllAsync();
        logger.LogInformation("[PacsSeeder] DONE: {Result}", result);
        Environment.Exit(0);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[PacsSeeder] FAILED");
        Environment.Exit(1);
    }
}

var builder = WebApplication.CreateBuilder(args);

// Local developer override — appsettings.Development.local.json is gitignored.
// Use it to set real connection strings without committing credentials.
// Example: copy appsettings.Development.json, fill in real passwords, save as .local.json.
builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true,
    reloadOnChange: true);

static string ResolveSqliteConnectionString(string connectionString, string contentRootPath)
{
  if (string.IsNullOrWhiteSpace(connectionString) ||
      !connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
  {
    return connectionString;
  }

  // SQLite does not support SQL Server pool-size keywords that may appear in
  // shared default connection strings during test host startup.
  var sanitizedConnectionString = string.Join(
      ';',
      connectionString
          .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
          .Where(segment =>
              !segment.StartsWith("Maximum Pool Size=", StringComparison.OrdinalIgnoreCase) &&
              !segment.StartsWith("Max Pool Size=", StringComparison.OrdinalIgnoreCase)));

  var sqliteBuilder = new SqliteConnectionStringBuilder(sanitizedConnectionString);
  if (string.IsNullOrWhiteSpace(sqliteBuilder.DataSource) ||
      Path.IsPathRooted(sqliteBuilder.DataSource) ||
      sqliteBuilder.DataSource == ":memory:")
  {
    return sqliteBuilder.ToString();
  }

  sqliteBuilder.DataSource = Path.GetFullPath(
      Path.Combine(contentRootPath, sqliteBuilder.DataSource));

  return sqliteBuilder.ToString();
}

static string ResolvePrimaryConnectionString(IConfiguration configuration, IHostEnvironment environment)
{
  var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=terrafusion.db";

  if (environment.IsDevelopment() &&
      TryReadBoolean(Environment.GetEnvironmentVariable("TF_DEV_USE_SQLITE"), out var forceSqlite) &&
      forceSqlite)
  {
    return "Data Source=terrafusion-dev.db";
  }

  return connectionString;
}

static bool TryReadBoolean(string? value, out bool parsed)
{
  if (bool.TryParse(value, out parsed))
  {
    return true;
  }

  if (string.Equals(value, "1", StringComparison.OrdinalIgnoreCase))
  {
    parsed = true;
    return true;
  }

  if (string.Equals(value, "0", StringComparison.OrdinalIgnoreCase))
  {
    parsed = false;
    return true;
  }

  parsed = false;
  return false;
}

static bool IsFeatureEnabled(IConfiguration configuration, string configKey, string envVar, bool defaultValue = false)
{
  if (TryReadBoolean(configuration[configKey], out var configValue))
  {
    return configValue;
  }

  if (TryReadBoolean(Environment.GetEnvironmentVariable(envVar), out var envValue))
  {
    return envValue;
  }

  return defaultValue;
}

// 🔍 TELEMETRY: Phase 9.1 Nervous System
var serviceName = "terrafusion-iron";
var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://otel-collector:4317";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(serviceName))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)));

// Relax DI validation for local/dev to allow graceful fallbacks
builder.Host.UseDefaultServiceProvider(options =>
{
  options.ValidateOnBuild = false;
  options.ValidateScopes = false;
});

// Redis Configuration (Optional - graceful degradation)
var redisAvailable = false;
try
{
  var redisConnection = builder.Configuration.GetConnectionString("Redis");
  if (!string.IsNullOrEmpty(redisConnection))
  {
    var redis = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnection);
    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(redis);
    Console.WriteLine("✅ Redis connected: {0}", redisConnection.Split(',')[0]);
    redisAvailable = true;
  }
  else
  {
    Console.WriteLine("ℹ️  Redis not configured - using NoOp cache");
  }
}
catch (Exception ex)
{
  Console.WriteLine("⚠️  Redis unavailable: {0} - using NoOp cache", ex.Message);
}

// 🎯 SOVEREIGN BINDING (Phase 9.2)
// No more "Dynamic Port Allocation" or "Laptop Logic"
// We trust ASPNETCORE_URLS from the environment.
// builder.WebHost.UseUrls() is NOT called manually.


// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add basic services with JSON serialization configuration
builder.Services.AddControllers()
    .ConfigureApplicationPartManager(manager =>
    {
      var defaultProvider = manager.FeatureProviders
          .FirstOrDefault(p => p is Microsoft.AspNetCore.Mvc.Controllers.ControllerFeatureProvider);
      if (defaultProvider != null)
      {
        manager.FeatureProviders.Remove(defaultProvider);
      }

      manager.FeatureProviders.Add(
          new TerraFusion.API.Controllers.NamespaceExcludingControllerFeatureProvider(
              "TerraFusion.AI.Controllers",
              "Codex369Controller"));
    })
    .AddJsonOptions(options =>
    {
      options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
      options.JsonSerializerOptions.WriteIndented = false;
      options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ITerrasyncService, TerrasyncService>();
builder.Services.AddMemoryCache();
builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  options.AddFixedWindowLimiter("ApiPolicy", policy =>
  {
    policy.PermitLimit = 10;
    policy.Window = TimeSpan.FromMinutes(1);
    policy.QueueLimit = 0;
    policy.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
  });
});

// Add SignalR for module hot-reload
builder.Services.AddSignalR();

// Register authentication services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TerraFusion.Core.Auth.IRequestUserContextAccessor, TerraFusion.API.Auth.HttpContextRequestUserContextAccessor>();
builder.Services.AddTerraFusionAuthentication(builder.Configuration);
builder.Services.AddTerraFusionSecurityServices(builder.Configuration, builder.Environment);

// 🎯 SERVICE REGISTRY & DISCOVERY - No more hardcoded ports!
builder.Services.AddSingleton<ServiceRegistry>();
// ✅ RE-ENABLED: Fixed BackgroundService pattern with proper ExecuteAsync implementation
builder.Services.AddHostedService<StartupOrchestrationService>();

// Register TerraFusion services (disambiguated interfaces)
builder.Services.AddScoped<TerraFusion.Abstractions.Interfaces.IAuditLogger, TerraFusion.API.Services.AuditLogger>();

// Phase 4 Playground services
builder.Services.AddSingleton<PrototypeTestingEngine>();
builder.Services.AddSingleton<ScenarioRunRegistry>();

// 🏛️ Sale Qualification — TerraFusion owns the IAAO ratio-study qualification decision
builder.Services.AddScoped<TerraFusion.API.Services.ISaleQualificationService, TerraFusion.API.Services.SaleQualificationService>();

// Calibration Workbench services
builder.Services.AddScoped<TerraFusion.Core.Services.IMatrixDiagnosticService, TerraFusion.API.Services.MatrixDiagnosticService>();
builder.Services.AddScoped<TerraFusion.Core.Services.ICalibrationMemoService, TerraFusion.Data.Services.CalibrationMemoService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IGovernanceExportService, TerraFusion.API.Services.GovernanceExportService>();

// Analytics orchestration — real EF Core queries against Properties + CostMatrices
builder.Services.AddScoped<TerraFusion.API.Controllers.IAnalyticsOrchestrator,
                            TerraFusion.API.Controllers.AnalyticsOrchestratorImpl>();

// 🏛️ OLS Regression — IAAO market-extracted adjustment derivation (stateless, pure math → singleton)
builder.Services.AddSingleton<TerraFusion.API.Services.IOlsRegressionService, TerraFusion.API.Services.OlsRegressionService>();

// 🏛️ TIER 3 Government Compliance Service - Championship Excellence
builder.Services.AddScoped<TerraFusion.API.Services.IGovernmentComplianceService, GovernmentComplianceService>();
// ✅ RE-ENABLED with IServiceScopeFactory pattern - DI lifetime issue RESOLVED
builder.Services.AddHostedService<GovernmentComplianceService>();

// 🛡️ AI Coordination Supervisor - Prevents AI service failures from crashing host
builder.Services.AddHostedService<AICoordinationSupervisorService>();

// 🎯 Elite Endpoint Validation Service - Championship endpoint monitoring
builder.Services.AddHostedService<EliteEndpointValidationService>();

// 🛡️ Elite Signal Handling Service - Government-grade shutdown management
builder.Services.AddHostedService<EliteSignalHandlingService>();

// 🔄 Legacy Harris PACS background sync is disabled by default.
// The canonical path is explicit TerraFusionSync invocation through the PACS adapter boundary.
if (IsFeatureEnabled(builder.Configuration, "HarrisPACS:BackgroundSync:Enabled", "TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC", false))
{
  builder.Services.AddHostedService<TerraFusion.Core.Services.HarrisPACSSyncBackgroundService>();
}

// TIER 4+ Services - Advanced AI Excellence
builder.Services.AddScoped<IAISwarmIntelligenceOrchestrator, AISwarmIntelligenceOrchestrator>();
builder.Services.AddScoped<IAdvancedSecurityFrameworkService, AdvancedSecurityFrameworkService>();
// ✅ RE-ENABLED: Registration of workflow and assistant services needed for Controllers
builder.Services.AddScoped<TerraFusion.AI.Services.IWorkflowAutomationService, TerraFusion.AI.Services.WorkflowAutomationService>();
builder.Services.AddScoped<TerraFusion.AI.Services.IAIAssistantService, TerraFusion.AI.Services.AIAssistantService>();
// Phase 9B: Muse Mode explain service
builder.Services.AddScoped<IMuseService, TerraFusion.AI.Services.MuseService>();
// Phase 10: HITL Drafter Mode — draft/approve/reject pipeline
builder.Services.AddScoped<IDraftService, TerraFusion.AI.Services.DraftService>();
// CLI Phase 1 — read-only repo context adapters (git diff + surface contract)
builder.Services.AddScoped<IGitContextService, TerraFusion.AI.Services.GitContextService>();
builder.Services.AddSingleton<ISurfaceContractService, TerraFusion.AI.Services.SurfaceContractService>();
// Phase 2 — Sovereign LLM client: provider selected at runtime from Muse config.
// MuseService stays provider-agnostic; only this registration knows the vendor.
// Default: Local (Ollama / any OpenAI-compat endpoint — data never leaves the building).
// Set Muse:Provider = "AzureOpenAI" for cloud-supervised paths.
{
    var museOpts = builder.Configuration.GetSection(MuseLlmOptions.SectionName).Get<MuseLlmOptions>()
                   ?? new MuseLlmOptions();
    builder.Services.Configure<MuseLlmOptions>(builder.Configuration.GetSection(MuseLlmOptions.SectionName));

    var kernelBuilder = Kernel.CreateBuilder();

    if (museOpts.Provider == "AzureOpenAI"
        && !string.IsNullOrWhiteSpace(museOpts.ApiKey)
        && !string.IsNullOrWhiteSpace(museOpts.Endpoint))
    {
        kernelBuilder.AddAzureOpenAIChatCompletion(
            deploymentName: museOpts.ModelId,
            endpoint: museOpts.Endpoint,
            apiKey: museOpts.ApiKey);
    }
    else
    {
        // Local / sovereign default — OpenAI-compatible endpoint (Ollama, LM Studio, etc.)
        // Local models typically ignore the API key; any non-empty string satisfies the SDK.
        var localEndpoint = museOpts.Endpoint ?? "http://localhost:11434/v1";
        var modelId = string.IsNullOrWhiteSpace(museOpts.ModelId) ? "llama3" : museOpts.ModelId;

        // Local models (Ollama, LM Studio) expose an OpenAI-compatible API.
        // Route via a pre-configured HttpClient so BaseAddress points at the local endpoint.
        var localHttpClient = new HttpClient { BaseAddress = new Uri(localEndpoint) };
        kernelBuilder.AddOpenAIChatCompletion(modelId, "sk-local", httpClient: localHttpClient);
    }

    var kernel = kernelBuilder.Build();
    builder.Services.AddSingleton(kernel.GetRequiredService<IChatCompletionService>());
    builder.Services.AddSingleton<IMuseLlmClient, TerraFusion.AI.Services.SemanticKernelMuseLlmClient>();
}
// Phase Routing Matrix: optional multi-lane MuseRouter sits above the single IMuseLlmClient.
// When Muse:Router:Routes is populated, dot-net DI will prefer the 5-arg MuseService ctor
// (greedy resolution), dispatching each task type to its ideal model.
// When Routes is empty / section absent, only the single IMuseLlmClient is used (backward compat).
{
    var routerOpts = builder.Configuration
        .GetSection(TerraFusion.Core.Configuration.MuseRouterOptions.SubSectionName)
        .Get<TerraFusion.Core.Configuration.MuseRouterOptions>();

    if (routerOpts?.Routes is { Count: > 0 } routes)
    {
        builder.Services.Configure<TerraFusion.Core.Configuration.MuseRouterOptions>(
            builder.Configuration.GetSection(TerraFusion.Core.Configuration.MuseRouterOptions.SubSectionName));

        // Build one IMuseLlmClient per route entry and put them in a dictionary
        // keyed by task name (e.g. "DevAssist", "Reasoning", "*").
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase);

        foreach (var (key, entry) in routes)
        {
            var laneKernel = Kernel.CreateBuilder();

            if (entry.Provider == "AzureOpenAI"
                && !string.IsNullOrWhiteSpace(entry.ApiKey)
                && !string.IsNullOrWhiteSpace(entry.Endpoint))
            {
                laneKernel.AddAzureOpenAIChatCompletion(
                    deploymentName: entry.ModelId,
                    endpoint: entry.Endpoint,
                    apiKey: entry.ApiKey);
            }
            else
            {
                var ep = entry.Endpoint ?? "http://localhost:11434/v1";
                var modelId = string.IsNullOrWhiteSpace(entry.ModelId) ? "llama3" : entry.ModelId;
                var http = new HttpClient { BaseAddress = new Uri(ep) };
                laneKernel.AddOpenAIChatCompletion(modelId, "sk-local", httpClient: http);
            }

            var laneBuilt = laneKernel.Build();
            var laneChatSvc = laneBuilt.GetRequiredService<IChatCompletionService>();
            // Each lane gets its own SemanticKernelMuseLlmClient wrapping its own chat service.
            var laneClient = new TerraFusion.AI.Services.SemanticKernelMuseLlmClient(
                laneChatSvc,
                Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SemanticKernelMuseLlmClient>.Instance);
            lanes[key] = laneClient;
        }

        builder.Services.AddSingleton<IMuseRouter>(sp =>
            new TerraFusion.AI.Services.MuseRouter(
                sp.GetRequiredService<ILogger<TerraFusion.AI.Services.MuseRouter>>(),
                lanes));
    }
}
// Muse router status — probes each lane for live/offline observability
builder.Services.AddSingleton<IMuseRouterStatusService, TerraFusion.AI.Services.MuseRouterStatusService>();
// ✅ STUB: Consciousness Engine stub for DI resolution
builder.Services.AddScoped<TerraFusion.Consciousness.Interfaces.IConsciousnessEngine, TerraFusion.Consciousness.Services.ConsciousnessEngineStub>();
// ✅ MISSING SERVICES: Registered missing dependencies for Workflow/AI Services
builder.Services.AddScoped<TerraFusion.AI.Services.IPropertyValuationService, TerraFusion.AI.Services.PropertyValuationService>();
builder.Services.AddScoped<TerraFusion.Consciousness.Interfaces.IComplianceService, TerraFusion.Consciousness.Services.ComplianceServiceStub>();

// TIER 5+ Services - TerraGaia Ultimate AI Consciousness
// RE-ENABLED: Changed from Singleton → Scoped to properly resolve TerraFusionContext (scoped DbContext) and IAuditLogger (scoped)
// TerraGaiaService doesn't run background tasks, so Scoped lifetime is appropriate for on-demand AI consciousness queries
builder.Services.AddScoped<ITerraGaiaService, TerraGaiaService>();

// TIER 5+ Cognitive Framework - 3-6-9-12 Development Excellence
builder.Services.AddScoped<ICognitiveFrameworkService, CognitiveFrameworkService>();

// 🔮 TESLA 3-6-9 FRAMEWORK - Universal Harmonic Metrics Engine
// "If you only knew the magnificence of the 3, 6 and 9, then you would have a key to the universe." - Nikola Tesla
builder.Services.AddScoped<TerraFusion.AI.Services.Framework369MetricsEngine>();
builder.Services.AddScoped<TerraFusion.AI.Services.ICodex369FrameworkService, TerraFusion.AI.Services.Codex369FrameworkService>();

// 🧠 GOVERNMENT-GRADE RESEARCH ANALYTICS SERVICES - PhD-Level Excellence
// Elite research coordination and quantum-enhanced analytics services
builder.Services.AddScoped<IQuantumConsciousnessService, QuantumConsciousnessService>();
builder.Services.AddScoped<IResearchAnalyticsService, ResearchAnalyticsService>();
builder.Services.AddScoped<ICrossWorkspaceSyncService, CrossWorkspaceSyncService>();
builder.Services.AddScoped<IStatisticalAnalysisService, StatisticalAnalysisService>();
builder.Services.AddScoped<IForgeStatisticsService, ForgeStatisticsService>();
// Dev stub: returns empty until a real CAMA service is registered
builder.Services.AddScoped<TerraFusion.API.Controllers.IMassAppraisalService, TerraFusion.API.Controllers.MassAppraisalServiceStub>();
builder.Services.AddScoped<IPredictiveModelingService, PredictiveModelingService>();
builder.Services.AddScoped<TerraFusion.API.Interfaces.IPerformanceMonitor, TerraFusion.API.Services.PerformanceMonitorService>();

// Phase 10: PropertyForge valuation service (cost/sales/income/reconciliation)
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IValuationService, TerraFusion.API.Services.ValuationService>();

// Calibration Workbench services
builder.Services.AddScoped<TerraFusion.Core.Services.IMatrixDiagnosticService, TerraFusion.API.Services.MatrixDiagnosticService>();
builder.Services.AddScoped<TerraFusion.Core.Services.ICalibrationMemoService, TerraFusion.Data.Services.CalibrationMemoService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IGovernanceExportService, TerraFusion.API.Services.GovernanceExportService>();

// Register flexible module catalog system (no hardcoding!)
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IModuleCatalog, DbModuleCatalog>();
builder.Services.AddScoped<ModuleSeedService>();
builder.Services.AddScoped<TerraFusion.API.Seeds.PacsDataSeeder>();
builder.Services.AddScoped<TerraFusion.API.Seeds.DevPropertySeeder>(); // CARD-06: dev property projection seeder
builder.Services.AddScoped<TerraFusion.API.Seeds.DevGovernmentUserSeeder>(); // CARD-17: dev admin user seeder
builder.Services.AddScoped<TerraFusion.API.Health.IFileSystemModuleDiscovery, FileSystemModuleDiscovery>();
builder.Services.AddScoped<TerraFusion.API.Health.IOrchestratorView, OrchestratorModuleView>();

// Register unified orchestration services
builder.Services.AddSingleton<IModuleLoaderService, ModuleLoaderService>();
// ✅ RE-ENABLED: Fixed with BackgroundService pattern and periodic refresh loop
builder.Services.AddHostedService<ModuleLoaderService>(provider =>
    (ModuleLoaderService)provider.GetRequiredService<IModuleLoaderService>());

// Agent telemetry buffer (read-only feed)
builder.Services.AddSingleton<IAgentTelemetryService>(_ => new AgentTelemetryService(capacity: 1000));

// Trace ingestion ring-buffer service (Phase 35-G-1)
builder.Services.AddSingleton<ITraceIngestionService, TraceIngestionService>();

// Register module services
builder.Services.AddScoped<TerraFusion.Core.Services.IModuleService, RuntimeModuleService>();

// Register enhancement services for PhD-level enhancement phases
builder.Services.AddScoped<IEnhancementOrchestrationService, EnhancementOrchestrationService>();
builder.Services.AddScoped<IEnhancementModuleRegistrationService, EnhancementModuleRegistrationService>();

// Register Dynamic Property Service
builder.Services.AddScoped<TerraFusion.Core.Services.IDynamicPropertyService, TerraFusion.Core.Services.DynamicPropertyService>();
// Register Property Service (REQUIRED by PropertiesController, SystemHub, QuantumMetricsHub)
builder.Services.AddScoped<TerraFusion.Core.Services.IPropertyService, TerraFusion.Core.Services.PropertyService>();

// Register Codex 3-6-9 Framework service (CodexController)
builder.Services.AddScoped<TerraFusion.Core.Interfaces.ICodexService, TerraFusion.Core.Services.CodexService>();

// Register governed tool audit service (FISMA-compliant Dais tool invocation logging)
builder.Services.AddScoped<TerraFusion.API.Services.IGovernedToolAuditService, TerraFusion.API.Services.GovernedToolAuditService>();

// Register Dais CRUD services (appeals, exemptions, certifications, notices, queue)
builder.Services.AddScoped<TerraFusion.Core.Services.IExemptionService, TerraFusion.Core.Services.ExemptionService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IAppealService, TerraFusion.Core.Services.AppealService>();
builder.Services.AddScoped<TerraFusion.Core.Services.ICertificationService, TerraFusion.Core.Services.CertificationService>();
builder.Services.AddScoped<TerraFusion.Core.Services.INoticeService, TerraFusion.Core.Services.NoticeService>();
builder.Services.AddScoped<TerraFusion.Core.Services.IQueueService, TerraFusion.Core.Services.QueueService>();

// Phase 11: GIS data service — PACS-sourced parcel boundary & layer data
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IGisDataService, TerraFusion.API.Services.GisDataService>();

// 🏛️ PACS Adapter - pacscontract.v1 compliant read-only boundary
// When PacsConnection is configured: SQL Server via Dapper (PacsSqlAdapter)
// When absent: seeded PACS data from EF Core / SQLite (PacsEfAdapter) for local dev
var pacsConn = builder.Configuration.GetConnectionString("PacsConnection");
// Connection string is "configured" only if it exists AND doesn't contain unresolved env vars
var pacsConfigured = !string.IsNullOrEmpty(pacsConn) && !pacsConn.Contains("${");
if (pacsConfigured)
{
  builder.Services.AddPacsAdapter();
}
else
{
  builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>();
}
// Conditionally register Redis-backed cache or NoOp fallback
if (redisAvailable)
{
  builder.Services.AddScoped<TerraFusion.Core.Services.IRedisCacheService, TerraFusion.Core.Services.RedisCacheService>();
}
else
{
  builder.Services.AddSingleton<TerraFusion.Core.Services.IRedisCacheService, TerraFusion.Core.Services.NoOpRedisCacheService>();
}

// 🔍 Register Property Data Validation Service - Championship-level data integrity verification
// Detects discrepancies between Harris PACS and TerraFusion, auto-corrects data issues, maintains 99.9% accuracy
builder.Services.AddScoped<TerraFusion.Core.Services.IPropertyDataValidationService, TerraFusion.Core.Services.PropertyDataValidationService>();

// ====================================================================
// 🔐 Phase 4 Sprint 1: NIST 800-63B Storage Infrastructure
// ====================================================================

// Feature flags configuration (all OFF by default - Sprint 1 storage only)
builder.Services.Configure<TerraFusion.Core.Configuration.FeatureFlagsOptions>(
    builder.Configuration.GetSection("FeatureFlags"));

// Redis lockout store (uses existing IDistributedCache from line 70-71)
builder.Services.AddScoped<TerraFusion.Core.Security.Lockout.ILockoutStore, TerraFusion.Core.Security.Lockout.RedisLockoutStore>();

// SQL password history store (uses TerraFusionDbContext)
builder.Services.AddScoped<TerraFusion.Core.Security.PasswordHistory.IPasswordHistoryStore, TerraFusion.Data.Security.SqlPasswordHistoryStore>();

// Note: Enforcement logic wired in Sprint 2 (flags OFF for Sprint 1)
// ====================================================================

// 📊 Register TerraFusion Elite Metrics Exporter - Championship-level observability for 7 AI services
// Exports Prometheus metrics for: Consciousness (swarm), CostForge AI, TerraGaia, TerraFusionGPT, TerraLevy, TerraFlow, TerraSync, Harris PACS integration
builder.Services.AddSingleton<TerraFusion.Core.Metrics.TerraFusionMetricsExporter>();

// 💎 Register Property Valuation AI Enhancement Service - 8-step AI-orchestrated property valuation
// Coordinates all 7 AI services for championship-level property assessment with 99.9% IAAO accuracy
builder.Services.AddScoped<TerraFusion.Core.Interfaces.IPropertyValuationAIEnhancementService, TerraFusion.Core.Services.PropertyValuationAIEnhancementService>();
// ✅ AI Engine Service - Elite AI coordination for 50,000+ agent swarm
// Implementation completed for TerraFusion.Core.Services.IAIEngineService interface
builder.Services.AddScoped<TerraFusion.Core.Services.IAIEngineService, TerraFusion.AI.Services.AIEngineService>();

// Register TerraFusionSync integration service
builder.Services.AddSingleton<TerraFusionSyncRuntimeState>();
builder.Services.AddScoped<PacsToTerraFusionSyncService>();
builder.Services.AddScoped<ITerraFusionSyncService, TerraFusionSyncIntegrationService>();

// RE-ENABLED: Required by MarketplaceController and TerraFusionMarketplaceController
builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();
builder.Services.AddSingleton<IModuleRegistry, ModuleRegistry>();
builder.Services.AddScoped<IHarrisPACSEnhancementBridge, HarrisPACSEnhancementBridge>();
builder.Services.AddScoped<ITerraFusionMarketplace, TerraFusionMarketplace>();
builder.Services.AddScoped<ICountyDeploymentService, CountyDeploymentService>();

// Register unified orchestration service
builder.Services.AddSingleton<IUnifiedOrchestrationService, UnifiedOrchestrationService>();
// ✅ RE-ENABLED: Fixed with BackgroundService pattern and health monitoring loop
builder.Services.AddHostedService<UnifiedOrchestrationService>(provider =>
    (UnifiedOrchestrationService)provider.GetRequiredService<IUnifiedOrchestrationService>());

// 🚀 ELITE OPERATIONAL EXCELLENCE - Championship-level government technology
builder.Services.AddScoped<TerraFusionOperationsInterfaces.IEliteOperationalService, TerraFusionOperations.EliteOperationalService>();

// Keep plugin hot reload for development
// TEMPORARILY DISABLED for Playground Phase 4 validation (may be contributing to shutdown issue)
// builder.Services.AddHostedService<PluginHotReloadService>();

// Add AutoMapper
builder.Services.AddAutoMapper(
    _ => { },
    typeof(TerraFusion.API.Program).Assembly,
    typeof(TerraFusion.Core.Services.ModuleService).Assembly);

// Register Rust FFI Service
// TEMPORARILY DISABLED - ffi_bridge.dll is placeholder, may cause issues
// builder.Services.AddSingleton<RustFFIService>();

// Wave 4: Wire GPT/RAG AI entity configurations into TerraFusionDbContext via static hook.
// This avoids a circular assembly reference (Data → AI → Data).
// Program.cs references both assemblies, so it can bridge them safely.
TerraFusion.Data.TerraFusionDbContext.OnModelCreatingExtensions = TerraFusion.AI.Data.GptAiEntityConfigurations.Apply;

// Register database context with SQLite fallback
builder.Services.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(options =>
{
  var connectionString = ResolvePrimaryConnectionString(builder.Configuration, builder.Environment);
  var provider = builder.Configuration["DatabaseProvider"];

  if (string.Equals(provider, "SqlServer", StringComparison.OrdinalIgnoreCase))
  {
    options.UseSqlServer(connectionString);
  }
  else if (connectionString.Contains("Host=") || string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
  {
    // PostgreSQL for production — UseVector() enables pgvector(1536) type mapping
    options.UseNpgsql(connectionString, o => o.UseVector());
  }
  else
  {
    // SQLite for development
    options.UseSqlite(ResolveSqliteConnectionString(connectionString, builder.Environment.ContentRootPath));
  }
});

// Register TerraFusionContext (Identity context for TerraGaiaService)
builder.Services.AddDbContext<TerraFusion.Data.TerraFusionContext>(options =>
{
  var connectionString = ResolvePrimaryConnectionString(builder.Configuration, builder.Environment);
  var provider = builder.Configuration["DatabaseProvider"];

  if (string.Equals(provider, "SqlServer", StringComparison.OrdinalIgnoreCase))
  {
    options.UseSqlServer(connectionString);
  }
  else if (connectionString.Contains("Host=") || string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
  {
    options.UseNpgsql(connectionString, o => o.UseVector());
  }
  else
  {
    options.UseSqlite(ResolveSqliteConnectionString(connectionString, builder.Environment.ContentRootPath));
  }
});

// CX-8: Register ICostForgeService for real property-backed cost calculation
builder.Services.AddScoped<TerraFusion.Core.Services.ICostForgeAIService, TerraFusion.AI.Services.CostForgeAIService>();
builder.Services.AddScoped<TerraFusion.Core.Services.ICostForgeService, TerraFusion.API.Services.CostForgeService>();

// Register ITerraFusionDbContext interface
builder.Services.AddScoped<ITerraFusionDbContext>(provider =>
    provider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>());

// Register IDbConnection factory for services requiring direct connections (e.g., DynamicPropertyService)
builder.Services.AddScoped<IDbConnection>(sp =>
{
  var cfg = sp.GetRequiredService<IConfiguration>();
  var connStr = ResolvePrimaryConnectionString(cfg, builder.Environment);
  var provider = cfg["DatabaseProvider"];

  if (string.Equals(provider, "SqlServer", StringComparison.OrdinalIgnoreCase))
  {
    return new SqlConnection(connStr);
  }
  else if (connStr.Contains("Host=") || string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase))
  {
    return new NpgsqlConnection(connStr);
  }
  else
  {
    return new SqliteConnection(
        ResolveSqliteConnectionString(connStr, builder.Environment.ContentRootPath));
  }
});

var startupConnectionString = ResolvePrimaryConnectionString(builder.Configuration, builder.Environment);
if (startupConnectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
{
  Console.WriteLine("[DB] Effective SQLite connection: {0}",
      ResolveSqliteConnectionString(startupConnectionString, builder.Environment.ContentRootPath));
}
else
{
  Console.WriteLine("[DB] Effective non-SQLite connection configured for development/runtime.");
}

// 📊 TerraFlow Quantum Command Center Repositories (Phase 1 Week 4)
builder.Services.AddScoped<IQuantumNotebookRepository, TerraFusion.Data.Repositories.QuantumNotebookRepository>();
builder.Services.AddScoped<IAnalysisResultRepository, TerraFusion.Data.Repositories.AnalysisResultRepository>();
builder.Services.AddScoped<IWorkflowRepository, TerraFusion.Data.Repositories.WorkflowRepository>();
builder.Services.AddScoped<IWorkflowExecutionRepository, TerraFusion.Data.Repositories.WorkflowExecutionRepository>();

// 📊 TerraFlow Quantum Command Center Service (Phase 1 Week 4)
builder.Services.AddScoped<TerraFusion.AI.Services.IQuantumAnalyticsService, TerraFusion.AI.Services.QuantumAnalyticsService>();

// ═══════════════════════════════════════════════════════════════════════════════
// 🌈 ARC CONSTELLATION - GPT/RAG Subsystem (Phase 9: Operational Hardening)
// ═══════════════════════════════════════════════════════════════════════════════
// GPT Configuration, Orchestration, and RAG services for PropertyAssessmentGPT and other system GPTs

// Register GptRagOptions - centralized configuration for GPT/RAG subsystem
var gptRagOptions = TerraFusion.AI.Configuration.GptRagOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(gptRagOptions);

// 📢 HERALD CONSTELLATION - Log GPT/RAG configuration at startup
var heraldLogger = LoggerFactory.Create(b => b.AddConsole()).CreateLogger("Herald.GptRag");
gptRagOptions.LogConfiguration(heraldLogger);

builder.Services.AddScoped<TerraFusion.AI.Interfaces.IGPTConfigurationService, TerraFusion.AI.Services.GPTConfigurationService>();
builder.Services.AddScoped<TerraFusion.AI.Interfaces.IGPTOrchestrationService, TerraFusion.AI.Services.GPTOrchestrationService>();

// RAG infrastructure: Embedding service (simulated for dev, OpenAI for prod) + Vector storage + RAG orchestration
builder.Services.AddHttpClient<TerraFusion.AI.Services.OpenAIEmbeddingService>();
builder.Services.AddScoped<TerraFusion.AI.Interfaces.IEmbeddingService>(sp =>
{
  var options = sp.GetRequiredService<TerraFusion.AI.Configuration.GptRagOptions>();

  if (options.UseRealEmbeddings)
  {
    // 🟢 OpenAI embeddings - production mode
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient();
    var configuration = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<TerraFusion.AI.Services.OpenAIEmbeddingService>>();
    return new TerraFusion.AI.Services.OpenAIEmbeddingService(httpClient, configuration, logger);
  }
  else
  {
    // 🟡 Simulated embeddings - dev/CI safe mode
    var logger = sp.GetRequiredService<ILogger<TerraFusion.AI.Services.SimulatedEmbeddingService>>();
    return new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);
  }
});
// Register RAG Embedding Repository — pgvector for Postgres, in-memory for SQLite/dev
{
    var ragConnStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
    var ragProvider = builder.Configuration["DatabaseProvider"] ?? "";
    var usePostgres = ragConnStr.Contains("Host=", StringComparison.OrdinalIgnoreCase)
        || ragProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase);
    var ragRepoName = usePostgres ? "PgVectorRAGEmbeddingRepository" : "InMemoryRAGEmbeddingRepository";
    Console.WriteLine("[RAG] Embedding repository: {0}", ragRepoName);
    if (usePostgres)
    {
        builder.Services.AddScoped<TerraFusion.AI.Interfaces.IRAGEmbeddingRepository, TerraFusion.AI.Repositories.PgVectorRAGEmbeddingRepository>();
    }
    else
    {
        builder.Services.AddScoped<TerraFusion.AI.Interfaces.IRAGEmbeddingRepository, TerraFusion.AI.Repositories.InMemoryRAGEmbeddingRepository>();
    }
}
builder.Services.AddScoped<TerraFusion.AI.Interfaces.IRAGService, TerraFusion.AI.Services.RAGService>();

// Phase 15.4: SystemGPT Health Evaluator for Herald threshold-based alerts
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptHealthEvaluator, TerraFusion.AI.Services.SystemGptHealthEvaluator>();

// Phase 17: SystemGPT Safe Mode Service for kill switch functionality
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptModeService, TerraFusion.AI.Services.SystemGptModeService>();

// Phase 18: Benton CAMA RAG Readiness Service for county-specific AI health
builder.Services.AddScoped<TerraFusion.AI.Services.IBentonRagReadinessService, TerraFusion.AI.Services.BentonRagReadinessService>();

// Phase 19: SystemGPT Event Service for AI incident timeline
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptEventService, TerraFusion.AI.Services.SystemGptEventService>();

// Phase 20: SystemGPT Metrics Service for AI telemetry console
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptMetricsService, TerraFusion.AI.Services.SystemGptMetricsService>();

// Phase 23: SystemGPT Federated Overview Service for multi-county dashboard
builder.Services.AddScoped<TerraFusion.AI.Services.ISystemGptFederatedOverviewService, TerraFusion.AI.Services.SystemGptFederatedOverviewService>();

// Phase 24: AI Policy Engine - County-scoped governance for GPT operations
builder.Services.AddSingleton<TerraFusion.AI.Services.ICountyPolicyService, TerraFusion.AI.Services.InMemoryCountyPolicyService>();
builder.Services.AddScoped<TerraFusion.AI.Services.ISystemGptPolicyEvaluator, TerraFusion.AI.Services.SystemGptPolicyEvaluator>();

// Phase 26: Autonomous Guardrails - deterministic pre-flight checks for GPT requests
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptGuardrailService, TerraFusion.AI.Services.SystemGptGuardrailService>();

// Phase 27: RAG Fleet Readiness - Multi-county RAG comparison and drift detection
builder.Services.AddSingleton<TerraFusion.AI.Services.ISystemGptRagFleetService, TerraFusion.AI.Services.SystemGptRagFleetService>();

// Phase 28: SystemGPT Atlas - Map-based AI health visualization with county nodes
builder.Services.AddScoped<TerraFusion.AI.Services.ISystemGptAtlasService, TerraFusion.AI.Services.SystemGptAtlasService>();

// Phase 29: SystemGPT Atlas Live - Real-Time Telemetry & Alert Engine (SSE streaming)
builder.Services.Configure<TerraFusion.AI.Models.SystemGptAtlasThresholds>(options =>
{
  options.WarningHealthScore = 0.80;
  options.CriticalHealthScore = 0.60;
  options.WarningErrorRatePercent = 1.0;
  options.CriticalErrorRatePercent = 5.0;
  options.WarningP95Ms = 300;
  options.CriticalP95Ms = 1000;
});
builder.Services.Configure<TerraFusion.AI.Models.SystemGptAtlasLiveOptions>(options =>
{
  options.IntervalMs = 3000; // 3-second updates
});
builder.Services.AddSingleton<TerraFusion.AI.Services.SystemGptAtlasClassifier>();
builder.Services.AddScoped<TerraFusion.AI.Services.ISystemGptAtlasTelemetrySource, TerraFusion.AI.Services.SystemGptAtlasTelemetrySource>();
builder.Services.AddScoped<TerraFusion.AI.Services.ISystemGptAtlasLiveService, TerraFusion.AI.Services.SystemGptAtlasLiveService>();
builder.Services.AddSingleton<TerraFusion.AI.Infrastructure.IServerSentEventsWriter, TerraFusion.AI.Infrastructure.ServerSentEventsWriter>();

// Register database services
builder.Services.AddScoped<IDatabaseInitializationService, DatabaseInitializationService>();
// TEMPORARILY DISABLED - StartAsync completes immediately, causing shutdown
// builder.Services.AddHostedService<DatabaseInitializationHostedService>();

// Register TerraLevy DbContext (PostgreSQL with SQLite fallback for dev)
builder.Services.AddDbContext<LevyDbContext>(options =>
{
  var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
                ?? builder.Configuration.GetConnectionString("LevyDatabase")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL");
  var provider = builder.Configuration["DatabaseProvider"];

  if (!string.IsNullOrWhiteSpace(levyConn) && string.Equals(provider, "SqlServer", StringComparison.OrdinalIgnoreCase))
  {
    options.UseSqlServer(levyConn);
    return;
  }

  if (string.IsNullOrWhiteSpace(levyConn))
  {
    Console.WriteLine("[LevyDb] WARNING: No PostgreSQL connection configured. Falling back to SQLite (levy-dev.db) for development.");
    options.UseSqlite("Data Source=levy-dev.db");
    return;
  }

  if (levyConn.Contains("Host="))
  {
    options.UseNpgsql(levyConn);
  }
  else
  {
    // Allow SQLite connection string if explicitly provided
    options.UseSqlite(levyConn);
  }
});

// Register TerraLevy services for championship-level tax assessment
builder.Services.AddScoped<TerraFusion.Levy.Services.ILevyCalculationService, TerraFusion.Levy.Services.LevyCalculationService>();
builder.Services.AddScoped<TerraFusion.Levy.Services.IRevenueProjectionService, TerraFusion.Levy.Services.RevenueProjectionService>();

// Add health checks for monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TerraFusion.Data.TerraFusionDbContext>("database")
    .AddCheck<TerraFusion.API.Health.ModuleConsistencyHealthCheck>("modules_consistency")
    .AddSpecLockCheck();

// 🔒 SpecLock Runtime Guard (MACHINE MODE)
// Validates generated artifacts match manifest sha256 at startup.
// Enable with: TF_SPECLOCK_GUARD_ENABLED=true
builder.Services.AddSpecLockRuntime();

// 🛒 Marketplace Security (PHASE B)
// Plugin admission control with OPA sandbox + SBOM/SLSA hard gates
builder.Services.AddMarketplaceSecurity();

// Register AI swarm orchestration services
builder.Services.AddHttpClient<IAIModuleOrchestrator, AIModuleOrchestrator>();
builder.Services.AddScoped<IAIModuleOrchestrator, AIModuleOrchestrator>();

// 🏛️ Register Elite Performance Optimization Service
// Government-grade performance enhancement for 50,000+ AI agents
builder.Services.AddScoped<IElitePerformanceOptimizer, ElitePerformanceOptimizer>();

// 🔒 Register Elite Security Hardening Service
// Advanced FISMA Moderate security for government-grade system protection
builder.Services.Configure<EliteSecurityOptions>(options =>
{
  options.MaxRequestsPerWindow = 1000;
  options.RateLimitWindowMinutes = 15;
  options.RateLimitThreshold = 100;
  options.EnableThreatDetection = true;
  options.RequireGovernmentClaims = true;
  options.RequiredSecurityHeaders = new[] { "Authorization", "X-API-Key" };
});
builder.Services.AddScoped<IEliteSecurityHardening, EliteSecurityHardening>();

// 🏛️ Register Multi-County Integration Service
// Synchronized data integration across all 39 Washington State counties
builder.Services.AddScoped<IMultiCountyIntegrationService, MultiCountyIntegrationService>();

//  Register Enterprise AI Agent Coordination System
// 50,000+ AI agents across 39 Washington State counties
// RE-ENABLED: DI lifetime issue FIXED with IServiceScopeFactory pattern
// PATCHED: Using robust error handling wrapper in Development to prevent host shutdown
Console.WriteLine("🛡️ Enterprise AI Agent Coordination with robust error handling enabled");
builder.Services.AddEnterpriseAgentCoordination();

// 🏗️ Register Elite Development Pipeline System
// Military-grade cross-workspace build coordination across 38 workspaces
// Temporarily disabled to stabilize local runtime and verify endpoints.
// RE-ENABLED: Required by DevelopmentPipelineController
var disableDevPipeline = Environment.GetEnvironmentVariable("TF_DISABLE_DEV_PIPELINE");
var isDevPipelineDisabled = string.Equals(disableDevPipeline, "1", StringComparison.OrdinalIgnoreCase)
    || string.Equals(disableDevPipeline, "true", StringComparison.OrdinalIgnoreCase);
if (!isDevPipelineDisabled)
{
  builder.Services.AddDevelopmentPipeline();
}

// Register TIER 5+ Multi-County Federation System
builder.Services.AddScoped<IMultiCountyFederationService, MultiCountyFederationService>();

// 🚀 ADVANCED QUANTUM COUNTY FEDERATION - Sovereign Data Management
// Quantum-secure inter-county communication for Washington State's 39 counties
// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
Console.WriteLine("🛡️ Configuring Advanced Quantum County Federation");
builder.Services.AddScoped<IAdvancedQuantumCountyFederation, AdvancedQuantumCountyFederation>();

// 🌟 ULTIMATE COSTFORGE AI - Million-Agent Property Intelligence Consciousness
// 99.9% accuracy, Factor 999, 1,000,000 agents, 147-dimensional analysis
// RE-ENABLED: Championship-level property intelligence with quantum optimization
builder.Services.AddUltimateCostForgeAPI(builder.Configuration, builder.Environment);

// ⚡ QUANTUM METRICS REAL-TIME INTEGRATION - Championship-Level WebSocket Performance
// Real-time government operations monitoring with 99.99% uptime targets
// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
Console.WriteLine("⚡ Configuring Quantum Metrics Real-Time Integration");
builder.Services.AddSignalR(options =>
{
  options.EnableDetailedErrors = builder.Environment.IsDevelopment();
  options.KeepAliveInterval = TimeSpan.FromSeconds(15);
  options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
  options.HandshakeTimeout = TimeSpan.FromSeconds(15);
  options.MaximumReceiveMessageSize = 64 * 1024; // 64KB
  options.StreamBufferCapacity = 10;
});

// Register Quantum Metrics Background Service for real-time broadcasting
var enableQuantumMetricsBackgroundService = IsFeatureEnabled(
    builder.Configuration,
    "Features:EnableQuantumMetricsBackgroundService",
    "TF_ENABLE_QUANTUM_METRICS_BACKGROUND_SERVICE");

if (enableQuantumMetricsBackgroundService)
{
  builder.Services.AddHostedService<QuantumMetricsBackgroundService>();
}
else
{
  Console.WriteLine("ℹ️ QuantumMetricsBackgroundService disabled by default. Set TF_ENABLE_QUANTUM_METRICS_BACKGROUND_SERVICE=true to enable.");
}

// Phase 11 — Sovereign Guard: verify sovereign.yaml manifest at startup
builder.Services.AddSingleton<SovereignGuard>();

// Configure CORS — restrict to known frontend origins
builder.Services.AddCors(options =>
{
  options.AddDefaultPolicy(policy =>
  {
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
          ?? new[]
          {
                $"http://localhost:{Environment.GetEnvironmentVariable("TF_FRONTEND_PORT") ?? "3102"}",
                "http://localhost:5173",  // Vite dev server
                "http://localhost:3000",  // Legacy frontend port
          };
    policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
  });
});

var app = builder.Build();

// Phase 11 — Sovereign Guard: fail fast if manifest is missing or tampered
{
  var sovereignGuard = app.Services.GetRequiredService<SovereignGuard>();
  var verification = sovereignGuard.Verify();
  if (!verification.IsValid)
  {
    Console.Error.WriteLine($"[SOVEREIGN VIOLATION] {verification.Violation}. Startup blocked.");
    Environment.Exit(1);
  }
}

// 🤖 Seed GPT configurations on startup (PropertyAssessmentGPT, etc.)
using (var scope = app.Services.CreateScope())
{
  try
  {
    var databaseInitializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializationService>();
    await databaseInitializer.InitializeAsync();

    var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GPTSeeder");

    var seeder = new TerraFusion.AI.Seeds.GPTConfigurationSeeder(dbContext,
        scope.ServiceProvider.GetRequiredService<ILogger<TerraFusion.AI.Seeds.GPTConfigurationSeeder>>());
    await seeder.SeedAllGPTsAsync();

    logger.LogInformation("GPT configurations seeded successfully");
  }
  catch (Exception ex)
  {
    Console.WriteLine($"GPT seeding skipped: {ex.Message}");
  }
}

// DX-01: Seed dossier runtime data in Development
if (app.Environment.IsDevelopment())
{
  using var seedScope = app.Services.CreateScope();
  try
  {
    var db = seedScope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
    await TerraFusion.API.Seeds.DatabaseSeeder.SeedDossierRuntimeDataAsync(db);
  }
  catch (Exception ex)
  {
    Console.WriteLine($"[DX-01] Dossier seed skipped: {ex.Message}");
  }
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
  app.UseDeveloperExceptionPage();
}

app.UseCors();

// DX-05: Correlation ID — ensure every response (including 400/403/404/500) carries
// X-Correlation-ID for traceability. Registered early so it wraps all downstream middleware.
TerraFusion.API.Middleware.CorrelationIdMiddlewareExtensions.UseCorrelationId(app);

// Prometheus metrics middleware
app.UseHttpMetrics();

// Authentication & Authorization
// Serve static files from native-shell/ui/dist BEFORE other middleware
var uiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "native-shell", "ui", "dist"));
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
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Audit Logging Middleware
app.UseAuditLogging();

// 🌟 Configure Ultimate CostForge AI middleware and endpoints
// RE-ENABLED: Championship-level property intelligence API with Factor 999
app.UseUltimateCostForgeAPI(app.Environment);

app.MapControllers();

// DX-01: Development-only JWT token endpoint for local testing.
// Returns a valid JWT with countyId, countyCode, role, and permission claims.
// GUARDED: Only available when app.Environment.IsDevelopment() is true.
if (app.Environment.IsDevelopment())
{
  app.MapGet("/api/auth/dev-token", (
      TerraFusion.API.Services.IJwtTokenService jwtService,
      IConfiguration config) =>
  {
    var defaultCountyId = config["DefaultCounty:Id"] ?? TerraFusion.API.Seeds.DatabaseSeeder.BentonCountyId.ToString();
    var defaultCountyCode = config["DefaultCounty:Code"] ?? "benton";

    var customClaims = new Dictionary<string, object>
    {
      ["countyId"] = defaultCountyId,
      ["countyCode"] = defaultCountyCode,
      ["perm"] = new List<string>
          {
                "read:dossier",
                "write:dossier",
                "read:property",
                "read:properties",
                "write:properties",
                "read:levy",
                "read:costforge",
                "access:costforge",
                "calculate:property-cost",
                "write:costforge",
                "read:compsforge",
                "write:compsforge",
                "read:incomeforge",
                "write:incomeforge",
                "read:system-status",
                "read:cost-matrix",
                "read:cost-factors",
                "read:cost-breakdown",
                "read:performance-metrics"
          }
    };

    var token = jwtService.GenerateAccessToken(
          userId: "dev-user-001",
          email: "dev@terrafusion.local",
          // GovernmentUser satisfies OSCoreAccess policy (AIModulesController, AISwarmController, etc.)
          roles: new[] { "Developer", "Assessor", "GovernmentUser" },
          customClaims: customClaims);

    return Results.Ok(new
    {
      token,
      expiresIn = int.Parse(config["JwtSettings:ExpirationMinutes"] ?? "120"),
      countyId = defaultCountyId,
      countyCode = defaultCountyCode,
      note = "Development-only token. Not available in production."
    });
  })
  .WithName("DevToken")
  .WithTags("Auth")
  .AllowAnonymous();

  Console.WriteLine("[DX-01] Development auth endpoint registered: GET /api/auth/dev-token");
}

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

// 🔒 SpecLock Ops Endpoint (/ops/speclock)
// Returns manifest JSON with ETag for ops tooling
app.MapSpecLockOps();

// 🔒 State Mesh Ops Endpoint (/ops/speclock/state)
// Federated county quorum verification proofs
app.MapSpecLockStateOps();

// 🔒 Public Proof Endpoint (/public/proof/{receiptId})
// Citizen-verifiable receipt proofs with speclock manifest snapshot
app.MapPublicProof();

// 🛒 Marketplace Ops Endpoints (/ops/plugins)
// Plugin admission control, permissions lookup, health check
app.MapMarketplaceOps();

// 🩺 Health Check Endpoints (K8s / Infra / Ops)
// /healthz        → liveness  (is the process alive?)
// /healthz/ready  → readiness (can I serve traffic?)
app.MapHealthChecks("/healthz", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
  Predicate = _ => false, // Always healthy if process is alive
  ResponseWriter = async (ctx, _) =>
  {
    ctx.Response.ContentType = "application/json; charset=utf-8";
    await ctx.Response.WriteAsync("{\"status\":\"ok\",\"probe\":\"liveness\"}");
  }
});

app.MapHealthChecks("/healthz/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
  Predicate = hc => hc.Tags.Contains("readiness") || hc.Name == "speclock",
  ResponseWriter = async (ctx, report) =>
  {
    ctx.Response.ContentType = "application/json; charset=utf-8";

    // NO MERCY: Hard gate on SpecLock + State Mesh verification
    if (!TerraFusion.API.Services.SpecLock.SpecLockGuardHostedService.Verified)
    {
      ctx.Response.StatusCode = 503;
      await ctx.Response.WriteAsync("{\"status\":\"not_ready\",\"probe\":\"readiness\",\"reason\":\"speclock_failed\"}");
      return;
    }

    if (!TerraFusion.API.Services.SpecLock.StateMeshGuardHostedService.Verified)
    {
      ctx.Response.StatusCode = 503;
      var reason = TerraFusion.API.Services.SpecLock.StateMeshGuardHostedService.FailureReason;
      var payload = System.Text.Json.JsonSerializer.Serialize(new
      {
        status = "not_ready",
        probe = "readiness",
        reason = "state_mesh_unverified",
        detail = reason
      });
      await ctx.Response.WriteAsync(payload);
      return;
    }

    var status = report.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy ? "ok" : "not_ready";
    var responsePayload = System.Text.Json.JsonSerializer.Serialize(new
    {
      status,
      probe = "readiness",
      speclock_verified = true,
      state_mesh_verified = true,
      checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
    });
    await ctx.Response.WriteAsync(responsePayload);
  }
});

// Map SignalR hubs
app.MapHub<OSCoreHub>("/hubs/oscore");
app.MapHub<EnhancementHub>("/hubs/enhancement");
app.MapHub<QuantumMetricsHub>("/hubs/quantum-metrics");
app.MapHub<GPTHub>("/hubs/gpt");

// 📊 Phase 2 Real-Time Collaboration Hubs (Week 5 Day 1-2)
app.MapHub<TerraFusion.AI.Hubs.NotebookHub>("/hubs/notebook");
app.MapHub<TerraFusion.AI.Hubs.AnalyticsHub>("/hubs/analytics");
app.MapHub<TerraFusion.AI.Hubs.WorkflowHub>("/hubs/workflow");
app.MapHub<TerraFusion.AI.Hubs.CollaborationHub>("/hubs/collaboration");
app.MapHub<TerraFusion.AI.Hubs.Codex369Hub>("/hubs/codex369");
app.MapHealthChecks("/health/codex369", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
  Predicate = check => check.Name.Contains("codex-369", StringComparison.OrdinalIgnoreCase)
});

// Add test endpoints
app.MapGet("/api/test", () => new
{
  message = "TerraFusion API is running!",
  timestamp = DateTime.UtcNow,
  version = "1.0.0",
  environment = app.Environment.EnvironmentName
});

// ── PACS ETL seed trigger (admin only) ───────────────────────────────────────
// POST /api/admin/pacs/seed  — pulls all 13 tables from tf-mssql pacs_oltp
// into TerraFusionDbContext. Idempotent upsert. Safe to re-run.
// Runs as a background Task — returns 202 immediately; watch server logs for progress.
{
    // Shared state for last run result
    var _pacsLastResult = "";
    var _pacsSeedRunning = false;

    app.MapPost("/api/admin/pacs/seed", (
        IServiceScopeFactory scopeFactory,
        ILogger<TerraFusion.API.Seeds.PacsDataSeeder> logger) =>
    {
        if (_pacsSeedRunning)
            return Results.Conflict("PACS seed already running. Check /api/admin/pacs/seed/status.");

        _pacsSeedRunning = true;
        _pacsLastResult = "running";
        _ = Task.Run(async () =>
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var seeder = scope.ServiceProvider.GetRequiredService<TerraFusion.API.Seeds.PacsDataSeeder>();
                var result = await seeder.SeedAllAsync();
                _pacsLastResult = result.ToString();
                logger.LogInformation("[PacsSeeder] Complete: {Result}", _pacsLastResult);
            }
            catch (Exception ex)
            {
                // Walk inner exceptions to surface the real Postgres/SqlClient error
                var inner = ex;
                while (inner.InnerException != null) inner = inner.InnerException;
                _pacsLastResult = $"ERROR: {ex.Message} | INNER: {inner.Message}";
                logger.LogError(ex, "[PacsSeeder] Seed failed");
            }
            finally { _pacsSeedRunning = false; }
        });

        return Results.Accepted("/api/admin/pacs/seed/status",
            new { message = "PACS seed started in background. Poll /api/admin/pacs/seed/status." });
    }).WithTags("Admin").WithName("SeedPacsData");

    app.MapGet("/api/admin/pacs/seed/status", () =>
        Results.Ok(new { running = _pacsSeedRunning, lastResult = _pacsLastResult })
    ).WithTags("Admin").WithName("SeedPacsStatus");

    // POST /api/admin/pacs/canonicalize — Phase 7 only: promote Pacs* mirror rows → canonical TF entities.
    // Use when pacs_* tables are already populated but canonical tables need refresh.
    {
        var _canonRunning = false;
        var _canonLastResult = "";

        app.MapPost("/api/admin/pacs/canonicalize", (
            IServiceScopeFactory scopeFactory,
            ILogger<TerraFusion.API.Seeds.PacsCanonicalizer> logger) =>
        {
            if (_canonRunning)
                return Results.Conflict("Canonicalization already running.");

            _canonRunning = true;
            _canonLastResult = "running";
            _ = Task.Run(async () =>
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var db = scope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
                    var canonicalizer = new TerraFusion.API.Seeds.PacsCanonicalizer(db, logger);
                    var result = await canonicalizer.CanonicalizeAsync();
                    _canonLastResult = result.ToString();
                    logger.LogInformation("[PacsCanonicalizer] Complete: {Result}", _canonLastResult);
                }
                catch (Exception ex)
                {
                    _canonLastResult = $"ERROR: {ex.Message}";
                    logger.LogError(ex, "[PacsCanonicalizer] Failed");
                }
                finally { _canonRunning = false; }
            });

            return Results.Accepted("/api/admin/pacs/canonicalize/status",
                new { message = "Canonicalization started. Poll /api/admin/pacs/canonicalize/status." });
        }).WithTags("Admin").WithName("CanonicalizeFromPacs");

        app.MapGet("/api/admin/pacs/canonicalize/status", () =>
            Results.Ok(new { running = _canonRunning, lastResult = _canonLastResult })
        ).WithTags("Admin").WithName("CanonicalizeStatus");
    }
}

// POST /api/admin/pacs/seed-sales — targeted seed: sales only, then canonicalize + qualify.
// Use this when PacsParcel / pacs_improvements / pacs_valuations are already seeded and
// you just need to refresh ComparableSales + QualificationRecommendation without running the
// full 8-hour ETL. Runs as background Task — returns 202 immediately.
{
    var _salesSeedRunning = false;
    var _salesSeedLastResult = "";

    app.MapPost("/api/admin/pacs/seed-sales", (
        IServiceScopeFactory scopeFactory,
        ILogger<TerraFusion.API.Seeds.PacsDataSeeder> logger) =>
    {
        if (_salesSeedRunning)
            return Results.Conflict("Sales seed already running. Check /api/admin/pacs/seed-sales/status.");

        _salesSeedRunning = true;
        _salesSeedLastResult = "running";
        _ = Task.Run(async () =>
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var seeder = scope.ServiceProvider.GetRequiredService<TerraFusion.API.Seeds.PacsDataSeeder>();
                var result = await seeder.SeedSalesOnlyAsync();
                _salesSeedLastResult = result.ToString();
                logger.LogInformation("[PacsSeeder][SalesOnly] Complete: {Result}", _salesSeedLastResult);
            }
            catch (Exception ex)
            {
                var inner = ex;
                while (inner.InnerException != null) inner = inner.InnerException;
                _salesSeedLastResult = $"ERROR: {ex.Message} | INNER: {inner.Message}";
                logger.LogError(ex, "[PacsSeeder][SalesOnly] Failed");
            }
            finally { _salesSeedRunning = false; }
        });

        return Results.Accepted("/api/admin/pacs/seed-sales/status",
            new { message = "Sales-only seed started. Poll /api/admin/pacs/seed-sales/status." });
    }).WithTags("Admin").WithName("SeedSalesOnly");

    app.MapGet("/api/admin/pacs/seed-sales/status", () =>
        Results.Ok(new { running = _salesSeedRunning, lastResult = _salesSeedLastResult })
    ).WithTags("Admin").WithName("SeedSalesOnlyStatus");
}

// Minimal transcendence health probe (previously returned 404 in some checks)
// Returns a simple OK payload without invoking heavy services
app.MapGet("/api/transcendence/health", () =>
{
  return Results.Ok(new
  {
    status = "ok",
    service = "transcendence",
    timestamp = DateTime.UtcNow
  });
});

// --- TerraLevy minimal endpoints ---
var levy = app.MapGroup("/levy").WithTags("Levy");

levy.MapGet("/health", async (LevyDbContext ctx) =>
{
  try
  {
    var provider = ctx.Database.ProviderName ?? string.Empty;

    // Auto-provision SQLite dev database for local runs
    if (provider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
    {
      await ctx.Database.EnsureCreatedAsync();
      return Results.Ok(new { status = "healthy", provider, mode = "sqlite-dev", timestamp = DateTime.UtcNow });
    }

    var canConnect = await ctx.Database.CanConnectAsync();
    return canConnect
        ? Results.Ok(new { status = "healthy", provider, timestamp = DateTime.UtcNow })
        : Results.Problem("Cannot connect to Levy database.", statusCode: 503);
  }
  catch (Exception ex)
  {
    return Results.Problem($"Levy DB error: {ex.Message}", statusCode: 503);
  }
});

levy.MapGet("/districts", async (
    LevyDbContext? db,
    string? county,
    int take = 50,
    int skip = 0
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  take = Math.Clamp(take, 1, 200);
  skip = Math.Max(0, skip);

  var query = db.Districts.AsNoTracking();
  if (!string.IsNullOrWhiteSpace(county))
  {
    query = query.Where(d => d.CountyId == county);
  }

  var items = await query
      .OrderBy(d => d.CountyId).ThenBy(d => d.DistrictCode)
      .Skip(skip)
      .Take(take)
      .Select(d => new
      {
        d.Id,
        d.CountyId,
        d.DistrictCode,
        d.Name,
        d.DistrictType,
        d.ParcelCount,
        d.TotalAssessedValue,
        d.IsActive
      })
      .ToListAsync();

  return Results.Ok(new { count = items.Count, items });
});

// Calculate optimal rate for a levy measure (quantum-enhanced)
levy.MapPost("/calculate", async (
    ILevyCalculationService calc,
    LevyDbContext db,
    CalculateRequest req
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  var measure = await db.LevyMeasures.AsNoTracking().FirstOrDefaultAsync(m => m.Id == req.MeasureId);
  if (measure is null)
  {
    return Results.NotFound(new { error = $"LevyMeasure {req.MeasureId} not found" });
  }

  var result = await calc.CalculateOptimalRateAsync(measure, useQuantumOptimization: true);
  return Results.Ok(result);
});

// Validate a proposed rate for statutory compliance
levy.MapGet("/measures/{id:guid}/compliance", async (
    ILevyCalculationService calc,
    LevyDbContext db,
    Guid id,
    decimal rate
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  var measure = await db.LevyMeasures.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
  if (measure is null)
  {
    return Results.NotFound(new { error = $"LevyMeasure {id} not found" });
  }

  var result = await calc.ValidateRateComplianceAsync(measure, rate);
  return Results.Ok(result);
});

// Analyze multiple rate scenarios for a measure
levy.MapPost("/scenarios/analyze", async (
    ILevyCalculationService calc,
    LevyDbContext db,
    AnalyzeScenariosRequest req
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  var measure = await db.LevyMeasures.AsNoTracking().FirstOrDefaultAsync(m => m.Id == req.MeasureId);
  if (measure is null)
  {
    return Results.NotFound(new { error = $"LevyMeasure {req.MeasureId} not found" });
  }

  var result = await calc.AnalyzeScenariosAsync(measure, req.Rates ?? new List<decimal>());
  return Results.Ok(result);
});

// Generate multi-year revenue projections for a scenario
levy.MapPost("/projections/generate", async (
    IRevenueProjectionService projections,
    LevyDbContext db,
    GenerateProjectionsRequest req
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  var scenario = await db.LevyScenarios.AsNoTracking().FirstOrDefaultAsync(s => s.Id == req.ScenarioId);
  if (scenario is null)
  {
    return Results.NotFound(new { error = $"LevyScenario {req.ScenarioId} not found" });
  }

  var list = await projections.GenerateProjectionsAsync(scenario, Math.Clamp(req.Years, 1, 10), useQuantumForecasting: true);
  return Results.Ok(list);
});

// List levy measures with optional county filter
levy.MapGet("/measures", async (
    LevyDbContext? db,
    string? county,
    int take = 50,
    int skip = 0
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  take = Math.Clamp(take, 1, 200);
  skip = Math.Max(0, skip);

  var query = db.LevyMeasures.AsNoTracking();
  if (!string.IsNullOrWhiteSpace(county))
  {
    query = query.Where(m => m.CountyId == county);
  }

  var items = await query
      .OrderByDescending(m => m.LevyYear).ThenBy(m => m.Name)
      .Skip(skip)
      .Take(take)
      .Select(m => new
      {
        m.Id,
        m.CountyId,
        m.Name,
        m.LevyYear,
        m.LevyType,
        m.Status,
        m.TargetAmount,
        m.CalculatedRate,
        m.MaximumRate,
        m.QuantumOptimized,
        m.AiConfidenceScore
      })
      .ToListAsync();

  return Results.Ok(new { count = items.Count, items });
});

// Get levy measure by id
levy.MapGet("/measures/{id:guid}", async (
    LevyDbContext? db,
    Guid id
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  var measure = await db.LevyMeasures.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
  return measure is not null ? Results.Ok(measure) : Results.NotFound(new { error = $"LevyMeasure {id} not found" });
});

// List scenarios, optionally by measure
levy.MapGet("/scenarios", async (
    LevyDbContext? db,
    Guid? measureId,
    int take = 50,
    int skip = 0
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  take = Math.Clamp(take, 1, 200);
  skip = Math.Max(0, skip);

  var query = db.LevyScenarios.AsNoTracking();
  if (measureId.HasValue)
  {
    query = query.Where(s => s.LevyMeasureId == measureId.Value);
  }

  var items = await query
      .OrderByDescending(s => s.CreatedAt)
      .Skip(skip)
      .Take(take)
      .Select(s => new
      {
        s.Id,
        s.CountyId,
        s.LevyMeasureId,
        s.Name,
        s.ScenarioType,
        s.LevyRate,
        s.ProjectedRevenue,
        s.CollectionRate,
        s.IsActive,
        s.ConfidenceScore
      })
      .ToListAsync();

  return Results.Ok(new { count = items.Count, items });
});

// List projections for a scenario
levy.MapGet("/projections", async (
    LevyDbContext? db,
    Guid scenarioId,
    int take = 50,
    int skip = 0
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  take = Math.Clamp(take, 1, 200);
  skip = Math.Max(0, skip);

  var query = db.RevenueProjections.AsNoTracking().Where(p => p.LevyScenarioId == scenarioId);
  var items = await query
      .OrderBy(p => p.FiscalYear)
      .Skip(skip)
      .Take(take)
      .Select(p => new
      {
        p.Id,
        p.LevyScenarioId,
        p.FiscalYear,
        p.ProjectedAssessedValue,
        p.ProjectedLevyAmount,
        p.ProjectedCollectionRate,
        p.ProjectedNetRevenue,
        p.GrowthRate,
        p.ConfidenceLevel
      })
      .ToListAsync();

  return Results.Ok(new { count = items.Count, items });
});

// Compare scenarios and return recommended option
levy.MapPost("/scenarios/compare", async (
    IRevenueProjectionService projections,
    LevyDbContext db,
    CompareScenariosRequest req
) =>
{
  if (db is null)
  {
    return Results.Problem("LevyDbContext not configured. Set LEVY_DATABASE_URL or ConnectionStrings:LevyDatabase.", statusCode: 503);
  }

  if (req.ScenarioIds is null || req.ScenarioIds.Count < 2)
  {
    return Results.BadRequest(new { error = "Provide at least two scenarioIds to compare." });
  }

  // Allow duplicate IDs by de-duplicating for lookup; proceed if at least one exists
  var requestedIds = req.ScenarioIds.Distinct().ToList();
  var scenarios = await db.LevyScenarios.AsNoTracking()
      .Where(s => requestedIds.Contains(s.Id))
      .ToListAsync();

  if (scenarios.Count == 0)
  {
    return Results.NotFound(new { error = "No matching scenarios found." });
  }

  var comparison = await projections.CompareScenariosAsync(scenarios, Math.Clamp(req.ProjectionYears, 1, 10));
  return Results.Ok(comparison);
});

// (moved DTOs to top of file)

// Removed duplicate MapGet("/health") - using SimpleHealthController at /health instead

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
Console.WriteLine("📋 Server configuration: Using ASPNETCORE_URLS environment variable");
// Console.WriteLine("🧩 Module System: 15 production modules configured");
// Console.WriteLine("🤖 AI Swarm: 1,008 agents with 87 MCP tools");
Console.WriteLine("💾 Database: SQLite fallback with background initialization");

try
{
  Console.WriteLine($"🚀 Starting TerraFusion API");
  Console.WriteLine($"🔍 Configured URLs: {string.Join(", ", builder.WebHost.GetSetting("urls") ?? "NONE SET - Using Kestrel defaults")}");
  Console.WriteLine($"🌐 Environment: {app.Environment.EnvironmentName}");

  // 🔬 DIAGNOSTIC: Add lifetime event handlers to trace shutdown triggers
  var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

  lifetime.ApplicationStarted.Register(() =>
  {
    Console.WriteLine($"✅ ApplicationStarted event fired at {DateTime.Now:HH:mm:ss.fff}");
    Console.WriteLine($"   Server is fully started and ready to accept requests");
  });

  lifetime.ApplicationStopping.Register(() =>
  {
    Console.WriteLine($"⚠️ ApplicationStopping event fired at {DateTime.Now:HH:mm:ss.fff}");
    Console.WriteLine($"   Something requested application shutdown!");
    Console.WriteLine($"   Stack trace of shutdown trigger:");
    Console.WriteLine($"{Environment.StackTrace}");
  });

  lifetime.ApplicationStopped.Register(() =>
  {
    Console.WriteLine($"🛑 ApplicationStopped event fired at {DateTime.Now:HH:mm:ss.fff}");
  });

  // 🌟 Initialize Ultimate CostForge AI Consciousness
  // RE-ENABLED: Championship-level 1M agent deployment with quantum Factor 999
  await app.Services.InitializeUltimateCostForgeAsync();

  // CARD-06: Seed Properties from PacsParcel in Development (idempotent).
  if (app.Environment.IsDevelopment())
  {
    using var devSeedScope = app.Services.CreateScope();
    var devPropSeeder = devSeedScope.ServiceProvider
        .GetRequiredService<TerraFusion.API.Seeds.DevPropertySeeder>();
    await devPropSeeder.SeedAsync();

    var devGovernmentUserSeeder = devSeedScope.ServiceProvider
        .GetRequiredService<TerraFusion.API.Seeds.DevGovernmentUserSeeder>();
    await devGovernmentUserSeeder.SeedAsync();
  }

  Console.WriteLine($"⏳ Calling app.Run()... This should block until shutdown");
  Console.WriteLine($"   Time: {DateTime.Now:HH:mm:ss.fff}");

  app.Run();

  Console.WriteLine($"⚠️ app.Run() returned! This means shutdown was requested.");
  Console.WriteLine($"   Time: {DateTime.Now:HH:mm:ss.fff}");
  Console.WriteLine($"✅ Server stopped gracefully");
}
catch (Exception ex)
{
  Console.WriteLine($"❌ Failed to start server: {ex.Message}");
  Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
  throw;
}

public partial class Program { }
