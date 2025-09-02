using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Services;

public interface IAIModuleOrchestrator
{
    Task<AIModuleStatus> GetAISwarmStatusAsync();
    Task<AICommandResult> ExecuteAICommandAsync(string module, string command, object parameters);
    Task<IEnumerable<AIModule>> GetActiveModulesAsync();
    Task<bool> StartAIModuleAsync(string moduleName);
    Task<bool> StopAIModuleAsync(string moduleName);
}

public class AIModuleOrchestrator : IAIModuleOrchestrator
{
    private readonly ILogger<AIModuleOrchestrator> _logger;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    
    // AI Module Configuration
    private readonly Dictionary<string, AIModuleConfig> _aiModules = new()
    {
        {
            "ai-command-brain", 
            new AIModuleConfig
            {
                Name = "ai-command-brain",
                DisplayName = "AI Command Brain",
                BaseUrl = "http://localhost:3001/api/ai-command-brain",
                Status = "active",
                Agents = 1008,
                MCPTools = 87,
                Description = "Supreme Commander + Field Generals + Squads coordination",
                Priority = 1
            }
        },
        {
            "ai-swarm",
            new AIModuleConfig
            {
                Name = "ai-swarm", 
                DisplayName = "AI Swarm Orchestrator",
                BaseUrl = "http://localhost:3002/api/ai-swarm",
                Status = "active",
                Agents = 1008,
                Description = "Swarm coordination managing 1,008 concurrent agents",
                Priority = 2
            }
        },
        {
            "ai-advanced",
            new AIModuleConfig
            {
                Name = "ai-advanced",
                DisplayName = "Enhanced Revenue Hunter",
                BaseUrl = "http://localhost:3003/api/ai-advanced",
                Status = "active",
                ROI = "47,231%",
                Description = "Revenue optimization with ML-powered predictions",
                Priority = 3,
                Endpoints = new[]
                {
                    "/mcp/orchestrate",
                    "/revenue/hunt", 
                    "/revenue/swarm",
                    "/temporal/optimize"
                }
            }
        }
    };

    public AIModuleOrchestrator(
        ILogger<AIModuleOrchestrator> logger,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClient = httpClient;
        _configuration = configuration;
        
        // Configure HttpClient for AI module communication with shorter timeout
        _httpClient.Timeout = TimeSpan.FromSeconds(2); // Reduced from 30 seconds
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-OS/1.0");
    }

