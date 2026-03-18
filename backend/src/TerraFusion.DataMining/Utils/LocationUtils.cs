// TMR-120: Location Utilities - Geocoding helpers
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Utils
{
    /// <summary>
    /// Represents a geocoded location result.
    /// </summary>
    public class GeocodedLocation
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FormattedAddress { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public bool IsValid => Latitude != 0 || Longitude != 0;
    }

    /// <summary>
    /// Geocoding utilities for resolving addresses to coordinates.
    /// API keys and endpoints are read from IConfiguration only.
    /// </summary>
    public class LocationUtils
    {
        private readonly ILogger<LocationUtils> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory? _httpClientFactory;

        public LocationUtils(
            ILogger<LocationUtils> logger,
            IConfiguration configuration,
            IHttpClientFactory? httpClientFactory = null)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Geocodes an address string to lat/long coordinates.
        /// </summary>
        public async Task<GeocodedLocation> GeocodeAsync(string address)
        {
            if (string.IsNullOrWhiteSpace(address))
                return new GeocodedLocation();

            var provider = _configuration["Geocoding:Provider"] ?? "stub";
            _logger.LogDebug("Geocoding address via {Provider}: {Address}", provider, address);

            // Stub: In production, call configured geocoding API
            // API key read from _configuration["Geocoding:ApiKey"]
            return await Task.FromResult(new GeocodedLocation
            {
                FormattedAddress = address.Trim(),
                Source = provider
            });
        }

        /// <summary>
        /// Calculates the distance in miles between two coordinates using the Haversine formula.
        /// </summary>
        public static double DistanceMiles(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 3958.8; // Earth radius in miles
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        /// <summary>
        /// Validates that coordinates fall within reasonable bounds.
        /// </summary>
        public static bool IsValidCoordinate(double latitude, double longitude)
        {
            return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    }
}
