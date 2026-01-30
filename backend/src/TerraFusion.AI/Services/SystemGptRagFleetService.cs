// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion RAG Fleet Readiness Service
// Phase 27: Multi-County RAG Fleet Readiness & Drift Detection
// "Detect when one county's valuation knowledge falls behind another's."
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 27: Service interface for multi-county RAG fleet comparison and drift detection.
/// Provides regional valuation intelligence monitoring across the federation.
/// </summary>
public interface ISystemGptRagFleetService
{
    /// <summary>
    /// Get the RAG fleet readiness status comparing all counties.
    /// Detects drift conditions and provides advisory.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Fleet readiness DTO with drift analysis.</returns>
    Task<RagFleetReadinessDto> GetFleetReadinessAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get RAG readiness for a specific county.
    /// </summary>
    /// <param name="countyId">The county identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>County readiness DTO, or null if county not found.</returns>
    Task<RagCountyReadinessDto?> GetCountyReadinessAsync(string countyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a summary for federated overview integration.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Summary DTO with drift risk and message.</returns>
    Task<RagFleetSummaryDto> GetFleetSummaryAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Phase 27: Implementation of RAG fleet readiness and drift detection.
/// Compares counties' RAG metadata and detects alignment issues.
/// </summary>
public class SystemGptRagFleetService : ISystemGptRagFleetService
{
    private readonly IBentonRagReadinessService? _bentonRagService;
    private readonly ILogger<SystemGptRagFleetService> _logger;

    // Drift detection thresholds
    private const double IndexAgeStaleThresholdHours = 24.0;      // 24 hours = stale
    private const double IndexAgeCriticalThresholdHours = 72.0;   // 72 hours = critical
    private const double CoverageDriftMediumThreshold = 0.50;     // <50% of max = Medium
    private const double CoverageDriftHighThreshold = 0.20;       // <20% of max = High

    public SystemGptRagFleetService(
        ILogger<SystemGptRagFleetService> logger,
        IBentonRagReadinessService? bentonRagService = null)
    {
        _logger = logger;
        _bentonRagService = bentonRagService;
    }

    /// <inheritdoc />
    public async Task<RagFleetReadinessDto> GetFleetReadinessAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Phase 27: Generating RAG fleet readiness check");
        var generatedAt = DateTimeOffset.UtcNow;

        // Collect per-county RAG data
        var counties = new List<RagCountyReadinessDto>();
        foreach (var countyInfo in CountyHelper.AllCounties)
        {
            var countyReadiness = await GetCountyRagReadinessAsync(countyInfo, generatedAt, cancellationToken);
            counties.Add(countyReadiness);
        }

        // Analyze drift conditions
        var driftAnalysis = AnalyzeDrift(counties, generatedAt);

        var configuredCount = counties.Count(c => c.Configured);
        var readyCount = counties.Count(c => c.RagStatus == "Ready");

        _logger.LogInformation(
            "Phase 27: Fleet readiness complete - {Total} counties, {Configured} configured, {Ready} ready, Drift={Drift}",
            counties.Count, configuredCount, readyCount, driftAnalysis.DriftRisk);

        return new RagFleetReadinessDto
        {
            GeneratedAtUtc = generatedAt,
            FleetDriftRisk = driftAnalysis.DriftRisk,
            Advisory = driftAnalysis.Advisory,
            Counties = counties.AsReadOnly(),
            TotalCounties = counties.Count,
            ConfiguredCounties = configuredCount,
            ReadyCounties = readyCount,
            DriftConditions = driftAnalysis.Conditions
        };
    }

    /// <inheritdoc />
    public async Task<RagFleetSummaryDto> GetFleetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var readiness = await GetFleetReadinessAsync(cancellationToken);
        return new RagFleetSummaryDto
        {
            FleetRagDriftRisk = readiness.FleetDriftRisk,
            FleetRagSummary = TruncateAdvisory(readiness.Advisory, 100)
        };
    }

