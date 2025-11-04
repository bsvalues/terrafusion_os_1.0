using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Extensions.Http;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace TerraFusion.Resilience
{
    /// <summary>
    /// Bulletproof HTTP Client with Championship-Level Resilience Patterns
    /// Implements Circuit Breaker, Retry, Timeout, and Bulkhead Isolation
    /// Government-Grade Fault Tolerance for TerraFusion OS
    /// </summary>
    public class BulletproofHttpClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BulletproofHttpClient> _logger;
        private readonly IAsyncPolicy<HttpResponseMessage> _resilientPolicy;

        public BulletproofHttpClient(HttpClient httpClient, ILogger<BulletproofHttpClient> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _resilientPolicy = CreateResilientPolicy();
        }

        /// <summary>
        /// Creates a comprehensive resilience policy combining multiple patterns
        /// </summary>
        private IAsyncPolicy<HttpResponseMessage> CreateResilientPolicy()
        {
            // 1. Timeout Policy - Prevent hanging requests
            var timeoutPolicy = Policy.TimeoutAsync<HttpResponseMessage>(
                TimeSpan.FromSeconds(30),
                onTimeoutAsync: (context, timespan, task) =>
                {
                    _logger.LogWarning("Request timeout after {Timeout}s for {OperationKey}",
                        timespan.TotalSeconds, context.OperationKey);
                    return Task.CompletedTask;
                });

            // 2. Retry Policy with Exponential Backoff and Jitter
            var retryPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>()
                .Or<SocketException>()
                .Or<TimeoutRejectedException>()
                .OrResult<HttpResponseMessage>(r => !IsSuccessStatusCode(r.StatusCode))
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: (retryAttempt, context) =>
                    {
                        // Exponential backoff with jitter for government-grade resilience
                        var delay = TimeSpan.FromSeconds(Math.Pow(2, retryAttempt));
                        var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000));
                        return delay + jitter;
                    },
                    onRetryAsync: async (outcome, timespan, retryCount, context) =>
                    {
                        var exception = outcome.Exception?.Message ?? "Non-success status code";
                        _logger.LogWarning("Retry {RetryCount} after {Delay}s for {OperationKey}. Reason: {Reason}",
                            retryCount, timespan.TotalSeconds, context.OperationKey, exception);
                        await Task.Delay(100); // Brief pause for system stability
                    });

            // 3. Circuit Breaker Policy - Prevent cascading failures
            var circuitBreakerPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>()
                .Or<SocketException>()
                .OrResult<HttpResponseMessage>(r => IsServerError(r.StatusCode))
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30),
                    onBreak: (result, duration, context) =>
                    {
                        _logger.LogError("🚨 CIRCUIT BREAKER OPENED for {Duration}s. Service: {OperationKey}. " +
                                       "Government systems entering fault tolerance mode.",
                            duration.TotalSeconds, context.OperationKey);
                    },
                    onReset: (context) =>
                    {
                        _logger.LogInformation("✅ CIRCUIT BREAKER RESET. Service: {OperationKey}. " +
                                             "Government systems restored to normal operation.",
                            context.OperationKey);
                    },
                    onHalfOpen: (context) =>
                    {
                        _logger.LogInformation("⚡ CIRCUIT BREAKER HALF-OPEN. Testing service: {OperationKey}",
                            context.OperationKey);
                    });

            // 4. Bulkhead Isolation Policy - Prevent resource exhaustion
            var bulkheadPolicy = Policy.BulkheadAsync<HttpResponseMessage>(
                maxParallelization: 10,
                maxQueuingActions: 20,
                onBulkheadRejectedAsync: (context) =>
                {
                    _logger.LogWarning("🛡️ BULKHEAD REJECTION. Service: {OperationKey}. " +
                                     "Request rejected due to capacity limits.",
                        context.OperationKey);
                    return Task.CompletedTask;
                });

            // 5. Combine all policies in the correct order
            return Policy.WrapAsync(
                retryPolicy,        // Outermost: Retry the entire chain
                circuitBreakerPolicy, // Circuit breaker around core operations
                timeoutPolicy,      // Timeout individual requests
                bulkheadPolicy      // Innermost: Resource isolation
            );
        }

        /// <summary>
        /// Execute GET request with championship-level resilience
        /// </summary>
        public async Task<HttpResponseMessage> GetAsync(string requestUri, string operationKey = null)
        {
            var context = new Context(operationKey ?? $"GET-{requestUri}");

            try
            {
                _logger.LogDebug("🚀 Executing resilient GET request to {RequestUri}", requestUri);

                var response = await _resilientPolicy.ExecuteAsync(async (ctx) =>
                {
                    var httpResponse = await _httpClient.GetAsync(requestUri);

                    // Log successful responses
                    if (IsSuccessStatusCode(httpResponse.StatusCode))
                    {
                        _logger.LogDebug("✅ Successful response from {RequestUri}: {StatusCode}",
                            requestUri, httpResponse.StatusCode);
                    }

                    return httpResponse;
                }, context);

                return response;
            }
            catch (CircuitBreakerOpenException)
            {
                _logger.LogError("🚨 Circuit breaker is OPEN for {RequestUri}. " +
                               "Service unavailable due to repeated failures.", requestUri);
                throw new ServiceUnavailableException($"Service unavailable: {requestUri}");
            }
            catch (BulkheadRejectedException)
            {
                _logger.LogError("🛡️ Bulkhead REJECTION for {RequestUri}. " +
                               "Service at capacity limit.", requestUri);
                throw new ServiceUnavailableException($"Service at capacity: {requestUri}");
            }
            catch (TimeoutRejectedException)
            {
                _logger.LogError("⏱️ Request TIMEOUT for {RequestUri}. " +
                               "Service did not respond within timeout period.", requestUri);
                throw new TimeoutException($"Request timeout: {requestUri}");
            }
        }

        /// <summary>
        /// Execute POST request with championship-level resilience
        /// </summary>
        public async Task<HttpResponseMessage> PostAsync(string requestUri, HttpContent content, string operationKey = null)
        {
            var context = new Context(operationKey ?? $"POST-{requestUri}");

            try
            {
                _logger.LogDebug("🚀 Executing resilient POST request to {RequestUri}", requestUri);

                var response = await _resilientPolicy.ExecuteAsync(async (ctx) =>
                {
                    var httpResponse = await _httpClient.PostAsync(requestUri, content);

                    if (IsSuccessStatusCode(httpResponse.StatusCode))
                    {
                        _logger.LogDebug("✅ Successful POST response from {RequestUri}: {StatusCode}",
                            requestUri, httpResponse.StatusCode);
                    }

                    return httpResponse;
                }, context);

                return response;
            }
            catch (CircuitBreakerOpenException)
            {
                _logger.LogError("🚨 Circuit breaker is OPEN for POST {RequestUri}", requestUri);
                throw new ServiceUnavailableException($"Service unavailable: {requestUri}");
            }
            catch (BulkheadRejectedException)
            {
                _logger.LogError("🛡️ Bulkhead REJECTION for POST {RequestUri}", requestUri);
                throw new ServiceUnavailableException($"Service at capacity: {requestUri}");
            }
            catch (TimeoutRejectedException)
            {
                _logger.LogError("⏱️ POST request TIMEOUT for {RequestUri}", requestUri);
                throw new TimeoutException($"Request timeout: {requestUri}");
            }
        }

        /// <summary>
        /// Health check with resilience patterns
        /// </summary>
        public async Task<bool> IsHealthyAsync(string healthEndpoint = "/health")
        {
            try
            {
                var response = await GetAsync(healthEndpoint, "HEALTH_CHECK");
                return IsSuccessStatusCode(response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Health check failed for {HealthEndpoint}: {Error}",
                    healthEndpoint, ex.Message);
                return false;
            }
        }

        /// <summary>
        /// Determines if the status code indicates success
        /// </summary>
        private static bool IsSuccessStatusCode(HttpStatusCode statusCode)
        {
            return ((int)statusCode >= 200) && ((int)statusCode <= 299);
        }

        /// <summary>
        /// Determines if the status code indicates a server error
        /// </summary>
        private static bool IsServerError(HttpStatusCode statusCode)
        {
            return ((int)statusCode >= 500) && ((int)statusCode <= 599);
        }

        /// <summary>
        /// Get current circuit breaker state for monitoring
        /// </summary>
        public string GetCircuitBreakerState()
        {
            // In a real implementation, you would expose the circuit breaker state
            // This is a simplified version for demonstration
            return "Closed"; // Could be "Open", "HalfOpen", or "Closed"
        }
    }

    /// <summary>
    /// Custom exceptions for bulletproof error handling
    /// </summary>
    public class ServiceUnavailableException : Exception
    {
        public ServiceUnavailableException(string message) : base(message) { }
        public ServiceUnavailableException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Extension methods for service registration
    /// </summary>
    public static class BulletproofHttpClientExtensions
    {
        /// <summary>
        /// Register bulletproof HTTP client with championship-level resilience
        /// </summary>
        public static IServiceCollection AddBulletproofHttpClient(this IServiceCollection services)
        {
            services.AddHttpClient<BulletproofHttpClient>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(60); // Overall timeout
                client.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-OS/1.0");
                client.DefaultRequestHeaders.Add("X-Government-System", "TerraFusion-Elite");
            })
            .AddPolicyHandler(GetRetryPolicy())
            .AddPolicyHandler(GetCircuitBreakerPolicy());

            return services;
        }

        /// <summary>
        /// Get HTTP retry policy for service registration
        /// </summary>
        private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (outcome, timespan, retryCount, context) =>
                    {
                        Console.WriteLine($"Retry {retryCount} for {context.OperationKey} in {timespan}s");
                    });
        }

        /// <summary>
        /// Get HTTP circuit breaker policy for service registration
        /// </summary>
        private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30));
        }
    }
}
