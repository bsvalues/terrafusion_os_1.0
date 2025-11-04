using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Models
{
    /// <summary>
    /// TERRAFUSION ECOSYSTEM MARKETPLACE MODELS
    ///
    /// Comprehensive data models supporting the TerraFusion OS ecosystem marketplace,
    /// including specialized government modules, Harris PACS bridge integration,
    /// and county-specific customizations.
    /// </summary>

    public class MarketplaceModule
    {
        public string ModuleId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Version { get; set; } = "";
        public ModuleCategory Category { get; set; }
        public ModulePriority Priority { get; set; }
        public string[] RequiredCapabilities { get; set; } = Array.Empty<string>();
        public bool HarrisPACSCompatible { get; set; }
        public bool LoadOnStartup { get; set; }
        public int AIAgentsRequired { get; set; }
        public HarrisPACSModuleBridge HarrisPACSBridge { get; set; } = new();
        public List<ModuleDependency> Dependencies { get; set; } = new List<ModuleDependency>();
        public ModuleConfiguration DefaultConfiguration { get; set; } = new();
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Publisher { get; set; } = "TerraFusion";
        public ModuleLicense License { get; set; } = new();
        public List<string> SupportedCounties { get; set; } = new List<string>();
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
    }

    public enum ModuleCategory
    {
        CoreGovernment,
        AIEnhanced,
        Analytics,
        Compliance,
        Customization,
        Integration,
        Utilities,
        Specialized
    }

    public enum ModulePriority
    {
        Critical,
        High,
        Medium,
        Low,
        Optional
    }

    public class ModuleDefinition
    {
        public string ModuleId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Version { get; set; } = "";
        public ModuleCategory Category { get; set; }
        public ModulePriority Priority { get; set; }
        public string[] RequiredCapabilities { get; set; } = Array.Empty<string>();
        public bool HarrisPACSCompatible { get; set; }
        public bool LoadOnStartup { get; set; }
        public int AIAgentsRequired { get; set; }
        public string AssemblyPath { get; set; } = "";
        public string EntryPoint { get; set; } = "";
        public List<ModuleDependency> Dependencies { get; set; } = new List<ModuleDependency>();
    }

    public class ModuleDependency
    {
        public string DependencyId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Version { get; set; } = "";
        public bool Required { get; set; }
        public string MinimumVersion { get; set; } = "";
        public string MaximumVersion { get; set; } = "";
    }

    public class ModuleConfiguration
    {
        public Dictionary<string, object> Settings { get; set; } = new Dictionary<string, object>();
        public Dictionary<string, ConnectionString> ConnectionStrings { get; set; } = new Dictionary<string, ConnectionString>();
        public Dictionary<string, FeatureFlag> FeatureFlags { get; set; } = new Dictionary<string, FeatureFlag>();
        public SecurityConfiguration SecurityConfiguration { get; set; } = new();
        public PerformanceConfiguration PerformanceConfiguration { get; set; } = new();
    }

    public class ConnectionString
    {
        public string Value { get; set; } = "";
        public string Provider { get; set; } = "";
        public bool Encrypted { get; set; }
        public Dictionary<string, string> AdditionalParameters { get; set; } = new Dictionary<string, string>();
    }

    public class FeatureFlag
    {
        public bool Enabled { get; set; }
        public string Description { get; set; } = "";
        public List<string> EnabledForCounties { get; set; } = new List<string>();
        public DateTime? EnabledUntil { get; set; }
    }

    public class SecurityConfiguration
    {
        public bool RequireAuthentication { get; set; } = true;
        public bool RequireAuthorization { get; set; } = true;
        public List<string> RequiredRoles { get; set; } = new List<string>();
        public bool EnableAuditLogging { get; set; } = true;
        public EncryptionLevel EncryptionLevel { get; set; } = EncryptionLevel.High;
    }

    public enum EncryptionLevel
    {
        None,
        Basic,
        Standard,
        High,
        Quantum
    }

    public class PerformanceConfiguration
    {
        public TimeSpan ResponseTimeTarget { get; set; } = TimeSpan.FromMilliseconds(100);
        public int MaxConcurrentRequests { get; set; } = 1000;
        public int CacheExpirationMinutes { get; set; } = 30;
        public bool EnablePerformanceMonitoring { get; set; } = true;
        public decimal PerformanceThreshold { get; set; } = 0.95m; // 95% performance target
    }

    public class ModuleLicense
    {
        public string LicenseType { get; set; } = "";
        public string LicenseKey { get; set; } = "";
        public DateTime ExpirationDate { get; set; }
        public List<string> Restrictions { get; set; } = new List<string>();
        public bool CommercialUse { get; set; }
    }

    public class HarrisPACSModuleBridge
    {
        public string ModuleId { get; set; } = "";
        public string BridgeId { get; set; } = "";
        public HarrisPACSIntegrationLevel IntegrationLevel { get; set; }
        public List<string> EnabledCapabilities { get; set; } = new List<string>();
        public int AIAgentAllocation { get; set; }
        public Dictionary<string, string> BridgeConfiguration { get; set; } = new Dictionary<string, string>();
        public bool AutoEnhancementEnabled { get; set; } = true;
        public List<DataMappingRule> DataMappingRules { get; set; } = new List<DataMappingRule>();
    }

    public enum HarrisPACSIntegrationLevel
    {
        None,
        Basic,
        Standard,
        Full,
        Advanced
    }

    public class DataMappingRule
    {
        public string SourceField { get; set; } = "";
        public string TargetField { get; set; } = "";
        public string MappingType { get; set; } = "";
        public string TransformationRule { get; set; } = "";
        public bool Required { get; set; }
    }

    public class MarketplaceInitializationResult
    {
        public string InitializationId { get; set; } = "";
        public bool Success { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan InitializationDuration { get; set; }
        public int TotalModulesLoaded { get; set; }
        public List<string> InitializedModules { get; set; } = new List<string>();
        public bool HarrisPACSBridgeIntegrated { get; set; }
        public string ErrorMessage { get; set; } = "";
        public string ErrorDetails { get; set; } = "";
    }

    public class ModuleActivationRequest
    {
        [Required]
        public string CountyCode { get; set; } = "";

        public bool UseHarrisPACSBridge { get; set; } = false;
        public ModuleConfiguration Configuration { get; set; } = new();
        public List<string> RequiredCapabilities { get; set; } = new List<string>();
        public int RequestedAIAgents { get; set; }
        public Dictionary<string, object> CustomParameters { get; set; } = new Dictionary<string, object>();
    }

    public class ModuleActivationResult
    {
        public bool Success { get; set; }
        public string ActivationId { get; set; } = "";
        public ActiveModuleInstance ActiveInstance { get; set; } = new();
        public string Message { get; set; } = "";
        public string ErrorMessage { get; set; } = "";
        public string ErrorDetails { get; set; } = "";
        public TimeSpan ActivationDuration { get; set; }
    }

    public class ActiveModuleInstance
    {
        public string ActivationId { get; set; } = "";
        public string ModuleId { get; set; } = "";
        public string CountyCode { get; set; } = "";
        public DateTime ActivationTime { get; set; }
        public MarketplaceModule Module { get; set; } = new();
        public ModuleConfiguration Configuration { get; set; } = new();
        public AIAgentAllocation AIAgentAllocation { get; set; } = new();
        public HarrisPACSBridgeActivation HarrisBridgeActivation { get; set; } = new();
        public ModuleStatus Status { get; set; }
        public ModulePerformanceMetrics PerformanceMetrics { get; set; } = new();
        public List<ModuleEvent> Events { get; set; } = new List<ModuleEvent>();
        public DateTime LastHealthCheck { get; set; }
        public Dictionary<string, object> RuntimeData { get; set; } = new Dictionary<string, object>();
    }

    public enum ModuleStatus
    {
        Initializing,
        Active,
        Paused,
        Error,
        Stopped,
        Upgrading
    }

    public class AIAgentAllocation
    {
        public string AllocationId { get; set; } = "";
        public int RequestedAgentCount { get; set; }
        public int AllocatedAgentCount { get; set; }
        public List<string> AllocatedAgentIds { get; set; } = new List<string>();
        public DateTime AllocationTime { get; set; }
        public AIAgentAllocationStatus Status { get; set; }
        public Dictionary<string, decimal> AgentPerformanceMetrics { get; set; } = new Dictionary<string, decimal>();
    }

    public enum AIAgentAllocationStatus
    {
        Pending,
        Allocated,
        Active,
        Released,
        Error
    }

    public class HarrisPACSBridgeActivation
    {
        public string BridgeId { get; set; } = "";
        public string ActivationId { get; set; } = "";
        public HarrisPACSIntegrationLevel IntegrationLevel { get; set; }
        public List<string> EnabledCapabilities { get; set; } = new List<string>();
        public DateTime ActivationTime { get; set; }
        public BridgeStatus Status { get; set; }
        public Dictionary<string, object> BridgeMetrics { get; set; } = new Dictionary<string, object>();
    }

    public enum BridgeStatus
    {
        Connecting,
        Connected,
        Active,
        Synchronizing,
        Error,
        Disconnected
    }

    public class ModulePerformanceMetrics
    {
        public string ModuleId { get; set; } = "";
        public DateTime LastUpdateTime { get; set; }
        public decimal PerformanceScore { get; set; }
        public TimeSpan ResponseTime { get; set; }
        public int ThroughputPerSecond { get; set; }
        public decimal ErrorRate { get; set; }
        public decimal MemoryUsageMB { get; set; }
        public decimal CPUUsagePercent { get; set; }
        public Dictionary<string, decimal> CustomMetrics { get; set; } = new Dictionary<string, decimal>();
        public List<PerformanceAlert> Alerts { get; set; } = new List<PerformanceAlert>();
    }

    public class PerformanceAlert
    {
        public string AlertId { get; set; } = "";
        public string AlertType { get; set; } = "";
        public string Message { get; set; } = "";
        public AlertSeverity Severity { get; set; }
        public DateTime Timestamp { get; set; }
        public bool Resolved { get; set; }
    }

    public enum AlertSeverity
    {
        Info,
        Warning,
        Error,
        Critical
    }

    public class ModuleEvent
    {
        public string EventId { get; set; } = "";
        public string EventType { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> EventData { get; set; } = new Dictionary<string, object>();
        public EventSeverity Severity { get; set; }
    }

    public enum EventSeverity
    {
        Debug,
        Information,
        Warning,
        Error,
        Critical
    }

    public class ModulePerformanceData
    {
        public decimal PerformanceScore { get; set; }
        public TimeSpan ResponseTime { get; set; }
        public int ThroughputPerSecond { get; set; }
        public decimal ErrorRate { get; set; }
        public decimal MemoryUsage { get; set; }
        public decimal CPUUsage { get; set; }
        public Dictionary<string, object> AdditionalMetrics { get; set; } = new Dictionary<string, object>();
    }

    public class ModuleRequirementValidation
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = "";
        public List<string> MissingRequirements { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
    }

    // Specialized Module Models

    public class GISCoreModuleConfiguration : ModuleConfiguration
    {
        public string MapServerUrl { get; set; } = "";
        public List<string> SupportedCoordinateSystems { get; set; } = new List<string>();
        public bool EnableQuantumSpatialAnalysis { get; set; } = true;
        public int MaxMapLayers { get; set; } = 50;
    }

    public class LevyManagementModuleConfiguration : ModuleConfiguration
    {
        public decimal DefaultTaxRate { get; set; }
        public List<TaxExemption> TaxExemptions { get; set; } = new List<TaxExemption>();
        public bool EnableAITaxCalculation { get; set; } = true;
        public string TaxYearFormat { get; set; } = "yyyy";
    }

    public class TaxExemption
    {
        public string ExemptionType { get; set; } = "";
        public decimal ExemptionAmount { get; set; }
        public string Description { get; set; } = "";
        public List<string> EligibilityCriteria { get; set; } = new List<string>();
    }

    public class ValuationToolsModuleConfiguration : ModuleConfiguration
    {
        public decimal AccuracyTarget { get; set; } = 0.999m; // 99.9% accuracy
        public bool EnableIAAOCompliance { get; set; } = true;
        public List<string> ValuationMethods { get; set; } = new List<string>();
        public bool EnableQuantumValuation { get; set; } = true;
    }

    public class CostForgeAIModuleConfiguration : ModuleConfiguration
    {
        public int MaxConcurrentEstimations { get; set; } = 100;
        public bool EnableQuantumOptimization { get; set; } = true;
        public List<string> SupportedConstructionTypes { get; set; } = new List<string>();
        public decimal PredictiveAccuracyTarget { get; set; } = 0.95m;
    }

    public class PropertyAnalyticsModuleConfiguration : ModuleConfiguration
    {
        public int MarketAnalysisDepthDays { get; set; } = 365;
        public bool EnableTrendPrediction { get; set; } = true;
        public List<string> AnalyticsReports { get; set; } = new List<string>();
        public bool EnableRealTimeAnalytics { get; set; } = true;
    }

    public class ComplianceAutomationModuleConfiguration : ModuleConfiguration
    {
        public List<string> RequiredStandards { get; set; } = new List<string> { "IAAO", "FISMA-High" };
        public bool EnableContinuousMonitoring { get; set; } = true;
        public int ComplianceCheckIntervalMinutes { get; set; } = 60;
        public bool EnableAutomaticRemediation { get; set; } = true;
    }

    public class CountySpecializationModuleConfiguration : ModuleConfiguration
    {
        public string CountyCode { get; set; } = "";
        public Dictionary<string, WorkflowCustomization> WorkflowCustomizations { get; set; } = new Dictionary<string, WorkflowCustomization>();
        public List<string> EnabledFeatures { get; set; } = new List<string>();
        public Dictionary<string, object> CountySpecificSettings { get; set; } = new Dictionary<string, object>();
    }

    public class WorkflowCustomization
    {
        public string WorkflowName { get; set; } = "";
        public List<WorkflowStep> CustomSteps { get; set; } = new List<WorkflowStep>();
        public Dictionary<string, string> FieldMappings { get; set; } = new Dictionary<string, string>();
        public bool Enabled { get; set; } = true;
    }

    public class WorkflowStep
    {
        public string StepName { get; set; } = "";
        public string StepType { get; set; } = "";
        public int Order { get; set; }
        public Dictionary<string, object> Configuration { get; set; } = new Dictionary<string, object>();
        public bool Required { get; set; } = true;
    }

    // Marketplace Analytics Models

    public class MarketplaceAnalytics
    {
        public DateTime AnalyticsTimestamp { get; set; }
        public int TotalModules { get; set; }
        public int ActiveModules { get; set; }
        public int TotalActivations { get; set; }
        public Dictionary<string, int> ModulesByCategory { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActivationsByCounty { get; set; } = new Dictionary<string, int>();
        public List<PopularModule> PopularModules { get; set; } = new List<PopularModule>();
        public MarketplacePerformanceMetrics PerformanceMetrics { get; set; } = new();
    }

    public class PopularModule
    {
        public string ModuleId { get; set; } = "";
        public string ModuleName { get; set; } = "";
        public int ActivationCount { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
    }

    public class MarketplacePerformanceMetrics
    {
        public decimal AverageModulePerformanceScore { get; set; }
        public TimeSpan AverageActivationTime { get; set; }
        public decimal OverallSystemHealth { get; set; }
        public int TotalAIAgentsAllocated { get; set; }
        public int ActiveHarrisPACSBridges { get; set; }
    }
}
