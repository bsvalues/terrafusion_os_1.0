// TerraFusion OS - Backend API Resilience Policies (C# + Polly)
// Application-level resilience with retry, circuit breaker, timeout, and fallback
////////////////////////////////////////////////////////////////////////////////

using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Timeout;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace TerraFusion.Resilience
{
    /// <summary>
    /// Polly resilience policies for TerraFusion Backend API
    /// Implements retry, circuit breaker, timeout, and fallback patterns
    /// </summary>
    public static class ResiliencePolicies
    {
        // Circuit breaker state tracking
        private static int _circuitBreakerOpenCount = 0;
        private static int _circuitBreakerHalfOpenCount = 0;
        
        /// <summary>
        /// Retry policy with exponential backoff
        /// Retries transient failures up to 3 times with increasing delays
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy(ILogger logger)
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError() // 5xx and 408
                .OrResult(msg => msg.StatusCode == HttpStatusCode.TooManyRequests) // 429
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (outcome, timespan, retryCount, context) =>
                    {
                        logger?.LogWarning(
                            "Retry {RetryCount} after {Delay}ms due to {Exception}. Request: {RequestUri}",
                            retryCount,
                            timespan.TotalMilliseconds,
                            outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString(),
                            context.GetValueOrDefault("RequestUri", "Unknown")
                        );
                    }
                );
        }

        /// <summary>
        /// Circuit breaker policy
        /// Opens circuit after 5 consecutive failures, stays open for 30 seconds
        /// Half-open state allows 1 test request to verify recovery
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy(ILogger logger)
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => msg.StatusCode == HttpStatusCode.ServiceUnavailable) // 503
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30),
                    onBreak: (outcome, duration) =>
                    {
                        _circuitBreakerOpenCount++;
                        logger?.LogError(
                            "Circuit breaker OPENED! Will remain open for {Duration}s. Total opens: {Count}. Reason: {Exception}",
                            duration.TotalSeconds,
                            _circuitBreakerOpenCount,
                            outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString()
                        );
                    },
                    onReset: () =>
                    {
                        logger?.LogInformation(
                            "Circuit breaker RESET (closed). Total opens in session: {Count}",
                            _circuitBreakerOpenCount
                        );
                    },
                    onHalfOpen: () =>
                    {
                        _circuitBreakerHalfOpenCount++;
                        logger?.LogWarning(
                            "Circuit breaker HALF-OPEN (testing recovery). Test attempt: {Count}",
                            _circuitBreakerHalfOpenCount
                        );
                    }
                );
        }

        /// <summary>
        /// Timeout policy
        /// Optimistic timeout: allows request to continue but returns control to caller
        /// Prevents indefinite hangs
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy(ILogger logger, int timeoutSeconds = 10)
        {
            return Policy.TimeoutAsync<HttpResponseMessage>(
                timeout: TimeSpan.FromSeconds(timeoutSeconds),
                timeoutStrategy: TimeoutStrategy.Optimistic,
                onTimeoutAsync: (context, timespan, task) =>
                {
                    logger?.LogError(
                        "Request timeout after {Timeout}s. Request: {RequestUri}",
                        timespan.TotalSeconds,
                        context.GetValueOrDefault("RequestUri", "Unknown")
                    );
                    return Task.CompletedTask;
                }
            );
        }

        /// <summary>
        /// Fallback policy
        /// Returns cached response or degraded mode response when all else fails
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetFallbackPolicy(
            ILogger logger,
            Func<HttpResponseMessage> fallbackResponse)
        {
            return Policy<HttpResponseMessage>
                .Handle<Exception>()
                .OrResult(r => !r.IsSuccessStatusCode)
                .FallbackAsync(
                    fallbackAction: (outcome, context, ct) =>
                    {
                        logger?.LogWarning(
                            "Fallback triggered for {RequestUri}. Returning cached/degraded response.",
                            context.GetValueOrDefault("RequestUri", "Unknown")
                        );
                        return Task.FromResult(fallbackResponse());
                    },
                    onFallbackAsync: (outcome, context) =>
                    {
                        logger?.LogInformation(
                            "Fallback executed for {RequestUri}",
                            context.GetValueOrDefault("RequestUri", "Unknown")
                        );
                        return Task.CompletedTask;
                    }
                );
        }

        /// <summary>
        /// Combined policy: Fallback -> Retry -> Circuit Breaker -> Timeout
        /// Executes in order: Timeout → Circuit Breaker → Retry → Fallback
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetCombinedPolicy(
            ILogger logger,
            Func<HttpResponseMessage> fallbackResponse,
            int timeoutSeconds = 10)
        {
            var timeout = GetTimeoutPolicy(logger, timeoutSeconds);
            var circuitBreaker = GetCircuitBreakerPolicy(logger);
            var retry = GetRetryPolicy(logger);
            var fallback = GetFallbackPolicy(logger, fallbackResponse);

            // Wrap policies: outermost (fallback) to innermost (timeout)
            return fallback
                .WrapAsync(retry)
                .WrapAsync(circuitBreaker)
                .WrapAsync(timeout);
        }
    }

    /// <summary>
    /// Extension methods for IServiceCollection to register resilient HttpClients
    /// </summary>
    public static class ResilienceExtensions
    {
        /// <summary>
        /// Add resilient HttpClient for PostgreSQL API
        /// </summary>
        public static IServiceCollection AddResilientPostgresClient(
            this IServiceCollection services,
            string baseAddress)
        {
            services.AddHttpClient("PostgresClient", client =>
            {
                client.BaseAddress = new Uri(baseAddress);
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .AddPolicyHandler((services, request) =>
            {
                var logger = services.GetRequiredService<ILogger<ResiliencePolicies>>();
                return ResiliencePolicies.GetCombinedPolicy(
                    logger,
                    () => CreateCachedPostgresResponse(),
                    timeoutSeconds: 10
                );
            });

            return services;
        }

        /// <summary>
        /// Add resilient HttpClient for Redis cache
        /// </summary>
        public static IServiceCollection AddResilientRedisClient(
            this IServiceCollection services,
            string baseAddress)
        {
            services.AddHttpClient("RedisClient", client =>
            {
                client.BaseAddress = new Uri(baseAddress);
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .AddPolicyHandler((services, request) =>
            {
                var logger = services.GetRequiredService<ILogger<ResiliencePolicies>>();
                return ResiliencePolicies.GetCombinedPolicy(
                    logger,
                    () => CreateCacheUnavailableResponse(),
                    timeoutSeconds: 5
                );
            });

            return services;
        }

        /// <summary>
        /// Add resilient HttpClient for AI Agent
        /// </summary>
        public static IServiceCollection AddResilientAIAgentClient(
            this IServiceCollection services,
            string baseAddress)
        {
            services.AddHttpClient("AIAgentClient", client =>
            {
                client.BaseAddress = new Uri(baseAddress);
                client.Timeout = TimeSpan.FromSeconds(60); // AI processing takes longer
            })
            .AddPolicyHandler((services, request) =>
            {
                var logger = services.GetRequiredService<ILogger<ResiliencePolicies>>();
                return ResiliencePolicies.GetCombinedPolicy(
                    logger,
                    () => CreateAIUnavailableResponse(),
                    timeoutSeconds: 30
                );
            });

            return services;
        }

        /// <summary>
        /// Add resilient HttpClient for MCP Servers
        /// </summary>
        public static IServiceCollection AddResilientMCPClient(
            this IServiceCollection services,
            string baseAddress)
        {
            services.AddHttpClient("MCPClient", client =>
            {
                client.BaseAddress = new Uri(baseAddress);
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .AddPolicyHandler((services, request) =>
            {
                var logger = services.GetRequiredService<ILogger<ResiliencePolicies>>();
                return ResiliencePolicies.GetCombinedPolicy(
                    logger,
                    () => CreateMCPUnavailableResponse(),
                    timeoutSeconds: 15
                );
            });

            return services;
        }

        // Fallback response creators
        private static HttpResponseMessage CreateCachedPostgresResponse()
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"status\":\"degraded\",\"message\":\"Using cached data - database temporarily unavailable\",\"cached\":true}"
                )
            };
        }

        private static HttpResponseMessage CreateCacheUnavailableResponse()
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"status\":\"degraded\",\"message\":\"Cache unavailable - serving from database\",\"cached\":false}"
                )
            };
        }

        private static HttpResponseMessage CreateAIUnavailableResponse()
        {
            return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
            {
                Content = new StringContent(
                    "{\"status\":\"unavailable\",\"message\":\"AI Agent temporarily unavailable - please retry\",\"retry_after\":30}"
                )
            };
        }

        private static HttpResponseMessage CreateMCPUnavailableResponse()
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"status\":\"degraded\",\"message\":\"MCP Servers unavailable - limited functionality\",\"degraded\":true}"
                )
            };
        }
    }

    /// <summary>
    /// Startup configuration example
    /// Add this to your Program.cs or Startup.cs
    /// </summary>
    public class ResilienceStartupExample
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Register resilient HTTP clients
            services.AddResilientPostgresClient("http://postgres:5432");
            services.AddResilientRedisClient("http://redis:6379");
            services.AddResilientAIAgentClient("http://ai-agent:8080");
            services.AddResilientMCPClient("http://mcp-servers:8090");

            // Add logging
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.AddDebug();
            });
        }
    }
}

/*
 * USAGE EXAMPLE:
 * 
 * // In your controller or service:
 * private readonly IHttpClientFactory _httpClientFactory;
 * 
 * public MyService(IHttpClientFactory httpClientFactory)
 * {
 *     _httpClientFactory = httpClientFactory;
 * }
 * 
 * public async Task<string> GetDataWithResilience()
 * {
 *     var client = _httpClientFactory.CreateClient("PostgresClient");
 *     var response = await client.GetAsync("/api/data");
 *     
 *     // Polly policies automatically handle:
 *     // - Retries (3 attempts with exponential backoff)
 *     // - Circuit breaker (opens after 5 failures)
 *     // - Timeout (10 seconds)
 *     // - Fallback (cached/degraded response)
 *     
 *     return await response.Content.ReadAsStringAsync();
 * }
 */
