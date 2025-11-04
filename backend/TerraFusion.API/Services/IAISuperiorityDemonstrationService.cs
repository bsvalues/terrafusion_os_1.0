using TerraFusion.API.Models.AIDemo;

namespace TerraFusion.API.Services;

/// <summary>
/// AI Superiority Demonstration Service Interface - Championship-level interface
/// for showcasing TerraFusion's 1,008 AI agents vs Harris PACS baseline
/// </summary>
public interface IAISuperiorityDemonstrationService
{
    /// <summary>
    /// Launch comprehensive AI superiority demonstration
    /// </summary>
    /// <param name="request">Demonstration request with scenario parameters</param>
    /// <returns>Demonstration result with performance comparison</returns>
    Task<SuperiorityDemoResult> LaunchSupremacyDemonstrationAsync(SuperiorityDemoRequest request);

    /// <summary>
    /// Get real-time demo dashboard data
    /// </summary>
    /// <param name="demoId">Demonstration session identifier</param>
    /// <returns>Real-time dashboard data with metrics and progress</returns>
    Task<AIDemoDashboardData> GetDemoDashboardAsync(string demoId);

    /// <summary>
    /// Stop running demonstration
    /// </summary>
    /// <param name="demoId">Demonstration session identifier</param>
    /// <returns>Cancellation result</returns>
    Task<DemoCancellationResult> StopDemonstrationAsync(string demoId);

    /// <summary>
    /// Get list of available demonstration scenarios
    /// </summary>
    /// <returns>List of demo scenarios with descriptions</returns>
    Task<List<DemoScenario>> GetAvailableScenariosAsync();

    /// <summary>
    /// Get historical demonstration results
    /// </summary>
    /// <param name="jurisdiction">Government jurisdiction filter (optional)</param>
    /// <param name="limit">Maximum results to return</param>
    /// <returns>List of past demonstration results</returns>
    Task<List<SuperiorityDemoResult>> GetDemoHistoryAsync(string? jurisdiction = null, int limit = 10);
}

/// <summary>
/// Superiority Demo Result - Demonstration execution outcome with championship metrics
/// </summary>
public class SuperiorityDemoResult
{
    public string DemoId { get; set; } = string.Empty;
    public string ScenarioId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public DateTime StartTimestamp { get; set; }
    public DateTime? CompletionTimestamp { get; set; }
    public TimeSpan Duration { get; set; }
    public AIPerformanceComparison Comparison { get; set; } = new();
    public ChampionshipMetricsSnapshot Metrics { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Demo Cancellation Result - Demonstration stop outcome
/// </summary>
public class DemoCancellationResult
{
    public bool Success { get; set; }
    public string DemoId { get; set; } = string.Empty;
    public DateTime CancellationTimestamp { get; set; }
    public string? Message { get; set; }
}

/// <summary>
/// Demo Scenario - Available demonstration scenario definition
/// </summary>
public class DemoScenario
{
    public string ScenarioId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedDurationMinutes { get; set; }
    public int MinPropertyCount { get; set; }
    public int MaxPropertyCount { get; set; }
    public List<string> RequiredFeatures { get; set; } = new();
}
