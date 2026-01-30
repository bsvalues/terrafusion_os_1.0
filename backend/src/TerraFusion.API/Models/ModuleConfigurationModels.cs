using System;
using System.Collections.Generic;

namespace TerraFusion.API.Models.Configuration;

/// <summary>
/// GIS Core Module Configuration for spatial data processing
/// </summary>
public class GISCoreModuleConfiguration
{
    public string ModuleId { get; set; } = "gis-core";
    public string ModuleName { get; set; } = "GIS Core";
    public bool Enabled { get; set; } = true;
    public string Version { get; set; } = "1.0.0";
    public Dictionary<string, string> SpatialDataSources { get; set; } = new();
    public List<string> SupportedProjections { get; set; } = new();
    public int MaxConcurrentProcessing { get; set; } = 10;
    public bool QuantumOptimizationEnabled { get; set; } = true;
}

/// <summary>
/// Levy Management Module Configuration for tax assessment
/// </summary>
public class LevyManagementModuleConfiguration
{
    public string ModuleId { get; set; } = "levy-management";
    public string ModuleName { get; set; } = "Levy Management";
    public bool Enabled { get; set; } = true;
    public string Version { get; set; } = "1.0.0";
    public decimal TaxRateCalculationPrecision { get; set; } = 0.0001m;
    public List<string> TaxAuthorities { get; set; } = new();
    public bool AutoCalculationEnabled { get; set; } = true;
    public int LevyYear { get; set; } = DateTime.UtcNow.Year;
}

/// <summary>
/// Valuation Tools Module Configuration for property assessment
/// </summary>
public class ValuationToolsModuleConfiguration
{
    public string ModuleId { get; set; } = "valuation-tools";
    public string ModuleName { get; set; } = "Valuation Tools";
    public bool Enabled { get; set; } = true;
    public string Version { get; set; } = "1.0.0";
    public decimal AccuracyTarget { get; set; } = 0.999m; // 99.9% accuracy
    public List<string> ValuationMethods { get; set; } = new();
    public bool AIEnhancedValuation { get; set; } = true;
    public int MinComparableSales { get; set; } = 3;
}

/// <summary>
/// Government Security Configuration for FISMA-High compliance
/// </summary>
public class GovernmentSecurityConfiguration
{
    public string SecurityLevel { get; set; } = "FISMA-HIGH";
    public bool QuantumEncryptionEnabled { get; set; } = true;
    public bool MultiFactorAuthenticationRequired { get; set; } = true;
    public int SessionTimeoutMinutes { get; set; } = 15;
    public bool AuditLoggingEnabled { get; set; } = true;
    public List<string> AllowedIPRanges { get; set; } = new();
    public FISMAHighRequirements FISMARequirements { get; set; } = new();
    public QuantumEncryptionConfiguration QuantumEncryption { get; set; } = new();

    // Additional properties for GovernmentGradeSecurityEngine
    public string FISMALevel { get; set; } = "High";
    public string EncryptionStandard { get; set; } = "AES-256";
    public string SecurityFramework { get; set; } = "NIST-800-53";
    public TimeSpan AuditLogRetentionPeriod { get; set; } = TimeSpan.FromDays(2555);
    public TimeSpan ComplianceMonitoringFrequency { get; set; } = TimeSpan.FromMinutes(15);
    public TimeSpan ThreatAnalysisFrequency { get; set; } = TimeSpan.FromMinutes(30);
    public TimeSpan SecurityAssessmentFrequency { get; set; } = TimeSpan.FromHours(24);
    public TimeSpan AuditReportingFrequency { get; set; } = TimeSpan.FromDays(30);
}

/// <summary>
/// FISMA-High Requirements for government compliance
/// </summary>
public class FISMAHighRequirements
{
    public bool ContinuousMonitoringEnabled { get; set; } = true;
    public bool AutomatedComplianceChecks { get; set; } = true;
    public int SecurityControlCount { get; set; } = 325; // NIST 800-53 controls
    public bool IncidentResponsePlanRequired { get; set; } = true;
    public bool DisasterRecoveryPlanRequired { get; set; } = true;
    public int AuditRetentionDays { get; set; } = 2555; // 7 years
    public List<string> RequiredSecurityControls { get; set; } = new();

    // Additional properties for GovernmentGradeSecurityEngine
    public int MinimumEncryptionStrength { get; set; } = 256;
    public string RequiredAuthentication { get; set; } = "Multi-Factor";
    public string AuditRequirements { get; set; } = "Comprehensive";
    public TimeSpan IncidentResponseTime { get; set; } = TimeSpan.FromMinutes(15);
}

/// <summary>
/// Quantum Encryption Configuration for post-quantum cryptography
/// </summary>
public class QuantumEncryptionConfiguration
{
    public bool Enabled { get; set; } = true;
    public string EncryptionAlgorithm { get; set; } = "CRYSTALS-Kyber";
    public int KeySizeBits { get; set; } = 3072;
    public bool QuantumKeyDistribution { get; set; } = true;
    public int RotationIntervalHours { get; set; } = 24;
    public bool FallbackToClassicalEncryption { get; set; } = true;
}

/// <summary>
/// Module Status enumeration for module lifecycle
/// </summary>
public enum ModuleStatus
{
    NotInstalled,
    Installing,
    Installed,
    Initializing,        // Added for government-grade module initialization
    Activating,
    Active,
    Deactivating,
    Inactive,
    Stopped,             // Added for government-grade module lifecycle
    Upgrading,
    Failed,
    Deprecated
}
