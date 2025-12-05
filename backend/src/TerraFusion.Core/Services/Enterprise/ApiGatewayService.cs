using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.Enterprise;

/// <summary>
/// Service for managing API Gateway configuration and policies
/// </summary>
public interface IApiGatewayService
{
    Task<ApiGatewayResponse> ApplyRateLimitPolicyAsync(string apiPath, RateLimitPolicy policy);
    Task<ApiGatewayResponse> ConfigureCorsAsync(string apiPath, CorsPolicy policy);
    Task<ApiGatewayResponse> SetupAuthenticationAsync(string apiPath, AuthenticationPolicy policy);
    Task<ApiGatewayResponse> ConfigureCachingAsync(string apiPath, CachingPolicy policy);
    Task<List<ApiMetrics>> GetApiMetricsAsync(string apiPath, TimeSpan period);
    Task<ApiGatewayResponse> RegisterApiAsync(ApiRegistration registration);
    Task<ApiGatewayResponse> UpdateApiPolicyAsync(string apiPath, string policyType, object policyData);
    Task<List<ApiRegistration>> GetRegisteredApisAsync();
    Task<ApiHealthStatus> CheckApiHealthAsync(string apiPath);
    Task<SubscriptionInfo> CreateSubscriptionAsync(string productName, string userId);
    Task<bool> ValidateSubscriptionAsync(string subscriptionKey);
    Task<List<SubscriptionInfo>> GetUserSubscriptionsAsync(string userId);
}