    public async Task<AIModuleStatus> GetAISwarmStatusAsync()
    {
        try
        {
            var activeModules = _aiModules.Values.Where(m => m.Status == "active").ToList();
            var totalAgents = activeModules.Sum(m => m.Agents);
            
            // Check health of each module
            var healthChecks = new List<Task<ModuleHealthStatus>>();
            foreach (var module in activeModules)
            {
                healthChecks.Add(CheckModuleHealthAsync(module));
            }

            var healthResults = await Task.WhenAll(healthChecks);
            
            return new AIModuleStatus
            {
                TotalModules = activeModules.Count,
                ActiveModules = healthResults.Count(h => h.IsHealthy),
                TotalAgents = totalAgents,
                HealthyAgents = healthResults.Where(h => h.IsHealthy).Sum(h => h.AgentCount),
                MCPTools = activeModules.Where(m => m.MCPTools > 0).Sum(m => m.MCPTools),
                OverallStatus = healthResults.All(h => h.IsHealthy) ? "healthy" : "degraded",
                LastUpdated = DateTime.UtcNow,
                Modules = healthResults.ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI swarm status");
            return new AIModuleStatus
            {
                OverallStatus = "error",
                LastUpdated = DateTime.UtcNow,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AICommandResult> ExecuteAICommandAsync(string module, string command, object parameters)
    {
        try
        {
            if (!_aiModules.TryGetValue(module, out var moduleConfig))
            {
                return new AICommandResult
                {
                    Success = false,
                    ErrorMessage = $"AI module '{module}' not found",
                    Timestamp = DateTime.UtcNow
                };
            }

            var endpoint = $"{moduleConfig.BaseUrl}/{command}";
            var json = JsonSerializer.Serialize(parameters);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _logger.LogInformation("Executing AI command {Command} on module {Module}", command, module);

            var response = await _httpClient.PostAsync(endpoint, content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return new AICommandResult
                {
                    Success = true,
                    Result = responseContent,
                    Module = module,
                    Command = command,
                    Timestamp = DateTime.UtcNow,
                    ExecutionTimeMs = 0 // Would track actual execution time
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("AI command failed: {StatusCode} - {Error}", response.StatusCode, errorContent);
                
                return new AICommandResult
                {
                    Success = false,
                    ErrorMessage = $"HTTP {response.StatusCode}: {errorContent}",
                    Module = module,
                    Command = command,
                    Timestamp = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing AI command {Command} on module {Module}", command, module);
            return new AICommandResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                Module = module,
                Command = command,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    public async Task<IEnumerable<AIModule>> GetActiveModulesAsync()
    {
        try
        {
            var modules = new List<AIModule>();
            
            foreach (var config in _aiModules.Values)
            {
                var health = await CheckModuleHealthAsync(config);
                
                modules.Add(new AIModule
                {
                    Name = config.Name,
                    DisplayName = config.DisplayName,
                    Status = health.IsHealthy ? "healthy" : "unhealthy",
                    AgentCount = config.Agents,
                    Description = config.Description,
                    BaseUrl = config.BaseUrl,
                    LastHealthCheck = health.LastChecked,
                    ResponseTimeMs = health.ResponseTimeMs,
                    Endpoints = config.Endpoints ?? Array.Empty<string>()
                });
            }

            return modules.OrderBy(m => _aiModules[m.Name].Priority);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active AI modules");
            return Array.Empty<AIModule>();
        }
    }

    public async Task<bool> StartAIModuleAsync(string moduleName)
    {
        try
        {
            if (!_aiModules.TryGetValue(moduleName, out var moduleConfig))
            {
                _logger.LogWarning("Attempted to start unknown AI module: {ModuleName}", moduleName);
                return false;
            }

            // In a real implementation, this would start the actual module process
            // For now, we'll simulate starting by checking if it's accessible
            var health = await CheckModuleHealthAsync(moduleConfig);
            
            _logger.LogInformation("AI module {ModuleName} start request completed. Healthy: {IsHealthy}", 
                moduleName, health.IsHealthy);
                
            return health.IsHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting AI module {ModuleName}", moduleName);
            return false;
        }
    }

    public async Task<bool> StopAIModuleAsync(string moduleName)
    {
        try
        {
            if (!_aiModules.ContainsKey(moduleName))
            {
                _logger.LogWarning("Attempted to stop unknown AI module: {ModuleName}", moduleName);
                return false;
            }

            // In a real implementation, this would gracefully shutdown the module
            _logger.LogInformation("AI module {ModuleName} stop request completed", moduleName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping AI module {ModuleName}", moduleName);
            return false;
        }
    }

    private async Task<ModuleHealthStatus> CheckModuleHealthAsync(AIModuleConfig config)
    {
        try
        {
            var startTime = DateTime.UtcNow;
            
            // Try to ping the module's health endpoint with cancellation token
            var healthUrl = $"{config.BaseUrl}/health";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1)); // 1 second timeout
            
            var response = await _httpClient.GetAsync(healthUrl, cts.Token);
            
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            return new ModuleHealthStatus
            {
                ModuleName = config.Name,
                IsHealthy = response.IsSuccessStatusCode,
                LastChecked = DateTime.UtcNow,
                ResponseTimeMs = (int)responseTime,
                AgentCount = config.Agents,
                StatusMessage = response.IsSuccessStatusCode ? "OK" : $"HTTP {response.StatusCode}"
            };
        }
        catch (TaskCanceledException)
        {
            // Timeout occurred - return degraded status but don't fail completely
            return new ModuleHealthStatus
            {
                ModuleName = config.Name,
                IsHealthy = false,
                LastChecked = DateTime.UtcNow,
                ResponseTimeMs = 1000, // Indicate timeout
                AgentCount = config.Agents,
                StatusMessage = "Timeout - Service not available"
            };
        }
        catch (HttpRequestException)
        {
            // Connection failed - return degraded status but don't fail completely
            return new ModuleHealthStatus
            {
                ModuleName = config.Name,
                IsHealthy = false,
                LastChecked = DateTime.UtcNow,
                ResponseTimeMs = 0,
                AgentCount = config.Agents,
                StatusMessage = "Connection failed - Service not running"
            };
        }
        catch (Exception ex)
        {
            return new ModuleHealthStatus
            {
                ModuleName = config.Name,
                IsHealthy = false,
                LastChecked = DateTime.UtcNow,
                ResponseTimeMs = -1,
                AgentCount = 0,
                StatusMessage = $"Error: {ex.Message}"
            };
        }
    }
}

// Supporting DTOs and models
public class AIModuleConfig
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Agents { get; set; }
    public int MCPTools { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public string ROI { get; set; } = string.Empty;
    public string[]? Endpoints { get; set; }
}

public class AIModuleStatus
{
    public int TotalModules { get; set; }
    public int ActiveModules { get; set; }
    public int TotalAgents { get; set; }
    public int HealthyAgents { get; set; }
    public int MCPTools { get; set; }
    public string OverallStatus { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public string? ErrorMessage { get; set; }
    public List<ModuleHealthStatus> Modules { get; set; } = new();
}

// ModuleHealthStatus is already defined in UnifiedOrchestrationService.cs
// Using the shared definition from that file

public class AICommandResult
{
    public bool Success { get; set; }
    public string? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public string Module { get; set; } = string.Empty;
    public string Command { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public int ExecutionTimeMs { get; set; }
}

public class AIModule
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public DateTime LastHealthCheck { get; set; }
    public int ResponseTimeMs { get; set; }
    public string[] Endpoints { get; set; } = Array.Empty<string>();
}