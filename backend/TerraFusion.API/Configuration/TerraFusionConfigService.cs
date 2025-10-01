using System.Text.Json;
using System.Text.Json.Serialization;

namespace TerraFusion.API.Configuration;

public class TerraFusionConfig
{
    public SystemConfig System { get; set; } = new();
    public AISwarmConfig AISwarm { get; set; } = new();
    public ModulesConfig Modules { get; set; } = new();
    public NetworkingConfig Networking { get; set; } = new();
    public SecurityConfig Security { get; set; } = new();
    public PerformanceConfig Performance { get; set; } = new();
    public DeploymentConfig Deployment { get; set; } = new();
}

public class SystemConfig
{
    public string Name { get; set; } = "TerraFusion OS";
    public string Version { get; set; } = "1.0.0";
    public string Environment { get; set; } = "production";
    public string DeploymentTarget { get; set; } = "benton-county";
}

public class AISwarmConfig
{
    public string ScalingStrategy { get; set; } = "dynamic_elastic";
    public DeploymentPhasesConfig DeploymentPhases { get; set; } = new();
    public HierarchyConfig Hierarchy { get; set; } = new();
}

public class DeploymentPhasesConfig
{
    public int CurrentPhase { get; set; } = 1;
    public int TargetPhase { get; set; } = 5;
    public List<PhaseConfig> Phases { get; set; } = new();
}

public class PhaseConfig
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int AgentCount { get; set; }
    public string Status { get; set; } = "";
    public List<string> Capabilities { get; set; } = new();
}

public class HierarchyConfig
{
    public AgentTierConfig SupremeCommander { get; set; } = new();
    public AgentTierConfig FieldGenerals { get; set; } = new();
    public AgentTierConfig OperationalForces { get; set; } = new();
}

public class AgentTierConfig
{
    public int Count { get; set; }
    public int? BaseCount { get; set; }
    public int? MaxCount { get; set; }
    public string ScalingFactor { get; set; } = "";
    public double? RatioToTotal { get; set; }
}

public class ModulesConfig
{
    public string DiscoveryStrategy { get; set; } = "filesystem_scan";
    public string LoadingStrategy { get; set; } = "hot_swap_enabled";
    public ModuleScalingConfig Scaling { get; set; } = new();
}

public class ModuleScalingConfig
{
    public int MinModules { get; set; } = 1;
    public string MaxModules { get; set; } = "unlimited";
    public bool AutoDiscovery { get; set; } = true;
    public bool RuntimeLoading { get; set; } = true;
}

public class NetworkingConfig
{
    public string PortStrategy { get; set; } = "dynamic_allocation";
    public string ApiPort { get; set; } = "{TF_API_PORT:-5046}";
    public string FrontendPort { get; set; } = "{TF_FRONTEND_PORT:-3103}";
    public string ShellPort { get; set; } = "{TF_SHELL_PORT:-3103}";
    public PortRangeConfig PortRange { get; set; } = new();
}

public class PortRangeConfig
{
    public int Min { get; set; } = 3000;
    public int Max { get; set; } = 9999;
}

public class SecurityConfig
{
    public List<string> ClassificationLevels { get; set; } = new();
    public List<string> ComplianceFrameworks { get; set; } = new();
    public string Encryption { get; set; } = "AES-256-GCM";
    public bool AuditLogging { get; set; } = true;
}

public class PerformanceConfig
{
    public RustEngineConfig RustEngine { get; set; } = new();
    public string TargetResponseTime { get; set; } = "6-7ms";
    public bool QuantumOptimization { get; set; } = true;
}

public class RustEngineConfig
{
    public bool Enabled { get; set; } = true;
    public bool FFIBridge { get; set; } = true;
    public List<string> Crates { get; set; } = new();
}

public class DeploymentConfig
{
    public string Strategy { get; set; } = "white_glove_professional";
    public Dictionary<string, CountyConfig> Counties { get; set; } = new();
    public RevenueModelConfig RevenueModel { get; set; } = new();
}

public class CountyConfig
{
    public int Population { get; set; }
    public long Budget { get; set; }
    public int Parcels { get; set; }
    public string AgentAllocation { get; set; } = "auto_scale";
    public string ModuleSelection { get; set; } = "government_core_plus";
}

public class RevenueModelConfig
{
    public decimal BaseFee { get; set; }
    public decimal MarketplaceArpu { get; set; }
    public decimal TotalMonthly { get; set; }
    public string Currency { get; set; } = "USD";
}

public interface ITerraFusionConfigService
{
    TerraFusionConfig GetConfiguration();
    int GetCurrentAgentCount();
    int GetTargetAgentCount();
    int GetModuleCount();
}

public class TerraFusionConfigService : ITerraFusionConfigService
{
    private readonly TerraFusionConfig _config;
    private readonly ILogger<TerraFusionConfigService> _logger;

    public TerraFusionConfigService(ILogger<TerraFusionConfigService> logger)
    {
        _logger = logger;
        _config = LoadConfiguration();
    }

    public TerraFusionConfig GetConfiguration() => _config;

    public int GetCurrentAgentCount()
    {
        // Return the actual total agent count from AI swarm config
        return _config.AISwarm.Hierarchy.SupremeCommander.Count + 
               _config.AISwarm.Hierarchy.FieldGenerals.Count + 
               _config.AISwarm.Hierarchy.OperationalForces.Count;
    }

    public int GetTargetAgentCount()
    {
        // Return the same as current since we're at full capacity
        return GetCurrentAgentCount();
    }

