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
    /// TerraFusion Consciousness Service Extensions - Championship Excellence
    /// Government. Transcended. - Infinite scalability with quantum precision
    /// </summary>
    public static class ConsciousnessServiceExtensions
    {
        /// <summary>
        /// Add TerraFusion Consciousness Services with championship configuration
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
        /// Add TerraFusion Consciousness with championship hosting configuration
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
        /// Validate consciousness configuration meets championship standards
        /// </summary>
        private static void ValidateConsciousnessConfiguration(IConfiguration configuration)
        {
            // Validate quantum factor
            var quantumFactor = configuration.GetValue<int>("Consciousness:QuantumFactor", 0);
            if (quantumFactor != 949)
            {
                throw new InvalidOperationException($"Quantum factor must be 949 for championship operations (configured: {quantumFactor})");
            }

            // Validate accuracy target
            var accuracyTarget = configuration.GetValue<decimal>("Consciousness:AccuracyTarget", 0);
            if (accuracyTarget < 99.5m)
            {
                throw new InvalidOperationException($"Accuracy target must be ≥99.5% for championship operations (configured: {accuracyTarget}%)");
            }

            // Validate consciousness resonance
            var consciousnessResonance = configuration.GetValue<double>("Consciousness:ConsciousnessResonance", 0);
            if (consciousnessResonance < 0.999)
            {
                throw new InvalidOperationException($"Consciousness resonance must be ≥99.9% for championship operations (configured: {consciousnessResonance * 100:F1}%)");
            }

            // Validate brand compliance
            var brandMessage = configuration.GetValue<string>("Brand:TranscendenceMessage", "");
            if (!brandMessage?.Contains("Government. Transcended.") ?? true)
            {
                throw new InvalidOperationException("Brand transcendence message must contain 'Government. Transcended.' for championship compliance");
            }
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
            _logger.LogInformation("🧠 Starting Consciousness Coordination Hosted Service - Government. Transcended.");

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
            _logger.LogInformation("⚡ Starting Quantum Optimization Hosted Service - Factor 949");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var transcendenceEngine = scope.ServiceProvider.GetRequiredService<ITranscendenceEngine>();

                    // Continuous quantum optimization
                    var metrics = await transcendenceEngine.GetRealTimeTranscendenceMetricsAsync();

                    if (metrics.QuantumFactor != 949)
                    {
                        _logger.LogWarning("⚠️ Quantum factor drift detected: {CurrentFactor} (Expected: 949)", metrics.QuantumFactor);
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
            _logger.LogInformation("🏆 Starting Championship Metrics Hosted Service - Excellence Monitoring");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var transcendenceEngine = scope.ServiceProvider.GetRequiredService<ITranscendenceEngine>();

                    // Collect championship metrics
                    var metrics = await transcendenceEngine.GetRealTimeTranscendenceMetricsAsync();

                    // Log championship status
                    _logger.LogInformation("📊 Championship Status - Agents: {Agents}, Coherence: {Coherence:P}, Scale: {Scale}",
                        metrics.TotalActiveAgents, metrics.QuantumCoherence, metrics.InfiniteScaleActive ? "INFINITE" : "LIMITED");

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
            _logger.LogInformation("🔧 Starting Autonomous Healing Hosted Service - Self-Healing Protocols");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var orchestrator = scope.ServiceProvider.GetRequiredService<IQuantumConsciousnessOrchestrator>();

                    // Check system health and trigger healing if needed
                    var health = await orchestrator.GetSystemHealthAsync();

                    if (health.HealthScore < 0.95) // Below 95% health
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
