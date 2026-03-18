// TMR-075: Property search and retrieval service
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Regional;

namespace TerraFusion.DataMining.Services
{
    /// <summary>
    /// Search criteria for property lookups.
    /// </summary>
    public class PropertySearchCriteria
    {
        /// <summary>Parcel number (exact match).</summary>
        public string? ParcelNumber { get; set; }

        /// <summary>Owner name (partial match).</summary>
        public string? OwnerName { get; set; }

        /// <summary>Street address (partial match).</summary>
        public string? Address { get; set; }

        /// <summary>County identifier.</summary>
        public string CountyId { get; set; } = "benton";

        /// <summary>Maximum results to return.</summary>
        public int MaxResults { get; set; } = 50;
    }

    /// <summary>
    /// Paginated search result.
    /// </summary>
    /// <typeparam name="T">Result item type.</typeparam>
    public class SearchResult<T>
    {
        /// <summary>Result items for the current page.</summary>
        public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();

        /// <summary>Total matching records (across all pages).</summary>
        public int TotalCount { get; set; }

        /// <summary>Whether more results are available.</summary>
        public bool HasMore { get; set; }

        /// <summary>Search criteria that produced these results.</summary>
        public string? SearchQuery { get; set; }
    }

    /// <summary>
    /// Interface for the property service.
    /// </summary>
    public interface IPropertyService
    {
        /// <summary>Searches for properties matching the given criteria.</summary>
        Task<SearchResult<UnifiedAssessmentRecord>> SearchAsync(PropertySearchCriteria criteria, CancellationToken ct = default);

        /// <summary>Gets a single property by parcel number.</summary>
        Task<UnifiedAssessmentRecord?> GetByParcelAsync(string parcelNumber, string countyId, CancellationToken ct = default);

        /// <summary>Gets sales history for a parcel.</summary>
        Task<IReadOnlyList<PacsSaleRecord>> GetSalesHistoryAsync(string parcelNumber, CancellationToken ct = default);
    }

    /// <summary>
    /// Service for searching and retrieving property records from unified data sources.
    /// Routes queries to the appropriate connectors based on county and search type.
    /// </summary>
    public class PropertyService : IPropertyService
    {
        private readonly IUnifiedAssessmentApi _assessmentApi;
        private readonly IBentonPacsConnector _pacsConnector;
        private readonly ILogger<PropertyService> _logger;

        /// <summary>
        /// Initializes the property service.
        /// </summary>
        /// <param name="assessmentApi">Unified assessment API.</param>
        /// <param name="pacsConnector">PACS connector for sales history.</param>
        /// <param name="logger">Logger instance.</param>
        public PropertyService(
            IUnifiedAssessmentApi assessmentApi,
            IBentonPacsConnector pacsConnector,
            ILogger<PropertyService> logger)
        {
            _assessmentApi = assessmentApi ?? throw new ArgumentNullException(nameof(assessmentApi));
            _pacsConnector = pacsConnector ?? throw new ArgumentNullException(nameof(pacsConnector));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<SearchResult<UnifiedAssessmentRecord>> SearchAsync(
            PropertySearchCriteria criteria, CancellationToken ct = default)
        {
            _logger.LogInformation("[PropertyService] Searching with criteria: parcel={Parcel}, owner={Owner}, address={Address}",
                criteria.ParcelNumber, criteria.OwnerName, criteria.Address);

            IReadOnlyList<UnifiedAssessmentRecord> results;

            if (!string.IsNullOrWhiteSpace(criteria.ParcelNumber))
            {
                var single = await _assessmentApi.GetByParcelAsync(
                    criteria.ParcelNumber, criteria.CountyId, ct);
                results = single != null
                    ? new[] { single }
                    : Array.Empty<UnifiedAssessmentRecord>();
            }
            else if (!string.IsNullOrWhiteSpace(criteria.OwnerName))
            {
                results = await _assessmentApi.SearchByOwnerAsync(
                    criteria.OwnerName, criteria.CountyId, criteria.MaxResults, ct);
            }
            else if (!string.IsNullOrWhiteSpace(criteria.Address))
            {
                results = await _assessmentApi.SearchByAddressAsync(
                    criteria.Address, criteria.CountyId, criteria.MaxResults, ct);
            }
            else
            {
                results = Array.Empty<UnifiedAssessmentRecord>();
            }

            return new SearchResult<UnifiedAssessmentRecord>
            {
                Items = results,
                TotalCount = results.Count,
                HasMore = false,
                SearchQuery = criteria.ParcelNumber ?? criteria.OwnerName ?? criteria.Address,
            };
        }

        /// <inheritdoc />
        public Task<UnifiedAssessmentRecord?> GetByParcelAsync(
            string parcelNumber, string countyId, CancellationToken ct = default)
        {
            return _assessmentApi.GetByParcelAsync(parcelNumber, countyId, ct);
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<PacsSaleRecord>> GetSalesHistoryAsync(
            string parcelNumber, CancellationToken ct = default)
        {
            return _pacsConnector.GetSalesHistoryAsync(parcelNumber, ct);
        }
    }
}
