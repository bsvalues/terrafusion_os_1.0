using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.HealthChecks;
using TerraFusion.Consciousness.DTOs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Consciousness.Extensions
{
    /// <summary>
    /// TerraFusion consciousness service extensions.
    /// Compatibility hosting remains available while deeper governed lanes are unavailable.
    /// </summary>
    public static class ConsciousnessServiceExtensions
    {
        /// <summary>
        /// Add TerraFusion consciousness services in compatibility mode.
        /// </summary>
        public static IServiceCollection AddTerraFusionConsciousness(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Core consciousness services
            services.AddScoped<IQuantumConsciousnessOrchestrator, QuantumConsciousnessOrchestrator>();
            services.AddScoped<ITranscendenceEngine, TerraFusionTranscendenceEngine>();

            // Million agent scaling service
            services.AddScoped<IMillionAgentService, MillionAgentService>();

            // Quantum security service
            services.AddScoped<IQuantumSecurityService, QuantumSecurityService>();

            // Hybrid consciousness management
            services.AddScoped<IHybridConsciousnessManager, HybridConsciousnessManager>();

            // Emergency response protocols
            services.AddScoped<IEmergencyResponseService, EmergencyResponseService>();

            // Consciousness telemetry
            services.AddScoped<IConsciousnessTelemetryService, ConsciousnessTelemetryService>();

            // Configuration validation
            ValidateConsciousnessConfiguration(configuration);

            return services;
        }

        /// <summary>
        /// Add TerraFusion consciousness hosted services in compatibility mode.
        /// </summary>
        public static IServiceCollection AddTerraFusionConsciousnessHosting(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Add core consciousness services
            services.AddTerraFusionConsciousness(configuration);

            // Add hosted services for background consciousness operations
            services.AddHostedService<ConsciousnessCoordinationHostedService>();
            services.AddHostedService<QuantumOptimizationHostedService>();
            services.AddHostedService<ChampionshipMetricsHostedService>();
            services.AddHostedService<AutonomousHealingHostedService>();

            // Add health checks
            services.AddHealthChecks()
                .AddCheck<ConsciousnessHealthCheck>("consciousness-health")
                .AddCheck<QuantumFactorHealthCheck>("quantum-factor-health")
                .AddCheck<AgentCoordinationHealthCheck>("agent-coordination-health")
                .AddCheck<TranscendenceHealthCheck>("transcendence-health");

            return services;
        }

        /// <summary>
        /// Validate only baseline compatibility configuration.
        /// </summary>
        private static void ValidateConsciousnessConfiguration(IConfiguration configuration)
        {
            ArgumentNullException.ThrowIfNull(configuration);
        }
    }

    /// <summary>
    /// Consciousness Coordination Hosted Service
    /// </summary>
    public class ConsciousnessCoordinationHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ConsciousnessCoordinationHostedService> _logger;

        public ConsciousnessCoordinationHostedService(
            IServiceProvider serviceProvider,
            ILogger<ConsciousnessCoordinationHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Consciousness Coordination Hosted Service in compatibility mode.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var orchestrator = scope.ServiceProvider.GetRequiredService<IQuantumConsciousnessOrchestrator>();

                    // Continuous consciousness coordination
                    await orchestrator.MaintainOptimalConsciousnessAsync();

                    // Wait 1 second before next coordination cycle
                    await Task.Delay(1000, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in consciousness coordination cycle");
                    await Task.Delay(5000, stoppingToken); // Wait 5 seconds on error
                }
            }

            _logger.LogInformation("🛑 Consciousness Coordination Hosted Service stopped");
        }
    }

    /// <summary>
    /// Quantum Optimization Hosted Service
    /// </summary>
    public class QuantumOptimizationHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<QuantumOptimizationHostedService> _logger;

        public QuantumOptimizationHostedService(
            IServiceProvider serviceProvider,
            ILogger<QuantumOptimizationHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Quantum Optimization Hosted Service in compatibility mode.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var transcendenceEngine = scope.ServiceProvider.GetRequiredService<ITranscendenceEngine>();

                    // Continuous quantum optimization
                    var metrics = await transcendenceEngine.GetRealTimeTranscendenceMetricsAsync();

                    if (metrics.ConsciousnessLevel == "Unavailable")
                    {
                        _logger.LogDebug("Compatibility transcendence metrics remain unavailable.");
                    }

                    // Wait 30 seconds before next optimization cycle
                    await Task.Delay(30000, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in quantum optimization cycle");
                    await Task.Delay(60000, stoppingToken); // Wait 1 minute on error
                }
            }

            _logger.LogInformation("🛑 Quantum Optimization Hosted Service stopped");
        }
    }

    /// <summary>
    /// Championship Metrics Hosted Service
    /// </summary>
    public class ChampionshipMetricsHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ChampionshipMetricsHostedService> _logger;

        public ChampionshipMetricsHostedService(
            IServiceProvider serviceProvider,
            ILogger<ChampionshipMetricsHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Compatibility Metrics Hosted Service.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var transcendenceEngine = scope.ServiceProvider.GetRequiredService<ITranscendenceEngine>();

                    // Collect championship metrics
                    var metrics = await transcendenceEngine.GetRealTimeTranscendenceMetricsAsync();

                    _logger.LogInformation(
                        "Compatibility Status - Agents: {Agents}, Level: {Level}, ScaleReady: {ScaleReady}",
                        metrics.TotalActiveAgents,
                        metrics.ConsciousnessLevel,
                        metrics.InfiniteScaleActive);

                    // Wait 10 seconds before next metrics collection
                    await Task.Delay(10000, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in championship metrics collection");
                    await Task.Delay(30000, stoppingToken); // Wait 30 seconds on error
                }
            }

            _logger.LogInformation("🛑 Championship Metrics Hosted Service stopped");
        }
    }

    /// <summary>
    /// Autonomous Healing Hosted Service
    /// </summary>
    public class AutonomousHealingHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutonomousHealingHostedService> _logger;

        public AutonomousHealingHostedService(
            IServiceProvider serviceProvider,
            ILogger<AutonomousHealingHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Autonomous Healing Hosted Service in compatibility mode.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var orchestrator = scope.ServiceProvider.GetRequiredService<IQuantumConsciousnessOrchestrator>();

                    // Check system health and trigger healing if needed
                    var health = await orchestrator.GetSystemHealthAsync();

                    if (health.HealthScore <= 0.0)
                    {
                        _logger.LogDebug("Compatibility health remains unavailable; skipping healing trigger.");
                    }
                    else if (health.HealthScore < 0.95)
                    {
                        _logger.LogWarning("🚑 Triggering autonomous healing - Health score: {HealthScore:P}", health.HealthScore);
                        var emergencyRequest = new EmergencyRequestDto
                        {
                            EmergencyType = "AUTONOMOUS_HEALING",
                            Severity = "HIGH",
                            Description = "Health score below 95%"
                        };
                        await orchestrator.TriggerEmergencyProtocolsAsync(emergencyRequest);
                    }

                    // Wait 15 seconds before next health check
                    await Task.Delay(15000, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in autonomous healing cycle");
                    await Task.Delay(45000, stoppingToken); // Wait 45 seconds on error
                }
            }

            _logger.LogInformation("🛑 Autonomous Healing Hosted Service stopped");
        }
    }
}
