// LEV-034 — Levy Search Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Fuzzy search across tax districts, tax codes, and properties.
    /// Provides autocomplete suggestions and ranked search results
    /// for the levy administration UI.
    /// </summary>
    public class LevySearchService
    {
        /// <summary>Maximum autocomplete suggestions returned.</summary>
        public const int MaxAutocompleteSuggestions = 10;

        /// <summary>
        /// Search across districts, tax codes, and properties with fuzzy matching.
        /// </summary>
        /// <param name="query">Search text (partial name, code, or parcel number).</param>
        /// <param name="countyId">Optional county filter.</param>
        /// <param name="maxResults">Maximum results to return.</param>
        /// <returns>Ranked search results across entity types.</returns>
        public Task<LevySearchResults> SearchAsync(
            string query, int? countyId = null, int maxResults = 25)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Task.FromResult(new LevySearchResults());

            // Stub — production impl uses EF Core with LIKE/trigram matching
            var results = new LevySearchResults
            {
                Query = query,
                TotalResults = 0,
                Districts = new List<SearchResultItem>(),
                TaxCodes = new List<SearchResultItem>(),
                Properties = new List<SearchResultItem>(),
                SearchedAt = DateTime.UtcNow
            };
            return Task.FromResult(results);
        }

        /// <summary>
        /// Provide autocomplete suggestions as the user types.
        /// Returns a flat list of suggestions ranked by relevance.
        /// </summary>
        /// <param name="prefix">Partial input from the user.</param>
        /// <param name="entityType">Optional filter: "District", "TaxCode", "Property", or null for all.</param>
        /// <returns>Ordered autocomplete suggestions.</returns>
        public Task<List<AutocompleteSuggestion>> AutocompleteAsync(
            string prefix, string? entityType = null)
        {
            if (string.IsNullOrWhiteSpace(prefix) || prefix.Length < 2)
                return Task.FromResult(new List<AutocompleteSuggestion>());

            // Stub
            return Task.FromResult(new List<AutocompleteSuggestion>());
        }

        /// <summary>
        /// Compute a simple fuzzy match score between query and candidate.
        /// </summary>
        internal static double FuzzyScore(string query, string candidate)
        {
            if (string.IsNullOrEmpty(query) || string.IsNullOrEmpty(candidate))
                return 0;

            var q = query.ToUpperInvariant();
            var c = candidate.ToUpperInvariant();

            // Exact prefix match scores highest
            if (c.StartsWith(q)) return 1.0;

            // Contains match
            if (c.Contains(q)) return 0.7;

            // Character overlap ratio
            var matched = q.Count(ch => c.Contains(ch));
            return (double)matched / q.Length * 0.5;
        }
    }

    /// <summary>Combined search results across entity types.</summary>
    public class LevySearchResults
    {
        public string Query { get; set; } = string.Empty;
        public int TotalResults { get; set; }
        public List<SearchResultItem> Districts { get; set; } = new();
        public List<SearchResultItem> TaxCodes { get; set; } = new();
        public List<SearchResultItem> Properties { get; set; } = new();
        public DateTime SearchedAt { get; set; }
    }

    /// <summary>Individual search result item.</summary>
    public class SearchResultItem
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public double RelevanceScore { get; set; }
    }

    /// <summary>Autocomplete suggestion.</summary>
    public class AutocompleteSuggestion
    {
        public string Text { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public double Score { get; set; }
    }
}
