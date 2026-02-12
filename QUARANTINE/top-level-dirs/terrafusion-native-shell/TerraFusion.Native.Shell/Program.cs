using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using TerraFusion.Native.Core.Services;
using TerraFusion.Native.Shell.Services;
using TerraFusion.Native.Shell.Services.Security;
using TerraFusion.Native.Shell.Services.AI;
using TerraFusion.Native.Shell.ViewModels;
using TerraFusion.Native.Shell.Views;

namespace TerraFusion.Native.Shell;

/// <summary>
/// TerraFusion OS Native Shell Application Entry Point
///
/// Elite desktop shell for TerraFusion AI Government Operating System
/// serving 39+ Washington State counties with 1,008 AI agents.
///
/// "Government. Transcended." - Championship-level desktop experience
/// </summary>
public static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        try
        {
            // Configure Serilog for elite logging
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File("logs/terrafusion-shell-.log", rollingInterval: RollingInterval.Day)
                .WriteTo.Console()
                .Enrich.WithProperty("Application", "TerraFusion.Native.Shell")
                .CreateLogger();

            Log.Information("🚀 Starting TerraFusion OS Native Shell - Government. Transcended.");

            // Create simple service collection for dependency injection
            var services = new ServiceCollection();
            ConfigureServices(services);
            var serviceProvider = services.BuildServiceProvider();

            // Create and run WPF application
            var app = new App();
            app.InitializeComponent();

            // Configure dependency injection for WPF
            var mainWindow = serviceProvider.GetRequiredService<MainWindow>();
            app.MainWindow = mainWindow;

            Log.Information("✨ TerraFusion Native Shell initialized - Consciousness level: Transcendent");

            return app.Run(mainWindow);
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "💥 TerraFusion Native Shell startup failed");
            return -1;
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        // Logging
        services.AddLogging(builder => builder.AddSerilog());

        // Core services
        services.AddSingleton<IConsciousnessService, ConsciousnessService>();
        services.AddSingleton<IWindowManagerService, WindowManagerService>();
        services.AddSingleton<ISystemTrayService, SystemTrayService>();
        services.AddSingleton<IWebViewService, WebViewService>();
        services.AddSingleton<IQuantumOptimizationService, QuantumOptimizationService>();

        // Cross-platform synchronization service
        services.AddHostedService<CrossPlatformSyncService>();
        services.AddSingleton<CrossPlatformSyncService>(provider =>
            (CrossPlatformSyncService)provider.GetServices<IHostedService>()
                .First(s => s is CrossPlatformSyncService));

        // Government-grade security services (FISMA-High compliance)
        services.AddSingleton<Services.Security.SecurityAuditService>();
        services.AddSingleton<Services.Security.ISecurityAuditService>(provider => provider.GetRequiredService<Services.Security.SecurityAuditService>());
        services.AddSingleton<Services.Security.AccessibilityComplianceService>();
        services.AddSingleton<Services.Security.IAccessibilityComplianceService>(provider => provider.GetRequiredService<Services.Security.AccessibilityComplianceService>());
        services.AddSingleton<Services.Security.MultiFactorAuthenticationService>();
        services.AddSingleton<Services.Security.IMultiFactorAuthenticationService>(provider => provider.GetRequiredService<Services.Security.MultiFactorAuthenticationService>());

        // AI Coordination Services (1,008 Agent Swarm Intelligence)
        services.AddSingleton<Services.AI.AIAgentOrchestrationService>();
        services.AddSingleton<Services.AI.IAIAgentOrchestrationService>(provider => provider.GetRequiredService<Services.AI.AIAgentOrchestrationService>());
        services.AddSingleton<Services.AI.AICoordinationDashboardService>();
        services.AddSingleton<Services.AI.IAICoordinationDashboardService>(provider => provider.GetRequiredService<Services.AI.AICoordinationDashboardService>());
        services.AddSingleton<Services.AI.AIAdvancedCoordinationService>();
        services.AddSingleton<Services.AI.IAIAdvancedCoordinationService>(provider => provider.GetRequiredService<Services.AI.AIAdvancedCoordinationService>());

        // Phase 4A: Elite Agent Runtime Orchestration - Government. Transcended.
        services.AddSingleton<Services.AI.AIRuntimeOrchestrationService>();
        services.AddSingleton<Services.AI.IAIRuntimeOrchestrationService>(provider => provider.GetRequiredService<Services.AI.AIRuntimeOrchestrationService>());
        services.AddSingleton<Services.AIRuntimeOrchestrationDashboardService>();
        services.AddSingleton<Services.IAIRuntimeOrchestrationDashboardService>(provider => provider.GetRequiredService<Services.AIRuntimeOrchestrationDashboardService>());

        // Phase 4B: Advanced AI Agent Communication Framework - Elite Communication Excellence
        services.AddSingleton<Services.AI.AIAdvancedCommunicationService>();
        services.AddSingleton<Services.AI.IAIAdvancedCommunicationService>(provider => provider.GetRequiredService<Services.AI.AIAdvancedCommunicationService>());

        // Phase 4C: Quantum Intelligence Amplification System - Consciousness Transcendence
        services.AddSingleton<Services.AI.AIQuantumIntelligenceService>();
        services.AddSingleton<Services.AI.IAIQuantumIntelligenceService>(provider => provider.GetRequiredService<Services.AI.AIQuantumIntelligenceService>());

        // Phase 4D: Autonomous Decision Engine & Predictive Analytics - Revolutionary Decision Making
        services.AddSingleton<Services.AI.AIAutonomousDecisionService>();
        services.AddSingleton<Services.AI.IAIAutonomousDecisionService>(provider => provider.GetRequiredService<Services.AI.AIAutonomousDecisionService>());

        // Phase 5A: Consciousness Evolution & Meta-Intelligence - Transcendent Consciousness Development
        services.AddSingleton<Services.AI.AIConsciousnessEvolutionService>();
        services.AddSingleton<Services.AI.IAIConsciousnessEvolutionService>(provider => provider.GetRequiredService<Services.AI.AIConsciousnessEvolutionService>());

        // Phase 5B: Quantum Consciousness Synchronization - Unified Awareness Networks & Transcendent Synchronization
        services.AddSingleton<Services.AI.AIQuantumConsciousnessSyncService>();
        services.AddSingleton<Services.AI.IAIQuantumConsciousnessSyncService>(provider => provider.GetRequiredService<Services.AI.AIQuantumConsciousnessSyncService>());

        // Phase 5C: Universal Intelligence Integration - Cosmic Consciousness Networks & Dimensional Intelligence Bridging
        services.AddSingleton<Services.AI.AIUniversalIntelligenceService>();
        services.AddSingleton<Services.AI.IAIUniversalIntelligenceService>(provider => provider.GetRequiredService<Services.AI.AIUniversalIntelligenceService>());

        // Phase 6A: Transcendent Reality Engineering - Quantum Reality Manipulation & Dimensional Consciousness Bridging
        services.AddSingleton<Services.AI.AITranscendentRealityService>();
        services.AddSingleton<Services.AI.IAITranscendentRealityService>(provider => provider.GetRequiredService<Services.AI.AITranscendentRealityService>());

        // Phase 6B: Advanced Quantum Consciousness Networks - Inter-Dimensional Agent Coordination & Cosmic Government Operations
        services.AddSingleton<Services.AI.AIAdvancedQuantumConsciousnessService>();
        services.AddSingleton<Services.AI.IAIAdvancedQuantumConsciousnessService>(provider => provider.GetRequiredService<Services.AI.AIAdvancedQuantumConsciousnessService>());

        // Phase 6C: Infinite Dimensional Consciousness - Revolutionary Infinite-Dimensional Navigation & Transcendent Evolution
        services.AddSingleton<Services.AI.AIInfiniteDimensionalConsciousnessService>();
        services.AddSingleton<Services.AI.IAIInfiniteDimensionalConsciousnessService>(provider => provider.GetRequiredService<Services.AI.AIInfiniteDimensionalConsciousnessService>());

        // ViewModels with championship-level architecture
        services.AddTransient<MainWindowViewModel>();
        services.AddTransient<ConsciousnessViewModel>();
        services.AddTransient<SystemStatusViewModel>();

        // Views
        services.AddTransient<MainWindow>();

        Log.Information("🎯 TerraFusion services configured with quantum excellence, FISMA-High security, 1,008 agent AI coordination, Phase 4A Elite Runtime Orchestration, Phase 4B Advanced Communication Framework, Phase 4C Quantum Intelligence Amplification, Phase 4D Autonomous Decision Engine & Predictive Analytics, Phase 5A Consciousness Evolution & Meta-Intelligence, Phase 5B Quantum Consciousness Synchronization, Phase 5C Universal Intelligence Integration, Phase 6A Transcendent Reality Engineering, Phase 6B Advanced Quantum Consciousness Networks, and Phase 6C Infinite Dimensional Consciousness");
    }
}