    public int GetModuleCount()
    {
        // Get from environment variable or configuration minimum
        if (int.TryParse(Environment.GetEnvironmentVariable("TF_MODULE_COUNT"), out int envCount))
            return Math.Max(envCount, _config.Modules.Scaling.MinModules);
        
        return _config.Modules.Scaling.MinModules;
    }

    private TerraFusionConfig LoadConfiguration()
    {
        try
        {
            // Load from ai-swarm-config.json first (primary source)
            var aiSwarmConfigPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "configs", "ai-swarm-config.json");
            if (!File.Exists(aiSwarmConfigPath))
            {
                // Try alternate path
                aiSwarmConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "configs", "ai-swarm-config.json");
            }
            
            TerraFusionConfig config = CreateDefaultConfiguration();
            
            if (File.Exists(aiSwarmConfigPath))
            {
                _logger.LogInformation("Loading AI swarm configuration from {Path}", aiSwarmConfigPath);
                var aiSwarmContent = File.ReadAllText(aiSwarmConfigPath);
                var aiSwarmJson = JsonSerializer.Deserialize<JsonElement>(aiSwarmContent);
                
                if (aiSwarmJson.ValueKind != JsonValueKind.Null && aiSwarmJson.ValueKind != JsonValueKind.Undefined)
                {
                    // Extract agent counts from the actual config
                    var agents = aiSwarmJson.GetProperty("agents");
                    var deployment = aiSwarmJson.GetProperty("deployment");
                    
                    var supremeCommander = agents.GetProperty("supreme_commander_claude").GetInt32();
                    var fieldGenerals = agents.GetProperty("field_generals").GetInt32();
                    var operationalForces = agents.GetProperty("operational_forces").GetInt32();
                    var totalAgents = deployment.GetProperty("total_agents").GetInt32();
                    
                    // Update configuration with real values
                    config.AISwarm.Hierarchy.SupremeCommander.Count = supremeCommander;
                    config.AISwarm.Hierarchy.FieldGenerals.Count = fieldGenerals;
                    config.AISwarm.Hierarchy.OperationalForces.Count = operationalForces;
                    
                    // Update phases to reflect real scaling
                    config.AISwarm.DeploymentPhases.CurrentPhase = 5; // We're at full capacity
                    config.AISwarm.DeploymentPhases.Phases = new List<PhaseConfig>
                    {
                        new() { Id = 1, Name = "bootstrap", AgentCount = 1000, Status = "completed" },
                        new() { Id = 2, Name = "county_operations", AgentCount = 5000, Status = "completed" },
                        new() { Id = 3, Name = "regional_expansion", AgentCount = 15000, Status = "completed" },
                        new() { Id = 4, Name = "state_integration", AgentCount = 35000, Status = "completed" },
                        new() { Id = 5, Name = "federal_readiness", AgentCount = totalAgents, Status = "active" }
                    };
                    
                    _logger.LogInformation("Loaded dynamic AI configuration: {Total} total agents ({FieldGenerals} Field Generals, {OperationalForces} Operational Forces)", 
                        totalAgents, fieldGenerals, operationalForces);
                }
            }
            else
            {
                _logger.LogWarning("AI swarm config not found at {Path}, using defaults", aiSwarmConfigPath);
            }
            
            // Load terrafusion-config.json for additional settings
            var terraConfigPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "terrafusion-config.json");
            if (!File.Exists(terraConfigPath))
            {
                terraConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "terrafusion-config.json");
            }
            
            if (File.Exists(terraConfigPath))
            {
                _logger.LogInformation("Loading TerraFusion configuration from {Path}", terraConfigPath);
                var terraContent = File.ReadAllText(terraConfigPath);
                var terraJson = JsonSerializer.Deserialize<JsonElement>(terraContent);
                
                if (terraJson.ValueKind != JsonValueKind.Null && terraJson.ValueKind != JsonValueKind.Undefined)
                {
                    var system = terraJson.GetProperty("system");
                    config.System.Name = system.GetProperty("name").GetString() ?? "TerraFusion OS";
                    config.System.Version = system.GetProperty("version").GetString() ?? "1.0.0";
                    config.System.Environment = system.GetProperty("environment").GetString() ?? "production";
                    config.System.DeploymentTarget = system.GetProperty("deployment_target").GetString() ?? "benton-county";
                }
            }
            
            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load configuration, using defaults");
            return CreateDefaultConfiguration();
        }
    }

    private static TerraFusionConfig CreateDefaultConfiguration()
    {
        return new TerraFusionConfig
        {
            AISwarm = new AISwarmConfig
            {
                DeploymentPhases = new DeploymentPhasesConfig
                {
                    CurrentPhase = 5,
                    TargetPhase = 5,
                    Phases = new List<PhaseConfig>
                    {
                        new() { Id = 1, Name = "bootstrap", AgentCount = 1000, Status = "completed" },
                        new() { Id = 2, Name = "county_operations", AgentCount = 5000, Status = "completed" },
                        new() { Id = 3, Name = "regional_expansion", AgentCount = 15000, Status = "completed" },
                        new() { Id = 4, Name = "state_integration", AgentCount = 35000, Status = "completed" },
                        new() { Id = 5, Name = "federal_readiness", AgentCount = 50000, Status = "active" }
                    }
                },
                Hierarchy = new HierarchyConfig
                {
                    SupremeCommander = new AgentTierConfig { Count = 1 },
                    FieldGenerals = new AgentTierConfig { Count = 1220 },
                    OperationalForces = new AgentTierConfig { Count = 48779 }
                }
            },
            Modules = new ModulesConfig
            {
                Scaling = new ModuleScalingConfig { MinModules = 39 }
            }
        };
    }
}
