using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace TerraFusion.Core.Services
{
    public interface ICDNIntegrationService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, Dictionary<string, string>? metadata = null);
        Task<string> GetOptimizedUrlAsync(string assetPath, CDNOptimizationOptions? options = null);
        Task<bool> InvalidateAsync(string path);
        Task<bool> InvalidateAsync(IEnumerable<string> paths);
        Task<CDNStatistics> GetStatisticsAsync();
        Task<bool> PurgeAllAsync();
        Task<List<CDNEdgeLocation>> GetEdgeLocationsAsync();
        Task<CDNPerformanceMetrics> GetPerformanceMetricsAsync(string path, TimeSpan? period = null);
        Task<bool> SetCachingRulesAsync(string path, CachingRule rule);
        Task<string> GenerateSignedUrlAsync(string path, TimeSpan expiration, string[]? allowedIPs = null);
    }

    public class CDNOptimizationOptions
    {
        public int? Width { get; set; }
        public int? Height { get; set; }
        public required string Format { get; set; } // webp, jpeg, png, avif
        public int? Quality { get; set; } // 1-100
        public bool AutoOptimize { get; set; } = true;
        public bool EnableWebP { get; set; } = true;
        public bool EnableAVIF { get; set; } = true;
        public required string Crop { get; set; } // center, smart, entropy
        public Dictionary<string, string> CustomTransformations { get; set; } = new Dictionary<string, string>();
    }

    public class CachingRule
    {
        public TimeSpan TTL { get; set; }
        public required string[] FileExtensions { get; set; }
        public required string[] MimeTypes { get; set; }
        public bool EnableGzip { get; set; } = true;
        public bool EnableBrotli { get; set; } = true;
        public required string CacheControl { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    }

    public class CDNStatistics
    {
        public long TotalRequests { get; set; }
        public long CacheHits { get; set; }
        public long CacheMisses { get; set; }
        public double HitRatio => TotalRequests > 0 ? (double)CacheHits / TotalRequests : 0;
        public long BandwidthUsed { get; set; }
        public long StorageUsed { get; set; }
        public int EdgeLocations { get; set; }
        public Dictionary<string, long> RequestsByCountry { get; set; } = new Dictionary<string, long>();
        public Dictionary<string, long> RequestsByContentType { get; set; } = new Dictionary<string, long>();
        public double AverageResponseTime { get; set; }
    }

    public class CDNEdgeLocation
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Country { get; set; }
        public required string Region { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsActive { get; set; }
        public double LoadPercentage { get; set; }
    }

    public class CDNPerformanceMetrics
    {
        public required string Path { get; set; }
        public long TotalRequests { get; set; }
        public double AverageResponseTime { get; set; }
        public double P95ResponseTime { get; set; }
        public double P99ResponseTime { get; set; }
        public long ErrorCount { get; set; }
        public double ErrorRate => TotalRequests > 0 ? (double)ErrorCount / TotalRequests : 0;
        public Dictionary<DateTime, long> RequestsOverTime { get; set; } = new Dictionary<DateTime, long>();
        public Dictionary<string, double> ResponseTimesByRegion { get; set; } = new Dictionary<string, double>();
    }

    public class CDNIntegrationService : ICDNIntegrationService
    {
        private readonly ILogger<CDNIntegrationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        
        // CDN Configuration
        private readonly string _cdnEndpoint;
        private readonly string _apiKey;
        private readonly string _secretKey;
        private readonly string _bucketName;
        private readonly string _distributionId;
        private readonly bool _enableImageOptimization;
        private readonly bool _enableCompression;

        public CDNIntegrationService(
            ILogger<CDNIntegrationService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;

            _cdnEndpoint = configuration["CDN:Endpoint"] ?? throw new ArgumentException("CDN endpoint not configured");
            _apiKey = configuration["CDN:ApiKey"] ?? throw new ArgumentException("CDN API key not configured");
            _secretKey = configuration["CDN:SecretKey"] ?? throw new ArgumentException("CDN secret key not configured");
            _bucketName = configuration["CDN:BucketName"] ?? "terrafusion-assets";
            _distributionId = configuration["CDN:DistributionId"] ?? "";
            _enableImageOptimization = configuration.GetValue<bool>("CDN:EnableImageOptimization", true);
            _enableCompression = configuration.GetValue<bool>("CDN:EnableCompression", true);

            ConfigureHttpClient();
        }

        private void ConfigureHttpClient()
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-OS/1.0");
            _httpClient.Timeout = TimeSpan.FromMinutes(5);
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, Dictionary<string, string>? metadata = null)
        {
            try
            {
                var fileHash = await ComputeFileHashAsync(fileStream);
                fileStream.Position = 0;

                var uploadPath = $"assets/{DateTime.UtcNow:yyyy/MM/dd}/{fileHash}/{fileName}";
                var uploadUrl = $"{_cdnEndpoint}/upload";

                using var content = new MultipartFormDataContent();
                content.Add(new StreamContent(fileStream), "file", fileName);
                content.Add(new StringContent(uploadPath), "path");
                content.Add(new StringContent(contentType), "contentType");

                if (metadata != null)
                {
                    foreach (var kvp in metadata)
                    {
                        content.Add(new StringContent(kvp.Value), $"metadata[{kvp.Key}]");
                    }
                }

                // Add optimization flags
                if (_enableImageOptimization && IsImageContentType(contentType))
                {
                    content.Add(new StringContent("true"), "optimize");
                    content.Add(new StringContent("webp,avif"), "formats");
                }

                if (_enableCompression)
                {
                    content.Add(new StringContent("true"), "compress");
                }

                var response = await _httpClient.PostAsync(uploadUrl, content);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<UploadResponse>(responseContent);

                var cdnUrl = $"{_cdnEndpoint}/{uploadPath}";
                
                _logger.LogInformation("Successfully uploaded file {FileName} to CDN: {Url}", fileName, cdnUrl);
                return cdnUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to CDN", fileName);
                throw;
            }
        }

        public async Task<string> GetOptimizedUrlAsync(string assetPath, CDNOptimizationOptions? options = null)
        {
            try
            {
                var baseUrl = $"{_cdnEndpoint}/{assetPath.TrimStart('/')}";
                
                if (options == null)
                {
                    return baseUrl;
                }

                var queryParams = new List<string>();

                if (options.Width.HasValue)
                    queryParams.Add($"w={options.Width}");

                if (options.Height.HasValue)
                    queryParams.Add($"h={options.Height}");

                if (!string.IsNullOrEmpty(options.Format))
                    queryParams.Add($"f={options.Format}");

                if (options.Quality.HasValue)
                    queryParams.Add($"q={options.Quality}");

                if (!string.IsNullOrEmpty(options.Crop))
                    queryParams.Add($"c={options.Crop}");

                if (options.AutoOptimize)
                    queryParams.Add("auto=compress,format");

                foreach (var transform in options.CustomTransformations)
                {
                    queryParams.Add($"{transform.Key}={transform.Value}");
                }

                var optimizedUrl = queryParams.Count > 0 
                    ? $"{baseUrl}?{string.Join("&", queryParams)}"
                    : baseUrl;

                _logger.LogDebug("Generated optimized URL: {Url}", optimizedUrl);
                return optimizedUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating optimized URL for asset: {AssetPath}", assetPath);
                return assetPath; // Fallback to original path
            }
        }

        public async Task<bool> InvalidateAsync(string path)
        {
            return await InvalidateAsync(new[] { path });
        }

        public async Task<bool> InvalidateAsync(IEnumerable<string> paths)
        {
            try
            {
                var invalidationUrl = $"{_cdnEndpoint}/invalidate";
                var payload = new
                {
                    distributionId = _distributionId,
                    paths = paths.ToArray()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(invalidationUrl, content);
                response.EnsureSuccessStatusCode();

                _logger.LogInformation("Successfully invalidated {Count} paths from CDN", paths.Count());
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating paths from CDN");
                return false;
            }
        }

        public async Task<CDNStatistics> GetStatisticsAsync()
        {
            try
            {
                var statsUrl = $"{_cdnEndpoint}/stats?distributionId={_distributionId}";
                var response = await _httpClient.GetAsync(statsUrl);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var stats = JsonSerializer.Deserialize<CDNStatistics>(content);

                _logger.LogDebug("Retrieved CDN statistics: {HitRatio}% hit ratio, {Bandwidth} bytes bandwidth", 
                    stats.HitRatio * 100, stats.BandwidthUsed);

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving CDN statistics");
                return new CDNStatistics();
            }
        }

        public async Task<bool> PurgeAllAsync()
        {
            try
            {
                var purgeUrl = $"{_cdnEndpoint}/purge";
                var payload = new { distributionId = _distributionId };
                
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(purgeUrl, content);
                response.EnsureSuccessStatusCode();

                _logger.LogWarning("Purged all content from CDN distribution: {DistributionId}", _distributionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging all content from CDN");
                return false;
            }
        }

        public async Task<List<CDNEdgeLocation>> GetEdgeLocationsAsync()
        {
            try
            {
                var edgeUrl = $"{_cdnEndpoint}/edge-locations";
                var response = await _httpClient.GetAsync(edgeUrl);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var locations = JsonSerializer.Deserialize<List<CDNEdgeLocation>>(content);

                _logger.LogDebug("Retrieved {Count} CDN edge locations", locations.Count);
                return locations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving CDN edge locations");
                return new List<CDNEdgeLocation>();
            }
        }

        public async Task<CDNPerformanceMetrics> GetPerformanceMetricsAsync(string path, TimeSpan? period = null)
        {
            try
            {
                var periodHours = period?.TotalHours ?? 24;
                var metricsUrl = $"{_cdnEndpoint}/metrics?path={Uri.EscapeDataString(path)}&period={periodHours}";
                
                var response = await _httpClient.GetAsync(metricsUrl);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var metrics = JsonSerializer.Deserialize<CDNPerformanceMetrics>(content);

                _logger.LogDebug("Retrieved performance metrics for path: {Path}, Avg response time: {ResponseTime}ms", 
                    path, metrics.AverageResponseTime);

                return metrics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving performance metrics for path: {Path}", path);
                return new CDNPerformanceMetrics { Path = path };
            }
        }

        public async Task<bool> SetCachingRulesAsync(string path, CachingRule rule)
        {
            try
            {
                var rulesUrl = $"{_cdnEndpoint}/caching-rules";
                var payload = new
                {
                    distributionId = _distributionId,
                    path = path,
                    ttl = (int)rule.TTL.TotalSeconds,
                    fileExtensions = rule.FileExtensions,
                    mimeTypes = rule.MimeTypes,
                    enableGzip = rule.EnableGzip,
                    enableBrotli = rule.EnableBrotli,
                    cacheControl = rule.CacheControl,
                    headers = rule.Headers
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(rulesUrl, content);
                response.EnsureSuccessStatusCode();

                _logger.LogInformation("Successfully set caching rules for path: {Path}, TTL: {TTL}", path, rule.TTL);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting caching rules for path: {Path}", path);
                return false;
            }
        }

        public async Task<string> GenerateSignedUrlAsync(string path, TimeSpan expiration, string[]? allowedIPs = null)
        {
            try
            {
                var expirationTimestamp = DateTimeOffset.UtcNow.Add(expiration).ToUnixTimeSeconds();
                var baseUrl = $"{_cdnEndpoint}/{path.TrimStart('/')}";
                
                // Create signature payload
                var signaturePayload = $"{path}:{expirationTimestamp}";
                if (allowedIPs != null && allowedIPs.Length > 0)
                {
                    signaturePayload += $":{string.Join(",", allowedIPs)}";
                }

                var signature = GenerateHMACSHA256(signaturePayload, _secretKey);
                
                var queryParams = new List<string>
                {
                    $"expires={expirationTimestamp}",
                    $"signature={signature}"
                };

                if (allowedIPs != null && allowedIPs.Length > 0)
                {
                    queryParams.Add($"ips={string.Join(",", allowedIPs)}");
                }

                var signedUrl = $"{baseUrl}?{string.Join("&", queryParams)}";
                
                _logger.LogDebug("Generated signed URL for path: {Path}, expires: {Expiration}", path, expiration);
                return signedUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating signed URL for path: {Path}", path);
                throw;
            }
        }

        private async Task<string> ComputeFileHashAsync(Stream stream)
        {
            using var sha256 = SHA256.Create();
            var hash = await sha256.ComputeHashAsync(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static bool IsImageContentType(string contentType)
        {
            return contentType?.StartsWith("image/") == true;
        }

        private static string GenerateHMACSHA256(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToBase64String(hash);
        }

        private class UploadResponse
        {
            public required string Url { get; set; }
            public required string Path { get; set; }
            public long Size { get; set; }
            public required string ContentType { get; set; }
        }
    }
}
