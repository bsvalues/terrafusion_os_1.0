using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces;

/// <summary>
/// TerraFusion Citizen Context Service Interface
/// Provides citizen-centric context for intelligent routing and service delivery
/// </summary>
public interface ICitizenContextService
{
    /// <summary>
    /// Gets citizen context information for request routing
    /// </summary>
    /// <param name="citizenId">Citizen identifier</param>
    /// <returns>Citizen context data</returns>
    Task<CitizenContextDto> GetCitizenContextAsync(string citizenId);

    /// <summary>
    /// Updates citizen preferences and context
    /// </summary>
    /// <param name="citizenId">Citizen identifier</param>
    /// <param name="context">Updated context information</param>
    /// <returns>Success indicator</returns>
    Task<bool> UpdateCitizenContextAsync(string citizenId, CitizenContextDto context);

    /// <summary>
    /// Validates citizen access to specific services
    /// </summary>
    /// <param name="citizenId">Citizen identifier</param>
    /// <param name="serviceEndpoint">Target service endpoint</param>
    /// <returns>Access validation result</returns>
    Task<bool> ValidateCitizenAccessAsync(string citizenId, string serviceEndpoint);

    /// <summary>
    /// Gets citizen satisfaction score
    /// </summary>
    /// <param name="citizenId">Citizen identifier (nullable)</param>
    /// <returns>Satisfaction score</returns>
    Task<double> GetCitizenSatisfactionScoreAsync(string? citizenId);

    /// <summary>
    /// Updates citizen interaction data
    /// </summary>
    /// <param name="citizenId">Citizen identifier (nullable)</param>
    /// <param name="interaction">Interaction data</param>
    /// <returns>Task</returns>
    Task UpdateCitizenInteractionAsync(string? citizenId, CitizenInteraction interaction);

    /// <summary>
    /// Gets citizen insights
    /// </summary>
    /// <param name="citizenId">Citizen identifier (nullable)</param>
    /// <returns>Citizen insights</returns>
    Task<CitizenInsights> GetCitizenInsightsAsync(string? citizenId);

    /// <summary>
    /// Gets population insights
    /// </summary>
    /// <returns>Population insights dictionary</returns>
    Task<Dictionary<string, object>> GetPopulationInsightsAsync();
}

/// <summary>
/// Citizen context data transfer object
/// </summary>
public class CitizenContextDto
{
    public string CitizenId { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string PreferredLanguage { get; set; } = "en-US";
    public Dictionary<string, object> Preferences { get; set; } = new();
    public List<string> AuthorizedServices { get; set; } = new();
    public DateTime LastActivity { get; set; }
    public bool IsAuthenticated { get; set; }
    public Dictionary<string, object> SecurityContext { get; set; } = new();
}

/// <summary>
/// Citizen context analysis result
/// </summary>
public class CitizenContext
{
    public string CitizenId { get; set; } = string.Empty;
    public string GeographicRegion { get; set; } = string.Empty;
    public string EmergencyLevel { get; set; } = "Normal";
    public string[] AccessibilityNeeds { get; set; } = Array.Empty<string>();
    public double SatisfactionScore { get; set; }
    public Dictionary<string, object> ServiceHistory { get; set; } = new();
}

/// <summary>
/// Citizen interaction data
/// </summary>
public class CitizenInteraction
{
    public string InteractionId { get; set; } = Guid.NewGuid().ToString();
    public string ServiceUsed { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public bool Successful { get; set; }
    public double SatisfactionRating { get; set; }
    public string[] AccessibilityFeaturesUsed { get; set; } = Array.Empty<string>();
    public string FeedbackText { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Citizen insights data
/// </summary>
public class CitizenInsights
{
    public string CitizenId { get; set; } = string.Empty;
    public Dictionary<string, object> Insights { get; set; } = new();
    public double OverallSatisfaction { get; set; }
    public List<string> PreferredServices { get; set; } = new();
    public DateTime LastAnalyzed { get; set; } = DateTime.UtcNow;
}