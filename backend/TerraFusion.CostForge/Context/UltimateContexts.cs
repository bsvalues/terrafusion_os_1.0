using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.CostForge.Context
{
    /// <summary>
    /// Ultimate Consciousness Context for Million-Agent Coordination
    /// </summary>
    public class UltimateConsciousnessContext
    {
        public string UserId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public DateTime ContextCreated { get; set; } = DateTime.UtcNow;
        public int QuantumFactor { get; set; } = 999;
        public double ConsciousnessLevel { get; set; } = 0.9999;
        public string OperationalMode { get; set; } = "ULTIMATE";
        public Dictionary<string, object> MetaData { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Property Context for Ultimate Valuations
    /// </summary>
    public class PropertyContext
    {
        public string PropertyId { get; set; } = string.Empty;
        public string ParcelNumber { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public int YearBuilt { get; set; }
        public decimal LandSize { get; set; }
        public decimal BuildingSize { get; set; }
        public string ZoningCode { get; set; } = string.Empty;
        public DateTime LastAssessed { get; set; }
        public Dictionary<string, object> PropertyFeatures { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Market Context for 147-Dimensional Analysis
    /// </summary>
    public class MarketContext
    {
        public string MarketId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public string RegionId { get; set; } = string.Empty;
        public DateTime AnalysisDate { get; set; } = DateTime.UtcNow;
        public decimal MedianPrice { get; set; }
        public decimal PricePerSquareFoot { get; set; }
        public double DaysOnMarket { get; set; }
        public double InventoryLevel { get; set; }
        public double AbsorptionRate { get; set; }
        public double AppreciationRate { get; set; }
        public string MarketTrend { get; set; } = string.Empty;
        public Dictionary<string, decimal> DimensionalFactors { get; set; } = new Dictionary<string, decimal>();
    }

    /// <summary>
    /// Operational Context for Quantum Processing
    /// </summary>
    public class OperationalContext
    {
        public string OperationId { get; set; } = Guid.NewGuid().ToString();
        public string ServiceName { get; set; } = "UltimateCostForgeAI";
        public DateTime OperationStart { get; set; } = DateTime.UtcNow;
        public string PerformanceTarget { get; set; } = "ULTIMATE";
        public int ActiveAgents { get; set; } = 1000000;
        public double ProcessingLoad { get; set; }
        public string QuantumState { get; set; } = "COHERENT";
        public Dictionary<string, object> SystemMetrics { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Validation Context for Government Compliance
    /// </summary>
    public class ValidationContext
    {
        public string ValidationId { get; set; } = Guid.NewGuid().ToString();
        public string ComplianceLevel { get; set; } = "FISMA_HIGH";
        public DateTime ValidationTimestamp { get; set; } = DateTime.UtcNow;
        public bool AuditRequired { get; set; } = true;
        public string ValidationStandard { get; set; } = "NIST_800_53";
        public List<string> RequiredChecks { get; set; } = new List<string>();
        public Dictionary<string, bool> ComplianceFlags { get; set; } = new Dictionary<string, bool>();
    }
}
