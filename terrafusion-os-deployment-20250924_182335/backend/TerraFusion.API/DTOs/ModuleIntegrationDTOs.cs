namespace TerraFusion.API.DTOs;

/// <summary>
/// Module information DTO for government ecosystem
/// </summary>
public class ModuleInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Status { get; set; } = "";
    public int Tier { get; set; }
    public string GovernmentPriority { get; set; } = "";
    public string Description { get; set; } = "";
    public string Port { get; set; } = "";
    public string HealthEndpoint { get; set; } = "";
    public string IntegrationStatus { get; set; } = "";
    public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
}

/// <summary>
/// Module status tracking DTO
/// </summary>
public class ModuleStatus
{
    public string Id { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime LastUpdated { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Integration status report DTO
/// </summary>
public class IntegrationStatusReport
{
    public int TotalModules { get; set; }
    public int FullyIntegrated { get; set; }
    public int ReadyToIntegrate { get; set; }
    public double IntegrationPercentage { get; set; }
    public int CriticalModules { get; set; }
    public int CriticalModulesIntegrated { get; set; }
    public double CriticalIntegrationPercentage { get; set; }
    public List<string> NextPriorityIntegrations { get; set; } = new();
    public Dictionary<string, string> DeploymentReadiness { get; set; } = new();
}

/// <summary>
/// Component registry root DTO
/// </summary>
public class ComponentRegistryRoot
{
    public ComponentRegistry TerraFusionOsComponentRegistry { get; set; } = new();
}

/// <summary>
/// Component registry DTO
/// </summary>
public class ComponentRegistry
{
    public SystemInfo SystemInfo { get; set; } = new();
    public ModuleTier Tier1CoreGovernment { get; set; } = new();
    public ModuleTier Tier2Operational { get; set; } = new();
    public ModuleTier Tier3Specialized { get; set; } = new();
    public ModuleTier Tier4AiSystems { get; set; } = new();
    public ModuleTier Tier5CommercialSuites { get; set; } = new();
    public ModuleTier Tier6SpecializedTools { get; set; } = new();
    public ModuleTier Tier7DevelopmentTesting { get; set; } = new();
    public IntegrationSummary IntegrationSummary { get; set; } = new();
}

/// <summary>
/// System information DTO
/// </summary>
public class SystemInfo
{
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string TargetDeployment { get; set; } = "";
    public int TotalModules { get; set; }
    public DateTime RegistryCreated { get; set; }
    public int AiAgentsCoordinated { get; set; }
    public string PerformanceTarget { get; set; } = "";
}

/// <summary>
/// Module tier DTO
/// </summary>
public class ModuleTier
{
    public string Description { get; set; } = "";
    public Dictionary<string, ModuleRegistryEntry> Modules { get; set; } = new();
}

/// <summary>
/// Module registry entry DTO
/// </summary>
public class ModuleRegistryEntry
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Status { get; set; } = "";
    public int Tier { get; set; }
    public string GovernmentPriority { get; set; } = "";
    public string Description { get; set; } = "";
    public string Port { get; set; } = "";
    public string HealthEndpoint { get; set; } = "";
    public string IntegrationStatus { get; set; } = "";
}

/// <summary>
/// Integration summary DTO
/// </summary>
public class IntegrationSummary
{
    public int TotalModules { get; set; }
    public int FullyIntegrated { get; set; }
    public int ReadyToIntegrate { get; set; }
    public string IntegrationPercentage { get; set; } = "";
    public List<string> NextPriorityIntegrations { get; set; } = new();
    public Dictionary<string, string> DeploymentReadiness { get; set; } = new();
}