using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Collections.Concurrent;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.Enterprise;

/// <summary>
/// Service for managing third-party integrations and webhooks
/// </summary>
public interface IThirdPartyIntegrationService
{
    Task<IntegrationResponse> RegisterWebhookAsync(WebhookConfig config);
    Task<bool> RemoveWebhookAsync(string webhookId);
    Task<List<WebhookRegistration>> GetActiveWebhooksAsync();
    Task<bool> ProcessIncomingWebhookAsync(string webhookId, string payload, string signature);
    Task<IntegrationResponse> CallExternalAPIAsync(string integrationName, string endpoint, object data);
    Task<List<Integration>> GetAvailableIntegrationsAsync();
    Task<bool> ConfigureIntegrationAsync(string integrationName, Dictionary<string, string> settings);
    Task<IntegrationHealthStatus> CheckIntegrationHealthAsync(string integrationName);
    Task<List<IntegrationLog>> GetIntegrationLogsAsync(string integrationName, TimeSpan period);
}

public class ThirdPartyIntegrationService : IThirdPartyIntegrationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ThirdPartyIntegrationService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly HttpClient _httpClient;
    private readonly ConcurrentDictionary<string, WebhookRegistration> _webhooks;
    private readonly ConcurrentDictionary<string, Integration> _integrations;

    public ThirdPartyIntegrationService(
        IConfiguration configuration,
        ILogger<ThirdPartyIntegrationService> logger,
        IStructuredLogger structuredLogger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _httpClient = httpClient;
        _webhooks = new ConcurrentDictionary<string, WebhookRegistration>();
        _integrations = new ConcurrentDictionary<string, Integration>();

        InitializeAvailableIntegrations();
    }

    public async Task<IntegrationResponse> RegisterWebhookAsync(WebhookConfig config)
    {
        try
        {
            var webhookId = Guid.NewGuid().ToString();
            var registration = new WebhookRegistration
            {
                Id = webhookId,
                Config = config,
                RegisteredAt = DateTimeOffset.UtcNow,
                IsActive = true,
                LastTriggered = null,
                TriggerCount = 0
            };

            _webhooks.TryAdd(webhookId, registration);

            // Persist to database
            await SaveWebhookToDatabase(registration);

            _structuredLogger.LogIntegrationEvent("WebhookRegistered",
                $"Webhook registered for {config.IntegrationName}",
                context: new { 
                    WebhookId = webhookId, 
                    Integration = config.IntegrationName,
                    Endpoint = config.TargetUrl,
                    Events = config.Events 
                });

            return new IntegrationResponse
            {
                Success = true,
                Message = "Webhook registered successfully",
                Data = new { WebhookId = webhookId, Url = $"/api/webhooks/{webhookId}" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register webhook for {Integration}", config.IntegrationName);
            return new IntegrationResponse
            {
                Success = false,
                Message = "Failed to register webhook",
                Error = ex.Message
            };
        }
    }

    public async Task<bool> RemoveWebhookAsync(string webhookId)
    {
        try
        {
            if (_webhooks.TryRemove(webhookId, out var webhook))
            {
                // Remove from database
                await RemoveWebhookFromDatabase(webhookId);

                _structuredLogger.LogIntegrationEvent("WebhookRemoved",
                    $"Webhook {webhookId} removed",
                    context: new { WebhookId = webhookId, Integration = webhook.Config.IntegrationName });

                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove webhook {WebhookId}", webhookId);
            return false;
        }
    }

        public Task<List<WebhookRegistration>> GetActiveWebhooksAsync()
    {
        try
        {
            return Task.FromResult(_webhooks.Values.Where(w => w.IsActive).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active webhooks");
            return Task.FromResult(new List<WebhookRegistration>());
        }
    }

    public async Task<bool> ProcessIncomingWebhookAsync(string webhookId, string payload, string signature)
    {
        try
        {
            if (!_webhooks.TryGetValue(webhookId, out var webhook))
            {
                _logger.LogWarning("Webhook {WebhookId} not found", webhookId);
                return false;
            }

            // Validate signature if required
            if (!string.IsNullOrEmpty(webhook.Config.Secret))
            {
                if (!ValidateWebhookSignature(payload, signature, webhook.Config.Secret))
                {
                    _structuredLogger.LogSecurityEvent("WebhookSignatureInvalid",
                        $"Invalid signature for webhook {webhookId}",
                        context: new { WebhookId = webhookId });
                    return false;
                }
            }

            // Update webhook statistics
            webhook.LastTriggered = DateTimeOffset.UtcNow;
            webhook.TriggerCount++;

            // Process the webhook payload
            await ProcessWebhookPayload(webhook, payload);

            _structuredLogger.LogIntegrationEvent("WebhookProcessed",
                $"Webhook {webhookId} processed successfully",
                context: new { 
                    WebhookId = webhookId, 
                    Integration = webhook.Config.IntegrationName,
                    PayloadSize = payload.Length 
                });

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process webhook {WebhookId}", webhookId);
            return false;
        }
    }

    public async Task<IntegrationResponse> CallExternalAPIAsync(string integrationName, string endpoint, object data)
    {
        try
        {
            if (!_integrations.TryGetValue(integrationName, out var integration))
            {
                return new IntegrationResponse
                {
                    Success = false,
                    Message = $"Integration {integrationName} not found"
                };
            }

            var url = $"{integration.BaseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            var jsonContent = JsonSerializer.Serialize(data);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            // Add authentication headers
            if (!string.IsNullOrEmpty(integration.ApiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", integration.ApiKey);
            }

            var response = await _httpClient.PostAsync(url, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            var integrationResponse = new IntegrationResponse
            {
                Success = response.IsSuccessStatusCode,
                Message = response.IsSuccessStatusCode ? "API call successful" : "API call failed",
                Data = responseContent,
                StatusCode = (int)response.StatusCode
            };

            _structuredLogger.LogIntegrationEvent("ExternalAPICall",
                $"External API call to {integrationName}",
                context: new { 
                    Integration = integrationName,
                    Endpoint = endpoint,
                    StatusCode = (int)response.StatusCode,
                    Success = response.IsSuccessStatusCode 
                });

            return integrationResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call external API {Integration}/{Endpoint}", integrationName, endpoint);
            return new IntegrationResponse
            {
                Success = false,
                Message = "External API call failed",
                Error = ex.Message
            };
        }
    }

    public Task<List<Integration>> GetAvailableIntegrationsAsync()
    {
        try
        {
            return Task.FromResult(_integrations.Values.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available integrations");
            return Task.FromResult(new List<Integration>());
        }
    }

    public async Task<bool> ConfigureIntegrationAsync(string integrationName, Dictionary<string, string> settings)
    {
        try
        {
            if (!_integrations.TryGetValue(integrationName, out var integration))
            {
                _logger.LogWarning("Integration {Integration} not found", integrationName);
                return false;
            }

            // Update integration settings
            integration.Settings = settings;
            integration.ConfiguredAt = DateTimeOffset.UtcNow;
            integration.IsConfigured = true;

            // Extract common settings
            if (settings.TryGetValue("apiKey", out var apiKey))
            {
                integration.ApiKey = apiKey;
            }

            if (settings.TryGetValue("baseUrl", out var baseUrl))
            {
                integration.BaseUrl = baseUrl;
            }

            // Persist to database
            await SaveIntegrationConfigToDatabase(integration);

            _structuredLogger.LogIntegrationEvent("IntegrationConfigured",
                $"Integration {integrationName} configured",
                context: new { 
                    Integration = integrationName,
                    SettingsCount = settings.Count 
                });

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to configure integration {Integration}", integrationName);
            return false;
        }
    }

    public async Task<IntegrationHealthStatus> CheckIntegrationHealthAsync(string integrationName)
    {
        try
        {
            if (!_integrations.TryGetValue(integrationName, out var integration))
            {
                return new IntegrationHealthStatus
                {
                    IntegrationName = integrationName,
                    IsHealthy = false,
                    Status = "Not Found",
                    LastChecked = DateTimeOffset.UtcNow
                };
            }

            // Perform health check
            var healthCheckUrl = $"{integration.BaseUrl.TrimEnd('/')}/health";
            var isHealthy = false;
            var status = "Unknown";
            var responseTime = TimeSpan.Zero;

            try
            {
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                var response = await _httpClient.GetAsync(healthCheckUrl);
                stopwatch.Stop();
                responseTime = stopwatch.Elapsed;

                isHealthy = response.IsSuccessStatusCode;
                status = response.IsSuccessStatusCode ? "Healthy" : $"Unhealthy ({response.StatusCode})";
            }
            catch (Exception healthEx)
            {
                status = $"Error: {healthEx.Message}";
            }

            var healthStatus = new IntegrationHealthStatus
            {
                IntegrationName = integrationName,
                IsHealthy = isHealthy,
                Status = status,
                ResponseTime = responseTime,
                LastChecked = DateTimeOffset.UtcNow
            };

            _structuredLogger.LogIntegrationEvent("HealthCheckPerformed",
                $"Health check for {integrationName}: {status}",
                context: new { 
                    Integration = integrationName,
                    IsHealthy = isHealthy,
                    ResponseTime = responseTime.TotalMilliseconds 
                });

            return healthStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check health for integration {Integration}", integrationName);
            return new IntegrationHealthStatus
            {
                IntegrationName = integrationName,
                IsHealthy = false,
                Status = $"Health check failed: {ex.Message}",
                LastChecked = DateTimeOffset.UtcNow
            };
        }
    }

    public async Task<List<IntegrationLog>> GetIntegrationLogsAsync(string integrationName, TimeSpan period)
    {
        try
        {
            // This would query logs from database
            var logs = await LoadIntegrationLogsFromDatabase(integrationName, period);
            return logs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get integration logs for {Integration}", integrationName);
            return new List<IntegrationLog>();
        }
    }

    private void InitializeAvailableIntegrations()
    {
        var integrations = new List<Integration>
        {
            new Integration
            {
                Name = "Salesforce",
                Description = "Customer relationship management platform",
                Type = IntegrationType.CRM,
                BaseUrl = "https://api.salesforce.com",
                SupportedEvents = new List<string> { "lead.created", "opportunity.updated", "account.modified" },
                RequiredSettings = new List<string> { "apiKey", "instanceUrl", "version" }
            },
            new Integration
            {
                Name = "Slack",
                Description = "Team communication platform",
                Type = IntegrationType.Communication,
                BaseUrl = "https://slack.com/api",
                SupportedEvents = new List<string> { "message.sent", "channel.created", "user.joined" },
                RequiredSettings = new List<string> { "botToken", "signingSecret" }
            },
            new Integration
            {
                Name = "Microsoft365",
                Description = "Microsoft Office 365 suite",
                Type = IntegrationType.Productivity,
                BaseUrl = "https://graph.microsoft.com/v1.0",
                SupportedEvents = new List<string> { "email.received", "calendar.event.created", "file.uploaded" },
                RequiredSettings = new List<string> { "clientId", "clientSecret", "tenantId" }
            },
            new Integration
            {
                Name = "Zapier",
                Description = "Automation platform for connecting apps",
                Type = IntegrationType.Automation,
                BaseUrl = "https://hooks.zapier.com",
                SupportedEvents = new List<string> { "trigger.activated", "action.completed" },
                RequiredSettings = new List<string> { "webhookUrl", "apiKey" }
            },
            new Integration
            {
                Name = "QuickBooks",
                Description = "Accounting and financial management software",
                Type = IntegrationType.Finance,
                BaseUrl = "https://sandbox-quickbooks.api.intuit.com",
                SupportedEvents = new List<string> { "invoice.created", "payment.received", "customer.updated" },
                RequiredSettings = new List<string> { "consumerKey", "consumerSecret", "accessToken", "realmId" }
            }
        };

        foreach (var integration in integrations)
        {
            _integrations.TryAdd(integration.Name, integration);
        }
    }

    private bool ValidateWebhookSignature(string payload, string signature, string secret)
    {
        // Implementation would depend on the specific integration's signature validation method
        // This is a simplified example
        try
        {
            using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secret));
            var computedHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(payload));
            var computedSignature = Convert.ToBase64String(computedHash);
            
            return signature.Equals(computedSignature, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private async Task ProcessWebhookPayload(WebhookRegistration webhook, string payload)
    {
        try
        {
            // Forward to configured endpoint
            if (!string.IsNullOrEmpty(webhook.Config.TargetUrl))
            {
                var content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
                await _httpClient.PostAsync(webhook.Config.TargetUrl, content);
            }

            // Process based on integration type
            switch (webhook.Config.IntegrationName.ToLower())
            {
                case "salesforce":
                    await ProcessSalesforceWebhook(payload);
                    break;
                case "slack":
                    await ProcessSlackWebhook(payload);
                    break;
                default:
                    await ProcessGenericWebhook(payload);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process webhook payload for {Integration}", 
                webhook.Config.IntegrationName);
        }
    }

    private async Task ProcessSalesforceWebhook(string payload)
    {
        // Salesforce-specific webhook processing
        await Task.Delay(10);
    }

    private async Task ProcessSlackWebhook(string payload)
    {
        // Slack-specific webhook processing
        await Task.Delay(10);
    }

    private async Task ProcessGenericWebhook(string payload)
    {
        // Generic webhook processing
        await Task.Delay(10);
    }

    private async Task SaveWebhookToDatabase(WebhookRegistration webhook)
    {
        // Simulate database save
        await Task.Delay(10);
    }

    private async Task RemoveWebhookFromDatabase(string webhookId)
    {
        // Simulate database removal
        await Task.Delay(10);
    }

    private async Task SaveIntegrationConfigToDatabase(Integration integration)
    {
        // Simulate database save
        await Task.Delay(10);
    }

    private async Task<List<IntegrationLog>> LoadIntegrationLogsFromDatabase(string integrationName, TimeSpan period)
    {
        // Simulate database load
        await Task.Delay(10);
        
        return new List<IntegrationLog>
        {
            new IntegrationLog
            {
                IntegrationName = integrationName,
                Action = "API Call",
                Status = "Success",
                Timestamp = DateTimeOffset.UtcNow.Subtract(TimeSpan.FromHours(1)),
                Details = "Sample log entry"
            }
        };
    }
}

// Data models
public class WebhookConfig
{
    public string IntegrationName { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
    public string? Secret { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
}

public class WebhookRegistration
{
    public string Id { get; set; } = string.Empty;
    public WebhookConfig Config { get; set; } = new();
    public DateTimeOffset RegisteredAt { get; set; }
    public DateTimeOffset? LastTriggered { get; set; }
    public int TriggerCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Integration
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IntegrationType Type { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public List<string> SupportedEvents { get; set; } = new();
    public List<string> RequiredSettings { get; set; } = new();
    public Dictionary<string, string> Settings { get; set; } = new();
    public bool IsConfigured { get; set; }
    public DateTimeOffset? ConfiguredAt { get; set; }
}

public enum IntegrationType
{
    CRM,
    Communication,
    Productivity,
    Automation,
    Finance,
    Analytics,
    Storage,
    Security
}

public class IntegrationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string? Error { get; set; }
    public int StatusCode { get; set; }
}

public class IntegrationHealthStatus
{
    public string IntegrationName { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public string Status { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public DateTimeOffset LastChecked { get; set; }
}

public class IntegrationLog
{
    public string IntegrationName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public string? Details { get; set; }
    public string? RequestId { get; set; }
}