public class ApiGatewayService : IApiGatewayService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiGatewayService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, ApiRegistration> _registeredApis;
    private readonly Dictionary<string, List<PolicyConfiguration>> _apiPolicies;
    private readonly string _apiManagementBaseUrl;
    private readonly string _subscriptionKey;

    public ApiGatewayService(
        IConfiguration configuration,
        ILogger<ApiGatewayService> logger,
        IStructuredLogger structuredLogger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _httpClient = httpClient;
        _registeredApis = new Dictionary<string, ApiRegistration>();
        _apiPolicies = new Dictionary<string, List<PolicyConfiguration>>();

        _apiManagementBaseUrl = _configuration["ApiManagement:BaseUrl"] 
            ?? "https://terrafusion-api-management.azure-api.net";
        _subscriptionKey = _configuration["ApiManagement:SubscriptionKey"] ?? "";

        InitializeDefaultApis();
    }

    public async Task<ApiGatewayResponse> ApplyRateLimitPolicyAsync(string apiPath, RateLimitPolicy policy)
    {
        try
        {
            var policyXml = GenerateRateLimitPolicyXml(policy);
            var response = await ApplyPolicyToApi(apiPath, "rate-limit", policyXml);

            if (response.Success)
            {
                // Store policy configuration
                AddOrUpdateApiPolicy(apiPath, new PolicyConfiguration
                {
                    Type = "rate-limit",
                    Configuration = policy,
                    AppliedAt = DateTimeOffset.UtcNow
                });

                _structuredLogger.LogApiGatewayEvent("RateLimitApplied",
                    $"Rate limit policy applied to {apiPath}",
                    context: new { 
                        ApiPath = apiPath,
                        CallsPerSecond = policy.CallsPerSecond,
                        CallsPerMinute = policy.CallsPerMinute,
                        BurstSize = policy.BurstSize 
                    });
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to apply rate limit policy to {ApiPath}", apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to apply rate limit policy",
                Error = ex.Message
            };
        }
    }

    public async Task<ApiGatewayResponse> ConfigureCorsAsync(string apiPath, CorsPolicy policy)
    {
        try
        {
            var policyXml = GenerateCorsPolicyXml(policy);
            var response = await ApplyPolicyToApi(apiPath, "cors", policyXml);

            if (response.Success)
            {
                AddOrUpdateApiPolicy(apiPath, new PolicyConfiguration
                {
                    Type = "cors",
                    Configuration = policy,
                    AppliedAt = DateTimeOffset.UtcNow
                });

                _structuredLogger.LogApiGatewayEvent("CorsConfigured",
                    $"CORS policy configured for {apiPath}",
                    context: new { 
                        ApiPath = apiPath,
                        AllowedOrigins = policy.AllowedOrigins,
                        AllowedMethods = policy.AllowedMethods 
                    });
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to configure CORS for {ApiPath}", apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to configure CORS",
                Error = ex.Message
            };
        }
    }

    public async Task<ApiGatewayResponse> SetupAuthenticationAsync(string apiPath, AuthenticationPolicy policy)
    {
        try
        {
            var policyXml = GenerateAuthenticationPolicyXml(policy);
            var response = await ApplyPolicyToApi(apiPath, "authentication", policyXml);

            if (response.Success)
            {
                AddOrUpdateApiPolicy(apiPath, new PolicyConfiguration
                {
                    Type = "authentication",
                    Configuration = policy,
                    AppliedAt = DateTimeOffset.UtcNow
                });

                _structuredLogger.LogApiGatewayEvent("AuthenticationConfigured",
                    $"Authentication policy configured for {apiPath}",
                    context: new { 
                        ApiPath = apiPath,
                        AuthenticationType = policy.Type,
                        RequireSubscription = policy.RequireSubscription 
                    });
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to setup authentication for {ApiPath}", apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to setup authentication",
                Error = ex.Message
            };
        }
    }

    public async Task<ApiGatewayResponse> ConfigureCachingAsync(string apiPath, CachingPolicy policy)
    {
        try
        {
            var policyXml = GenerateCachingPolicyXml(policy);
            var response = await ApplyPolicyToApi(apiPath, "caching", policyXml);

            if (response.Success)
            {
                AddOrUpdateApiPolicy(apiPath, new PolicyConfiguration
                {
                    Type = "caching",
                    Configuration = policy,
                    AppliedAt = DateTimeOffset.UtcNow
                });

                _structuredLogger.LogApiGatewayEvent("CachingConfigured",
                    $"Caching policy configured for {apiPath}",
                    context: new { 
                        ApiPath = apiPath,
                        Duration = policy.Duration,
                        VaryByQueryString = policy.VaryByQueryString 
                    });
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to configure caching for {ApiPath}", apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to configure caching",
                Error = ex.Message
            };
        }
    }

    public async Task<List<ApiMetrics>> GetApiMetricsAsync(string apiPath, TimeSpan period)
    {
        try
        {
            var endTime = DateTimeOffset.UtcNow;
            var startTime = endTime.Subtract(period);

            // Call Azure API Management analytics API
            var metricsUrl = $"{_apiManagementBaseUrl}/analytics/metrics" +
                $"?api={apiPath}&start={startTime:yyyy-MM-ddTHH:mm:ssZ}&end={endTime:yyyy-MM-ddTHH:mm:ssZ}";

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);

            var response = await _httpClient.GetAsync(metricsUrl);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var metrics = JsonSerializer.Deserialize<List<ApiMetrics>>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                return metrics ?? new List<ApiMetrics>();
            }

            _logger.LogWarning("Failed to get API metrics for {ApiPath}: {StatusCode}", apiPath, response.StatusCode);
            return new List<ApiMetrics>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get API metrics for {ApiPath}", apiPath);
            return new List<ApiMetrics>();
        }
    }

    public async Task<ApiGatewayResponse> RegisterApiAsync(ApiRegistration registration)
    {
        try
        {
            // Register API with Azure API Management
            var apiData = new
            {
                properties = new
                {
                    displayName = registration.DisplayName,
                    description = registration.Description,
                    path = registration.Path,
                    protocols = registration.Protocols,
                    serviceUrl = registration.ServiceUrl,
                    subscriptionKeyParameterNames = registration.SubscriptionKeyParameterNames
                }
            };

            var jsonContent = JsonSerializer.Serialize(apiData);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);

            var response = await _httpClient.PutAsync($"{_apiManagementBaseUrl}/apis/{registration.Name}", content);

            if (response.IsSuccessStatusCode)
            {
                _registeredApis[registration.Name] = registration;

                _structuredLogger.LogApiGatewayEvent("ApiRegistered",
                    $"API {registration.Name} registered successfully",
                    context: new { 
                        ApiName = registration.Name,
                        Path = registration.Path,
                        ServiceUrl = registration.ServiceUrl 
                    });

                return new ApiGatewayResponse
                {
                    Success = true,
                    Message = "API registered successfully",
                    Data = registration
                };
            }

            return new ApiGatewayResponse
            {
                Success = false,
                Message = $"Failed to register API: {response.StatusCode}",
                StatusCode = (int)response.StatusCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register API {ApiName}", registration.Name);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to register API",
                Error = ex.Message
            };
        }
    }

    public async Task<ApiGatewayResponse> UpdateApiPolicyAsync(string apiPath, string policyType, object policyData)
    {
        try
        {
            return policyType.ToLower() switch
            {
                "rate-limit" => await ApplyRateLimitPolicyAsync(apiPath, (RateLimitPolicy)policyData),
                "cors" => await ConfigureCorsAsync(apiPath, (CorsPolicy)policyData),
                "authentication" => await SetupAuthenticationAsync(apiPath, (AuthenticationPolicy)policyData),
                "caching" => await ConfigureCachingAsync(apiPath, (CachingPolicy)policyData),
                _ => new ApiGatewayResponse
                {
                    Success = false,
                    Message = $"Unsupported policy type: {policyType}"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update API policy {PolicyType} for {ApiPath}", policyType, apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to update API policy",
                Error = ex.Message
            };
        }
    }

    public Task<List<ApiRegistration>> GetRegisteredApisAsync()
    {
        try
        {
            return Task.FromResult(_registeredApis.Values.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get registered APIs");
            return Task.FromResult(new List<ApiRegistration>());
        }
    }

    public async Task<ApiHealthStatus> CheckApiHealthAsync(string apiPath)
    {
        try
        {
            if (!_registeredApis.TryGetValue(apiPath, out var apiRegistration))
            {
                return new ApiHealthStatus
                {
                    ApiPath = apiPath,
                    IsHealthy = false,
                    Status = "API not found",
                    LastChecked = DateTimeOffset.UtcNow
                };
            }

            var healthUrl = $"{apiRegistration.ServiceUrl}/health";
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            var response = await _httpClient.GetAsync(healthUrl);
            stopwatch.Stop();

            var isHealthy = response.IsSuccessStatusCode;
            var status = isHealthy ? "Healthy" : $"Unhealthy ({response.StatusCode})";

            return new ApiHealthStatus
            {
                ApiPath = apiPath,
                IsHealthy = isHealthy,
                Status = status,
                ResponseTime = stopwatch.Elapsed,
                LastChecked = DateTimeOffset.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check API health for {ApiPath}", apiPath);
            return new ApiHealthStatus
            {
                ApiPath = apiPath,
                IsHealthy = false,
                Status = $"Health check failed: {ex.Message}",
                LastChecked = DateTimeOffset.UtcNow
            };
        }
    }

    public async Task<SubscriptionInfo> CreateSubscriptionAsync(string productName, string userId)
    {
        try
        {
            var subscriptionData = new
            {
                properties = new
                {
                    displayName = $"{productName} Subscription for {userId}",
                    scope = $"/products/{productName}",
                    userId = $"/users/{userId}",
                    state = "active"
                }
            };

            var subscriptionId = Guid.NewGuid().ToString();
            var jsonContent = JsonSerializer.Serialize(subscriptionData);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);

            var response = await _httpClient.PutAsync($"{_apiManagementBaseUrl}/subscriptions/{subscriptionId}", content);

            if (response.IsSuccessStatusCode)
            {
                var subscription = new SubscriptionInfo
                {
                    Id = subscriptionId,
                    ProductName = productName,
                    UserId = userId,
                    PrimaryKey = GenerateSubscriptionKey(),
                    SecondaryKey = GenerateSubscriptionKey(),
                    State = "active",
                    CreatedAt = DateTimeOffset.UtcNow,
                    ExpiresAt = DateTimeOffset.UtcNow.AddYears(1)
                };

                _structuredLogger.LogApiGatewayEvent("SubscriptionCreated",
                    $"Subscription created for product {productName}",
                    context: new { 
                        SubscriptionId = subscriptionId,
                        ProductName = productName,
                        UserId = userId 
                    });

                return subscription;
            }

            throw new InvalidOperationException($"Failed to create subscription: {response.StatusCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create subscription for product {ProductName}, user {UserId}", productName, userId);
            throw;
        }
    }

    public async Task<bool> ValidateSubscriptionAsync(string subscriptionKey)
    {
        try
        {
            // Call Azure API Management to validate subscription key
            var validationUrl = $"{_apiManagementBaseUrl}/subscriptions/validate";
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", subscriptionKey);

            var response = await _httpClient.GetAsync(validationUrl);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate subscription key");
            return false;
        }
    }

    public async Task<List<SubscriptionInfo>> GetUserSubscriptionsAsync(string userId)
    {
        try
        {
            var subscriptionsUrl = $"{_apiManagementBaseUrl}/users/{userId}/subscriptions";
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);

            var response = await _httpClient.GetAsync(subscriptionsUrl);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var subscriptions = JsonSerializer.Deserialize<List<SubscriptionInfo>>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                return subscriptions ?? new List<SubscriptionInfo>();
            }

            return new List<SubscriptionInfo>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user subscriptions for {UserId}", userId);
            return new List<SubscriptionInfo>();
        }
    }

    private void InitializeDefaultApis()
    {
        var defaultApis = new List<ApiRegistration>
        {
            new ApiRegistration
            {
                Name = "properties-api",
                DisplayName = "Property Management API",
                Description = "APIs for managing property records",
                Path = "properties",
                ServiceUrl = "https://terrafusion-backend.azurewebsites.net/api",
                Protocols = new List<string> { "https" },
                SubscriptionKeyParameterNames = new Dictionary<string, string>
                {
                    ["Header"] = "Ocp-Apim-Subscription-Key",
                    ["Query"] = "subscription-key"
                }
            },
            new ApiRegistration
            {
                Name = "reports-api",
                DisplayName = "Reports API",
                Description = "APIs for generating reports",
                Path = "reports",
                ServiceUrl = "https://terrafusion-backend.azurewebsites.net/api",
                Protocols = new List<string> { "https" },
                SubscriptionKeyParameterNames = new Dictionary<string, string>
                {
                    ["Header"] = "Ocp-Apim-Subscription-Key",
                    ["Query"] = "subscription-key"
                }
            }
        };

        foreach (var api in defaultApis)
        {
            _registeredApis[api.Name] = api;
        }
    }

    private async Task<ApiGatewayResponse> ApplyPolicyToApi(string apiPath, string policyType, string policyXml)
    {
        try
        {
            var content = new StringContent(policyXml, System.Text.Encoding.UTF8, "application/xml");
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);

            var response = await _httpClient.PutAsync($"{_apiManagementBaseUrl}/apis/{apiPath}/policies/{policyType}", content);

            return new ApiGatewayResponse
            {
                Success = response.IsSuccessStatusCode,
                Message = response.IsSuccessStatusCode ? "Policy applied successfully" : $"Failed to apply policy: {response.StatusCode}",
                StatusCode = (int)response.StatusCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to apply policy {PolicyType} to API {ApiPath}", policyType, apiPath);
            return new ApiGatewayResponse
            {
                Success = false,
                Message = "Failed to apply policy",
                Error = ex.Message
            };
        }
    }

    private void AddOrUpdateApiPolicy(string apiPath, PolicyConfiguration policy)
    {
        if (!_apiPolicies.ContainsKey(apiPath))
        {
            _apiPolicies[apiPath] = new List<PolicyConfiguration>();
        }

        var existingPolicy = _apiPolicies[apiPath].FirstOrDefault(p => p.Type == policy.Type);
        if (existingPolicy != null)
        {
            _apiPolicies[apiPath].Remove(existingPolicy);
        }

        _apiPolicies[apiPath].Add(policy);
    }

    private string GenerateRateLimitPolicyXml(RateLimitPolicy policy)
    {
        return $@"
<policies>
    <inbound>
        <rate-limit calls=""{policy.CallsPerSecond}"" renewal-period=""60"" />
        <rate-limit-by-key calls=""{policy.CallsPerMinute}"" renewal-period=""3600"" counter-key=""@(context.Request.IpAddress)"" />
    </inbound>
</policies>";
    }

    private string GenerateCorsPolicyXml(CorsPolicy policy)
    {
        var origins = string.Join(",", policy.AllowedOrigins);
        var methods = string.Join(",", policy.AllowedMethods);
        var headers = string.Join(",", policy.AllowedHeaders);

        return $@"
<policies>
    <inbound>
        <cors allow-credentials=""true"">
            <allowed-origins>
                {string.Join("", policy.AllowedOrigins.Select(o => $"<origin>{o}</origin>"))}
            </allowed-origins>
            <allowed-methods>
                {string.Join("", policy.AllowedMethods.Select(m => $"<method>{m}</method>"))}
            </allowed-methods>
            <allowed-headers>
                {string.Join("", policy.AllowedHeaders.Select(h => $"<header>{h}</header>"))}
            </allowed-headers>
        </cors>
    </inbound>
</policies>";
    }

    private string GenerateAuthenticationPolicyXml(AuthenticationPolicy policy)
    {
        return policy.Type.ToLower() switch
        {
            "jwt" => $@"
<policies>
    <inbound>
        <validate-jwt header-name=""Authorization"" failed-validation-httpcode=""401"" failed-validation-error-message=""Unauthorized"">
            <openid-config url=""{policy.OpenIdConfigUrl}"" />
            <audiences>
                <audience>{policy.Audience}</audience>
            </audiences>
            <issuers>
                <issuer>{policy.Issuer}</issuer>
            </issuers>
        </validate-jwt>
    </inbound>
</policies>",
            "subscription" => @"
<policies>
    <inbound>
        <check-header name=""Ocp-Apim-Subscription-Key"" failed-check-httpcode=""401"" failed-check-error-message=""Access denied due to missing subscription key"" ignore-case=""false"" />
    </inbound>
</policies>",
            _ => @"<policies><inbound></inbound></policies>"
        };
    }

    private string GenerateCachingPolicyXml(CachingPolicy policy)
    {
        var varyBy = policy.VaryByQueryString ? @"<vary-by-query-parameter>*</vary-by-query-parameter>" : "";
        var varyByHeaders = string.Join("", policy.VaryByHeaders.Select(h => $"<vary-by-header>{h}</vary-by-header>"));

        return $@"
<policies>
    <inbound>
        <cache-lookup vary-by-developer=""true"" vary-by-developer-groups=""false"" downstream-caching-type=""none"">
            {varyBy}
            {varyByHeaders}
        </cache-lookup>
    </inbound>
    <outbound>
        <cache-store duration=""{policy.Duration}"" />
    </outbound>
</policies>";
    }

    private string GenerateSubscriptionKey()
    {
        var keyBytes = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(keyBytes);
        return Convert.ToBase64String(keyBytes);
    }
}

