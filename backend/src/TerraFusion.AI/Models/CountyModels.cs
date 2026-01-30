// ═══════════════════════════════════════════════════════════════════════════════
// 📍 TerraFusion Multi-County Federation Layer
// Phase 22: County abstraction for multi-tenant SystemGPT operations
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// Supported county identifiers for TerraFusion OS.
    /// Phase 22: Multi-County Federation Layer (Infrastructure Only).
    /// </summary>
    public enum CountyId
    {
        /// <summary>Benton County - Primary production county (fully configured).</summary>
        Benton = 0,

        /// <summary>Yakima County - Future deployment (placeholder only).</summary>
        Yakima = 1,

        /// <summary>Franklin County - Future deployment (placeholder only).</summary>
        Franklin = 2
    }

    /// <summary>
    /// County metadata for display and configuration purposes.
    /// </summary>
    public record CountyInfo
    {
        /// <summary>County identifier.</summary>
        public CountyId Id { get; init; }

        /// <summary>Display name for UI.</summary>
        public string DisplayName { get; init; } = string.Empty;

        /// <summary>Short code for API usage.</summary>
        public string Code { get; init; } = string.Empty;

        /// <summary>Whether this county has RAG/AI services fully configured.</summary>
        public bool IsConfigured { get; init; }

        /// <summary>State abbreviation (always WA for Washington State).</summary>
        public string State { get; init; } = "WA";
    }

    /// <summary>
    /// Static helper for county operations and parsing.
    /// </summary>
    public static class CountyHelper
    {
        /// <summary>
        /// All supported counties with their metadata.
        /// </summary>
        public static readonly IReadOnlyList<CountyInfo> AllCounties = new[]
        {
            new CountyInfo { Id = CountyId.Benton, DisplayName = "Benton County", Code = "benton", IsConfigured = true },
            new CountyInfo { Id = CountyId.Yakima, DisplayName = "Yakima County", Code = "yakima", IsConfigured = false },
            new CountyInfo { Id = CountyId.Franklin, DisplayName = "Franklin County", Code = "franklin", IsConfigured = false }
        };

        /// <summary>
        /// Parse a county identifier from string, defaulting to Benton if invalid or null.
        /// Phase 22: Backward compatible - null/invalid always returns Benton.
        /// </summary>
        /// <param name="countyCode">County code string (e.g., "benton", "yakima", "franklin")</param>
        /// <returns>Parsed CountyId, or Benton if invalid/null</returns>
        public static CountyId ParseCountyIdOrDefault(string? countyCode)
        {
            if (string.IsNullOrWhiteSpace(countyCode))
                return CountyId.Benton;

            return countyCode.Trim().ToLowerInvariant() switch
            {
                "benton" => CountyId.Benton,
                "yakima" => CountyId.Yakima,
                "franklin" => CountyId.Franklin,
                _ => CountyId.Benton // Default to Benton for unknown values
            };
        }

        /// <summary>
        /// Get county info by ID.
        /// </summary>
        public static CountyInfo GetCountyInfo(CountyId countyId)
        {
            return AllCounties.FirstOrDefault(c => c.Id == countyId)
                ?? AllCounties[0]; // Default to Benton
        }

        /// <summary>
        /// Get county info by code string.
        /// </summary>
        public static CountyInfo GetCountyInfo(string? countyCode)
        {
            var id = ParseCountyIdOrDefault(countyCode);
            return GetCountyInfo(id);
        }

        /// <summary>
        /// Check if a county has full RAG/AI services configured.
        /// </summary>
        public static bool IsCountyConfigured(CountyId countyId)
        {
            return GetCountyInfo(countyId).IsConfigured;
        }

        /// <summary>
        /// Check if a county has full RAG/AI services configured.
        /// </summary>
        public static bool IsCountyConfigured(string? countyCode)
        {
            return IsCountyConfigured(ParseCountyIdOrDefault(countyCode));
        }

        /// <summary>
        /// Get the county code string for API responses.
        /// </summary>
        public static string GetCountyCode(CountyId countyId)
        {
            return GetCountyInfo(countyId).Code;
        }
    }
}

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Abstraction for resolving the current county context.
    /// Phase 22: Allows services to be county-aware without coupling to specific resolution logic.
    /// </summary>
    public interface ICountyContext
    {
        /// <summary>
        /// Get the current county ID for this request/operation.
        /// </summary>
        TerraFusion.AI.Models.CountyId CurrentCountyId { get; }

        /// <summary>
        /// Get the current county info for this request/operation.
        /// </summary>
        TerraFusion.AI.Models.CountyInfo CurrentCounty { get; }

        /// <summary>
        /// Whether the current county has full RAG/AI services configured.
        /// </summary>
        bool IsCurrentCountyConfigured { get; }
    }

    /// <summary>
    /// Single-tenant county context that always returns Benton County.
    /// Phase 22: Default implementation for backward compatibility.
    /// </summary>
    public class SingleTenantCountyContext : ICountyContext
    {
        public TerraFusion.AI.Models.CountyId CurrentCountyId => TerraFusion.AI.Models.CountyId.Benton;

        public TerraFusion.AI.Models.CountyInfo CurrentCounty =>
            TerraFusion.AI.Models.CountyHelper.GetCountyInfo(TerraFusion.AI.Models.CountyId.Benton);

        public bool IsCurrentCountyConfigured => true;
    }

    /// <summary>
    /// Request-scoped county context for multi-county federation.
    /// Phase 22: Allows per-request county resolution from query parameters.
    /// </summary>
    public class RequestScopedCountyContext : ICountyContext
    {
        private readonly TerraFusion.AI.Models.CountyId _countyId;

        public RequestScopedCountyContext(string? countyCode = null)
        {
            _countyId = TerraFusion.AI.Models.CountyHelper.ParseCountyIdOrDefault(countyCode);
        }

        public RequestScopedCountyContext(TerraFusion.AI.Models.CountyId countyId)
        {
            _countyId = countyId;
        }

        public TerraFusion.AI.Models.CountyId CurrentCountyId => _countyId;

        public TerraFusion.AI.Models.CountyInfo CurrentCounty =>
            TerraFusion.AI.Models.CountyHelper.GetCountyInfo(_countyId);

        public bool IsCurrentCountyConfigured =>
            TerraFusion.AI.Models.CountyHelper.IsCountyConfigured(_countyId);
    }
}
