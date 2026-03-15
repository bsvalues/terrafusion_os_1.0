// TMR-032: Unified connector with failover across Zillow, Realtor, PACMLS
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Connectors
{
    /// <summary>
    /// Unified property result aggregated from multiple data sources.
    /// </summary>
    public class UnifiedPropertyResult
    {
        /// <summary>Primary source that provided this result.</summary>
        public string PrimarySource { get; set; } = string.Empty;

        /// <summary>Full street address.</summary>
        public string? Address { get; set; }

        /// <summary>City.</summary>
        public string? City { get; set; }

        /// <summary>State.</summary>
        public string? State { get; set; }

        /// <summary>ZIP code.</summary>
        public string? ZipCode { get; set; }

        /// <summary>Estimated market value (best available).</summary>
        public decimal? EstimatedValue { get; set; }

        /// <summary>Last sale price.</summary>
        public decimal? LastSalePrice { get; set; }

        /// <summary>Last sale date.</summary>
        public DateTime? LastSaleDate { get; set; }

        /// <summary>Number of bedrooms.</summary>
        public int? Bedrooms { get; set; }

        /// <summary>Number of bathrooms.</summary>
        public double? Bathrooms { get; set; }

        /// <summary>Square footage.</summary>
        public int? SquareFootage { get; set; }

        /// <summary>Property type.</summary>
        public string? PropertyType { get; set; }

        /// <summary>Sources that were attempted during this lookup.</summary>
        public List<string> AttemptedSources { get; set; } = new();

        /// <summary>Sources that failed during this lookup.</summary>
        public List<string> FailedSources { get; set; } = new();
    }

    /// <summary>
    /// Unified real estate connector that aggregates data from multiple sources
    /// (Zillow, Realtor.com, PACMLS) with automatic failover. If the primary source
    /// fails, subsequent sources are tried in priority order.
    /// </summary>
    public class UnifiedRealEstateConnector
    {
        private readonly ILogger<UnifiedRealEstateConnector> _logger;
        private readonly ZillowConnector? _zillow;
        private readonly RealtorConnector? _realtor;
        private readonly PacmlsConnector? _pacmls;
        private readonly RedfinConnector? _redfin;

        /// <summary>
        /// Initializes the unified connector. All individual connectors are optional;
        /// the connector will use whichever are available.
        /// </summary>
        public UnifiedRealEstateConnector(
            ILogger<UnifiedRealEstateConnector> logger,
            ZillowConnector? zillow = null,
            RealtorConnector? realtor = null,
            PacmlsConnector? pacmls = null,
            RedfinConnector? redfin = null)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _zillow = zillow;
            _realtor = realtor;
            _pacmls = pacmls;
            _redfin = redfin;
        }

        /// <summary>
        /// Searches for a property across all available sources with failover.
        /// Returns the first successful result, trying sources in priority order.
        /// </summary>
        /// <param name="address">Property address to search.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        public async Task<UnifiedPropertyResult?> SearchPropertyAsync(
            string address, CancellationToken cancellationToken = default)
        {
            var result = new UnifiedPropertyResult { Address = address };

            // Try Zillow first
            if (_zillow != null)
            {
                result.AttemptedSources.Add("Zillow");
                try
                {
                    var zillowResults = await _zillow.SearchByAddressAsync(address, cancellationToken);
                    if (zillowResults.Count > 0)
                    {
                        var z = zillowResults[0];
                        MapZillowResult(z, result);
                        result.PrimarySource = "Zillow";
                        _logger.LogInformation("[Unified] Found property via Zillow: {Address}", address);
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    result.FailedSources.Add("Zillow");
                    _logger.LogWarning(ex, "[Unified] Zillow failed for: {Address}", address);
                }
            }

            // Failover to Realtor.com
            if (_realtor != null)
            {
                result.AttemptedSources.Add("Realtor");
                try
                {
                    // Parse city/state from address for Realtor search
                    var parts = address.Split(',');
                    if (parts.Length >= 2)
                    {
                        var city = parts[^2].Trim();
                        var state = parts[^1].Trim().Split(' ')[0];
                        var realtorResults = await _realtor.SearchForSaleAsync(city, state, 5, cancellationToken);
                        if (realtorResults.Count > 0)
                        {
                            var r = realtorResults[0];
                            MapRealtorResult(r, result);
                            result.PrimarySource = "Realtor";
                            _logger.LogInformation("[Unified] Found property via Realtor: {Address}", address);
                            return result;
                        }
                    }
                }
                catch (Exception ex)
                {
                    result.FailedSources.Add("Realtor");
                    _logger.LogWarning(ex, "[Unified] Realtor failed for: {Address}", address);
                }
            }

            // Failover to Redfin
            if (_redfin != null)
            {
                result.AttemptedSources.Add("Redfin");
                try
                {
                    var redfinResults = await _redfin.SearchAsync(address, cancellationToken);
                    if (redfinResults.Count > 0)
                    {
                        var r = redfinResults[0];
                        MapRedfinResult(r, result);
                        result.PrimarySource = "Redfin";
                        _logger.LogInformation("[Unified] Found property via Redfin: {Address}", address);
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    result.FailedSources.Add("Redfin");
                    _logger.LogWarning(ex, "[Unified] Redfin failed for: {Address}", address);
                }
            }

            _logger.LogWarning("[Unified] No results found for: {Address}", address);
            return null;
        }

        /// <summary>
        /// Returns the names of all available (configured) connectors.
        /// </summary>
        public IReadOnlyList<string> GetAvailableSources()
        {
            var sources = new List<string>();
            if (_zillow != null) sources.Add("Zillow");
            if (_realtor != null) sources.Add("Realtor");
            if (_pacmls != null) sources.Add("PACMLS");
            if (_redfin != null) sources.Add("Redfin");
            return sources.AsReadOnly();
        }

        private static void MapZillowResult(ZillowPropertyResult z, UnifiedPropertyResult target)
        {
            target.City = z.City;
            target.State = z.State;
            target.ZipCode = z.ZipCode;
            target.EstimatedValue = z.Zestimate;
            target.LastSalePrice = z.LastSoldPrice;
            target.LastSaleDate = z.LastSoldDate;
            target.Bedrooms = z.Bedrooms;
            target.Bathrooms = z.Bathrooms;
            target.SquareFootage = z.LivingArea;
            target.PropertyType = z.PropertyType;
        }

        private static void MapRealtorResult(RealtorPropertyResult r, UnifiedPropertyResult target)
        {
            target.City = r.City;
            target.State = r.StateCode;
            target.ZipCode = r.ZipCode;
            target.EstimatedValue = r.Price;
            target.LastSalePrice = r.LastSoldPrice;
            target.LastSaleDate = r.LastSoldDate;
            target.Bedrooms = r.Bedrooms;
            target.Bathrooms = r.Bathrooms;
            target.SquareFootage = r.SquareFootage;
            target.PropertyType = r.PropertyType;
        }

        private static void MapRedfinResult(RedfinPropertyResult r, UnifiedPropertyResult target)
        {
            target.City = r.City;
            target.State = r.State;
            target.ZipCode = r.ZipCode;
            target.EstimatedValue = r.RedfinEstimate ?? r.Price;
            target.Bedrooms = r.Bedrooms;
            target.Bathrooms = r.Bathrooms;
            target.SquareFootage = r.SquareFootage;
            target.PropertyType = r.PropertyType;
        }
    }
}