// Data models for API Gateway
public class RateLimitPolicy
{
    public int CallsPerSecond { get; set; } = 10;
    public int CallsPerMinute { get; set; } = 100;
    public int BurstSize { get; set; } = 50;
    public string? CounterKey { get; set; }
}

public class CorsPolicy
{
    public List<string> AllowedOrigins { get; set; } = new() { "*" };
    public List<string> AllowedMethods { get; set; } = new() { "GET", "POST", "PUT", "DELETE", "OPTIONS" };
    public List<string> AllowedHeaders { get; set; } = new() { "*" };
    public List<string> ExposedHeaders { get; set; } = new();
    public bool AllowCredentials { get; set; } = true;
    public int MaxAge { get; set; } = 3600;
}

public class AuthenticationPolicy
{
    public string Type { get; set; } = "jwt"; // jwt, subscription, oauth2
    public string? Issuer { get; set; }
    public string? Audience { get; set; }
    public string? OpenIdConfigUrl { get; set; }
    public bool RequireSubscription { get; set; } = true;
    public List<string> RequiredScopes { get; set; } = new();
}

public class CachingPolicy
{
    public int Duration { get; set; } = 300; // seconds
    public bool VaryByQueryString { get; set; } = true;
    public List<string> VaryByHeaders { get; set; } = new();
    public bool StaleWhileRevalidate { get; set; } = false;
    public string? CacheKey { get; set; }
}

public class PolicyConfiguration
{
    public string Type { get; set; } = string.Empty;
    public object? Configuration { get; set; }
    public DateTimeOffset AppliedAt { get; set; }
}

public class ApiRegistration
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string ServiceUrl { get; set; } = string.Empty;
    public List<string> Protocols { get; set; } = new() { "https" };
    public Dictionary<string, string> SubscriptionKeyParameterNames { get; set; } = new();
    public bool SubscriptionRequired { get; set; } = true;
    public DateTimeOffset RegisteredAt { get; set; } = DateTimeOffset.UtcNow;
}

public class ApiMetrics
{
    public string ApiPath { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public int RequestCount { get; set; }
    public double AverageResponseTime { get; set; }
    public int ErrorCount { get; set; }
    public double ErrorRate { get; set; }
    public long TotalBandwidth { get; set; }
}

public class ApiHealthStatus
{
    public string ApiPath { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public string Status { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public DateTimeOffset LastChecked { get; set; }
}

public class SubscriptionInfo
{
    public string Id { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string PrimaryKey { get; set; } = string.Empty;
    public string SecondaryKey { get; set; } = string.Empty;
    public string State { get; set; } = "active";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ApiGatewayResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string? Error { get; set; }
    public int StatusCode { get; set; }
}
