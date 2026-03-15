// TMR-127: Location Processing - Geocoding scripts
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Utils;

namespace TerraFusion.DataMining.Scripts
{
    /// <summary>
    /// Result of a batch geocoding operation.
    /// </summary>
    public class LocationProcessingResult
    {
        public int TotalRecords { get; set; }
        public int Geocoded { get; set; }
        public int Failed { get; set; }
        public int Skipped { get; set; }
        public TimeSpan Duration { get; set; }
    }

    /// <summary>
    /// Batch geocoding script that processes property addresses.
    /// API configuration is read from IConfiguration via LocationUtils.
    /// </summary>
    public class LocationProcessing
    {
        private readonly ILogger<LocationProcessing> _logger;
        private readonly LocationUtils _locationUtils;

        public LocationProcessing(ILogger<LocationProcessing> logger, LocationUtils locationUtils)
        {
            _logger = logger;
            _locationUtils = locationUtils;
        }

        /// <summary>
        /// Processes a batch of addresses, geocoding each one.
        /// </summary>
        public async Task<LocationProcessingResult> ProcessBatchAsync(
            IReadOnlyList<string> addresses,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            var result = new LocationProcessingResult { TotalRecords = addresses.Count };

            _logger.LogInformation("Starting batch geocoding for {Count} addresses", addresses.Count);

            foreach (var address in addresses)
            {
                if (cancellationToken.IsCancellationRequested) break;

                if (string.IsNullOrWhiteSpace(address))
                {
                    result.Skipped++;
                    continue;
                }

                try
                {
                    var location = await _locationUtils.GeocodeAsync(address);
                    if (location.IsValid)
                        result.Geocoded++;
                    else
                        result.Failed++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Geocoding failed for address: {Address}", address);
                    result.Failed++;
                }
            }

            result.Duration = DateTime.UtcNow - startTime;
            _logger.LogInformation(
                "Batch geocoding complete: {Geocoded}/{Total} succeeded, {Failed} failed, {Skipped} skipped in {Duration}",
                result.Geocoded, result.TotalRecords, result.Failed, result.Skipped, result.Duration);

            return result;
        }

        /// <summary>
        /// Validates that existing geocoded coordinates are within Benton County bounds.
        /// </summary>
        public static bool IsWithinBentonCounty(double latitude, double longitude)
        {
            // Approximate bounding box for Benton County, WA
            return latitude >= 46.0 && latitude <= 46.7 &&
                   longitude >= -119.9 && longitude <= -119.1;
        }
    }
}