    /// <inheritdoc />
    public async Task<RagCountyReadinessDto?> GetCountyReadinessAsync(string countyId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Phase 27: Getting RAG readiness for county: {CountyId}", countyId);

        // Find county in our known list
        var countyInfo = CountyHelper.AllCounties
            .FirstOrDefault(c => string.Equals(c.Code, countyId, StringComparison.OrdinalIgnoreCase));

        if (countyInfo == null)
        {
            _logger.LogWarning("County not found in configuration: {CountyId}", countyId);
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        return await GetCountyRagReadinessAsync(countyInfo, now, cancellationToken);
    }

    /// <summary>
    /// Get RAG readiness for a single county.
    /// </summary>
    private async Task<RagCountyReadinessDto> GetCountyRagReadinessAsync(
        CountyInfo countyInfo,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        // Non-configured counties
        if (!countyInfo.IsConfigured)
        {
            return RagCountyReadinessDto.Unconfigured(countyInfo.Code, countyInfo.DisplayName);
        }

        // For Benton County (the only fully configured county currently)
        if (countyInfo.Id == CountyId.Benton && _bentonRagService != null)
        {
            try
            {
                var bentonRag = await _bentonRagService.GetReadinessAsync();
                var indexAge = bentonRag.LastIndexAt.HasValue
                    ? (now - bentonRag.LastIndexAt.Value).TotalHours
                    : (double?)null;

                return new RagCountyReadinessDto
                {
                    CountyId = countyInfo.Code,
                    CountyName = countyInfo.DisplayName,
                    Configured = true,
                    RagStatus = bentonRag.OverallStatus.ToString(),
                    DocumentCount = bentonRag.DocumentCount,
                    EmbeddingCount = bentonRag.EmbeddingCount,
                    LastIndexedAtUtc = bentonRag.LastIndexAt,
                    IndexAgeHours = indexAge,
                    Note = bentonRag.StatusReason
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get RAG readiness for {County}", countyInfo.DisplayName);
                return new RagCountyReadinessDto
                {
                    CountyId = countyInfo.Code,
                    CountyName = countyInfo.DisplayName,
                    Configured = true,
                    RagStatus = "Unknown",
                    Note = "Error retrieving RAG status"
                };
            }
        }

        // For other "configured" counties without RAG service wired yet
        // This is a placeholder for future expansion
        return new RagCountyReadinessDto
        {
            CountyId = countyInfo.Code,
            CountyName = countyInfo.DisplayName,
            Configured = countyInfo.IsConfigured,
            RagStatus = countyInfo.IsConfigured ? "Pending" : "Unknown",
            Note = countyInfo.IsConfigured ? "RAG service pending integration" : "Not configured"
        };
    }

    /// <summary>
    /// Analyze drift conditions across counties.
    /// </summary>
    private DriftAnalysisResult AnalyzeDrift(List<RagCountyReadinessDto> counties, DateTimeOffset now)
    {
        var conditions = new List<string>();
        var maxRisk = RagFleetDriftRisk.Low;
        var advisories = new List<string>();

        // Get configured counties for comparison
        var configuredCounties = counties.Where(c => c.Configured).ToList();
        if (configuredCounties.Count == 0)
        {
            return new DriftAnalysisResult
            {
                DriftRisk = RagFleetDriftRisk.Low,
                Advisory = "No counties are configured for RAG services yet.",
                Conditions = new[] { "NoConfiguredCounties" }
            };
        }

        // === Condition 1: Index Age Drift ===
        var countiesWithIndex = configuredCounties
            .Where(c => c.LastIndexedAtUtc.HasValue)
            .ToList();

        if (countiesWithIndex.Count > 0)
        {
            var maxAge = countiesWithIndex.Max(c => c.IndexAgeHours ?? 0);
            var minAge = countiesWithIndex.Min(c => c.IndexAgeHours ?? 0);
            var ageDiff = maxAge - minAge;

            if (ageDiff > IndexAgeCriticalThresholdHours)
            {
                maxRisk = RagFleetDriftRisk.High;
                var staleCounty = countiesWithIndex.OrderByDescending(c => c.IndexAgeHours).First();
                conditions.Add($"IndexAgeDriftHigh:{staleCounty.CountyId}");
                advisories.Add($"{staleCounty.CountyName} RAG index is {maxAge:F0} hours old — urgent reindexing recommended.");
            }
            else if (ageDiff > IndexAgeStaleThresholdHours)
            {
                if (maxRisk < RagFleetDriftRisk.Medium) maxRisk = RagFleetDriftRisk.Medium;
                var staleCounty = countiesWithIndex.OrderByDescending(c => c.IndexAgeHours).First();
                conditions.Add($"IndexAgeDriftMedium:{staleCounty.CountyId}");
                advisories.Add($"{staleCounty.CountyName} embeddings are {ageDiff:F0} hours older than other counties — consider reindexing.");
            }

            // Check for any county with stale index
            foreach (var county in countiesWithIndex.Where(c => c.IndexAgeHours > IndexAgeStaleThresholdHours))
            {
                if (!conditions.Any(c => c.Contains(county.CountyId)))
                {
                    conditions.Add($"StaleIndex:{county.CountyId}");
                }
            }
        }

        // === Condition 2: Coverage Drift (Document/Embedding count disparity) ===
        var countiesWithDocs = configuredCounties
            .Where(c => c.DocumentCount.HasValue && c.DocumentCount > 0)
            .ToList();

        if (countiesWithDocs.Count > 1)
        {
            var maxDocs = countiesWithDocs.Max(c => c.DocumentCount ?? 0);
            foreach (var county in countiesWithDocs)
            {
                var ratio = (double)(county.DocumentCount ?? 0) / maxDocs;
                if (ratio < CoverageDriftHighThreshold)
                {
                    maxRisk = RagFleetDriftRisk.High;
                    conditions.Add($"CoverageDriftHigh:{county.CountyId}");
                    advisories.Add($"{county.CountyName} RAG dataset appears incomplete compared to other counties ({county.DocumentCount} docs vs {maxDocs} max).");
                }
                else if (ratio < CoverageDriftMediumThreshold)
                {
                    if (maxRisk < RagFleetDriftRisk.Medium) maxRisk = RagFleetDriftRisk.Medium;
                    conditions.Add($"CoverageDriftMedium:{county.CountyId}");
                    advisories.Add($"{county.CountyName} has lower document coverage than other counties.");
                }
            }
        }

        // === Condition 3: Status Drift (Ready vs Unindexed/Partial) ===
        var statusCounts = configuredCounties
            .GroupBy(c => c.RagStatus)
            .ToDictionary(g => g.Key, g => g.Count());

        var unindexedCount = statusCounts.GetValueOrDefault("Unindexed", 0);
        var partialCount = statusCounts.GetValueOrDefault("Partial", 0);
        var readyCount = statusCounts.GetValueOrDefault("Ready", 0);

        if (unindexedCount > 1)
        {
            maxRisk = RagFleetDriftRisk.High;
            conditions.Add("MultipleUnindexed");
            advisories.Add("Multiple counties have never been indexed — fleet RAG coverage is critically low.");
        }
        else if (unindexedCount > 0 && readyCount > 0)
        {
            if (maxRisk < RagFleetDriftRisk.Medium) maxRisk = RagFleetDriftRisk.Medium;
            conditions.Add("StatusDriftUnindexed");
            var unindexed = configuredCounties.Where(c => c.RagStatus == "Unindexed").Select(c => c.CountyName);
            advisories.Add($"Some counties ({string.Join(", ", unindexed)}) have not been indexed while others are Ready.");
        }

        if (partialCount > 0 && readyCount > 0)
        {
            if (maxRisk < RagFleetDriftRisk.Medium) maxRisk = RagFleetDriftRisk.Medium;
            conditions.Add("StatusDriftPartial");
            var partial = configuredCounties.Where(c => c.RagStatus == "Partial").Select(c => c.CountyName);
            advisories.Add($"Some counties ({string.Join(", ", partial)}) have partial indexes.");
        }

        // Build final advisory
        string finalAdvisory;
        if (advisories.Count == 0)
        {
            finalAdvisory = "Fleet RAG parity is healthy across all counties.";
        }
        else if (advisories.Count == 1)
        {
            finalAdvisory = advisories[0];
        }
        else
        {
            finalAdvisory = string.Join(" ", advisories.Take(3)); // Limit to 3 advisories
        }

        return new DriftAnalysisResult
        {
            DriftRisk = maxRisk,
            Advisory = finalAdvisory,
            Conditions = conditions
        };
    }

    /// <summary>
    /// Truncate advisory to max length for summary display.
    /// </summary>
    private static string TruncateAdvisory(string advisory, int maxLength)
    {
        if (string.IsNullOrEmpty(advisory) || advisory.Length <= maxLength)
            return advisory;
        return advisory[..(maxLength - 3)] + "...";
    }

    /// <summary>
    /// Internal result type for drift analysis.
    /// </summary>
    private sealed class DriftAnalysisResult
    {
        public RagFleetDriftRisk DriftRisk { get; init; } = RagFleetDriftRisk.Low;
        public string Advisory { get; init; } = string.Empty;
        public IReadOnlyList<string> Conditions { get; init; } = Array.Empty<string>();
    }
}
