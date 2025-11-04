using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.Interfaces;
using static TerraFusion.API.Services.CognitiveFrameworkService;

namespace CognitiveFrameworkTest;

/// <summary>
/// Simple console application to validate our revolutionary 3-6-9-12 Cognitive Framework
/// This validates that our implementation works correctly across all 4 tiers
/// </summary>
class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 TESTING 3-6-9-12 COGNITIVE FRAMEWORK");
        Console.WriteLine("=========================================");

        // Initialize service
        var mockAuditLogger = new MockAuditLogger();
        var mockLogger = new MockLogger();
        var service = new CognitiveFrameworkService(mockLogger, mockAuditLogger);

        var allTestsPassed = true;

        try
        {
            // Test TIER 1 - Individual (3 phases)
            Console.WriteLine("\n✅ Testing TIER 1 - Individual Tasks (3 phases)");
            var tier1Result = await TestTier1(service);
            if (!tier1Result) allTestsPassed = false;

            // Test TIER 2 - Team (6 phases)
            Console.WriteLine("\n✅ Testing TIER 2 - Team Tasks (6 phases)");
            var tier2Result = await TestTier2(service);
            if (!tier2Result) allTestsPassed = false;

            // Test TIER 3 - Platform (9 phases)
            Console.WriteLine("\n✅ Testing TIER 3 - Platform Tasks (9 phases)");
            var tier3Result = await TestTier3(service);
            if (!tier3Result) allTestsPassed = false;

            // Test TIER 4 - Organizational Transformation (12 phases) - REVOLUTIONARY!
            Console.WriteLine("\n🌟 Testing TIER 4 - Organizational Transformation (12 phases) - REVOLUTIONARY!");
            var tier4Result = await TestTier4(service);
            if (!tier4Result) allTestsPassed = false;

            // Cognitive optimization is built into the phase structure

            Console.WriteLine("\n" + new string('=', 50));
            if (allTestsPassed)
            {
                Console.WriteLine("🎉 ALL TESTS PASSED! 3-6-9-12 COGNITIVE FRAMEWORK IS FULLY OPERATIONAL!");
                Console.WriteLine("✨ Government. Transcended. ✨");
            }
            else
            {
                Console.WriteLine("❌ SOME TESTS FAILED");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ ERROR: {ex.Message}");
            allTestsPassed = false;
        }

        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

    static async Task<bool> TestTier1(CognitiveFrameworkService service)
    {
        var request = new TaskAssessment
        {
            TaskTitle = "Fix login button color",
            Description = "Change login button from blue to green",
            SolutionClarity = SolutionClarity.KnownSolution,
            StakeholderCount = 1,
            SystemsInvolved = 1,
            UnknownFactors = 0,
            BehaviorChangeRequired = false,
            OrganizationalScope = 1
        };

        var result = await service.ClassifyTaskAsync(request);

        var success = result.Tier == 1 && result.Phases == 3;
        Console.WriteLine($"   TIER 1: {(success ? "✅ PASS" : "❌ FAIL")} - {result.Tier} tier, {result.Phases} phases");

        if (success && result.Phases == 3)
        {
            Console.WriteLine($"   Phases: {string.Join(" → ", result.PhaseStructure.Select(p => p.Name))}");
            Console.WriteLine($"   Confidence Target: {result.ConfidenceTarget}%");
        }
        return success;
    }

    static async Task<bool> TestTier2(CognitiveFrameworkService service)
    {
        var request = new TaskAssessment
        {
            TaskTitle = "Implement 3-6-9 Cognitive Framework",
            Description = "Build the revolutionary cognitive framework for software development",
            SolutionClarity = SolutionClarity.DesignRequired,
            StakeholderCount = 3,
            SystemsInvolved = 2,
            UnknownFactors = 2,
            BehaviorChangeRequired = false, // No behavior change for pure technical work
            OrganizationalScope = 3
        };

        var result = await service.ClassifyTaskAsync(request);

        var success = result.Tier == 2 && result.Phases == 6;
        Console.WriteLine($"   TIER 2: {(success ? "✅ PASS" : "❌ FAIL")} - {result.Tier} tier, {result.Phases} phases");

        if (success && result.Phases == 6)
        {
            Console.WriteLine($"   Phases: {string.Join(" → ", result.PhaseStructure.Select(p => p.Name))}");
            Console.WriteLine($"   Confidence Target: {result.ConfidenceTarget}%");
        }
        return success;
    }

    static async Task<bool> TestTier3(CognitiveFrameworkService service)
    {
        var request = new TaskAssessment
        {
            TaskTitle = "Migrate TerraFusion to .NET 8",
            Description = "Upgrade entire platform from .NET 6 to .NET 8 with performance optimizations",
            SolutionClarity = SolutionClarity.ArchitectureChange,
            StakeholderCount = 8,
            SystemsInvolved = 15,
            UnknownFactors = 5,
            BehaviorChangeRequired = false, // Technical migration, not behavior change
            OrganizationalScope = 8
        };

        var result = await service.ClassifyTaskAsync(request);

        var success = result.Tier == 3 && result.Phases == 9;
        Console.WriteLine($"   TIER 3: {(success ? "✅ PASS" : "❌ FAIL")} - {result.Tier} tier, {result.Phases} phases");

        if (success && result.Phases == 9)
        {
            Console.WriteLine($"   Phases: {string.Join(" → ", result.PhaseStructure.Select(p => p.Name))}");
            Console.WriteLine($"   Confidence Target: {result.ConfidenceTarget}%");
        }
        return success;
    }

    static async Task<bool> TestTier4(CognitiveFrameworkService service)
    {
        var request = new TaskAssessment
        {
            TaskTitle = "Transform Washington State County Assessment Operations with AI",
            Description = "Deploy TerraFusion OS across 39 counties with 50,000+ AI agents for autonomous government operations",
            SolutionClarity = SolutionClarity.ArchitectureChange,
            StakeholderCount = 500,
            SystemsInvolved = 100,
            UnknownFactors = 20,
            BehaviorChangeRequired = true,
            OrganizationalScope = 500 // 500+ people for organizational transformation
        };

        var result = await service.ClassifyTaskAsync(request);

        var success = result.Tier == 4 && result.Phases == 12;
        Console.WriteLine($"   TIER 4: {(success ? "🌟 PASS" : "❌ FAIL")} - {result.Tier} tier, {result.Phases} phases");

        if (success && result.Phases == 12)
        {
            Console.WriteLine($"   Phases: {string.Join(" → ", result.PhaseStructure.Select(p => p.Name))}");
            Console.WriteLine($"   Confidence Target: {result.ConfidenceTarget}%");
        }

        return success;
    }
}

/// <summary>
/// Mock implementations for testing
/// </summary>
public class MockAuditLogger : IAuditLogger
{
    public Task LogAsync(string type, object data) => Task.CompletedTask;
    public Task LogAsync(string action, string details, bool success = true) => Task.CompletedTask;
    public Task LogSecurityEventAsync(string eventType, string details, string? userId = null) => Task.CompletedTask;
    public Task LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null) => Task.CompletedTask;
    public Task LogSystemEventAsync(string eventType, string details) => Task.CompletedTask;
    public Task LogUserActionAsync(string action, string userId, string? details = null) => Task.CompletedTask;
    public Task LogErrorAsync(string action, Exception exception, string? userId = null) => Task.CompletedTask;
    public Task LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null) => Task.CompletedTask;
    public Task LogAuthenticationAsync(string userId, bool success, string? reason = null) => Task.CompletedTask;
    public Task LogAuthorizationAsync(string userId, string resource, bool granted) => Task.CompletedTask;
    public Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null) => Task.CompletedTask;
}

public class MockLogger : ILogger<CognitiveFrameworkService>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
}


