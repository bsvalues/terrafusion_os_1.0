// TMR-013: Abstract base API connector with rate limiting, auth, retry, metrics
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Connectors
{
    /// <summary>
    /// Metrics snapshot for a connector's API usage.
    /// </summary>
    public class ConnectorMetrics
    {
        /// <summary>Total requests made since startup.</summary>
        public long TotalRequests { get; set; }

        /// <summary>Total successful (2xx) responses.</summary>
        public long SuccessCount { get; set; }

        /// <summary>Total failed requests (non-2xx or exception).</summary>
        public long FailureCount { get; set; }

        /// <summary>Total requests that were rate-limited and delayed.</summary>
        public long RateLimitedCount { get; set; }

        /// <summary>Average response time in milliseconds.</summary>
        public double AverageResponseTimeMs { get; set; }
    }

    /// <summary>
    /// Abstract base class for all external API connectors.
    /// Provides rate limiting, authentication header injection (from IConfiguration),
    /// retry logic with exponential backoff, and request metrics.
    /// </summary>
    public abstract class BaseApiConnector
    {
        /// <summary>Logger for diagnostics.</summary>
        protected readonly ILogger Logger;

        /// <summary>Configuration for retrieving API keys and settings.</summary>
        protected readonly IConfiguration Configuration;

        /// <summary>HTTP client for making requests.</summary>
        protected readonly HttpClient HttpClient;

        /// <summary>Display name for this connector.</summary>
        public abstract string ConnectorName { get; }

        /// <summary>Configuration section key for this connector's settings.</summary>
        protected abstract string ConfigSectionKey { get; }

        private readonly SemaphoreSlim _rateLimitSemaphore = new(1, 1);
        private DateTime _lastRequestTime = DateTime.MinValue;
        private long _totalRequests;
        private long _successCount;
        private long _failureCount;
        private long _rateLimitedCount;
        private double _totalResponseTimeMs;

        /// <summary>
        /// Minimum interval between requests for rate limiting. Override in subclasses.
        /// </summary>
        protected virtual TimeSpan MinRequestInterval => TimeSpan.FromMilliseconds(200);

        /// <summary>
        /// Maximum number of retry attempts for transient failures.
        /// </summary>
        protected virtual int MaxRetries => 3;

        /// <summary>
        /// Initializes the base connector.
        /// </summary>
        /// <param name="httpClient">HTTP client instance.</param>
        /// <param name="configuration">Application configuration (for API keys).</param>
        /// <param name="logger">Logger instance.</param>
        protected BaseApiConnector(HttpClient httpClient, IConfiguration configuration, ILogger logger)
        {
            HttpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            Configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Applies authentication headers from configuration. Called before each request.
        /// Override in subclasses for custom auth schemes.
        /// </summary>
        /// <param name="request">The HTTP request to authenticate.</param>
        protected virtual void ApplyAuthentication(HttpRequestMessage request)
        {
            var apiKey = Configuration[$"{ConfigSectionKey}:ApiKey"];
            if (!string.IsNullOrEmpty(apiKey))
            {
                request.Headers.Add("X-Api-Key", apiKey);
            }

            var bearerToken = Configuration[$"{ConfigSectionKey}:BearerToken"];
            if (!string.IsNullOrEmpty(bearerToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            }
        }

        /// <summary>
        /// Sends an HTTP request with rate limiting, authentication, and retry logic.
        /// </summary>
        /// <param name="request">The request to send.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The HTTP response.</returns>
        protected async Task<HttpResponseMessage> SendWithPolicyAsync(
            HttpRequestMessage request, CancellationToken cancellationToken = default)
        {
            ApplyAuthentication(request);
            await EnforceRateLimitAsync(cancellationToken);

            HttpResponseMessage? response = null;
            var startTime = DateTime.UtcNow;

            for (int attempt = 0; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    Interlocked.Increment(ref _totalRequests);

                    // Clone request for retries (original is disposed after first send)
                    var clonedRequest = attempt == 0 ? request : await CloneRequestAsync(request);
                    ApplyAuthentication(clonedRequest);

                    response = await HttpClient.SendAsync(clonedRequest, cancellationToken);
                    var elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds;
                    Interlocked.Exchange(ref _totalResponseTimeMs, _totalResponseTimeMs + elapsed);

                    if (response.IsSuccessStatusCode)
                    {
                        Interlocked.Increment(ref _successCount);
                        return response;
                    }

                    // Rate limited by server - wait and retry
                    if ((int)response.StatusCode == 429 && attempt < MaxRetries)
                    {
                        Interlocked.Increment(ref _rateLimitedCount);
                        var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                        Logger.LogWarning("[{Connector}] Rate limited, waiting {Delay}s", ConnectorName, delay.TotalSeconds);
                        await Task.Delay(delay, cancellationToken);
                        continue;
                    }

                    // Server error - retry with backoff
                    if ((int)response.StatusCode >= 500 && attempt < MaxRetries)
                    {
                        var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                        Logger.LogWarning("[{Connector}] Server error {Status}, retrying in {Delay}s",
                            ConnectorName, response.StatusCode, delay.TotalSeconds);
                        await Task.Delay(delay, cancellationToken);
                        continue;
                    }

                    Interlocked.Increment(ref _failureCount);
                    return response;
                }
                catch (HttpRequestException ex) when (attempt < MaxRetries)
                {
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    Logger.LogWarning(ex, "[{Connector}] Request failed, retrying in {Delay}s",
                        ConnectorName, delay.TotalSeconds);
                    await Task.Delay(delay, cancellationToken);
                }
            }

            Interlocked.Increment(ref _failureCount);
            return response ?? new HttpResponseMessage(System.Net.HttpStatusCode.ServiceUnavailable);
        }

        /// <summary>
        /// Convenience method to GET and deserialize JSON.
        /// </summary>
        protected async Task<T?> GetJsonAsync<T>(string url, CancellationToken cancellationToken = default)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            using var response = await SendWithPolicyAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

        /// <summary>
        /// Returns a snapshot of the connector's metrics.
        /// </summary>
        public ConnectorMetrics GetMetrics()
        {
            var total = Interlocked.Read(ref _totalRequests);
            return new ConnectorMetrics
            {
                TotalRequests = total,
                SuccessCount = Interlocked.Read(ref _successCount),
                FailureCount = Interlocked.Read(ref _failureCount),
                RateLimitedCount = Interlocked.Read(ref _rateLimitedCount),
                AverageResponseTimeMs = total > 0 ? _totalResponseTimeMs / total : 0
            };
        }

        private async Task EnforceRateLimitAsync(CancellationToken cancellationToken)
        {
            await _rateLimitSemaphore.WaitAsync(cancellationToken);
            try
            {
                var elapsed = DateTime.UtcNow - _lastRequestTime;
                if (elapsed < MinRequestInterval)
                {
                    await Task.Delay(MinRequestInterval - elapsed, cancellationToken);
                }
                _lastRequestTime = DateTime.UtcNow;
            }
            finally
            {
                _rateLimitSemaphore.Release();
            }
        }

        private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage original)
        {
            var clone = new HttpRequestMessage(original.Method, original.RequestUri);
            if (original.Content != null)
            {
                var content = await original.Content.ReadAsStringAsync();
                clone.Content = new StringContent(content);
            }
            foreach (var header in original.Headers)
            {
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
            return clone;
        }
    }
}
